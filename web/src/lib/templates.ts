import type { TemplateId } from "./types";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  /** Personalidade visual, usada no seletor do onboarding/admin */
  vibe: string;
}

/**
 * Registro único dos 6 templates. O componente de cada template vive em
 * src/components/templates/<id>/ — adicionados na Fase 3.
 */
export const TEMPLATES: TemplateInfo[] = [
  {
    id: "classico",
    name: "Clássico",
    description: "Layout limpo e direto: header com logo, grid de veículos, rodapé com contato.",
    vibe: "Tradicional e confiável",
  },
  {
    id: "moderno",
    name: "Moderno",
    description: "Hero com busca integrada, cards com hover e seção de destaques.",
    vibe: "Tecnológico e arrojado",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Fundo escuro, tipografia elegante e carrossel de destaques.",
    vibe: "Alto padrão",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Tipografia grande, muito espaço em branco e foco total nas fotos.",
    vibe: "Sofisticado e discreto",
  },
  {
    id: "esportivo",
    name: "Esportivo",
    description: "Diagonais, contraste forte e CTAs agressivos. Feito para chamar atenção.",
    vibe: "Energia e velocidade",
  },
  {
    id: "vitrine",
    name: "Vitrine",
    description: "Foto gigante em destaque, navegação horizontal e cards imersivos.",
    vibe: "Visual em primeiro lugar",
  },
];

export function getTemplate(id: string): TemplateInfo {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
