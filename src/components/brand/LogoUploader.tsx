"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Crop, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// react-easy-crop só baixa se o usuário escolher um arquivo raster —
// o dialog nem monta antes disso (gate no cropFile, abaixo).
const LogoCropDialog = dynamic(
  () => import("./LogoCropDialog").then((m) => m.LogoCropDialog),
  { ssr: false },
);

const ACCEPT =
  ".svg,.png,.webp,.avif,.jpg,.jpeg,image/svg+xml,image/png,image/webp,image/avif,image/jpeg";

const MAX_SVG_BYTES = 1 * 1024 * 1024;

type PreviewBg = "checker" | "light" | "dark";

const BG_OPTIONS: { id: PreviewBg; label: string; className: string }[] = [
  { id: "checker", label: "Fundo transparente", className: "sf-checkerboard" },
  { id: "light", label: "Fundo claro", className: "bg-white" },
  { id: "dark", label: "Fundo escuro", className: "bg-slate-900" },
];

/**
 * Upload de logo com dropzone, corte (rasters) e preview sobre fundo
 * claro/escuro/xadrez — o xadrez evidencia a transparência. SVG sobe
 * como vetor, sem corte (escala sem perda).
 */
export function LogoUploader({
  logoUrl,
  storeName,
  onUpload,
  onRemove,
}: {
  logoUrl: string | null;
  storeName: string;
  /** Envia o FormData (campo "logo") para a action do caller. */
  onUpload: (fd: FormData) => Promise<{ ok: boolean; url?: string; error?: string }>;
  onRemove: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [bg, setBg] = useState<PreviewBg>("checker");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    const fd = new FormData();
    fd.append("logo", file);
    startTransition(async () => {
      const res = await onUpload(fd);
      if (!res.ok) setError(res.error ?? "Não foi possível enviar o logo.");
    });
  }

  function handleFiles(files: FileList | null) {
    setError(null);
    const file = files?.[0];
    if (!file) return;

    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    if (isSvg) {
      if (file.size > MAX_SVG_BYTES) {
        setError("SVG muito grande (máx. 1MB).");
        return;
      }
      setOriginal(null);
      upload(file);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Envie SVG, PNG, WebP, AVIF ou JPEG.");
      return;
    }
    setOriginal(file);
    setCropFile(file);
  }

  function confirmCrop(blob: Blob) {
    setCropFile(null);
    upload(new File([blob], "logo.png", { type: "image/png" }));
  }

  function removeLogo() {
    setError(null);
    setOriginal(null);
    startTransition(async () => {
      await onRemove();
    });
  }

  const bgClass = BG_OPTIONS.find((b) => b.id === bg)!.className;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-dashed transition",
          dragOver ? "border-primary ring-2 ring-primary/40" : "border-border",
          bgClass,
        )}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`Logo de ${storeName}`}
            width={240}
            height={96}
            unoptimized
            className="max-h-24 w-auto max-w-[75%] object-contain"
          />
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-1 text-muted-foreground"
          >
            <Upload className="size-5" />
            <span className="text-xs font-medium">
              Arraste seu logo ou clique para escolher
            </span>
          </button>
        )}

        <div className="absolute right-2 top-2 flex gap-1 rounded-full bg-background/80 p-1 ring-1 ring-foreground/10 backdrop-blur">
          {BG_OPTIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              title={b.label}
              aria-label={b.label}
              aria-pressed={bg === b.id}
              onClick={() => setBg(b.id)}
              className={cn(
                "size-4 cursor-pointer rounded-full ring-1 ring-inset ring-foreground/20 transition",
                b.className,
                bg === b.id && "ring-2 ring-primary",
              )}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
        >
          {pending ? "Enviando…" : logoUrl ? "Trocar logo" : "Enviar logo"}
        </Button>
        {original && !pending && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCropFile(original)}
          >
            <Crop /> Ajustar corte
          </Button>
        )}
        {logoUrl && (
          <button
            type="button"
            disabled={pending}
            onClick={removeLogo}
            className="cursor-pointer text-xs text-destructive hover:underline"
          >
            Remover logo
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        SVG, PNG ou WebP com fundo transparente ficam melhores. Imagens são
        cortadas aqui mesmo, sem perder a transparência. Máx. 4MB.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {cropFile !== null && (
        <LogoCropDialog
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={confirmCrop}
        />
      )}
    </div>
  );
}
