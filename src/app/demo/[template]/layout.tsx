import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoStorefront, isTemplateId } from "@/lib/demo-store";
import { resolveStorefrontFonts } from "@/lib/google-fonts";
import { themeVars, fontVars, surfaceVars } from "@/components/storefront/theme";
import { DemoBar } from "./DemoBar";

/** Demos são material de venda, não conteúdo indexável. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Espelho do layout de vitrine ([slug]/layout) para as lojas de
 * demonstração: mesmo tema escopado + Google Fonts dinâmico, mas com
 * dados em memória, sem WhatsApp flutuante e com a barra de demo.
 */
export default async function DemoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  if (!isTemplateId(template)) notFound();

  const store = demoStorefront(template);
  const fonts = await resolveStorefrontFonts(store.settings);

  return (
    <div
      style={{
        ...themeVars(store.colors),
        ...surfaceVars(store.colors.background),
        ...fontVars(fonts),
        fontFamily: "var(--sf-font)",
      }}
    >
      {fonts.href && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={fonts.href} precedence="default" />
        </>
      )}
      {/* respiro para a barra fixa não cobrir o rodapé */}
      <div className="pb-14">{children}</div>
      <DemoBar current={template} />
    </div>
  );
}
