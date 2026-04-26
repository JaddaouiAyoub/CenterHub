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
    if (!teacherProfile) redirect("/login");
    return (
      <div className="p-6">
        <TeacherSchedule teacherProfileId={teacherProfile.id} />
      </div>
    );
  }

  if (role === "STUDENT") {
    const studentProfile = await getStudentProfileByUserId(session.user.id!);
    if (!studentProfile) redirect("/login");
    return (
      <div className="p-6">
        <StudentSchedule profile={studentProfile} />
      </div>
    );
  }

  redirect("/dashboard");
}
