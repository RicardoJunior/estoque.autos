import { describe, it, expect } from "vitest";
import { prepareLogo, LogoError } from "../logo";

function svgFile(content: string): File {
  return new File([content], "logo.svg", { type: "image/svg+xml" });
}

async function accepts(content: string): Promise<boolean> {
  try {
    await prepareLogo(svgFile(content));
    return true;
  } catch (e) {
    if (e instanceof LogoError) return false;
    throw e;
  }
}

describe("prepareLogo — SVG benignos", () => {
  it("aceita logo simples", async () => {
    expect(
      await accepts(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10z" fill="#f00"/></svg>`,
      ),
    ).toBe(true);
  });
  it("aceita gradiente com url(#id)", async () => {
    expect(
      await accepts(
        `<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><rect fill="url(#g)"/></svg>`,
      ),
    ).toBe(true);
  });
  it("aceita imagem embutida data:image", async () => {
    expect(
      await accepts(
        `<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,iVBOR"/></svg>`,
      ),
    ).toBe(true);
  });
  it("aceita <style> interno sem refs externas", async () => {
    expect(
      await accepts(
        `<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:red}</style><rect class="a"/></svg>`,
      ),
    ).toBe(true);
  });
});

describe("prepareLogo — SVG perigosos", () => {
  const attacks: [string, string][] = [
    ["script", `<svg><script>alert(1)</script></svg>`],
    [
      "script com prefixo de namespace",
      `<svg xmlns:x="http://www.w3.org/2000/svg"><x:script>alert(1)</x:script></svg>`,
    ],
    ["event handler", `<svg onload="alert(1)"></svg>`],
    ["javascript: em href", `<svg><a href="javascript:alert(1)"><text>x</text></a></svg>`],
    [
      "javascript: com entidade",
      `<svg><a href="jav&#x61;script:alert(1)"><text>x</text></a></svg>`,
    ],
    [
      "tag script via entidades",
      `<svg>&#60;script&#62;alert(1)&#60;/script&#62;</svg>`,
    ],
    ["href externo", `<svg><image xlink:href="https://evil.com/x.png"/></svg>`],
    ["href protocolo-relativo", `<svg><image href="//evil.com/x.png"/></svg>`],
    ["@import em CSS", `<svg><style>@import url(https://evil.com/x.css);</style></svg>`],
    [
      "url() externo em CSS",
      `<svg><style>.a{background:url(https://evil.com/x.png)}</style></svg>`,
    ],
    [
      "foreignObject com prefixo",
      `<svg><s:foreignObject xmlns:s="http://www.w3.org/2000/svg"><body/></s:foreignObject></svg>`,
    ],
    ["declaração ENTITY", `<!DOCTYPE svg [<!ENTITY x "y">]><svg>&x;</svg>`],
  ];
  for (const [name, payload] of attacks) {
    it(`rejeita ${name}`, async () => {
      expect(await accepts(payload)).toBe(false);
    });
  }
});

describe("prepareLogo — rasters", () => {
  it("aceita PNG por magic bytes", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    const file = new File([png], "logo.png", { type: "image/png" });
    const out = await prepareLogo(file);
    expect(out.ext).toBe("png");
    expect(out.contentType).toBe("image/png");
  });
  it("rejeita conteúdo que não é imagem (type mentiroso)", async () => {
    const file = new File(["<html>oi</html>"], "logo.png", { type: "image/png" });
    await expect(prepareLogo(file)).rejects.toThrow(LogoError);
  });
});
