"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BILLING_INTERVALS,
  PLANS,
  annualMonthlyEquivalent,
  annualSavingsPct,
  type BillingInterval,
} from "@/lib/billing";

// Conteúdo de marketing dos cards (preços vêm de PLANS — fonte única)
const CARDS = [
  {
    id: "basico" as const,
    tag: "Para começar",
    featured: false,
    cta: "Assinar o Básico",
    items: [
      "Site pronto com os 6 templates",
      "Cor, fonte e logo da loja",
      "Até 20 carros ativos",
      "Cadastro pela tabela FIPE",
      "Leads por proposta e WhatsApp",
      "Endereço estoque.autos/sua-loja",
    ],
  },
  {
    id: "pro" as const,
    tag: "Para crescer",
    featured: true,
    cta: "Assinar o Pro",
    items: [
      "Tudo do Básico, e mais:",
      "Domínio próprio (sualoja.com.br)",
      "Até 60 carros ativos",
      "Destaque nos resultados de busca",
      "Suporte prioritário",
    ],
  },
];

/** "24" + ",90" — o layout da landing separa reais de centavos. */
function splitPrice(cents: number): [string, string] {
  const reais = Math.floor(cents / 100);
  const resto = cents % 100;
  return [String(reais), resto === 0 ? "" : `,${String(resto).padStart(2, "0")}`];
}

export function PlanosSection() {
  const [interval, setInterval] = useState<BillingInterval>("mensal");
  const maxSavings = Math.max(
    ...Object.values(PLANS).map((p) => annualSavingsPct(p)),
  );

  return (
    <>
      {/* mensal × anual */}
      <div
        className="mt-9 inline-flex gap-1 rounded-full border border-border bg-card p-1"
        role="group"
        aria-label="Intervalo de cobrança"
      >
        {BILLING_INTERVALS.map((i) => (
          <button
            key={i}
            type="button"
            aria-pressed={i === interval}
            onClick={() => setInterval(i)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary",
              i === interval
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {i === "mensal" ? "Mensal" : (
              <>
                Anual{" "}
                <span className={i === interval ? "opacity-85" : "text-primary"}>
                  · até {maxSavings}% off
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="lp-plans">
        {CARDS.map((card) => {
          const plan = PLANS[card.id];
          const [reais, centavos] = splitPrice(plan.priceCents[interval]);
          return (
            <div
              key={card.id}
              className={`lp-plan${card.featured ? " lp-plan-pro" : ""}`}
            >
              {card.featured && (
                <Badge className="lp-plan-badge">Mais escolhido</Badge>
              )}
              <div className="lp-plan-head">
                <span className="lp-plan-name">{plan.name}</span>
                <span className="lp-plan-tag">{card.tag}</span>
              </div>
              <div className="lp-price">
                <span className="lp-price-cur">R$</span>
                <span className="lp-price-val font-display">{reais}</span>
                <span className="lp-price-cents">{centavos}</span>
                <span className="lp-price-per">
                  /{interval === "mensal" ? "mês" : "ano"}
                </span>
              </div>
              <p
                className={cn(
                  "min-h-5 text-xs",
                  interval === "anual" ? "text-muted-foreground" : "invisible",
                )}
              >
                equivale a {annualMonthlyEquivalent(plan)}/mês —{" "}
                <span className="text-primary font-semibold">
                  economize {annualSavingsPct(plan)}%
                </span>
              </p>
              <ul className="lp-plan-list">
                {card.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <Link
                href={`/cadastro?plano=${card.id}&intervalo=${interval}`}
                className={cn(
                  buttonVariants({
                    size: "lg",
                    variant: card.featured ? "default" : "outline",
                  }),
                  "lp-plan-btn",
                  card.featured && "lp-cta",
                )}
              >
                {card.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
