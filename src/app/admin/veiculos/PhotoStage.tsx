"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { VehiclePhoto } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { stagePhotosAction, unstagePhotoAction } from "./staging-actions";
import type { SkippedPhoto } from "./actions";

// Espelha MAX_UPLOAD_BYTES de src/lib/images.ts (server-only).
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_PHOTOS = 30;

function batchBySize(files: File[]): File[][] {
  const batches: File[][] = [];
  let batch: File[] = [];
  let bytes = 0;
  for (const f of files) {
    if (batch.length > 0 && bytes + f.size > MAX_FILE_BYTES) {
      batches.push(batch);
      batch = [];
      bytes = 0;
    }
    batch.push(f);
    bytes += f.size;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

/**
 * Upload de fotos DENTRO do cadastro: envia na hora (staging) e
 * entrega a lista pro form via hidden `staged_photos`. A primeira
 * foto é a capa.
 */
export function PhotoStage() {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setError(null);
    if (fileRef.current) fileRef.current.value = "";

    const skipped: SkippedPhoto[] = files
      .filter((f) => f.size > MAX_FILE_BYTES)
      .map((f) => ({ name: f.name, reason: "maior que 12MB" }));
    const batches = batchBySize(files.filter((f) => f.size <= MAX_FILE_BYTES));

    startTransition(async () => {
      for (const group of batches) {
        const fd = new FormData();
        group.forEach((f) => fd.append("photos", f));
        const res = await stagePhotosAction(fd);
        if (res.staged?.length) {
          setPhotos((prev) => [...prev, ...res.staged!].slice(0, MAX_PHOTOS));
        }
        if (res.skipped) skipped.push(...res.skipped);
      }
      if (skipped.length > 0) {
        const list = skipped.map((s) => `${s.name} (${s.reason})`).join(", ");
        setError(
          skipped.length === 1
            ? `1 foto não entrou: ${list}`
            : `${skipped.length} fotos não entraram: ${list}`,
        );
      }
    });
  }

  function remove(photo: VehiclePhoto) {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    startTransition(async () => {
      await unstagePhotoAction(photo.path);
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="staged_photos" value={JSON.stringify(photos)} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
          >
            <Image
              src={p.url}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
            {i === 0 && (
              <Badge className="absolute left-1.5 top-1.5">Capa</Badge>
            )}
            <button
              type="button"
              aria-label="Remover foto"
              onClick={() => remove(p)}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-5" aria-hidden />
            )}
            {pending ? "Enviando…" : "Adicionar"}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        A primeira foto é a capa do anúncio. Você pode reordenar depois de
        salvar. {photos.length}/{MAX_PHOTOS}
      </p>
    </div>
  );
}
