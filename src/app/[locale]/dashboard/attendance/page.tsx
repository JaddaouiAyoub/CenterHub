import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AttendanceManager } from "@/components/dashboard/secretary/AttendanceManager";
import { TeacherAttendance } from "@/components/dashboard/teacher/TeacherAttendance";
import { StudentAttendanceHistory } from "@/components/dashboard/student/StudentAttendanceHistory";
import { getTeacherProfileByUserId } from "@/actions/teachers";
import { getStudentProfileByUserId } from "@/actions/students";

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
    if (!teacherProfileId) redirect("/login");
  }

  if (role === "STUDENT") {
    const profile = await getStudentProfileByUserId(session.user.id!);
    if (!profile) redirect("/login");
    return (
      <div className="p-6">
        <StudentAttendanceHistory profile={profile} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {role === "TEACHER" ? (
        <TeacherAttendance teacherProfileId={teacherProfileId!} />
      ) : (
        <AttendanceManager />
      )}
    </div>
  );
}


