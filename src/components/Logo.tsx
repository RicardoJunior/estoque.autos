import type { CSSProperties } from "react";

/** Cor da marca (âmbar). Mantém o ".autos" e o tile sempre na cor da marca. */
const BRAND = "#ff7a1a";

/**
 * Ícone da marca — chevrons de velocidade («) num tile âmbar arredondado.
 * Sem dependência de fonte; escala em qualquer tamanho. Serve em Server e
 * Client Components (sem hooks).
 */
export function LogoMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="8" fill={BRAND} />
      <path
        d="M9.5 10 15 16l-5.5 6M16 10l5.5 6L16 22"
        stroke="#160a02"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Marca completa: ícone + wordmark "estoque.autos". "estoque" usa currentColor
 * (adapta a fundo claro/escuro); ".autos" é sempre âmbar. Reutilizável em todo
 * o projeto (landing, auth, onboarding, admin).
 */
export function Logo({
  size = 22,
  showWordmark = true,
  className,
  style,
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.4),
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        fontSize: Math.round(size * 0.82),
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <LogoMark size={size} />
      {showWordmark && (
        <span>
          estoque<span style={{ color: BRAND }}>.autos</span>
        </span>
      )}
    </span>
  );
}
