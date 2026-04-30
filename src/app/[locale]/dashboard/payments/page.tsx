import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PaymentManager } from "@/components/dashboard/secretary/PaymentManager";
import { StudentPaymentHistory } from "@/components/dashboard/student/StudentPaymentHistory";
import { getStudentProfileByUserId } from "@/actions/students";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const role = session.user.role;

  if (role === "STUDENT") {
    const profile = await getStudentProfileByUserId(session.user.id!);
    if (!profile) redirect("/login");
    return (
      <div className="p-6">
        <StudentPaymentHistory profile={profile} />
      </div>
    );
  }

  // Admin view
  if (role === "ADMIN") {
    return (
      <div className="p-6">
        <PaymentManager />
      </div>
    );
  }

  // Others (including Secretary) - No access
  redirect(`/${locale}/dashboard`);
}
