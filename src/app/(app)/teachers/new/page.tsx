import { requireStaff } from "@/server/session";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink } from "@/components/ui";
import { TeacherFields } from "../teacher-form";
import { createTeacherAction } from "../actions";

export const metadata = { title: "مدرس جديد" };

export default async function NewTeacher() {
  await requireStaff();
  return (
    <div className="max-w-3xl">
      <BackLink href="/teachers">المدرسين</BackLink>
      <PageHeader title="مدرس جديد" />
      <div className="card">
        <ActionForm action={createTeacherAction} submit="إضافة المدرس"><TeacherFields /></ActionForm>
      </div>
    </div>
  );
}
