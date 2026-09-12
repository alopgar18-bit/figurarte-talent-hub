import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { obtenerUrlSubidaFoto } from "@/lib/subida-fotos.functions";
import {
  MAX_FOTOS_CANDIDATO,
  anadirMiFoto,
  eliminarMiFoto,
  obtenerMisFotos,
} from "@/lib/mis-fotos.functions";
import { RecorteFoto, type AreaRecorte } from "@/components/RecorteFoto";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MisFotos({ nombre }: { nombre: string }) {
  const pedirSubida = useServerFn(obtenerUrlSubidaFoto);
  const cargarFotos = useServerFn(obtenerMisFotos);
  const anadir = useServerFn(anadirMiFoto);
  const quitar = useServerFn(eliminarMiFoto);

  const [fotos, setFotos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recortando, setRecortando] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [aEliminar, setAEliminar] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelado = false;
    void cargarFotos({ data: undefined as never })
      .then((res) => {
        if (!cancelado) setFotos(res.fotos);
      })
      .catch(() => {
        if (!cancelado) toast.error("No hemos podido cargar tus fotos.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [cargarFotos]);

  async function subirFoto(file: File, area: AreaRecorte | null) {
    setSubiendo(true);
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const extension = (["jpg", "jpeg", "png", "webp", "heic"].includes(ext)
        ? ext
        : "jpg") as "jpg" | "jpeg" | "png" | "webp" | "heic";

      const permiso = await pedirSubida({ data: { extension } });
      if (permiso.estado === "limite")
        throw new Error("Demasiadas subidas seguidas. Prueba de nuevo dentro de un rato.");
      if (permiso.estado !== "ok") throw new Error("No se pudo preparar la subida.");

      const { error } = await supabase.storage
        .from("candidatos-fotos")
        .uploadToSignedUrl(permiso.path, permiso.token, file);
      if (error) throw new Error("No hemos podido subir la foto.");

      const res = await anadir({ data: { path: permiso.path, area } });
      setFotos(res.fotos);
      toast.success("Foto añadida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No hemos podido añadir la foto.");
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminar(indice: number) {
    setBorrando(indice);
    try {
      const res = await quitar({ data: { indice } });
      setFotos(res.fotos);
      toast.success("Foto eliminada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No hemos podido eliminar la foto.");
    } finally {
      setBorrando(null);
    }
  }

  const lleno = fotos.length >= MAX_FOTOS_CANDIDATO;

  return (
    <section className="border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-card-foreground">
            Mis fotos ({fotos.length}/{MAX_FOTOS_CANDIDATO})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Añade o quita tus fotos cuando quieras. Se recortan en formato 3:4.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) setRecortando(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={subiendo || lleno}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Añadir foto
          </Button>
        </div>
      </div>

      {lleno && (
        <p className="mt-3 text-xs text-muted-foreground">
          Has alcanzado el máximo de {MAX_FOTOS_CANDIDATO} fotos. Elimina alguna para
          poder subir otra.
        </p>
      )}

      <div className="mt-4">
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando tus fotos…</p>
        ) : fotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fotos.map((foto, indice) => {
              const esPlaceholder = !/^https?:\/\//.test(foto);
              return (
                <div key={`${foto}-${indice}`} className="relative">
                  {esPlaceholder ? (
                    <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed bg-muted/50 p-3 text-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="break-all text-[10px] leading-tight text-muted-foreground">
                        {foto}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={foto}
                      alt={`Foto de ${nombre}`}
                      loading="lazy"
                      className="aspect-[3/4] w-full border border-border object-cover"
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    aria-label="Eliminar esta foto"
                    disabled={borrando === indice}
                    onClick={() => setAEliminar(indice)}
                  >
                    {borrando === indice ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no tienes fotos.</p>
        )}
      </div>

      {recortando && (
        <RecorteFoto
          file={recortando}
          titulo="Nueva foto"
          onCancelar={() => setRecortando(null)}
          onConfirmar={(area) => {
            const file = recortando;
            setRecortando(null);
            void subirFoto(file, area);
          }}
        />
      )}

      <Dialog open={aEliminar !== null} onOpenChange={(abierto) => !abierto && setAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar foto</DialogTitle>
            <DialogDescription>
              La foto se quitará de tu ficha y se borrará definitivamente. Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const indice = aEliminar;
                setAEliminar(null);
                if (indice !== null) void eliminar(indice);
              }}
            >
              Eliminar foto
            </Button>
          </DialogFooter>
        </DialogFooter>
      </Dialog>
    </section>
  );
}
