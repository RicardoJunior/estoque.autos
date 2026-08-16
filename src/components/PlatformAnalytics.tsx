"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

// ============================================================
// Google Analytics da PLATAFORMA (estoque.autos): landing, blog,
// ajuda, cadastro, admin. NÃO dispara nas vitrines dos clientes —
// elas têm o próprio tracking (TrackingPixels, plano Pro) e o
// lojista é o controlador dos dados dos visitantes (LGPD).
//
// Regra: só no HOST do app + rotas da plataforma. Um slug de loja
// nunca é um slug reservado, então o allowlist abaixo exclui as
// vitrines automaticamente.
// ============================================================

const GA_ID = "G-486H5Q09DP";

const APP_HOSTS = new Set([
  "estoque.autos",
  "www.estoque.autos",
  "localhost",
  "127.0.0.1",
]);

/** Primeiros segmentos que pertencem à plataforma (reserved slugs + rotas). */
const PLATFORM_SEGMENTS = new Set([
  "admin",
  "auth",
  "login",
  "cadastro",
  "signup",
  "onboarding",
  "esqueci-senha",
  "redefinir-senha",
  "dashboard",
  "app",
  "ajuda",
  "suporte",
  "precos",
  "termos",
  "privacidade",
  "blog",
  "status",
  "sobre",
  "contato",
  "convite",
  "demo",
  "demo-preview",
]);

function isPlatformPath(pathname: string): boolean {
  if (pathname === "/") return true; // landing de marketing
  const seg = pathname.split("/")[1] ?? "";
  return PLATFORM_SEGMENTS.has(seg);
}

/** Host do app? (lido sem setState-em-effect, sem mismatch de hidratação) */
function useIsAppHost(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => APP_HOSTS.has(window.location.hostname),
    () => false, // SSR: assume que não é (renderiza nada)
  );
}

export function PlatformAnalytics() {
  const pathname = usePathname();
  const isAppHost = useIsAppHost();
  const enabled = isAppHost && isPlatformPath(pathname);

  // page_view nas navegações SPA (o gtag('config') já envia a 1ª).
  useEffect(() => {
    if (!enabled) return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== "function") return;
    w.gtag("event", "page_view", {
      page_path: pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
    // só em mudança de rota; o load inicial fica com o config do Script
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
