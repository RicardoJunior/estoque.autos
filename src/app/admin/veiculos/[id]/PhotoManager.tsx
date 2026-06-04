"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { VehiclePhoto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  removePhotoAction,
  reorderPhotosAction,
  uploadPhotosAction,
} from "../actions";

const MAX_PHOTOS = 30;

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
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("photos", f));
    if (fileRef.current) fileRef.current.value = "";

    startTransition(async () => {
      const res = await uploadPhotosAction(vehicleId, fd);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function persistOrder(next: VehiclePhoto[]) {
    setPhotos(next);
    startTransition(async () => {
      await reorderPhotosAction(
        vehicleId,
        next.map((p) => p.id),
      );
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
      await removePhotoAction(vehicleId, id);
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
          variant="ghost"
          disabled={pending || photos.length >= MAX_PHOTOS}
          onClick={() => fileRef.current?.click()}
        >
          {pending ? "Enviando…" : "+ Adicionar fotos"}
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
          <p className="text-sm text-destructive">{error}</p>
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
                    <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Capa
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <div className="flex gap-1">
                    <IconBtn label="Mover para a esquerda" disabled={i === 0 || pending} onClick={() => move(p.id, -1)}>←</IconBtn>
                    <IconBtn label="Mover para a direita" disabled={i === photos.length - 1 || pending} onClick={() => move(p.id, 1)}>→</IconBtn>
                  </div>
                  <div className="flex gap-1">
                    {i !== 0 && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => makeCover(p.id)}
                        className="rounded px-1.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
                      >
                        Capa
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(p.id)}
                      className="rounded px-1.5 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10"
                    >
                      Remover
                    </button>
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
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
    >
      {children}
    </button>
  );
}
