import { notFound } from "next/navigation";
import { requirePortal } from "@/server/session";
import { getT } from "@/server/lang";
import { TeacherHome } from "./teacher-home";
import { FamilyHome } from "./family-home";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("home") };
}

export default async function MyHome() {
  const user = await requirePortal();
  if (user.role === "teacher") return <TeacherHome user={user} />;
  if (user.role === "student" || user.role === "guardian") return <FamilyHome user={user} />;
  notFound();
}
