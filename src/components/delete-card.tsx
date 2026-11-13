import type { ReactNode } from "react";
import { ActionForm } from "@/components/action-form";
import type { ActionState } from "@/server/action";

/** The "delete for good" box at the bottom of a student, teacher or family page (admin only). */
export function DeleteCard({
  title,
  action,
  confirm,
  submit,
  children,
}: {
  title: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  confirm: string;
  submit: string;
  children: ReactNode;
}) {
  return (
    <section className="card mt-6 border-red-200">
      <h2 className="mb-1 font-bold text-red-700">{title}</h2>
      <div className="text-sm text-slate-600">{children}</div>
      <ActionForm action={action} submit={submit} submitClass="btn-danger" confirm={confirm} pendingLabel="بيتمسح…">
        {null}
      </ActionForm>
    </section>
  );
}
