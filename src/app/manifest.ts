import type { MetadataRoute } from "next";

/** Web App Manifest (PWA) da plataforma. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "estoque.autos",
    short_name: "estoque.autos",
    description:
      "O site da sua loja de carros, pronto em minutos. Estoque pela FIPE, leads por WhatsApp e domínio próprio.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0b0d",
    theme_color: "#ff7a1a",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
