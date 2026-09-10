import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subirVideoYoutube } from "@/lib/video.functions";

export function VideoPresentacion({
  videoUrlActual,
  nombre,
  codigo,
}: {
  videoUrlActual: string | null;
  nombre: string;
  codigo: string;
}) {
  const enviar = useServerFn(subirVideoYoutube);
  const [urlGuardada, setUrlGuardada] = useState(videoUrlActual);
  const [sustituir, setSustituir] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<"idle" | "subiendo">("idle");
  const [aviso, setAviso] = useState<string | null>(null);

  async function guardar() {
    if (!archivo) {
      toast.error("Elige primero un archivo de vídeo.");
      return;
    }
    setAviso(null);
    setEstado("subiendo");
    try {
      const { data: sesion } = await supabase.auth.getUser();
      const userId = sesion.user?.id;
      if (!userId) throw new Error("sin sesión");

      const extension = archivo.name.split(".").pop() ?? "mp4";
      const ruta = `${userId}/${Date.now()}.${extension}`;
      const { error: errSubida } = await supabase.storage
        .from("candidatos-videos-temp")
        .upload(ruta, archivo, { contentType: archivo.type || "video/mp4" });
      if (errSubida) {
        setEstado("idle");
        toast.error("No hemos podido subir el vídeo. Comprueba el tamaño (máx. 50 MB).");
        return;
      }

      const resultado = await enviar({
        data: { ruta, titulo: `${nombre} — ${codigo}` },
      });
      setEstado("idle");

      if (resultado.estado === "no_disponible") {
        setAviso(
          "Esta función todavía no está activada. En cuanto el equipo la habilite, podrás subir tu vídeo. Tu archivo queda guardado esperando.",
        );
        return;
      }
      if (resultado.estado === "limite") {
        toast.error("Demasiados intentos, prueba de nuevo en unos minutos.");
        return;
      }
      if (resultado.estado === "error") {
        toast.error(resultado.mensaje);
        return;
      }
      setUrlGuardada(resultado.url);
      setArchivo(null);
      setSustituir(false);
      toast.success("Vídeo guardado.");
    } catch {
      setEstado("idle");
      toast.error("No hemos podido procesar el vídeo.");
    }
  }

  return (
    <section className="border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-card-foreground">Vídeo de presentación</h2>

      {urlGuardada && !sustituir ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">Ya tienes un vídeo guardado:</p>
          <a
            href={urlGuardada}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-sm font-medium text-primary underline"
          >
            {urlGuardada}
          </a>
          <Button variant="outline" onClick={() => setSustituir(true)} className="w-full sm:w-auto">
            Sustituir vídeo
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Graba una presentación breve (nombre, edad y una frase sobre ti) y súbela aquí.
          </p>
          <div className="space-y-2">
            <Label htmlFor="video">Archivo de vídeo</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={guardar} disabled={estado === "subiendo"} className="w-full sm:w-auto">
              {estado === "subiendo" ? "Subiendo..." : "Guardar en FigurArte"}
            </Button>
            {urlGuardada && (
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => {
                  setSustituir(false);
                  setArchivo(null);
                  setAviso(null);
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
          {aviso && (
            <p className="border border-primary/40 bg-primary/5 p-3 text-sm text-foreground">
              {aviso}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
