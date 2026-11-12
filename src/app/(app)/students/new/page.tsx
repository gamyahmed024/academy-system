import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listGuardians } from "@/server/services/people";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink } from "@/components/ui";
import { StudentFields } from "../student-form";
import { createStudentAction } from "../actions";

export const metadata = { title: "طالب جديد" };

export default async function NewStudent() {
  await requireStaff();
  const guardians = await listGuardians(getDb());
  return (
    <div className="max-w-3xl">
      <BackLink href="/students">الطلاب</BackLink>
      <PageHeader title="طالب جديد" />
      <div className="card">
        <ActionForm action={createStudentAction} submit="إضافة الطالب">
          <StudentFields guardians={guardians} />
        </ActionForm>
      </div>
    </div>
  );
}
