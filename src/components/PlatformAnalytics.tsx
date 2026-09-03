"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { GA_ID } from "@/lib/funnel";

// ============================================================
// Google Analytics + Pixel Meta + Microsoft Clarity da PLATAFORMA
// (estoque.autos): landing, blog, ajuda, cadastro, admin. NÃO dispara nas vitrines dos clientes —
// elas têm o próprio tracking (TrackingPixels, plano Pro) e o
// lojista é o controlador dos dados dos visitantes (LGPD).
//
// Regra: só no HOST do app + rotas da plataforma. Um slug de loja
// nunca é um slug reservado, então o allowlist abaixo exclui as
// vitrines automaticamente.
// ============================================================

// Pixel da Meta da plataforma — inlined no build (NEXT_PUBLIC_*). Vazio =
// pixel desligado (dev). Em prod vem do .env.local via scripts/deploy-prod.sh.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
// Microsoft Clarity (gravação de sessão/heatmaps). Os eventos do funil e o
// User-ID também vão para cá (lib/funnel.ts) — dá para filtrar gravações
// por "sign_up_error", "confirm_code_not_received" etc.
const CLARITY_ID = "ycks79ybzk";

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
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", "page_view", {
        page_path: pathname + window.location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
    if (typeof w.fbq === "function") w.fbq("track", "PageView");
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
      <Script id="ms-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
      </Script>
      {META_PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  );
}
