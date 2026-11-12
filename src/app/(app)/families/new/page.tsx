import { requireStaff } from "@/server/session";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink } from "@/components/ui";
import { GuardianFields } from "../guardian-form";
import { createGuardianAction } from "../actions";

export const metadata = { title: "عيلة جديدة" };

export default async function NewFamily() {
  await requireStaff();
  return (
    <div className="max-w-3xl">
      <BackLink href="/families">العائلات</BackLink>
      <PageHeader title="عيلة جديدة" subtitle="بعد ما تضيف ولي الأمر، ضيف الأولاد كطلاب واختاره كولي أمر ليهم" />
      <div className="card">
        <ActionForm action={createGuardianAction} submit="إضافة">
          <GuardianFields />
        </ActionForm>
      </div>
    </div>
  );
}
