import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { getStudent, listGuardians } from "@/server/services/people";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink } from "@/components/ui";
import { StudentFields } from "../../student-form";
import { updateStudentAction } from "../../actions";

export const metadata = { title: "تعديل طالب" };

export default async function EditStudent(props: PageProps<"/students/[id]/edit">) {
  await requireStaff();
  const id = Number((await props.params).id);
  const db = getDb();
  const s = Number.isInteger(id) ? await getStudent(db, id) : null;
  if (!s) notFound();
  const guardians = await listGuardians(db);
  return (
    <div className="max-w-3xl">
      <BackLink href={`/students/${id}`}>{s.name}</BackLink>
      <PageHeader title={`تعديل: ${s.name}`} />
      <div className="card">
        <ActionForm action={updateStudentAction.bind(null, id)}>
          <StudentFields s={s} guardians={guardians} />
        </ActionForm>
        {s.guardianId === null && (
          <p className="mt-3 text-xs text-slate-500">لو ربطت الطالب بولي أمر، رصيده الحالي هيتنقل لمحفظة العيلة وهيتسجل النقل.</p>
        )}
      </div>
    </div>
  );
}
