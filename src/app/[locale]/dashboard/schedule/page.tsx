import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTeacherProfileByUserId } from "@/actions/teachers";
import { TeacherSchedule } from "@/components/dashboard/teacher/TeacherSchedule";

export default async function SchedulePage() {
  const session = await auth();

  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const teacherProfile = await getTeacherProfileByUserId(session.user.id!);

  if (!teacherProfile) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
        <h2 className="text-red-800 font-bold text-lg">Profil non trouvé</h2>
        <p className="text-red-600">Impossible de charger votre profil d'enseignant. Veuillez contacter l'administration.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <TeacherSchedule teacherProfileId={teacherProfile.id} />
    </div>
  );
}
