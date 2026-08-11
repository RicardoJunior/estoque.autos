import { redirect } from "next/navigation";
import {
  getSession,
  getUnlinkedSubscription,
  isSubscriptionActive,
} from "@/lib/auth";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Criar minha loja" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // plano-primeiro: cada loja nasce de uma assinatura ainda sem loja
  // (o RPC create_tenant também barra no banco; aqui é UX)
  const sub = await getUnlinkedSubscription();
  if (!isSubscriptionActive(sub)) {
    redirect(session.memberships.length > 0 ? "/admin" : "/cadastro/assinatura");
  }

  return <OnboardingWizard />;
}
