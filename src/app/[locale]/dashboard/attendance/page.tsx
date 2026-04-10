import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AttendanceManager } from "@/components/dashboard/secretary/AttendanceManager";
import { TeacherAttendance } from "@/components/dashboard/teacher/TeacherAttendance";
import { getTeacherProfileByUserId } from "@/actions/teachers";

export default async function AttendancePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  let teacherProfileId: string | null = null;

  if (role === "TEACHER") {
    const profile = await getTeacherProfileByUserId(session.user.id!);
    teacherProfileId = profile?.id || null;
  }

  return (
    <div className="p-6">
      {role === "TEACHER" ? (
        teacherProfileId ? (
          <TeacherAttendance teacherProfileId={teacherProfileId} />
        ) : (
          <div className="p-8 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
            Profil enseignant non trouvé.
          </div>
        )
      ) : (
        <AttendanceManager />
      )}
    </div>
  );
}


