/** Free-trial requests sent by visitors from the welcome page. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { testDb, closeDb } from "./db";
import type { DB } from "@/db";
import { createTrialRequest, listTrialRequests, updateTrialRequest, countNewRequests, checkTrialRequest } from "@/server/services/requests";

let db: DB;
const base = {
  name: "Lena Müller",
  email: "Lena@Example.com",
  whatsapp: "+49 151 2345678",
  country: "Germany",
  timezone: "Europe/Berlin",
  level: "none",
  forWhom: "me",
  preferredTimes: "Sat evening",
  message: "",
  lang: "de",
};

beforeAll(async () => {
  db = await testDb();
  await db.execute(sql`TRUNCATE trial_requests RESTART IDENTITY`);
});
afterAll(closeDb);

describe("trial requests", () => {
  it("rejects bad input with a reason the page can translate", () => {
    expect(checkTrialRequest({ ...base, name: " " })).toBe("name");
    expect(checkTrialRequest({ ...base, email: "lena@" })).toBe("email");
    expect(checkTrialRequest({ ...base, whatsapp: "123" })).toBe("whatsapp");
    expect(checkTrialRequest({ ...base, whatsapp: "" })).toBeNull();
    expect(checkTrialRequest({ ...base, level: "expert" })).toBe("choice");
  });

  it("saves a request, lower-cases the email and drops an unknown time zone", async () => {
    expect(await createTrialRequest(db, { ...base, timezone: "Mars/Base" })).toBeNull();
    const [r] = await listTrialRequests(db, "new");
    expect(r.email).toBe("lena@example.com");
    expect(r.timezone).toBeNull();
    expect(r.message).toBeNull();
    expect(await countNewRequests(db)).toBe(1);
  });

  it("stops one email after three requests in a day", async () => {
    expect(await createTrialRequest(db, base)).toBeNull();
    expect(await createTrialRequest(db, { ...base, email: "LENA@example.com" })).toBeNull();
    expect(await createTrialRequest(db, base)).toBe("tooMany");
    expect(await createTrialRequest(db, { ...base, email: "other@example.com" })).toBeNull();
  });

  it("lets staff move a request along with a note", async () => {
    const [r] = await listTrialRequests(db, "new");
    await updateTrialRequest(db, r.id, "contacted", "Sat 6pm");
    const [c] = await listTrialRequests(db, "contacted");
    expect(c.staffNote).toBe("Sat 6pm");
    await expect(updateTrialRequest(db, r.id, "lost", "")).rejects.toThrow();
  });
});

import { createUser } from "@/server/services/auth";
import { createPasswordHelp, listPasswordHelp, markPasswordHelpHandled, addPricePlan, listPricePlans, removePricePlan } from "@/server/services/requests";

describe("forgot password", () => {
  it("records the request, links a known account, and answers the same for unknown emails", async () => {
    await db.execute(sql`TRUNCATE password_help_requests RESTART IDENTITY`);
    const u = await createUser(db, { name: "Omar Test", email: "known-student@example.com", password: "long-enough-pass", role: "student" });
    expect(await createPasswordHelp(db, "Known-Student@example.com", "en")).toBeNull();
    expect(await createPasswordHelp(db, "nobody@example.com", "de")).toBeNull();
    expect(await createPasswordHelp(db, "not-an-email", "de")).toBe("email");
    const open = await listPasswordHelp(db);
    expect(open.map((r) => r.email).sort()).toEqual(["known-student@example.com", "nobody@example.com"]);
    expect(open.find((r) => r.email.startsWith("known"))?.userName).toBe("Omar Test");
    await markPasswordHelpHandled(db, open[0].id);
    expect(await listPasswordHelp(db)).toHaveLength(1);
    expect(u).toBeTruthy();
  });
});

describe("price plans", () => {
  it("adds, lists in order and hides plans", async () => {
    await db.execute(sql`TRUNCATE price_plans RESTART IDENTITY`);
    await addPricePlan(db, { lessonsPerMonth: 12, minutes: 45, price: 120, currency: "USD", featured: true });
    await addPricePlan(db, { lessonsPerMonth: 8, minutes: 45, price: 85.5, currency: "EUR", featured: false });
    await expect(addPricePlan(db, { lessonsPerMonth: 0, minutes: 45, price: 10, currency: "USD", featured: false })).rejects.toThrow();
    await expect(addPricePlan(db, { lessonsPerMonth: 4, minutes: 45, price: 10, currency: "XYZ", featured: false })).rejects.toThrow();
    const plans = await listPricePlans(db);
    expect(plans.map((p) => p.lessonsPerMonth)).toEqual([8, 12]);
    expect(plans[0].price).toBe("85.50");
    await removePricePlan(db, plans[0].id);
    expect(await listPricePlans(db)).toHaveLength(1);
  });
});
