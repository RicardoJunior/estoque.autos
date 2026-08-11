import { isBillingInterval, isPlanId } from "@/lib/billing";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Criar conta" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string; intervalo?: string; next?: string }>;
}) {
  const { plano, intervalo, next } = await searchParams;
  return (
    <SignupForm
      plano={isPlanId(plano) ? plano : "basico"}
      intervalo={isBillingInterval(intervalo) ? intervalo : "mensal"}
      next={next}
    />
  );
}
