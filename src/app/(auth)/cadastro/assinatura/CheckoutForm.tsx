"use client";

import { Button } from "@/components/ui/button";
import { trackFunnel } from "@/lib/funnel";
import type { BillingInterval } from "@/lib/billing";
import type { PlanId } from "@/lib/types";

/**
 * Form do checkout: server action + evento begin_checkout (GA4/Meta)
 * no submit. O redirect para o Stripe acontece na action.
 */
export function CheckoutForm({
  action,
  plano,
  intervalo,
  valueCents,
}: {
  action: (formData: FormData) => Promise<void>;
  plano: PlanId;
  intervalo: BillingInterval;
  valueCents: number;
}) {
  return (
    <form
      action={action}
      className="mt-6"
      onSubmit={() =>
        trackFunnel("begin_checkout", {
          value: valueCents / 100,
          plan: plano,
          interval: intervalo,
        })
      }
    >
      <input type="hidden" name="plano" value={plano} />
      <input type="hidden" name="intervalo" value={intervalo} />
      <Button type="submit" className="w-full">
        Continuar para o pagamento
      </Button>
    </form>
  );
}
