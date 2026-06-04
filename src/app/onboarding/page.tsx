import { redirect } from "next/navigation";
import { getSession, getSubscription, isSubscriptionActive } from "@/lib/auth";
import { storeFontPreviewMap } from "@/lib/store-fonts-loader";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Criar minha loja" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.tenant) redirect("/admin");

  // plano-primeiro: a loja só nasce com assinatura ativa (o RPC
  // create_tenant também barra no banco; aqui é UX)
  const sub = await getSubscription();
  if (!isSubscriptionActive(sub)) redirect("/cadastro/assinatura");

  return <OnboardingWizard fontPreviews={storeFontPreviewMap()} />;
}
