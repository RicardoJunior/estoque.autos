import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    /** Meta description (140–160 caracteres). */
    description: z.string(),
    /** Resposta direta à pergunta do título (40–70 palavras) — AEO. */
    answer: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum([
      "gestao",
      "vendas",
      "financeiro",
      "consignados",
      "marketing",
    ]),
    tags: z.array(z.string()).default([]),
    /** Vira seção "Perguntas frequentes" + JSON-LD FAQPage. */
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
