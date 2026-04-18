import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SubjectResourceManager } from "@/components/dashboard/resources/SubjectResourceManager";
import { getSubjects, getClasses } from "@/actions/courses";

export default async function ResourcesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const subjects = await getSubjects();
  const classes = await getClasses();
  const studentId = role === "STUDENT" ? session.user.id : undefined;

  return (
    <div className="p-6">
      <SubjectResourceManager 
        role={role} 
        subjects={subjects} 
        classes={classes} 
        studentId={studentId}
      />
    </div>
  );
}
