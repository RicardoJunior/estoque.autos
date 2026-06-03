import type { TemplateId } from "@/lib/types";
import type { TemplateProps } from "./types";
import { Classico } from "./templates/Classico";
import { Moderno } from "./templates/Moderno";
import { Premium } from "./templates/Premium";
import { Minimal } from "./templates/Minimal";
import { Esportivo } from "./templates/Esportivo";
import { Vitrine } from "./templates/Vitrine";

/** Tom (claro/escuro) de cada template — referência para outras telas. */
export const TEMPLATE_TONE: Record<TemplateId, "light" | "dark"> = {
  classico: "light",
  moderno: "light",
  premium: "dark",
  minimal: "light",
  esportivo: "dark",
  vitrine: "light",
};

/** Renderiza o template da loja. Switch direto (evita componente dinâmico). */
export function StorefrontView({ store, vehicles }: TemplateProps) {
  switch (store.template_id) {
    case "moderno":
      return <Moderno store={store} vehicles={vehicles} />;
    case "premium":
      return <Premium store={store} vehicles={vehicles} />;
    case "minimal":
      return <Minimal store={store} vehicles={vehicles} />;
    case "esportivo":
      return <Esportivo store={store} vehicles={vehicles} />;
    case "vitrine":
      return <Vitrine store={store} vehicles={vehicles} />;
    case "classico":
    default:
      return <Classico store={store} vehicles={vehicles} />;
  }
}
