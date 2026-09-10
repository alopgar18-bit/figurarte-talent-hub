import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";

export type AreaRecorte = { x: number; y: number; width: number; height: number };

type Props = {
  file: File;
  titulo: string;
  onConfirmar: (area: AreaRecorte) => void;
  onCancelar: () => void;
};

/**
 * Vista de recorte en proporción retrato 3:4.
 * El área devuelta está en PÍXELES de la imagen original (croppedAreaPixels
 * de react-easy-crop), por lo que se puede reconstruir el recorte exacto
 * más adelante en el dossier.
 */
export function RecorteFoto({ file, titulo, onConfirmar, onCancelar }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<AreaRecorte | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const onCropComplete = useCallback((_: unknown, pixels: AreaRecorte) => {
    setArea(pixels);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          {titulo}
        </p>
        <span className="text-xs text-muted-foreground">Formato 3:4</span>
      </div>

      <div className="relative flex-1 bg-muted">
        {url && (
          <Cropper
            image={url}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            objectFit="contain"
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>

      <div className="space-y-4 border-t border-border bg-card px-4 py-4">
        <div>
          <label htmlFor="zoom-recorte" className="text-xs text-muted-foreground">
            Zoom — arrastra la imagen para encuadrar
          </label>
          <input
            id="zoom-recorte"
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancelar}>
            Elegir otra
          </Button>
          <Button
            type="button"
            disabled={!area}
            onClick={() => area && onConfirmar(area)}
          >
            Usar esta foto
          </Button>
        </div>
      </div>
    </div>
  );
}
