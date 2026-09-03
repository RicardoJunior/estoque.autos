import { PORTAL_LABELS, type PortalId } from "../types";
import type { PortalAdapter } from "./types";

// ============================================================
// Registro dos portais: metadados para a UI (todos) e adapters
// (só os implementados). Carregamento lazy para não puxar os
// clientes de todos os portais em cada rota.
// ============================================================

export type PortalMode = "oauth" | "credentials" | "feed";

export interface PortalMeta {
  id: PortalId;
  label: string;
  mode: PortalMode;
  /** adapter pronto para uso */
  implemented: boolean;
  /** ordem de exibição (roadmap do plano) */
  order: number;
  /** pré-requisito comercial que a loja precisa resolver com o portal */
  prerequisite: string;
  /** rótulo curto do estado "sem plano" */
  needsPlanHint: string;
  docsUrl?: string;
}

export const PORTAL_META: Record<PortalId, PortalMeta> = {
  mercadolivre: {
    id: "mercadolivre",
    label: PORTAL_LABELS.mercadolivre,
    mode: "oauth",
    implemented: true,
    order: 1,
    prerequisite:
      "Sua loja precisa ter um pacote de publicação de veículos contratado com o time comercial do Mercado Livre. Sem o pacote, os anúncios são recusados na hora de publicar.",
    needsPlanHint: "Contrate um pacote de veículos com o Mercado Livre e clique em “Sincronizar tudo”.",
    docsUrl: "https://vendedores.mercadolivre.com.br/veiculos",
  },
  olx: {
    id: "olx",
    label: PORTAL_LABELS.olx,
    mode: "oauth",
    implemented: true,
    order: 2,
    prerequisite:
      "A OLX só libera a integração para lojas com plano Empresa (Essencial, Plus ou Premium Empresa). Contratação pelo 0800 022 9800.",
    needsPlanHint: "Contrate um plano Empresa com a OLX (0800 022 9800) e clique em “Sincronizar tudo”.",
    docsUrl: "https://ajuda.olx.com.br/s/article/integradores-e-importacao-de-anuncios",
  },
  webmotors: {
    id: "webmotors",
    label: PORTAL_LABELS.webmotors,
    mode: "credentials",
    implemented: false,
    order: 3,
    prerequisite:
      "Exige Cockpit com Plano Controle ou Performance e uma credencial “Estoque Terceiro” gerada no Cockpit. A homologação do estoque.autos junto à Webmotors está em andamento.",
    needsPlanHint: "Contrate o Cockpit (Plano Controle/Performance) com a Webmotors.",
    docsUrl: "https://ajuda.cockpit.com.br/hc/pt-br",
  },
  chavesnamao: {
    id: "chavesnamao",
    label: PORTAL_LABELS.chavesnamao,
    mode: "credentials",
    implemented: false,
    order: 4,
    prerequisite: "Token de integração fornecido pelo Chaves na Mão (ws@chavesnamao.com.br).",
    needsPlanHint: "Solicite o token de integração ao Chaves na Mão.",
  },
  meta_catalog: {
    id: "meta_catalog",
    label: PORTAL_LABELS.meta_catalog,
    mode: "feed",
    implemented: true,
    order: 5,
    prerequisite:
      "Crie um catálogo do tipo “Veículos” no Gerenciador de Comércio da Meta e cadastre a URL do feed abaixo como fonte de dados (atualização a cada 24 h). Anúncios de inventário automotivo são pagos (Gerenciador de Anúncios).",
    needsPlanHint: "",
    docsUrl: "https://www.facebook.com/business/help/1510143265745613",
  },
  usadosbr: {
    id: "usadosbr",
    label: PORTAL_LABELS.usadosbr,
    mode: "feed",
    implemented: true,
    order: 6,
    prerequisite:
      "Envie a URL do feed XML abaixo para suporte@usadosbr.com junto com o CNPJ da loja; eles configuram a leitura do lado deles.",
    needsPlanHint: "",
    docsUrl: "https://ajuda.usadosbr.com/dt_articles/integrar-meu-estoque-com-a-usadosbr/",
  },
};

export const PORTALS_ORDERED: PortalMeta[] = Object.values(PORTAL_META).sort(
  (a, b) => a.order - b.order,
);

export function isPortalId(value: string): value is PortalId {
  return value in PORTAL_META;
}

/** Portais com adapter de publicação (aparecem no "Publicar em" do veículo). */
export function isPublishingPortal(portal: PortalId): boolean {
  const m = PORTAL_META[portal];
  return m.implemented && m.mode !== "feed";
}

const loaders: Partial<Record<PortalId, () => Promise<PortalAdapter>>> = {
  mercadolivre: async () => (await import("./mercadolivre/adapter")).mercadoLivreAdapter,
  olx: async () => (await import("./olx/adapter")).olxAdapter,
};

export async function getAdapter(portal: PortalId): Promise<PortalAdapter> {
  const load = loaders[portal];
  if (!load) throw new Error(`portal sem adapter: ${portal}`);
  return load();
}

export function hasAdapter(portal: PortalId): boolean {
  return portal in loaders;
}
