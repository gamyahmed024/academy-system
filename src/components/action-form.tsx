"use client";

import { useActionState, useEffect, useRef, startTransition, type ReactNode } from "react";
import type { ActionState } from "@/server/action";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submit?: string;
  submitClass?: string;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
};

function SubmitButton({ label, className, pending }: { label: string; className: string; pending: boolean }) {
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "لحظة…" : label}
    </button>
  );
}

/** A form bound to a server action that shows its error or success message. */
export function ActionForm({ action, children, submit = "حفظ", submitClass = "btn", className, resetOnSuccess, confirm }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={ref}
      className={className}
      // Submitting through onSubmit (not the action prop) keeps what the user
      // typed when the server returns an error; React would reset it otherwise.
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SubmitButton label={submit} className={submitClass} pending={pending} />
        {state?.error && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {state.error}
          </p>
        )}
        {state?.ok && !state.error && <p className="text-sm font-semibold text-green-700">✓ {state.ok}</p>}
      </div>
    </form>
  );
}
