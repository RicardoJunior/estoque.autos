"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroMediaType, TemplateId } from "@/lib/types";

/** Viewport virtual do iframe (desktop); escala para caber no wrapper. */
const VIRTUAL_W = 1360;
const ASPECT = 1.25; // wrapper aspect-[4/5]

export interface DemoPreviewHero {
  title?: string;
  subtitle?: string;
  media?: HeroMediaType;
  videoUrl?: string;
  images?: string[];
}

export interface DemoPreviewTexts {
  featuredTitle: string;
  featuredSubtitle: string;
  stockTitle: string;
}

/**
 * Prévia EXATA do site: um iframe escalado apontando para
 * /demo-preview, que renderiza o template real com os overrides de
 * marca ainda não salvos. Inerte (pointer-events none) — é prévia,
 * não navegação.
 */
export function DemoPreview({
  template,
  name,
  primary,
  accent,
  background,
  fontHead,
  fontBody,
  logoUrl,
  slogan,
  showName,
  hero,
  texts,
}: {
  template: TemplateId;
  name: string;
  primary: string;
  accent: string;
  background?: string | null;
  fontHead: string;
  fontBody: string;
  logoUrl?: string | null;
  slogan?: string;
  showName?: boolean;
  hero?: DemoPreviewHero;
  texts?: DemoPreviewTexts;
}) {
  const params = new URLSearchParams({ template, name });
  params.set("primary", primary);
  params.set("accent", accent);
  if (background) params.set("background", background);
  params.set("head", fontHead);
  params.set("body", fontBody);
  if (logoUrl) params.set("logo", logoUrl);
  if (slogan) params.set("slogan", slogan);
  if (showName) params.set("show_name", "true");
  if (hero) {
    // "" viaja de propósito: apagar o texto tem que sumir na prévia
    if (hero.title !== undefined) params.set("hero_title", hero.title);
    if (hero.subtitle !== undefined) params.set("hero_subtitle", hero.subtitle);
  }
  if (hero?.media) params.set("hero_media", hero.media);
  if (hero?.videoUrl) params.set("hero_video", hero.videoUrl);
  if (hero?.images?.length) params.set("hero_imgs", hero.images.join(","));
  if (texts) {
    params.set("t_ft", texts.featuredTitle);
    params.set("t_fs", texts.featuredSubtitle);
    params.set("t_st", texts.stockTitle);
  }
  const url = `/demo-preview?${params.toString()}`;

  // debounce: arrastar o seletor de cor dispara dezenas de mudanças/s
  const [src, setSrc] = useState(url);
  useEffect(() => {
    const t = setTimeout(() => setSrc(url), 500);
    return () => clearTimeout(t);
  }, [url]);

  // escala = largura real / viewport virtual
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / VIRTUAL_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative aspect-[4/5] w-full overflow-hidden rounded-[calc(var(--radius)+0.4rem)] border border-[var(--color-border)] bg-white shadow-sm"
    >
      <iframe
        src={src}
        title="Prévia ao vivo do site"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none origin-top-left border-0"
        style={{
          width: VIRTUAL_W,
          height: VIRTUAL_W * ASPECT,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
