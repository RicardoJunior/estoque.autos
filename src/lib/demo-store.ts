import type { PublicVehicle, Storefront, VehicleQuery } from "./public";
import {
  TEMPLATE_IDS,
  type TemplateId,
  type TenantColors,
  type TenantFonts,
  type TenantHero,
} from "./types";

// ============================================================
// Lojas de DEMONSTRAÇÃO dos templates (/demo/[template]).
// Tudo em memória — nada toca o banco. Cada template ganha uma
// marca fictícia própria (nome, cores, fontes) para mostrar na
// prática o quanto a vitrine é configurável.
// ============================================================

export function isTemplateId(v: string): v is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(v);
}

interface DemoBrand {
  name: string;
  slogan: string;
  about: string;
  colors: TenantColors;
  fonts: TenantFonts;
  /** demos também vitrinam os recursos novos */
  background?: string;
  hero?: TenantHero;
}

const BRANDS: Record<TemplateId, DemoBrand> = {
  classico: {
    name: "Andrade Veículos",
    slogan: "Tradição e procedência em seminovos",
    about:
      "Há 22 anos no mesmo endereço, a Andrade Veículos é referência em seminovos revisados com garantia e procedência. Cada carro passa por inspeção de 120 itens antes de ir para a vitrine.",
    colors: { primary: "#1d4ed8", accent: "#f59e0b" },
    fonts: { head: "Archivo", body: "Inter" },
  },
  moderno: {
    name: "Vetor Motors",
    slogan: "O jeito novo de comprar seminovos",
    about:
      "A Vetor nasceu digital: preço transparente, histórico completo de cada carro e negociação direta pelo WhatsApp. Sem pressão de vendedor, sem letra miúda.",
    colors: { primary: "#7c3aed", accent: "#06b6d4" },
    fonts: { head: "Sora", body: "Inter" },
  },
  premium: {
    name: "Blackstone Motors",
    slogan: "Curadoria de veículos excepcionais",
    about:
      "Selecionamos poucas unidades, todas com histórico impecável e revisões em concessionária. Atendimento com hora marcada, avaliação do seu usado no ato e entrega assistida.",
    colors: { primary: "#cfa85c", accent: "#a8843e" },
    fonts: { head: "Playfair Display", body: "Inter" },
  },
  minimal: {
    name: "Galeria Um",
    slogan: "Menos ruído. Melhores carros.",
    about:
      "Uma seleção enxuta, fotos honestas e preço justo. A Galeria Um acredita que comprar carro pode ser simples — e que bom design também é respeito ao cliente.",
    colors: { primary: "#0f172a", accent: "#e11d48" },
    fonts: { head: "Fraunces", body: "Source Sans 3" },
    background: "#faf7f2",
  },
  esportivo: {
    name: "Garage 88",
    slogan: "Potência com procedência",
    about:
      "Especializada em esportivos e versões topo de linha. Dinamômetro próprio, laudo cautelar completo e test-drive agendado para todos os carros do estoque.",
    colors: { primary: "#dc2626", accent: "#facc15" },
    fonts: { head: "Bebas Neue", body: "DM Sans" },
    hero: {
      media: "images",
      images: [
        { id: "h1", path: "", url: "/demo/cars/golf-1.svg" },
        { id: "h2", path: "", url: "/demo/cars/hrv-1.svg" },
      ],
    },
  },
  vitrine: {
    name: "Boulevard Autos",
    slogan: "Seu próximo carro em destaque",
    about:
      "No Boulevard o carro é a estrela: fotos grandes, ficha completa e atendimento ágil. Financiamento com as principais instituições e troca com troco facilitada.",
    colors: { primary: "#0f766e", accent: "#ea580c" },
    fonts: { head: "Space Grotesk", body: "DM Sans" },
    hero: {
      media: "images",
      images: [
        { id: "h1", path: "", url: "/demo/cars/civic-1.svg" },
        { id: "h2", path: "", url: "/demo/cars/ranger-1.svg" },
        { id: "h3", path: "", url: "/demo/cars/tcross-1.svg" },
      ],
    },
  },
};

/** Slug composto: os templates montam hrefs como `/${slug}/carros/...`. */
export function demoSlug(template: TemplateId): string {
  return `demo/${template}`;
}

export function demoStorefront(template: TemplateId): Storefront {
  const brand = BRANDS[template];
  return {
    id: `demo-${template}`,
    slug: demoSlug(template),
    name: brand.name,
    // padrão "555x": não colide com número real (4002-8922 é de verdade)
    phone: "(11) 5555-0123",
    // sem WhatsApp: os botões wa.me sumiriam para um número fictício de
    // qualquer forma — a conversão da demo é a barra "Criar meu site"
    whatsapp: null,
    email: "contato@exemplo.com.br",
    address: {
      street: "Av. Brigadeiro Faria Lima",
      number: "1500",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
      cep: "01452-001",
    },
    template_id: template,
    colors: { ...brand.colors, background: brand.background },
    logo_url: null,
    settings: {
      slogan: brand.slogan,
      about: brand.about,
      footer_text: "Site de demonstração criado com estoque.autos.",
      business_hours: "Seg a Sex 9h–18h\nSáb 9h–13h",
      fonts: brand.fonts,
      hero: brand.hero,
    },
  };
}

// ------------------------------------------------------------
// Estoque de demonstração (compartilhado pelos 6 templates)
// ------------------------------------------------------------

const photo = (name: string, n: number) => ({
  id: `${name}-${n}`,
  path: `demo/${name}-${n}.svg`,
  url: `/demo/cars/${name}-${n}.svg`,
});

const vehicle = (
  v: Omit<
    PublicVehicle,
    | "tenant_id"
    | "optionals"
    | "photos"
    | "created_at"
    | "doors"
    | "color"
    | "condition_flags"
  > &
    Partial<
      Pick<PublicVehicle, "optionals" | "doors" | "color" | "condition_flags">
    > & {
      photoName: string;
      createdDaysAgo: number;
    },
): PublicVehicle => {
  const { photoName, createdDaysAgo, ...rest } = v;
  return {
    tenant_id: "demo",
    doors: 4,
    color: null,
    optionals: [],
    condition_flags: [],
    photos: [photo(photoName, 1), photo(photoName, 2)],
    // datas fixas (build determinístico) espaçadas para o sort "recentes"
    created_at: new Date(
      Date.UTC(2026, 6, 30) - createdDaysAgo * 86_400_000,
    ).toISOString(),
    ...rest,
  };
};

export const DEMO_VEHICLES: PublicVehicle[] = [
  vehicle({
    id: "civic-touring",
    brand: "Honda",
    model: "Civic",
    version: "Touring 1.5 Turbo",
    year_fab: 2023,
    year_model: 2023,
    color: "Prata",
    fuel: "gasolina",
    transmission: "cvt",
    mileage: 28400,
    category: "carro",
    price: 164900,
    description:
      "Único dono, todas as revisões na concessionária. Pneus novos, sem detalhes de pintura.",
    optionals: ["Teto solar", "Bancos em couro", "ACC", "Central multimídia", "Câmera de ré"],
    featured: true,
    status: "available",
    fipe_price: 168500,
    fipe_reference: "julho de 2026",
    photoName: "civic",
    createdDaysAgo: 2,
  }),
  vehicle({
    id: "corolla-xei",
    brand: "Toyota",
    model: "Corolla",
    version: "XEi 2.0 Flex",
    year_fab: 2022,
    year_model: 2023,
    color: "Cinza",
    fuel: "flex",
    transmission: "cvt",
    mileage: 41200,
    category: "carro",
    price: 139900,
    description:
      "Revisado, laudo cautelar aprovado. IPVA 2026 pago. Aceita troca com troco.",
    optionals: ["Bancos em couro", "Faróis full LED", "Chave presencial"],
    featured: true,
    status: "available",
    fipe_price: 141200,
    fipe_reference: "julho de 2026",
    photoName: "corolla",
    createdDaysAgo: 5,
  }),
  vehicle({
    id: "hrv-touring",
    brand: "Honda",
    model: "HR-V",
    version: "Touring 1.5 Turbo",
    year_fab: 2023,
    year_model: 2024,
    color: "Vermelho",
    fuel: "gasolina",
    transmission: "cvt",
    mileage: 19800,
    category: "carro",
    price: 172900,
    description: "Impecável. Garantia de fábrica até 2027, manual e duas chaves.",
    optionals: ["Teto solar", "Sensor de ponto cego", "Carregador por indução"],
    featured: false,
    status: "available",
    fipe_price: 175800,
    fipe_reference: "julho de 2026",
    photoName: "hrv",
    createdDaysAgo: 8,
  }),
  vehicle({
    id: "compass-limited",
    brand: "Jeep",
    model: "Compass",
    version: "Limited T270",
    year_fab: 2022,
    year_model: 2022,
    color: "Preto",
    fuel: "flex",
    transmission: "automatico",
    mileage: 52300,
    category: "carro",
    price: 149900,
    description:
      "Versão Limited com pacote Premium. Segundo dono, histórico completo no app.",
    optionals: ["Teto panorâmico", "Bancos em couro", "Piloto adaptativo"],
    featured: false,
    status: "reserved",
    fipe_price: 152400,
    fipe_reference: "julho de 2026",
    photoName: "compass",
    createdDaysAgo: 12,
  }),
  vehicle({
    id: "tcross-highline",
    brand: "Volkswagen",
    model: "T-Cross",
    version: "Highline 1.4 TSI",
    year_fab: 2023,
    year_model: 2023,
    color: "Azul",
    fuel: "flex",
    transmission: "automatico",
    mileage: 33100,
    category: "carro",
    price: 132900,
    description: "Highline com ADAS completo. Pneus meia-vida, revisões em dia.",
    optionals: ["Painel digital", "Keyless", "Ar digital touch"],
    featured: false,
    status: "available",
    fipe_price: 134600,
    fipe_reference: "julho de 2026",
    photoName: "tcross",
    createdDaysAgo: 15,
  }),
  vehicle({
    id: "onix-premier",
    brand: "Chevrolet",
    model: "Onix",
    version: "Premier 1.0 Turbo",
    year_fab: 2024,
    year_model: 2024,
    color: "Branco",
    fuel: "flex",
    transmission: "automatico",
    mileage: 12700,
    category: "carro",
    price: 94900,
    description: "Praticamente zero. Na garantia de fábrica, sem nenhum retoque.",
    optionals: ["Wi-Fi nativo", "Câmera de ré", "Sensor de estacionamento"],
    featured: false,
    status: "available",
    fipe_price: 96200,
    fipe_reference: "julho de 2026",
    photoName: "onix",
    createdDaysAgo: 19,
  }),
  vehicle({
    id: "hilux-srx",
    brand: "Toyota",
    model: "Hilux",
    version: "SRX 2.8 Diesel 4x4",
    year_fab: 2022,
    year_model: 2023,
    color: "Cinza",
    fuel: "diesel",
    transmission: "automatico",
    mileage: 61500,
    category: "utilitario",
    price: 259900,
    description:
      "SRX 4x4 com capota marítima e protetor de caçamba. Nunca puxou implemento.",
    optionals: ["Capota marítima", "Estribos", "Central multimídia"],
    featured: false,
    status: "available",
    fipe_price: 263800,
    fipe_reference: "julho de 2026",
    photoName: "hilux",
    createdDaysAgo: 23,
  }),
  vehicle({
    id: "ranger-limited",
    brand: "Ford",
    model: "Ranger",
    version: "Limited 3.0 V6 Diesel",
    year_fab: 2023,
    year_model: 2024,
    color: "Azul",
    fuel: "diesel",
    transmission: "automatico",
    mileage: 38900,
    category: "utilitario",
    price: 289900,
    description: "V6 Limited com teto, som B&O e pacote off-road. Único dono.",
    optionals: ["Teto solar", "Som B&O", "Diferencial blocante"],
    featured: false,
    status: "available",
    fipe_price: 294100,
    fipe_reference: "julho de 2026",
    photoName: "ranger",
    createdDaysAgo: 27,
  }),
  vehicle({
    id: "golf-gti",
    brand: "Volkswagen",
    model: "Golf",
    version: "GTI 2.0 TSI",
    year_fab: 2019,
    year_model: 2019,
    color: "Amarelo",
    fuel: "gasolina",
    transmission: "automatizado",
    mileage: 47600,
    category: "carro",
    price: 189900,
    doors: 2,
    description:
      "GTI original, sem modificações. Laudo cautelar e histórico de revisões disponíveis.",
    optionals: ["Teto solar", "Pacote R-Line", "Escape original"],
    featured: false,
    status: "available",
    fipe_price: 186700,
    fipe_reference: "julho de 2026",
    photoName: "golf",
    createdDaysAgo: 31,
  }),
];

export function getDemoVehicle(id: string): PublicVehicle | null {
  return DEMO_VEHICLES.find((v) => v.id === id) ?? null;
}

// ------------------------------------------------------------
// Filtros em memória — espelham listPublicVehicles (lib/public.ts)
// para a busca/ordenação dos templates funcionar na demo.
// ------------------------------------------------------------

export function filterDemoVehicles(q: VehicleQuery = {}): PublicVehicle[] {
  let list = [...DEMO_VEHICLES];

  if (q.category) list = list.filter((v) => v.category === q.category);
  if (q.fuel) list = list.filter((v) => v.fuel === q.fuel);
  if (q.transmission)
    list = list.filter((v) => v.transmission === q.transmission);
  if (q.minPrice != null && Number.isFinite(q.minPrice) && q.minPrice >= 0)
    list = list.filter((v) => v.price >= q.minPrice!);
  if (q.maxPrice != null && Number.isFinite(q.maxPrice) && q.maxPrice >= 0)
    list = list.filter((v) => v.price <= q.maxPrice!);
  if (q.search) {
    // mesma sem\u00e2ntica de listPublicVehicles: cada PALAVRA precisa casar
    // com alguma coluna (brand/model/version), sem acento-folding
    const words = q.search
      .replace(/[%,()]/g, " ")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 5);
    list = list.filter((v) => {
      const cols = [v.brand, v.model, v.version ?? ""].map((s) =>
        s.toLowerCase(),
      );
      return words.every((w) => cols.some((c) => c.includes(w)));
    });
  }

  const sort = q.sort ?? "recent";
  list.sort((a, b) => {
    // destaque pinado s\u00f3 na ordena\u00e7\u00e3o padr\u00e3o (espelha listPublicVehicles)
    if (sort === "recent" && a.featured !== b.featured)
      return a.featured ? -1 : 1;
    switch (sort) {
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "km_asc":
        return (a.mileage ?? Infinity) - (b.mileage ?? Infinity);
      default:
        return a.created_at < b.created_at ? 1 : -1;
    }
  });
  return list;
}
