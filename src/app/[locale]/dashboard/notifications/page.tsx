import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStudentProfileByUserId } from "@/actions/students";
import { getTeacherProfileByUserId } from "@/actions/teachers";
import { getClasses } from "@/actions/courses";
import { NotificationsManager } from "@/components/notifications/NotificationsManager";
import { StudentNotifications } from "@/components/notifications/StudentNotifications";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { role, id: userId } = session.user;

  // ── Student ──────────────────────────────────────────────────────────────
  if (role === "STUDENT") {
    const profile = await getStudentProfileByUserId(userId!);
    if (!profile) redirect("/login");
    return (
      <div className="p-6">
        <StudentNotifications userId={userId!} studentProfileId={profile.id} />
      </div>
    );
  }

  // ── Teacher ───────────────────────────────────────────────────────────────
  if (role === "TEACHER") {
    const profile = await getTeacherProfileByUserId(userId!);
    if (!profile) redirect("/login");
    
    // Get their assigned class IDs for targeting
    const assignedClassIds: string[] = profile
      ? (profile as any).courses?.map((c: any) => c.classId).filter(Boolean) ?? []
      : [];
    const uniqueClassIds = [...new Set(assignedClassIds)] as string[];

    return (
      <div className="p-6">
        <NotificationsManager
          userId={userId!}
          role="TEACHER"
          assignedClassIds={uniqueClassIds}
        />
      </div>
    );
  }

  // ── Secretary ─────────────────────────────────────────────────────────────
  if (role === "SECRETARY") {
    return (
      <div className="p-6">
        <NotificationsManager userId={userId!} role="SECRETARY" />
      </div>
    );
  }

  redirect("/dashboard");
}
