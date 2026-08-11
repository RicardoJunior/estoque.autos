import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/public";
import { themeVars, fontVars, surfaceVars } from "@/components/storefront/theme";
import { resolveStorefrontFonts } from "@/lib/google-fonts";
import { WhatsAppFloat } from "@/components/storefront/WhatsAppFloat";
import { TrackingPixels } from "@/components/storefront/TrackingPixels";

/**
 * Aplica o tema da loja (cores + fonte) ao container — escopo local,
 * sem vazar para :root (corrige o bug de tema global da v1).
 *
 * As fontes são QUALQUER família do Google Fonts, carregadas em runtime
 * via <link> da API css2 (next/font só aceita fontes estáticas de build).
 * O React 19 faz hoist dos <link> abaixo para o <head>; `precedence` é
 * obrigatório para stylesheet ser hoisted/dedupado.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();

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
      {children}
      {/* WhatsApp flutuante global à vitrine (todas as lojas/páginas). */}
      <WhatsAppFloat whatsapp={store.whatsapp} storeName={store.name} />
      {/* pixels de marketing — recurso do plano Pro */}
      {store.plan === "pro" && (
        <TrackingPixels tracking={store.settings.tracking} />
      )}
    </div>
  );
}
