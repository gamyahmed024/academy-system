import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listGuardians } from "@/server/services/people";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink } from "@/components/ui";
import { StudentFields } from "../student-form";
import { isValidTimezone } from "@/lib/domain/time";
import { createStudentAction } from "../actions";

export const metadata = { title: "طالب جديد" };

export default async function NewStudent(props: PageProps<"/students/new">) {
  await requireStaff();
  const guardians = await listGuardians(getDb());
  // Filled in when coming from a trial request.
  const sp = await props.searchParams;
  const q = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const tz = q("timezone");
  const fromRequest = q("name")
    ? { name: q("name"), email: q("email"), whatsapp: q("phone"), country: q("country"), timezone: isValidTimezone(tz) ? tz : undefined, status: "trial" }
    : undefined;
  return (
    <div className="max-w-3xl">
      <BackLink href="/students">الطلاب</BackLink>
      <PageHeader title="طالب جديد" />
      <div className="card">
        <ActionForm action={createStudentAction} submit="إضافة الطالب">
          <StudentFields s={fromRequest} guardians={guardians} />
        </ActionForm>
      </div>
    </div>
  );
}
