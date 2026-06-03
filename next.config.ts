import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-host barato: `node .next/standalone/server.js` num VPS pequeno.
  output: "standalone",
  // Raiz do workspace (há um package-lock.json legado um nível acima).
  turbopack: { root: __dirname },
  images: {
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

export default nextConfig;
