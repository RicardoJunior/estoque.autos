import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Liga o getCloudflareContext()/env.IMAGES dentro do `next dev`.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // OpenNext faz o próprio bundling para o Worker; `output: "standalone"` era
  // do plano antigo de VPS/Docker e não faz sentido no Cloudflare.
  turbopack: { root: __dirname },
  // 127.0.0.1 é host de dev (middleware/PlatformAnalytics já o tratam assim);
  // sem isso o Next 16 bloqueia os chunks e a página abre sem hidratar —
  // útil para testar as telas deslogadas sem derrubar a sessão do localhost.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Uploads (logo/fotos) trafegam por Server Actions; o padrão do Next 16
    // é 1MB e mataria a action antes de executar. O PhotoManager envia lotes
    // de até 12MB (espelho de MAX_UPLOAD_BYTES em lib/images.ts); 24mb cobre
    // o lote + overhead do multipart. Não reduza abaixo disso.
    serverActions: { bodySizeLimit: "24mb" },
  },
  images: {
    // Só pula a otimização quando o Supabase é LOCAL (127.0.0.1, anti-SSRF do
    // Next 16). Em produção o binding IMAGES da Cloudflare otimiza o
    // _next/image normalmente (sem sharp).
    unoptimized: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").includes(
      "127.0.0.1",
    ),
    remotePatterns: [
      // Fotos e logos servidos pelo Supabase Storage
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Supabase local (supabase start)
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
};

// MDX do blog/ajuda é COMPILADO no build (dynamic import + generateStaticParams),
// nunca lido por fs em runtime — compatível com o Worker do OpenNext. Plugins
// passados como STRING porque o Turbopack não serializa funções para o Rust.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
