import type { ReactNode } from "react";

interface Props {
  title: string;
  /** subtítulo/contagem opcional (ex.: "12 veículos") */
  subtitle?: ReactNode;
  /** conteúdo à direita (ex.: <StoreSearch />) */
  action?: ReactNode;
  tone?: "light" | "dark";
  /** mostra um traço de destaque sob o título (estilo premium/esportivo) */
  accentRule?: boolean;
  className?: string;
}

/**
 * Cabeçalho de seção reutilizável pelos templates. Título usa a fonte de
 * títulos da loja (var(--sf-font-head)); o traço de destaque usa
 * var(--sf-primary). Tom claro/escuro ajusta apenas as cores neutras.
 */
export function SectionHeader({
  title,
  subtitle,
  action,
  tone = "light",
  accentRule = false,
  className = "",
}: Props) {
  const dark = tone === "dark";
  return (
    <div
      className={`mb-6 flex flex-wrap items-end justify-between gap-4 ${className}`}
    >
      <div>
        <h2
          className={`text-xl font-bold sm:text-2xl ${
            dark ? "text-white" : "text-slate-900"
          }`}
          style={{ fontFamily: "var(--sf-font-head)" }}
        >
          {title}
        </h2>
        {accentRule && (
          <div
            className="mt-3 h-px w-16"
            style={{ background: "var(--sf-primary)" }}
          />
        )}
        {subtitle != null && (
          <p
            className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action != null && <div>{action}</div>}
    </div>
  );
}
