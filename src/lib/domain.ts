// ============================================================
// Helpers de domínio próprio (host do app, normalização e
// verificação de apontamento DNS/HTTP). Compartilhado por
// middleware, action e UI.
// ============================================================

/** Host (sem protocolo, sem porta) do app a partir de NEXT_PUBLIC_APP_URL. */
export function appHost(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.estoque.autos";
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  }
}

/**
 * Normaliza o domínio digitado pelo lojista: minúsculo, sem
 * protocolo, sem caminho/porta, sem barras nem espaços.
 * Ex.: "https://www.Minha Loja.com.br/" → "www.minhaloja.com.br"
 */
export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/[/?#].*$/, ""); // caminho/query/hash
  d = d.replace(/:.*/, ""); // porta
  d = d.replace(/\s+/g, ""); // espaços acidentais
  d = d.replace(/^\.+|\.+$/g, ""); // pontos nas pontas
  return d;
}

const HOSTNAME_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/** true se for um hostname válido (já normalizado). */
export function isValidDomain(domain: string): boolean {
  return (
    domain.length >= 4 &&
    domain.length <= 253 &&
    HOSTNAME_RE.test(domain)
  );
}

/** É um apex/raiz (sem subdomínio, ex.: minhaloja.com.br)? */
export function isApexDomain(domain: string): boolean {
  // heurística simples: <= 2 labels é apex; 3+ com tld composto
  // (com.br, etc.) também pode ser apex — mas o aviso de UI cobre.
  const labels = domain.split(".");
  if (labels.length <= 2) return true;
  // tlds compostos comuns no Brasil
  const composite = ["com.br", "net.br", "org.br", "co.uk", "com.mx"];
  return composite.some((c) => domain.endsWith("." + c) && labels.length === 3);
}

interface DnsAnswer {
  name: string;
  type: number;
  data: string;
}
interface DnsResponse {
  Answer?: DnsAnswer[];
}

/**
 * Verifica o apontamento via DNS-over-HTTPS (Cloudflare). Considera
 * apontado se houver um CNAME para o host do app, OU se a resolução
 * final (A/AAAA seguindo CNAME) já bater no app (caso de ALIAS/ANAME
 * em apex, que a resolução achata em A). Retorna true/false; em erro
 * de rede, false (mantém status pendente).
 */
export async function verifyDomainPointing(
  domain: string,
  target = appHost(),
): Promise<boolean> {
  const targetClean = target.toLowerCase().replace(/\.$/, "");

  async function doh(type: "CNAME" | "A"): Promise<DnsAnswer[]> {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
      domain,
    )}&type=${type}`;
    const res = await fetch(url, {
      headers: { accept: "application/dns-json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as DnsResponse;
    return json.Answer ?? [];
  }

  try {
    // 1) CNAME aponta direto para o host do app?
    const cname = await doh("CNAME");
    const cnameHit = cname.some((a) => {
      const data = a.data.toLowerCase().replace(/\.$/, "");
      return data === targetClean || data.endsWith("." + targetClean);
    });
    if (cnameHit) return true;

    // 2) apex via ALIAS/ANAME: o registro A do domínio bate com o A do app?
    const [domainA, appA] = await Promise.all([
      doh("A"),
      (async () => {
        const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
          targetClean,
        )}&type=A`;
        const res = await fetch(url, {
          headers: { accept: "application/dns-json" },
        });
        if (!res.ok) return [] as DnsAnswer[];
        const json = (await res.json()) as DnsResponse;
        return json.Answer ?? [];
      })(),
    ]);
    const appIps = new Set(
      appA.filter((a) => a.type === 1).map((a) => a.data),
    );
    if (appIps.size > 0) {
      return domainA.some((a) => a.type === 1 && appIps.has(a.data));
    }
    return false;
  } catch {
    return false;
  }
}
