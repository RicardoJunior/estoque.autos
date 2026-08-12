import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  /** linha de destaque acima do título (ex.: "Bem-vindo", "Destaque") */
  eyebrow?: ReactNode;
  /** null/undefined = loja apagou o título → o h1 não renderiza */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** preço/valor exibido em destaque (ex.: hero de veículo) */
  price?: ReactNode;
  /** CTA principal */
  cta?: { label: string; href: string };
  /** imagem de fundo (hero com foto do veículo) */
  image?: { url: string; alt: string } | null;
  /** alinhamento do conteúdo */
  align?: "left" | "center";
  tone?: "light" | "dark";
  /** quando true, mostra o traço de destaque (estilo premium) */
  accentRule?: boolean;
  className?: string;
}

/**
 * Hero reutilizável com variações por props: com/sem imagem de fundo,
 * alinhado à esquerda/centro, claro/escuro. Cores e fontes vêm do tema
 * da loja (var(--sf-*)). Não fixa cores de marca — só neutras/overlay.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  price,
  cta,
  image,
  align = "left",
  tone = "light",
  accentRule = false,
  className = "",
}: Props) {
  // tom escuro aqui = texto sobre foto/mídia com overlay preto — cores
  // literais claras p/ legibilidade, independem do fundo custom do site;
  // no tom claro as neutras seguem os tokens var(--sf-*) do tema
  const dark = tone === "dark" || !!image;
  const centered = align === "center";
  const alignCls = centered ? "items-center text-center" : "items-start";

  const content = (
    <div
      className={`mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 ${alignCls}`}
    >
      {eyebrow != null && (
        <span
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--sf-primary)" }}
        >
          {eyebrow}
        </span>
      )}
      {title != null && (
        <h1
          className="text-3xl font-bold leading-tight sm:text-5xl"
          style={{
            fontFamily: "var(--sf-font-head)",
            color: dark ? "#ffffff" : "var(--sf-ink, #0f172a)",
          }}
        >
          {title}
        </h1>
      )}
      {accentRule && (
        <div
          className={`h-px w-20 ${centered ? "mx-auto" : ""}`}
          style={{ background: "var(--sf-primary)" }}
        />
      )}
      {subtitle != null && (
        <p
          className="max-w-2xl text-base sm:text-lg"
          style={{ color: dark ? "#cbd5e1" : "var(--sf-ink-soft, #64748b)" }}
        >
          {subtitle}
        </p>
      )}
      {(price != null || cta) && (
        <div
          className={`mt-3 flex flex-wrap items-center gap-5 ${
            centered ? "justify-center" : ""
          }`}
        >
          {price != null && (
            <span
              className="text-2xl font-extrabold sm:text-3xl"
              style={{ color: dark ? "#ffffff" : "var(--sf-ink, #0f172a)" }}
            >
              {price}
            </span>
          )}
          {cta && (
            <Link
              href={cta.href}
              className="rounded-full px-6 py-2.5 text-sm font-semibold transition hover:opacity-90"
              style={{
                background: "var(--sf-accent)",
                color: "var(--sf-on-accent)",
              }}
            >
              {cta.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );

  if (image) {
    return (
      <section className={`relative ${className}`}>
        <div className="relative aspect-video w-full overflow-hidden sm:aspect-[21/9]">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/15" />
          <div className="absolute inset-0 flex items-end pb-12 sm:pb-16">
            {content}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative ${className}`}
      style={{ background: dark ? undefined : "var(--sf-primary-soft)" }}
    >
      <div className="flex flex-col py-14 sm:py-20">{content}</div>
    </section>
  );
}
