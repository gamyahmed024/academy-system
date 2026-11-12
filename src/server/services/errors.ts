/** An error whose message is safe to show to the user (Arabic). */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new UserError(message);
}
