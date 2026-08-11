import type { Storefront } from "@/lib/public";
import type { TenantHero } from "@/lib/types";

/**
 * O nome da loja aparece em TEXTO só quando não há logo (algo precisa
 * identificar a loja) ou quando o lojista ligou `show_name`.
 */
export function showStoreName(store: Storefront): boolean {
  return !store.logo_url || store.settings.show_name === true;
}

/** A hero tem mídia de fundo configurada e utilizável? */
export function heroMediaActive(hero: TenantHero | undefined | null): boolean {
  if (!hero) return false;
  if (hero.media === "video") return !!hero.video_url;
  if (hero.media === "images") return (hero.images?.length ?? 0) > 0;
  return false;
}
