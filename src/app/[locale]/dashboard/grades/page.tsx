import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTeacherProfileByUserId } from "@/actions/teachers";
import { getStudentProfileByUserId } from "@/actions/students";
import { TeacherGrades } from "@/components/dashboard/teacher/TeacherGrades";
import { StudentGrades } from "@/components/dashboard/student/StudentGrades";

export default async function GradesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "TEACHER") {
    const profile = await getTeacherProfileByUserId(session.user.id!);
    if (!profile) return <div>Profil enseignant non trouvé</div>;
    return <TeacherGrades teacherProfileId={profile.id} />;
  }

  if (role === "STUDENT") {
    const profile = await getStudentProfileByUserId(session.user.id!);
    if (!profile) return <div>Profil étudiant non trouvé</div>;
    return <StudentGrades studentProfileId={profile.id} />;
  }

  return (
    <div className="p-8 text-center text-slate-500">
      Cette fonctionnalité est réservée aux enseignants et aux étudiants.
    </div>
  );
}
