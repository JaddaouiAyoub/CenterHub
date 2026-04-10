import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStudentProfileByUserId } from "@/actions/students";
import { StudentResources } from "@/components/dashboard/student/StudentResources";

export default async function ResourcesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role !== "STUDENT") {
    // For now, only students have a dedicated unified resources page
    // Teachers see resources per course in their schedule.
    redirect("/dashboard");
  }

  const profile = await getStudentProfileByUserId(session.user.id!);

  if (!profile) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
        <h2 className="text-red-800 font-bold text-lg">Profil non trouvé</h2>
        <p className="text-red-600">Impossible de charger votre profil d'étudiant.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <StudentResources profile={profile} />
    </div>
  );
}
