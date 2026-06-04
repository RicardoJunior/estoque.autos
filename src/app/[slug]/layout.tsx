import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/public";
import { themeVarsFromStore } from "@/components/storefront/theme";
import { storeFontClassName } from "@/lib/store-fonts-loader";
import { WhatsAppFloat } from "@/components/storefront/WhatsAppFloat";

/**
 * Aplica o tema da loja (cores + fonte) ao container — escopo local,
 * sem vazar para :root (corrige o bug de tema global da v1).
 * A className do next/font injeta o @font-face; as vars --sf-font /
 * --sf-font-head dizem aos templates quais famílias usar.
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

  return (
    <div
      className={storeFontClassName(store.settings.font)}
      style={{ ...themeVarsFromStore(store), fontFamily: "var(--sf-font)" }}
    >
      {children}
      {/* WhatsApp flutuante global à vitrine (todas as lojas/páginas). */}
      <WhatsAppFloat whatsapp={store.whatsapp} storeName={store.name} />
    </div>
  );
}
