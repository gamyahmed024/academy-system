/**
 * npm run seed            → creates the first admin user (if none exists)
 * npm run seed -- --demo  → also fills the database with demo data around today
 *
 * Admin credentials come from ADMIN_EMAIL / ADMIN_PASSWORD (required, except with --demo).
 */
import "dotenv/config";
import { DateTime } from "luxon";
import { eq, lt, and } from "drizzle-orm";
import { getDb } from "../src/db";
import { users, lessons } from "../src/db/schema";
import { createUser } from "../src/server/services/auth";
import { createTeacher, createStudent, createGuardian, createGroup } from "../src/server/services/people";
import { createSeries, moveLesson, listLessons } from "../src/server/services/schedule";
import { recordPayment, recordAttendance, getSettings } from "../src/server/services/money";

async function main() {
  const db = getDb();
  await getSettings(db);
  const email = process.env.ADMIN_EMAIL ?? "admin@academy.local";
  const demo = process.argv.includes("--demo");
  // The code is public, so a default password is only allowed for local demo data.
  const password = process.env.ADMIN_PASSWORD ?? (demo ? "change-me-now" : "");
  let [admin] = await db.select().from(users).where(eq(users.email, email));
  if (!admin) {
    if (password.length < 10) {
      throw new Error("Set ADMIN_PASSWORD (at least 10 characters) before seeding.");
    }
    admin = await createUser(db, { name: "عمر", email, password, role: "admin" });
    console.log(`admin created: ${email}`);
  } else console.log(`admin exists: ${email}`);

  if (!demo) return;
  const by = admin.id;
  const tz = "Africa/Cairo";
  const now = DateTime.now().setZone(tz);
  const start = now.minus({ weeks: 3 }).toISODate()!;
  const end = now.plus({ weeks: 8 }).toISODate()!;

  const sara = await createTeacher(db, { name: "أ. سارة", timezone: tz, payPerLessonEgp: "250", subjects: "عامية مصرية، فصحى", meetingUrl: "https://meet.google.com/sar-ahte-ach", whatsapp: "+201000000001" }, by);
  const mahmoud = await createTeacher(db, { name: "أ. محمود", timezone: tz, payPerLessonEgp: "300", subjects: "قرآن، فصحى", meetingUrl: "https://zoom.us/j/1234567890" }, by);
  const mona = await createTeacher(db, { name: "أ. منى", timezone: tz, payPerLessonEgp: "220", subjects: "عامية مصرية" }, by);

  const emma = await createStudent(db, { name: "Emma Schneider", country: "ألمانيا", timezone: "Europe/Berlin", subject: "عامية مصرية", level: "متوسط", whatsapp: "+4915100000000", nativeLanguage: "German" }, by);
  const john = await createStudent(db, { name: "John Miller", country: "أمريكا", timezone: "America/New_York", subject: "فصحى", level: "مبتدئ", nativeLanguage: "English" }, by);
  const aiko = await createStudent(db, { name: "Aiko Tanaka", country: "اليابان", timezone: "Asia/Tokyo", subject: "فصحى", level: "متقدم" }, by);
  const smith = await createGuardian(db, { name: "Sarah Smith", timezone: "Europe/London", whatsapp: "+447700900000" }, by);
  const liam = await createStudent(db, { name: "Liam Smith", country: "بريطانيا", timezone: "Europe/London", subject: "قرآن", level: "مبتدئ", guardianId: smith.id }, by);
  const noah = await createStudent(db, { name: "Noah Smith", country: "بريطانيا", timezone: "Europe/London", subject: "قرآن", level: "مبتدئ", guardianId: smith.id }, by);
  const sophie = await createStudent(db, { name: "Sophie Martin", country: "فرنسا", timezone: "Europe/Paris", subject: "عامية مصرية", level: "مبتدئ" }, by);
  const lucas = await createStudent(db, { name: "Lucas García", country: "إسبانيا", timezone: "Europe/Madrid", subject: "عامية مصرية", level: "مبتدئ" }, by);
  const mia = await createStudent(db, { name: "Mia Chen", country: "كندا", timezone: "America/Toronto", subject: "عامية مصرية", level: "مبتدئ", status: "trial" }, by);
  const group = await createGroup(db, { name: "مبتدئين عامية A", teacherId: sara.id, level: "مبتدئ", studentIds: [sophie.id, lucas.id, mia.id] }, by);

  const S = (o: Parameters<typeof createSeries>[1]) => createSeries(db, o, by);
  await S({ teacherId: sara.id, studentId: emma.id, weekdays: [2, 4], localTime: "10:00", anchorTimezone: "Europe/Berlin", minutes: 60, startDate: start, endDate: end });
  await S({ teacherId: mahmoud.id, studentId: john.id, weekdays: [1, 3], localTime: "08:00", anchorTimezone: "America/New_York", minutes: 60, startDate: start, endDate: end });
  await S({ teacherId: mahmoud.id, studentId: aiko.id, weekdays: [6], localTime: "19:00", anchorTimezone: "Asia/Tokyo", minutes: 60, startDate: start, endDate: end });
  await S({ teacherId: mona.id, studentId: liam.id, weekdays: [7, 3], localTime: "16:00", anchorTimezone: "Europe/London", minutes: 45, startDate: start, endDate: end });
  await S({ teacherId: mona.id, studentId: noah.id, weekdays: [7, 3], localTime: "17:00", anchorTimezone: "Europe/London", minutes: 45, startDate: start, endDate: end });
  await S({ teacherId: sara.id, groupId: group.id, weekdays: [6, 2], localTime: "19:00", anchorTimezone: tz, minutes: 90, startDate: start, endDate: end });
  // daily lessons so "today" always has something
  for (const [t, s, h] of [[sara.id, emma.id, "16:00"], [mahmoud.id, john.id, "17:30"]] as const) {
    await createSeries(db, { teacherId: t, studentId: s, weekdays: [now.weekday], localTime: h, anchorTimezone: tz, minutes: 30, startDate: now.toISODate()!, endDate: now.toISODate()! }, by).catch(() => {});
  }

  const m0 = now.startOf("month");
  const pay = (o: Parameters<typeof recordPayment>[1]) => recordPayment(db, o, by);
  for (const [i, m] of [m0.minus({ months: 1 }), m0].entries()) {
    const d = (day: number) => m.set({ day }).toISODate()!;
    const usd = i ? "50.60" : "48.50", eur = i ? "58.50" : "56", gbp = i ? "66.80" : "64";
    await pay({ studentId: emma.id, amount: "120", currency: "EUR", rateToEgp: eur, lessonsCredited: 8, method: "PayPal", paidOn: d(1) });
    await pay({ studentId: john.id, amount: "180", currency: "USD", rateToEgp: usd, lessonsCredited: 8, method: "تحويل بنكي", paidOn: d(2) });
    await pay({ guardianId: smith.id, amount: "260", currency: "GBP", rateToEgp: gbp, lessonsCredited: 16, method: "Wise", paidOn: d(1) });
    await pay({ studentId: sophie.id, amount: "60", currency: "EUR", rateToEgp: eur, lessonsCredited: 8, method: "PayPal", paidOn: d(3) });
    await pay({ studentId: lucas.id, amount: "60", currency: "EUR", rateToEgp: eur, lessonsCredited: 8, method: "PayPal", paidOn: d(4) });
    if (!i) await pay({ studentId: aiko.id, amount: "20000", currency: "JPY", rateToEgp: "0.33", lessonsCredited: 4, method: "Wise", paidOn: d(5) });
  }

  // past attendance: mostly present, a few realistic exceptions
  const past = await listLessons(db, { from: now.minus({ weeks: 3 }).toJSDate(), to: now.minus({ days: 2 }).toJSDate() });
  let k = 0;
  for (const l of past) {
    const ids = l.studentId ? [l.studentId] : [sophie.id, lucas.id, mia.id];
    for (const sid of ids) {
      k++;
      const state = k % 13 === 0 ? "excused" : k % 17 === 0 ? "absent" : k % 11 === 0 ? "late" : "present";
      await recordAttendance(db, { lessonId: l.id, studentId: sid, state, noticeAt: state === "excused" ? new Date(l.startsAt.getTime() - 30 * 3600_000) : null, note: state === "present" && k % 3 === 0 ? "مراجعة الدرس اللي فات + واجب صفحة 12" : null }, by);
    }
  }
  // one moved occurrence next week
  const nextEmma = await db.select().from(lessons).where(and(eq(lessons.studentId, emma.id), lt(lessons.startsAt, now.plus({ days: 10 }).toJSDate()))).orderBy(lessons.startsAt);
  const target = nextEmma.find((l) => l.startsAt > now.plus({ days: 2 }).toJSDate() && l.minutes === 60);
  if (target) {
    const d = DateTime.fromJSDate(target.startsAt).setZone("Europe/Berlin").plus({ days: 1 });
    await moveLesson(db, target.id, { date: d.toISODate()!, time: "11:00", timezone: "Europe/Berlin", reason: "طلب الطالبة" }, by).catch(() => {});
  }
  console.log("demo data created");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
