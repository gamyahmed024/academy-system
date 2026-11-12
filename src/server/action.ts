import "server-only";
import { unstable_rethrow } from "next/navigation";
import { UserError } from "./services/errors";

export type ActionState = { error?: string; ok?: string } | undefined;

/** Turn a thrown UserError into a message the form can show. */
export async function run(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const ok = await fn();
    return { ok: ok ?? "اتحفظ" };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof UserError) return { error: e.message };
    console.error(e);
    return { error: "حصلت مشكلة غير متوقعة، جرّب تاني" };
  }
}

export const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
export const optStr = (f: FormData, k: string) => str(f, k) || null;
export const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? NaN : Number(v);
};
export const optId = (f: FormData, k: string) => {
  const v = str(f, k);
  return v ? Number(v) : null;
};
