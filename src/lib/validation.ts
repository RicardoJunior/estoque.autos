import { z } from "zod";

/**
 * Converte um ZodError em { campo: mensagem } (primeira por campo).
 * Usa o ÚLTIMO segmento do path: para objetos aninhados
 * (settings.slogan, colors.primary) é ele que nomeia o campo do form.
 */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path.at(-1) ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
import {
  FUELS,
  HERO_MEDIA_TYPES,
  LEAD_TYPES,
  TEMPLATE_IDS,
  TRANSMISSIONS,
  VEHICLE_CATEGORIES,
  VEHICLE_FLAGS,
  VEHICLE_STATUSES,
} from "./types";

// ============================================================
// Schemas Zod — fonte única de validação, usada por Server
// Actions e Route Handlers. Na v1, front e back tinham schemas
// divergentes (expenses objeto vs array, doors 1-6 vs 2-5...) e
// o cadastro quebrava; aqui o MESMO schema valida os dois lados.
// ============================================================

export const slugSchema = z
  .string()
  .min(3, "Mínimo de 3 caracteres")
  .max(40, "Máximo de 40 caracteres")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/,
    "Use apenas letras minúsculas, números e hífens",
  );

export const signupSchema = z.object({
  name: z.string().min(2, "Informe seu nome").max(80),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
});

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const createTenantSchema = z.object({
  name: z.string().min(2, "Informe o nome da loja").max(80),
  slug: slugSchema,
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  email: z.email("E-mail inválido").optional().or(z.literal("")),
});

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use #RRGGBB)");

/**
 * Nome de família do Google Fonts. A forma é validada aqui; a
 * EXISTÊNCIA no catálogo é conferida na action (findGoogleFont),
 * para o catálogo não entrar no bundle de quem importa este módulo.
 */
const fontFamily = z
  .string()
  .trim()
  .min(1, "Escolha uma fonte")
  .max(80, "Fonte inválida");

/** URL https de vídeo direto (.mp4/.webm) para o fundo da hero. */
const heroVideoUrl = z
  .string()
  .max(300)
  .regex(
    /^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i,
    "Use um link https direto para um arquivo .mp4 ou .webm",
  );

export const tenantCustomizationSchema = z.object({
  template_id: z.enum(TEMPLATE_IDS).optional(),
  colors: z
    .object({
      primary: hexColor,
      accent: hexColor,
      /** vazio = usar o padrão do template */
      background: hexColor.optional(),
    })
    .optional(),
  settings: z
    .object({
      slogan: z.string().max(120).optional(),
      about: z.string().max(2000).optional(),
      footer_text: z.string().max(300).optional(),
      business_hours: z.string().max(200).optional(),
      /** legado (lista curada antiga) — aceito só para compatibilidade */
      font: z.string().max(40).optional(),
      fonts: z.object({ head: fontFamily, body: fontFamily }).optional(),
      show_name: z.boolean().optional(),
      hero: z
        .object({
          title: z.string().max(90).optional(),
          subtitle: z.string().max(200).optional(),
          media: z.enum(HERO_MEDIA_TYPES).optional(),
          video_url: heroVideoUrl.optional(),
        })
        .optional(),
    })
    .optional(),
});

export const tenantContactSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).nullable().optional(),
  whatsapp: z.string().max(20).nullable().optional(),
  email: z.email().nullable().optional().or(z.literal("")),
  address: z
    .object({
      cep: z.string().max(9).optional(),
      street: z.string().max(120).optional(),
      number: z.string().max(20).optional(),
      complement: z.string().max(60).optional(),
      neighborhood: z.string().max(80).optional(),
      city: z.string().max(80).optional(),
      state: z.string().max(2).optional(),
    })
    .nullable()
    .optional(),
});

/** Hostname (domínio próprio) já normalizado: minúsculo, sem protocolo. */
export const customDomainSchema = z
  .string()
  .min(4, "Domínio muito curto")
  .max(253, "Domínio muito longo")
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    "Domínio inválido (ex.: www.minhaloja.com.br)",
  );

const currentYear = new Date().getFullYear();

export const vehicleSchema = z.object({
  brand: z.string().min(1, "Informe a marca").max(60),
  model: z.string().min(1, "Informe o modelo").max(80),
  version: z.string().max(80).nullable().optional(),
  year_fab: z.coerce
    .number()
    .int()
    .min(1900)
    .max(currentYear + 1)
    .nullable()
    .optional(),
  year_model: z.coerce
    .number()
    .int()
    .min(1900)
    .max(currentYear + 2)
    .nullable()
    .optional(),
  plate: z.string().max(10).nullable().optional(),
  color: z.string().max(40).nullable().optional(),
  fuel: z.enum(FUELS).nullable().optional(),
  transmission: z.enum(TRANSMISSIONS).nullable().optional(),
  mileage: z.coerce.number().int().min(0).nullable().optional(),
  doors: z.coerce.number().int().min(2).max(6).nullable().optional(),
  category: z.enum(VEHICLE_CATEGORIES).default("carro"),
  price: z.coerce.number().min(0, "Informe o preço"),
  description: z.string().max(5000).nullable().optional(),
  optionals: z.array(z.string().max(60)).max(50).default([]),
  condition_flags: z.array(z.enum(VEHICLE_FLAGS)).max(VEHICLE_FLAGS.length).default([]),
  featured: z.boolean().default(false),
  // snapshot FIPE (preenchido pela cascata; cadastro manual = null)
  fipe_code: z.string().max(20).nullable().optional(),
  fipe_year_id: z.string().max(20).nullable().optional(),
  fipe_price: z.coerce.number().min(0).nullable().optional(),
  fipe_reference: z.string().max(40).nullable().optional(),
});

export const vehicleStatusSchema = z.object({
  status: z.enum(VEHICLE_STATUSES),
});

/**
 * Lead público. Proposta exige nome+telefone; cliques de
 * WhatsApp/telefone não exigem nada (fix do bug v1 que perdia
 * esses leads por exigir e-mail).
 */
export const publicLeadSchema = z
  .object({
    vehicle_id: z.uuid(),
    type: z.enum(LEAD_TYPES),
    name: z.string().max(80).optional(),
    phone: z.string().max(20).optional(),
    email: z.email("E-mail inválido").optional().or(z.literal("")),
    message: z.string().max(2000).optional(),
    proposal_value: z.coerce.number().min(0).optional(),
    trade_vehicle: z.string().max(200).optional(),
    /**
     * honeypot anti-spam: humanos não preenchem. Preenchido NÃO é
     * erro de validação (autofill travaria visitante real sem
     * feedback) — a action detecta e finge sucesso sem gravar.
     */
    website: z.string().optional(),
  })
  .refine(
    (d) => d.type !== "proposal" || (!!d.name?.trim() && !!d.phone?.trim()),
    { message: "Nome e telefone são obrigatórios", path: ["name"] },
  );

export const leadUpdateSchema = z.object({
  status: z.enum(["new", "in_progress", "won", "lost"]).optional(),
  notes: z.string().max(5000).nullable().optional(),
});

// ------------------------------------------------------------
// Marketing da vitrine (settings.tracking + settings.social)
// ------------------------------------------------------------

/** vazio = remover; formatos estritos porque os IDs são interpolados
 *  em <script> na vitrine (defesa contra XSS armazenado) */
const emptyOr = (schema: z.ZodType<string>) =>
  z.literal("").or(schema).optional();

export const trackingSettingsSchema = z.object({
  facebook_pixel: emptyOr(
    z.string().trim().regex(/^\d{5,20}$/, "ID do Meta Pixel é numérico"),
  ),
  tiktok_pixel: emptyOr(
    z
      .string()
      .trim()
      .regex(/^[A-Z0-9]{8,32}$/i, "ID do TikTok Pixel inválido"),
  ),
  google_analytics: emptyOr(
    z
      .string()
      .trim()
      .regex(/^G-[A-Z0-9]{4,16}$/i, "Use o formato G-XXXXXXXXXX"),
  ),
});

const socialUrl = z
  .string()
  .trim()
  .max(200)
  .regex(/^https:\/\/\S+$/i, "Use o link completo, começando com https://");

export const socialSettingsSchema = z.object({
  instagram: emptyOr(socialUrl),
  facebook: emptyOr(socialUrl),
  tiktok: emptyOr(socialUrl),
  x: emptyOr(socialUrl),
  youtube: emptyOr(socialUrl),
  linkedin: emptyOr(socialUrl),
  threads: emptyOr(socialUrl),
  kwai: emptyOr(socialUrl),
});
