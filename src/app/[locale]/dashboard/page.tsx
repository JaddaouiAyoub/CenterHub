import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminView } from "@/components/dashboard/AdminView";
import { TeacherView } from "@/components/dashboard/TeacherView";
import { ParentView } from "@/components/dashboard/ParentView";
import { SecretaryView } from "@/components/dashboard/SecretaryView";
import { StudentView } from "@/components/dashboard/StudentView";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "ADMIN":
      return <AdminView user={session.user} />;
    case "TEACHER":
      return <TeacherView user={session.user} />;
    case "PARENT":
      return <ParentView user={session.user} />;
    case "SECRETARY":
      return <SecretaryView user={session.user} />;
    case "STUDENT":
      return <StudentView user={session.user} />;
    default:
      return <div>Role non reconnu</div>;
  }
}
