"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCcw, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cropImageToBlob } from "./crop";

const ASPECTS = [
  { id: "original", label: "Original" },
  { id: "square", label: "Quadrado" },
  { id: "wide", label: "Horizontal" },
] as const;

type AspectId = (typeof ASPECTS)[number]["id"];

/**
 * Corte de logo com zoom/rotação sobre fundo xadrez (deixa claro o que
 * é transparente). Exporta PNG — transparência preservada.
 */
export function LogoCropDialog({
  file,
  onCancel,
  onConfirm,
}: {
  file: File | null;
  onCancel: () => void;
  /** Recebe o PNG cortado; o caller fecha o diálogo limpando `file`. */
  onConfirm: (blob: Blob) => void | Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectId, setAspectId] = useState<AspectId>("original");
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const imageUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // novo arquivo → zera o estado do editor (ajuste durante o render)
  const [lastFile, setLastFile] = useState<File | null>(file);
  if (file !== lastFile) {
    setLastFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectId("original");
    setAreaPixels(null);
    setBusy(false);
  }

  const aspect =
    aspectId === "square" ? 1 : aspectId === "wide" ? 3 : naturalAspect;

  async function apply() {
    if (!file || !areaPixels) return;
    setBusy(true);
    try {
      const blob = await cropImageToBlob(file, areaPixels, rotation);
      await onConfirm(blob);
    } catch {
      setBusy(false);
    }
  }

  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajustar logo</DialogTitle>
          <DialogDescription>
            Arraste para posicionar. O fundo xadrez mostra as áreas
            transparentes.
          </DialogDescription>
        </DialogHeader>

        <div className="sf-checkerboard relative h-56 overflow-hidden rounded-lg sm:h-72">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              minZoom={1}
              maxZoom={4}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, pixels) => setAreaPixels(pixels)}
              onMediaLoaded={({ naturalWidth, naturalHeight }) =>
                setNaturalAspect(naturalWidth / Math.max(1, naturalHeight))
              }
              style={{
                containerStyle: { background: "transparent" },
                cropAreaStyle: { boxShadow: "0 0 0 9999em rgba(10, 11, 13, 0.72)" },
              }}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ASPECTS.map((a) => (
            <Button
              key={a.id}
              type="button"
              size="xs"
              variant={aspectId === a.id ? "secondary" : "ghost"}
              aria-pressed={aspectId === a.id}
              onClick={() => setAspectId(a.id)}
            >
              {a.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <Slider
              value={[zoom]}
              min={1}
              max={4}
              step={0.05}
              aria-label="Zoom"
              onValueChange={(v) => setZoom(Array.isArray(v) ? v[0] : v)}
            />
          </div>
          <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Rotação {rotation ? `${Math.round(rotation)}°` : ""}
            </span>
            <Slider
              value={[rotation]}
              min={-180}
              max={180}
              step={1}
              aria-label="Rotação"
              onValueChange={(v) => setRotation(Array.isArray(v) ? v[0] : v)}
            />
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Girar 90° à direita"
                onClick={() => setRotation((r) => (r + 90 > 180 ? -90 : r + 90))}
              >
                <RotateCw />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Desfazer rotação"
                onClick={() => setRotation(0)}
              >
                <RotateCcw />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy || !areaPixels}
            onClick={apply}
          >
            {busy ? "Processando…" : "Aplicar corte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
