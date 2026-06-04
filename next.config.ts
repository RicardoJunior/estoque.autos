import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Liga o getCloudflareContext()/env.IMAGES dentro do `next dev`.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // OpenNext faz o próprio bundling para o Worker; `output: "standalone"` era
  // do plano antigo de VPS/Docker e não faz sentido no Cloudflare.
  turbopack: { root: __dirname },
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
