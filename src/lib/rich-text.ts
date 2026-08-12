// ============================================================
// Sanitização de texto rico do editor (WYSIWYG) — SEM dependências.
//
// Estratégia à prova de XSS por construção (allowlist estrita):
//   1. ESCAPA tudo (&, <, >) → nenhum '<' cru sobrevive à entrada;
//   2. REINTRODUZ apenas os nomes de tag permitidos, SEM atributos
//      (o replacement é sempre "<tag>"/"</tag>" literal).
// Como nenhum atributo é preservado, é impossível injetar href,
// on*, javascript:, style ou <script> — qualquer coisa fora da
// allowlist (incl. <a>, <img>, <iframe>) vira texto escapado.
//
// Sem links: o conjunto permitido não inclui <a> (decisão de produto)
// — assim nenhum atributo precisa ser preservado em lugar nenhum.
// ============================================================

/** Tags de bloco/lista + ênfase do "Sobre a loja". */
const RICH_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li"];
/** Só ênfase + quebra de linha (título/subtítulo inline do hero). */
const INLINE_TAGS = ["strong", "b", "em", "i", "u", "s", "br"];

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Allowlist estrita: escapa tudo e reabre só as tags permitidas
 * (descartando quaisquer atributos). Void tags (br) viram "<br>".
 */
function sanitizeWith(html: string, tags: string[]): string {
  const alt = tags.join("|");
  let out = escapeHtml(String(html ?? ""));

  // <br>, <br/>, <br /> (com ou sem atributos) → <br>
  if (tags.includes("br")) {
    out = out.replace(/&lt;br(?:\s[^&]*)?\s*\/?\s*&gt;/gi, "<br>");
  }
  // abertura, com atributos opcionais que são DESCARTADOS no replace
  out = out.replace(
    new RegExp(`&lt;(${alt})(?:\\s[^&]*)?&gt;`, "gi"),
    (_m, t: string) => `<${t.toLowerCase()}>`,
  );
  // fechamento
  out = out.replace(
    new RegExp(`&lt;/(${alt})\\s*&gt;`, "gi"),
    (_m, t: string) => `</${t.toLowerCase()}>`,
  );
  return out;
}

/**
 * Sanitiza o HTML do editor ("Sobre a loja"). Retorna "" quando o
 * conteúdo é só marcação vazia (ex.: "<p></p>" de um editor em branco).
 */
export function sanitizeRichText(html: string): string {
  const clean = sanitizeWith(html, RICH_TAGS).trim();
  return richTextToPlain(clean) === "" ? "" : clean;
}

/** Sanitiza texto inline do editor (título/subtítulo); vazio vira "". */
export function sanitizeInlineText(html: string): string {
  // blocos do editor não aninham em <h1>: a ABERTURA <p>/<div> (com
  // atributos) some e o FECHAMENTO </p>/</div> vira quebra de linha.
  const flattened = String(html ?? "")
    .replace(/<(?:p|div)(?:\s[^>]*)?>/gi, "")
    .replace(/<\/(?:p|div)>/gi, "<br>");
  const clean = sanitizeWith(flattened, INLINE_TAGS)
    .replace(/^(<br>\s*)+/i, "") // sem <br> sobrando no início
    .replace(/(<br>\s*)+$/i, "") // …nem no fim
    .trim();
  return richTextToPlain(clean) === "" ? "" : clean;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** Versão texto puro (meta description, JSON-LD, buscas). */
export function richTextToPlain(html: string): string {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * O campo `about` guardou texto puro por muito tempo — detecta se o
 * valor já é HTML do editor ou é legado (renderiza com quebras).
 */
export function isRichText(value: string): boolean {
  return /<(p|br|strong|em|u|s|ul|ol|li|a)[\s/>]/i.test(value);
}
