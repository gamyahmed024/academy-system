import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  numeric,
  date,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/*
 * Data model for phase 1. Design rules (see the proposal, sections 8 and 13):
 *  - every instant is stored as timestamptz (UTC);
 *  - nothing is hard-deleted in normal use: people get a status, lessons get
 *    "cancelled" (the admin can still delete test or mistaken records for good,
 *    see server/services/cleanup.ts);
 *  - lesson credits live in a ledger (credit_entries) attached to a wallet that
 *    one student or a whole family shares;
 *  - every payment keeps the exchange rate of the day it was received.
 */

export const roleEnum = pgEnum("role", ["admin", "staff", "teacher", "student", "guardian"]);
export const personStatusEnum = pgEnum("person_status", ["trial", "active", "paused", "stopped"]);
export const lessonStatusEnum = pgEnum("lesson_status", ["scheduled", "done", "cancelled"]);
export const attendanceStateEnum = pgEnum("attendance_state", [
  "present",
  "late",
  "absent", // no-show without notice
  "excused", // student cancelled; deducted or not depending on notice
  "teacher_cancelled",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  timezone: text("timezone").notNull().default("Africa/Cairo"),
  locale: text("locale").notNull().default("ar"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  // sha256 of the random token kept in the cookie
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  timezone: text("timezone").notNull(),
  walletId: integer("wallet_id")
    .notNull()
    .references(() => wallets.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("guardians_user_uq").on(t.userId)]);

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    name: text("name").notNull(),
    email: text("email"),
    whatsapp: text("whatsapp"),
    country: text("country"),
    nativeLanguage: text("native_language"),
    timezone: text("timezone").notNull(),
    subject: text("subject"),
    level: text("level"),
    // own meeting room for one-to-one lessons; overrides the teacher's room
    meetingUrl: text("meeting_url"),
    status: personStatusEnum("status").notNull().default("active"),
    guardianId: integer("guardian_id").references(() => guardians.id),
    walletId: integer("wallet_id")
      .notNull()
      .references(() => wallets.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("students_guardian_idx").on(t.guardianId),
    index("students_wallet_idx").on(t.walletId),
    uniqueIndex("students_user_uq").on(t.userId),
  ],
);

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  timezone: text("timezone").notNull().default("Africa/Cairo"),
  subjects: text("subjects"),
  // fixed personal meeting room (Meet / Zoom) entered once; used for every lesson
  meetingUrl: text("meeting_url"),
  payPerLessonEgp: numeric("pay_per_lesson_egp", { precision: 12, scale: 2 }).notNull().default("0"),
  status: personStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("teachers_user_uq").on(t.userId)]);

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teachers.id),
  level: text("level"),
  active: boolean("active").notNull().default(true),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.studentId] })],
);

export const series = pgTable("series", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teachers.id),
  studentId: integer("student_id").references(() => students.id),
  groupId: integer("group_id").references(() => groups.id),
  // ISO weekdays, 1 = Monday ... 7 = Sunday
  weekdays: jsonb("weekdays").$type<number[]>().notNull(),
  localTime: text("local_time").notNull(), // "HH:mm" in anchorTimezone
  anchorTimezone: text("anchor_timezone").notNull(),
  minutes: integer("minutes").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    seriesId: integer("series_id").references(() => series.id),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id),
    studentId: integer("student_id").references(() => students.id),
    groupId: integer("group_id").references(() => groups.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    // set when a single occurrence of a series is moved; keeps where it came from
    originalStartsAt: timestamp("original_starts_at", { withTimezone: true }),
    minutes: integer("minutes").notNull(),
    status: lessonStatusEnum("status").notNull().default("scheduled"),
    cancelReason: text("cancel_reason"),
    // optional override; otherwise the teacher's fixed meeting room is used
    meetingUrl: text("meeting_url"),
    topic: text("topic"),
    /** A free lesson (the trial): attending it never takes a credit. */
    free: boolean("free").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lessons_teacher_start_idx").on(t.teacherId, t.startsAt), index("lessons_start_idx").on(t.startsAt)],
);

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
    state: attendanceStateEnum("state").notNull(),
    // when the student told us (for "excused"); decides the deduction
    noticeAt: timestamp("notice_at", { withTimezone: true }),
    deducted: boolean("deducted").notNull(),
    teacherPaid: boolean("teacher_paid").notNull(),
    note: text("note"),
    recordedBy: integer("recorded_by").references(() => users.id),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("attendance_lesson_student_uq").on(t.lessonId, t.studentId)],
);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id")
    .notNull()
    .references(() => wallets.id),
  studentId: integer("student_id").references(() => students.id),
  guardianId: integer("guardian_id").references(() => guardians.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  // exchange rate to EGP on the day of payment; never recomputed
  rateToEgp: numeric("rate_to_egp", { precision: 14, scale: 6 }).notNull(),
  amountEgp: numeric("amount_egp", { precision: 14, scale: 2 }).notNull(),
  lessonsCredited: integer("lessons_credited").notNull(),
  method: text("method").notNull(),
  paidOn: date("paid_on").notNull(),
  receiptNo: text("receipt_no").notNull().unique(),
  note: text("note"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditEntries = pgTable(
  "credit_entries",
  {
    id: serial("id").primaryKey(),
    walletId: integer("wallet_id")
      .notNull()
      .references(() => wallets.id),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    paymentId: integer("payment_id").references(() => payments.id),
    attendanceId: integer("attendance_id").references(() => attendance.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_wallet_idx").on(t.walletId), uniqueIndex("credit_attendance_uq").on(t.attendanceId)],
);

export const payouts = pgTable(
  "payouts",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id),
    month: text("month").notNull(), // "YYYY-MM" (Cairo time)
    lessons: integer("lessons").notNull(),
    amountEgp: numeric("amount_egp", { precision: 14, scale: 2 }).notNull(),
    paidOn: date("paid_on"),
    closedAt: timestamp("closed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payouts_teacher_month_uq").on(t.teacherId, t.month)],
);

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  academyName: text("academy_name").notNull().default("الأكاديمية"),
  /** The name in Latin letters, shown to visitors and students who don't read Arabic. */
  academyNameLatin: text("academy_name_latin").notNull().default("Umam Academy"),
  academyTimezone: text("academy_timezone").notNull().default("Africa/Cairo"),
  // excused with at least this many hours of notice is not deducted
  freeCancelHours: integer("free_cancel_hours").notNull().default(24),
  payTeacherOnNoShow: boolean("pay_teacher_on_no_show").notNull().default(true),
  lowBalanceThreshold: integer("low_balance_threshold").notNull().default(1),
  // what the teacher is paid for a free trial lesson (instead of their usual rate)
  trialPayEgp: numeric("trial_pay_egp", { precision: 12, scale: 2 }).notNull().default("30"),
  // shown as the contact button on the public welcome page
  contactWhatsapp: text("contact_whatsapp"),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  data: jsonb("data"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

/** A visitor's request for a free trial lesson, sent from the public welcome page. */
export const requestStatusEnum = pgEnum("request_status", ["new", "contacted", "enrolled", "closed"]);

export const trialRequests = pgTable(
  "trial_requests",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp"),
    country: text("country"),
    timezone: text("timezone"),
    level: text("level").notNull(),
    forWhom: text("for_whom").notNull(),
    preferredTimes: text("preferred_times"),
    message: text("message"),
    /** The page language the visitor used, so staff can answer in it. */
    lang: text("lang").notNull(),
    status: requestStatusEnum("status").notNull().default("new"),
    staffNote: text("staff_note"),
    /** The student file made from this request, if any. */
    studentId: integer("student_id").references(() => students.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trial_requests_status_idx").on(t.status, t.createdAt), index("trial_requests_email_idx").on(t.email, t.createdAt)],
);

/** "Forgot password": the person asks the academy for a new temporary password. */
export const passwordHelpRequests = pgTable("password_help_requests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  /** The account with that email, when there is one. */
  userId: integer("user_id").references(() => users.id),
  lang: text("lang").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("password_help_email_idx").on(t.email, t.createdAt)]);

/** Packages shown to visitors on the welcome page. Labels are built per language from the numbers. */
export const pricePlans = pgTable("price_plans", {
  id: serial("id").primaryKey(),
  lessonsPerMonth: integer("lessons_per_month").notNull(),
  minutes: integer("minutes").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
