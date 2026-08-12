"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
} from "lucide-react";
import type { VehiclePhoto } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  removePhotoAction,
  reorderPhotosAction,
  uploadPhotosAction,
  type SkippedPhoto,
} from "../actions";

const MAX_PHOTOS = 30;
// Espelha MAX_UPLOAD_BYTES de src/lib/images.ts (server-only, não importável aqui).
const MAX_FILE_BYTES = 12 * 1024 * 1024;

/**
 * Server Actions têm bodySizeLimit (next.config.ts). Enviar tudo num FormData
 * só estoura com fotos de celular — então mandamos em lotes de até 12MB.
 */
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

function skippedMessage(skipped: SkippedPhoto[]): string {
  const list = skipped.map((s) => `${s.name} (${s.reason})`).join(", ");
  return skipped.length === 1
    ? `1 foto não foi enviada: ${list}`
    : `${skipped.length} fotos não foram enviadas: ${list}`;
}

export function PhotoManager({
  vehicleId,
  initial,
}: {
  vehicleId: string;
  initial: VehiclePhoto[];
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<VehiclePhoto[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setError(null);
    if (fileRef.current) fileRef.current.value = "";

    // acima de 12MB a action nem chega a rodar — barra aqui, com motivo
    const skipped: SkippedPhoto[] = files
      .filter((f) => f.size > MAX_FILE_BYTES)
      .map((f) => ({ name: f.name, reason: "maior que 12MB" }));
    const batches = batchBySize(files.filter((f) => f.size <= MAX_FILE_BYTES));

    startTransition(async () => {
      let failure: string | null = null;
      for (const group of batches) {
        const fd = new FormData();
        group.forEach((f) => fd.append("photos", f));
        const res = await uploadPhotosAction(vehicleId, fd);
        // a action devolve a lista final — router.refresh() não repõe o
        // useState deste client component
        if (res.photos) setPhotos(res.photos);
        if (res.skipped) skipped.push(...res.skipped);
        if (res.error) {
          failure = res.error;
          break;
        }
      }

      const parts: string[] = [];
      if (failure) parts.push(failure);
      if (skipped.length > 0) parts.push(skippedMessage(skipped));
      setError(parts.length > 0 ? parts.join(" ") : null);
      router.refresh();
    });
  }

  function persistOrder(next: VehiclePhoto[]) {
    setPhotos(next);
    startTransition(async () => {
      const res = await reorderPhotosAction(
        vehicleId,
        next.map((p) => p.id),
      );
      setPhotos(res.photos);
      setError(res.error ?? null);
    });
  }

  function move(id: string, dir: -1 | 1) {
    const i = photos.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    persistOrder(next);
  }

  function makeCover(id: string) {
    const i = photos.findIndex((p) => p.id === id);
    if (i <= 0) return;
    const next = [...photos];
    const [pic] = next.splice(i, 1);
    next.unshift(pic);
    persistOrder(next);
  }

  function remove(id: string) {
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next);
    startTransition(async () => {
      const res = await removePhotoAction(vehicleId, id);
      setPhotos(res.photos);
      setError(res.error ?? null);
      router.refresh();
    });
  }

  return (
    <Card className="gap-4 px-5 py-5">
      <CardHeader className="grid-cols-[1fr_auto] items-center gap-0 px-0">
        <div>
          <CardTitle className="text-sm font-semibold">Fotos</CardTitle>
          <p className="text-xs text-muted-foreground">
            {photos.length}/{MAX_PHOTOS} · a primeira é a capa do anúncio
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={pending || photos.length >= MAX_PHOTOS}
          onClick={() => fileRef.current?.click()}
        >
          {pending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
          ) : (
            <ImagePlus data-icon="inline-start" aria-hidden />
          )}
          {pending ? "Enviando…" : "Adicionar fotos"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </CardHeader>

      <CardContent className="space-y-4 px-0">
        {error && (
          <Alert
            variant="destructive"
            className="border-transparent bg-destructive/10"
          >
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/70"
          >
            <span className="text-2xl">📷</span>
            Clique para enviar fotos do veículo
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-lg border border-border"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={p.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <Badge className="absolute left-1.5 top-1.5">Capa</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <div className="flex gap-1">
                    <IconBtn label="Mover para a esquerda" disabled={i === 0 || pending} onClick={() => move(p.id, -1)}>
                      <ChevronLeft aria-hidden />
                    </IconBtn>
                    <IconBtn label="Mover para a direita" disabled={i === photos.length - 1 || pending} onClick={() => move(p.id, 1)}>
                      <ChevronRight aria-hidden />
                    </IconBtn>
                  </div>
                  <div className="flex gap-1">
                    {i !== 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={pending}
                        onClick={() => makeCover(p.id)}
                        className="text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        Capa
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={pending}
                      onClick={() => remove(p.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-xs"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="text-muted-foreground"
    >
      {children}
    </Button>
  );
}
