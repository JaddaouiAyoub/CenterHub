import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTeacherProfileByUserId } from "@/actions/teachers";
import { getStudentProfileByUserId } from "@/actions/students";
import { TeacherSchedule } from "@/components/dashboard/teacher/TeacherSchedule";
import { StudentSchedule } from "@/components/dashboard/student/StudentSchedule";

export default async function SchedulePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "TEACHER") {
    const teacherProfile = await getTeacherProfileByUserId(session.user.id!);
    if (!teacherProfile) {
      return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
          <h2 className="text-red-800 font-bold text-lg">Profil non trouvé</h2>
          <p className="text-red-600">Impossible de charger votre profil d'enseignant.</p>
        </div>
      );
    }
    return (
      <div className="p-6">
        <TeacherSchedule teacherProfileId={teacherProfile.id} />
      </div>
    );
  }

  if (role === "STUDENT") {
    const studentProfile = await getStudentProfileByUserId(session.user.id!);
    if (!studentProfile) {
      return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
          <h2 className="text-red-800 font-bold text-lg">Profil non trouvé</h2>
          <p className="text-red-600">Impossible de charger votre profil d'étudiant.</p>
        </div>
      );
    }
    return (
      <div className="p-6">
        <StudentSchedule profile={studentProfile} />
      </div>
    );
  }

  redirect("/dashboard");
}
