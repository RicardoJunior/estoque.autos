"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { VehiclePhoto } from "@/lib/types";

export function Gallery({ photos, title }: { photos: VehiclePhoto[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const has = photos.length > 0;
  const safe = Math.min(active, Math.max(0, photos.length - 1));

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setActive((a) => (a + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setActive((a) => (a - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  if (!has) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        Sem fotos
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100"
      >
        <Image
          src={photos[safe].url}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
      </button>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === safe ? "border-[color:var(--sf-primary)]" : "border-transparent"
              }`}
            >
              <Image src={p.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-4 top-4 text-3xl text-white/80 hover:text-white"
            aria-label="Fechar"
          >
            ×
          </button>
          {photos.length > 1 && (
            <button
              className="absolute left-4 text-4xl text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setActive((a) => (a - 1 + photos.length) % photos.length);
              }}
              aria-label="Anterior"
            >
              ‹
            </button>
          )}
          <div
            className="relative h-[80vh] w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[safe].url}
              alt={title}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          {photos.length > 1 && (
            <button
              className="absolute right-4 text-4xl text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setActive((a) => (a + 1) % photos.length);
              }}
              aria-label="Próxima"
            >
              ›
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white">
            {safe + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
