import Script from "next/script";
import type { TenantTracking } from "@/lib/types";

// ============================================================
// Pixels de marketing da vitrine (recurso Pro): Meta (Facebook),
// TikTok e GA4. Server component — só emite os snippets padrão de
// cada plataforma com o ID do lojista.
//
// SEGURANÇA: os IDs são interpolados dentro de <script>. Além da
// validação no save (validation.ts), re-valida AQUI com os mesmos
// formatos estritos — um settings adulterado no banco não pode
// virar XSS na vitrine. ID fora do formato = pixel não renderiza.
// ============================================================

const FB_ID = /^\d{5,20}$/;
const TIKTOK_ID = /^[A-Z0-9]{8,32}$/i;
const GA4_ID = /^G-[A-Z0-9]{4,16}$/i;

export function TrackingPixels({ tracking }: { tracking?: TenantTracking }) {
  const fb = tracking?.facebook_pixel?.match(FB_ID)
    ? tracking.facebook_pixel
    : null;
  const tiktok = tracking?.tiktok_pixel?.match(TIKTOK_ID)
    ? tracking.tiktok_pixel
    : null;
  const ga = tracking?.google_analytics?.match(GA4_ID)
    ? tracking.google_analytics
    : null;
  if (!fb && !tiktok && !ga) return null;

  return (
    <>
      {fb && (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fb}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${fb}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
      {tiktok && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)}(document,"script");ttq.load('${tiktok}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
    </>
  );
}
