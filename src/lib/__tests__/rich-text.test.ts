import { describe, it, expect } from "vitest";
import {
  sanitizeRichText,
  sanitizeInlineText,
  richTextToPlain,
  isRichText,
} from "../rich-text";

describe("rich-text sanitizer (sem dependência, allowlist estrita)", () => {
  describe("XSS — nada fora da allowlist sobrevive", () => {
    it("descarta <script>", () => {
      expect(sanitizeRichText("<p>oi</p><script>alert(1)</script>")).toBe(
        "<p>oi</p>&lt;script&gt;alert(1)&lt;/script&gt;",
      );
      expect(sanitizeInlineText("a<script>alert(1)</script>")).not.toContain(
        "<script",
      );
    });

    it("remove atributos de eventos (onerror/onclick)", () => {
      const out = sanitizeRichText('<b onclick="steal()">x</b>');
      expect(out).toBe("<b>x</b>");
      expect(out).not.toContain("onclick");
    });

    it("escapa <img onerror> (vira texto inerte, sem elemento vivo)", () => {
      const out = sanitizeRichText('<img src=x onerror="alert(1)">');
      // segurança: nenhuma tag <img viva (o '<' foi escapado p/ &lt;)
      expect(out).not.toMatch(/<img/i);
      expect(out).toContain("&lt;img");
    });

    it("escapa <a href javascript:> — links não são permitidos", () => {
      const out = sanitizeRichText('<a href="javascript:alert(1)">clique</a>');
      // nenhum <a vivo nem href/atributo re-emitido como HTML
      expect(out).not.toMatch(/<a[\s>]/i);
      expect(out).toContain("clique");
    });

    it("não deixa passar href mesmo com aspas quebradas", () => {
      const out = sanitizeInlineText('<b href="x" onmouseover="y">z</b>');
      expect(out).toBe("<b>z</b>");
    });
  });

  describe("preserva a formatação permitida", () => {
    it("mantém negrito/itálico/sublinhado inline", () => {
      expect(sanitizeInlineText("<strong>a</strong> <em>b</em> <u>c</u>")).toBe(
        "<strong>a</strong> <em>b</em> <u>c</u>",
      );
    });

    it("mantém parágrafos e listas no rich", () => {
      expect(sanitizeRichText("<p>oi</p><ul><li>a</li><li>b</li></ul>")).toBe(
        "<p>oi</p><ul><li>a</li><li>b</li></ul>",
      );
    });

    it("achata <p> em <br> no inline (não aninha bloco em h1)", () => {
      expect(sanitizeInlineText("<p>linha 1</p><p>linha 2</p>")).toBe(
        "linha 1<br>linha 2",
      );
    });

    it("normaliza <br/> e <br /> para <br>", () => {
      expect(sanitizeInlineText("a<br/>b<br />c")).toBe("a<br>b<br>c");
    });
  });

  describe("vazio → string vazia", () => {
    it("editor em branco vira ''", () => {
      expect(sanitizeRichText("<p></p>")).toBe("");
      expect(sanitizeInlineText("<p><br></p>")).toBe("");
      expect(sanitizeInlineText("   ")).toBe("");
    });
  });

  describe("richTextToPlain / isRichText", () => {
    it("extrai texto puro e decodifica entidades", () => {
      expect(richTextToPlain("<p>Ana &amp; Cia</p>")).toBe("Ana & Cia");
    });
    it("detecta HTML do editor vs. texto legado", () => {
      expect(isRichText("<p>oi</p>")).toBe(true);
      expect(isRichText("texto simples")).toBe(false);
    });
  });
});
