import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";

/**
 * Barra fixa das páginas de demonstração: deixa claro que é um site de
 * exemplo, permite alternar entre os 6 templates sem voltar à landing
 * e concentra a conversão ("Criar meu site").
 */
export function DemoBar({ current }: { current: TemplateId }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0b0c10]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        {/* sempre visível — no mobile é o único aviso de que o site é
            fictício e a única volta para a landing */}
        <Link
          href="/#templates"
          className="shrink-0 text-xs font-semibold uppercase tracking-wide text-white/50 transition hover:text-white"
          title="Voltar para estoque.autos"
        >
          ← Demo<span className="hidden sm:inline">nstração</span>
        </Link>
        <nav
          aria-label="Ver outros templates"
          className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto"
        >
          {TEMPLATES.map((t) => {
            const active = t.id === current;
            return (
              <Link
                key={t.id}
                href={`/demo/${t.id}`}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.name}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/cadastro"
          className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
        >
          Criar meu site →
        </Link>
      </div>
    </div>
  );
}
