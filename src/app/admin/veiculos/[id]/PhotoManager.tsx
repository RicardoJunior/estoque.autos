"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { VehiclePhoto } from "@/lib/types";
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
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Fotos</h2>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {photos.length}/{MAX_PHOTOS} · a primeira é a capa do anúncio
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          disabled={pending || photos.length >= MAX_PHOTOS}
          onClick={() => fileRef.current?.click()}
        >
          {pending ? "Enviando…" : "+ Adicionar fotos"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-[var(--radius)] border border-dashed border-slate-300 bg-slate-50 py-10 text-sm text-[var(--color-ink-soft)] hover:bg-slate-100"
        >
          <span className="text-2xl">📷</span>
          Clique para enviar fotos do veículo
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)]"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={p.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-[var(--color-brand)] px-1.5 py-0.5 text-[10px] font-medium text-white">
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
                      className="rounded px-1.5 py-1 text-[10px] font-medium text-[var(--color-brand)] hover:bg-blue-50"
                    >
                      Capa
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(p.id)}
                    className="rounded px-1.5 py-1 text-[10px] font-medium text-[var(--color-danger)] hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
      className="flex h-6 w-6 items-center justify-center rounded border border-[var(--color-border)] text-xs text-[var(--color-ink-soft)] hover:bg-slate-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
