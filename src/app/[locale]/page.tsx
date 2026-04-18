import { redirect } from "next/navigation";
import { auth } from "@/auth";
import HomeClient from "@/components/home/HomeClient";

export default async function IndexPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const session = await auth();

  if (session) {
    redirect(`/${locale}/dashboard`);
  }

  return <HomeClient locale={locale} />;
}
