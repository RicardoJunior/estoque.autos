"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import type { TenantHero } from "@/lib/types";
import { downscaleImageToBlob } from "./crop";

type HeroImage = NonNullable<TenantHero["images"]>[number];

const MAX_IMAGES = 6;

/**
 * Carrossel da hero: grade de miniaturas + upload múltiplo. As fotos
 * são redimensionadas no navegador (1920px, JPEG) antes de subir.
 */
export function HeroImagesField({
  images,
  onUpload,
  onRemove,
  onChanged,
}: {
  images: HeroImage[];
  onUpload: (fd: FormData) => Promise<{ ok: boolean; hero?: TenantHero; error?: string }>;
  onRemove: (id: string) => Promise<{ ok: boolean; hero?: TenantHero }>;
  onChanged: (images: HeroImage[]) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    setError(null);
    const list = Array.from(files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (list.length === 0) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        for (const file of list.slice(0, MAX_IMAGES - images.length)) {
          const blob = await downscaleImageToBlob(file, 1920);
          fd.append("images", new File([blob], "hero.jpg", { type: "image/jpeg" }));
        }
        const res = await onUpload(fd);
        if (res.ok && res.hero?.images) onChanged(res.hero.images);
        else setError(res.error ?? "Não foi possível enviar as imagens.");
      } catch {
        setError("Não foi possível processar as imagens.");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await onRemove(id);
      if (res.ok && res.hero) onChanged(res.hero.images ?? []);
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-video overflow-hidden rounded-lg border border-border"
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="200px"
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              aria-label="Remover imagem"
              disabled={pending}
              onClick={() => remove(img.id)}
              className="absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <ImagePlus className="size-4" />
            <span className="text-[11px] font-medium">
              {pending ? "Enviando…" : "Adicionar"}
            </span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Até {MAX_IMAGES} fotos panorâmicas (fachada, showroom, carros). Elas
        giram automaticamente no fundo da hero.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
