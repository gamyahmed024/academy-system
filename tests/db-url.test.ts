import { describe, expect, it } from "vitest";
import { runtimeUrl } from "@/db";

describe("runtimeUrl", () => {
  const session = "postgresql://app.ref:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";
  it("uses the transaction pooler on Vercel", () => {
    expect(runtimeUrl(session, true)).toBe("postgresql://app.ref:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres");
  });
  it("leaves the URL alone elsewhere", () => {
    expect(runtimeUrl(session, false)).toBe(session);
    expect(runtimeUrl("postgresql://u:p@localhost:5432/db", true)).toBe("postgresql://u:p@localhost:5432/db");
  });
});
