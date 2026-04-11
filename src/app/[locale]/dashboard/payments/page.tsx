import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PaymentManager } from "@/components/dashboard/secretary/PaymentManager";
import { StudentPaymentHistory } from "@/components/dashboard/student/StudentPaymentHistory";
import { getStudentProfileByUserId } from "@/actions/students";

export default async function PaymentsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "STUDENT") {
    const profile = await getStudentProfileByUserId(session.user.id!);
    if (!profile) {
      return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
          <h2 className="text-red-800 font-bold text-lg">Profil non trouvé</h2>
          <p className="text-red-600">Impossible de charger votre profil.</p>
        </div>
      );
    }
    return (
      <div className="p-6">
        <StudentPaymentHistory profile={profile} />
      </div>
    );
  }

  // Secretary / Admin view
  return (
    <div className="p-6">
      <PaymentManager />
    </div>
  );
}
