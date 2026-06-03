import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Criar minha loja" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.tenant) redirect("/admin");

  return <OnboardingWizard />;
}
