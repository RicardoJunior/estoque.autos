"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TenantHero } from "@/lib/types";

const SLIDE_MS = 5000;

/**
 * Mídia de fundo da hero (vídeo em loop mudo ou carrossel com
 * crossfade). Renderiza como camada absoluta — o template põe por
 * cima o overlay/gradiente e o conteúdo. Use junto de
 * heroMediaActive() (identity.ts); sem mídia, retorna null.
 */
export function HeroMedia({
  hero,
  className = "",
}: {
  hero: TenantHero | undefined;
  className?: string;
}) {
  const images = hero?.media === "images" ? (hero.images ?? []) : [];
  const [index, setIndex] = useState(0);
  // respeita usuários que pediram menos movimento: fica na 1ª imagem.
  // init preguiçoso (nada do DOM inicial depende disso — sem mismatch)
  const [animate, setAnimate] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setAnimate(!e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!animate || images.length < 2) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      SLIDE_MS,
    );
    return () => clearInterval(t);
  }, [animate, images.length]);

  if (hero?.media === "video" && hero.video_url) {
    return (
      <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
        <video
          src={hero.video_url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (images.length > 0) {
    return (
      <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
        {images.map((img, i) => (
          <Image
            key={img.id}
            src={img.url}
            alt=""
            fill
            sizes="100vw"
            preload={i === 0 ? true : undefined}
            className={`object-cover transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
    );
  }

  return null;
}
