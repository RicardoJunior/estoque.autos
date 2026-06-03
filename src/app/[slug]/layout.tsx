import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/public";
import { themeVars } from "@/components/storefront/theme";

/**
 * Aplica o tema da loja (cores) ao container — escopo local, sem vazar
 * para :root (corrige o bug de tema global da v1).
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

  return <div style={themeVars(store.colors)}>{children}</div>;
}
