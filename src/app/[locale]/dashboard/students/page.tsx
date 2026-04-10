import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentsList } from "@/components/dashboard/secretary/StudentsList";
import { TeacherStudentsList } from "@/components/dashboard/teacher/TeacherStudentsList";
import { getTeacherProfileByUserId } from "@/actions/teachers";

export default async function StudentsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "TEACHER") {
    const profile = await getTeacherProfileByUserId(session.user.id!);
    if (!profile) {
      return <div className="p-6 text-red-600 bg-red-50 rounded-xl">Profil enseignant introuvable. Veuillez contacter l'administration.</div>;
    }
    return (
      <div className="p-6">
        <TeacherStudentsList teacherProfileId={profile.id} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <StudentsList />
    </div>
  );
}

