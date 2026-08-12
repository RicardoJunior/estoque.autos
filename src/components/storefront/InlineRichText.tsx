import { sanitizeInlineText } from "@/lib/rich-text";

/**
 * Texto editável do template (título/subtítulo do hero) — pode conter
 * HTML inline do editor (negrito/itálico/sublinhado/quebra de linha).
 * SEMPRE re-sanitizado na renderização (defesa em profundidade; texto
 * puro legado passa intacto, com < & > escapados).
 */
export function InlineRichText({ value }: { value: string }) {
  return (
    <span dangerouslySetInnerHTML={{ __html: sanitizeInlineText(value) }} />
  );
}
