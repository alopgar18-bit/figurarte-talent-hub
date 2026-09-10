import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { darConsentimientoRgpd, TEXTO_CESION } from "@/lib/rgpd.functions";
import { obtenerMisDatos, eliminarMisDatos } from "@/lib/derechos-rgpd.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPresentacion } from "@/components/candidato/VideoPresentacion";


type Ficha = Record<string, unknown> & {
  id: string;
  codigo: string;
  fecha_nacimiento: string | null;
  video_youtube_url: string | null;
};

function texto(v: unknown) {
  return typeof v === "string" ? v : "";
}
function numero(v: unknown) {
  return typeof v === "number" ? String(v) : "";
}
function esMenor(fecha: string) {
  if (!fecha) return false;
  const nac = new Date(fecha);
  if (Number.isNaN(nac.getTime())) return false;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad < 18;
}

function Seccion({
  titulo,
  descripcion,
  children,
  onGuardar,
  guardando,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  onGuardar: () => void;
  guardando: boolean;
}) {
  return (
    <section className="border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-bold tracking-tight text-card-foreground">{titulo}</h2>
      {descripcion && (
        <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
      <Button className="mt-5 w-full sm:w-auto" onClick={onGuardar} disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar"}
      </Button>
    </section>
  );
}

function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  tipo = "text",
  ancho,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
  ancho?: boolean;
}) {
  return (
    <div className={ancho ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input id={id} type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Interruptor({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-border px-3 py-2">
      <span className="text-sm">{etiqueta}</span>
      <Switch checked={valor} onCheckedChange={onChange} />
    </div>
  );
}

export function PerfilCandidato({ candidatoId }: { candidatoId: string }) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, unknown>>({});
  const [firmando, setFirmando] = useState(false);
  const firmar = useServerFn(darConsentimientoRgpd);
  const descargarDatos = useServerFn(obtenerMisDatos);
  const eliminarCuenta = useServerFn(eliminarMisDatos);
  const [descargando, setDescargando] = useState(false);
  const [dialogoBorrado, setDialogoBorrado] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [borrando, setBorrando] = useState(false);

  async function descargar() {
    setDescargando(true);
    try {
      const datos = await descargarDatos({ data: undefined as never });
      const contenido = {
        generado_en: datos.generado_en,
        candidato: JSON.parse(datos.candidato_json) as unknown,
        historial_proyectos: datos.historial,
      };
      const blob = new Blob([JSON.stringify(contenido, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-figurarte-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No hemos podido preparar tu descarga. Inténtalo de nuevo.");
    }
    setDescargando(false);
  }

  async function confirmarBorrado() {
    setBorrando(true);
    try {
      const res = await eliminarCuenta({ data: { confirmacion: "ELIMINAR" as const } });
      if (res.estado !== "ok") {
        toast.error(res.mensaje, { duration: 10000 });
        setBorrando(false);
        return;
      }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      toast.error("No hemos podido eliminar tus datos. Inténtalo de nuevo.");
      setBorrando(false);
    }
  }


  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const { data, error } = await supabase
        .from("candidatos")
        .select("*")
        .eq("id", candidatoId)
        .maybeSingle();
      if (cancelado) return;
      if (error || !data) {
        setCargando(false);
        return;
      }
      setFicha(data as unknown as Ficha);
      setF(data as unknown as Record<string, unknown>);
      setCargando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [candidatoId]);

  async function firmarConsentimiento() {
    setFirmando(true);
    try {
      const res = await firmar({ data: undefined as never });
      setFicha((prev) => (prev ? { ...prev, consentimiento_rgpd: true } : prev));
      setF((prev) => ({ ...prev, consentimiento_rgpd: true }));
      if (res.falloLiberacion) {
        toast.error(
          "Hemos guardado tu autorización, pero no hemos podido activar los proyectos en los que te habían apuntado. Escríbenos para que lo revisemos: todavía no apareces en ellos.",
          { duration: 12000 },
        );
      } else {
        toast.success(
          res.liberadas > 0
            ? `Gracias, ya puedes participar en nuestros proyectos. Ya apareces en ${res.liberadas} proyecto${res.liberadas === 1 ? "" : "s"} que te habían apuntado.`
            : "Gracias, ya puedes participar en nuestros proyectos.",
        );
      }
    } catch {
      toast.error("No hemos podido guardar tu autorización. Inténtalo de nuevo.");
    }
    setFirmando(false);
  }

  function set(campo: string, valor: unknown) {
    setF((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(seccion: string, campos: string[]) {
    setGuardando(seccion);
    const payload: Record<string, unknown> = {};
    for (const c of campos) {
      const v = f[c];
      if (typeof v === "string") payload[c] = v.trim() === "" ? null : v.trim();
      else payload[c] = v ?? null;
    }
    if (typeof payload["altura_cm"] === "string")
      payload["altura_cm"] = Number(payload["altura_cm"]) || null;
    if (typeof payload["peso_kg"] === "string")
      payload["peso_kg"] = Number(payload["peso_kg"]) || null;

    const { error } = await supabase
      .from("candidatos")
      .update(payload as never)
      .eq("id", candidatoId);
    setGuardando(null);
    if (error) {
      toast.error("No hemos podido guardar los cambios.");
      return;
    }
    toast.success("Cambios guardados.");
  }

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando tu ficha...</p>;
  }
  if (!ficha) {
    return (
      <p className="text-sm text-muted-foreground">
        No hemos podido cargar tu ficha. Vuelve a intentarlo en un momento.
      </p>
    );
  }

  const menor = esMenor(texto(f["fecha_nacimiento"]));

  return (
    <div className="space-y-6">
      <div className="border border-border bg-muted/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Tu código de candidato
        </p>
        <p className="text-xl font-black tracking-tight">{ficha.codigo}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Completa tu perfil poco a poco: cada bloque se guarda por separado.
        </p>
      </div>

      {ficha["consentimiento_rgpd"] !== true && (
        <section className="border-2 border-primary bg-primary/5 p-4 sm:p-6">
          <h2 className="text-lg font-bold tracking-tight">Autorización de cesión de imagen</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {TEXTO_CESION}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sin esta autorización no podemos presentarte a los proyectos de nuestros
            clientes.
          </p>
          <Button
            className="mt-4 w-full sm:w-auto"
            disabled={firmando}
            onClick={firmarConsentimiento}
          >
            {firmando ? "Guardando..." : "Aceptar y firmar"}
          </Button>
        </section>
      )}


      <Seccion
        titulo="Datos básicos"
        onGuardar={() =>
          guardar("basicos", [
            "nombre",
            "apellidos",
            "telefono",
            "ciudad",
            "provincia",
            "altura_cm",
            "peso_kg",
          ])
        }
        guardando={guardando === "basicos"}
      >
        <Campo id="nombre" etiqueta="Nombre" valor={texto(f["nombre"])} onChange={(v) => set("nombre", v)} />
        <Campo id="apellidos" etiqueta="Apellidos" valor={texto(f["apellidos"])} onChange={(v) => set("apellidos", v)} />
        <Campo id="telefono" etiqueta="Teléfono" valor={texto(f["telefono"])} onChange={(v) => set("telefono", v)} />
        <Campo id="ciudad" etiqueta="Ciudad" valor={texto(f["ciudad"])} onChange={(v) => set("ciudad", v)} />
        <Campo id="provincia" etiqueta="Provincia" valor={texto(f["provincia"])} onChange={(v) => set("provincia", v)} />
        <Campo
          id="altura"
          etiqueta="Altura (cm)"
          tipo="number"
          valor={typeof f["altura_cm"] === "string" ? f["altura_cm"] : numero(f["altura_cm"])}
          onChange={(v) => set("altura_cm", v)}
        />
        <Campo
          id="peso"
          etiqueta="Peso (kg)"
          tipo="number"
          valor={typeof f["peso_kg"] === "string" ? f["peso_kg"] : numero(f["peso_kg"])}
          onChange={(v) => set("peso_kg", v)}
        />
      </Seccion>

      <Seccion
        titulo="Identidad"
        onGuardar={() => guardar("identidad", ["genero", "fecha_nacimiento", "dni"])}
        guardando={guardando === "identidad"}
      >
        <Campo id="genero" etiqueta="Género" valor={texto(f["genero"])} onChange={(v) => set("genero", v)} />
        <Campo
          id="fecha_nacimiento"
          etiqueta="Fecha de nacimiento"
          tipo="date"
          valor={texto(f["fecha_nacimiento"])}
          onChange={(v) => set("fecha_nacimiento", v)}
        />
        <Campo id="dni" etiqueta="DNI" valor={texto(f["dni"])} onChange={(v) => set("dni", v)} />
      </Seccion>

      {menor && (
        <Seccion
          titulo="Tutor legal"
          descripcion="Como eres menor de 18 años, necesitamos los datos de tu madre, padre o tutor legal."
          onGuardar={() => {
            if (
              !texto(f["tutor_nombre"]).trim() ||
              !texto(f["tutor_apellidos"]).trim() ||
              !texto(f["tutor_dni"]).trim()
            ) {
              toast.error("Rellena nombre, apellidos y DNI del tutor legal.");
              return;
            }
            void guardar("tutor", ["tutor_nombre", "tutor_apellidos", "tutor_dni"]);
          }}
          guardando={guardando === "tutor"}
        >
          <Campo id="tutor_nombre" etiqueta="Nombre del tutor" valor={texto(f["tutor_nombre"])} onChange={(v) => set("tutor_nombre", v)} />
          <Campo id="tutor_apellidos" etiqueta="Apellidos del tutor" valor={texto(f["tutor_apellidos"])} onChange={(v) => set("tutor_apellidos", v)} />
          <Campo id="tutor_dni" etiqueta="DNI del tutor" valor={texto(f["tutor_dni"])} onChange={(v) => set("tutor_dni", v)} />
        </Seccion>
      )}

      <Seccion
        titulo="Físico"
        onGuardar={() =>
          guardar("fisico", [
            "color_piel",
            "color_cabello",
            "color_ojos",
            "tiene_tatuajes",
            "tiene_cicatrices",
            "tiene_ortodoncia",
          ])
        }
        guardando={guardando === "fisico"}
      >
        <Campo id="color_piel" etiqueta="Color de piel" valor={texto(f["color_piel"])} onChange={(v) => set("color_piel", v)} />
        <Campo id="color_cabello" etiqueta="Color de cabello" valor={texto(f["color_cabello"])} onChange={(v) => set("color_cabello", v)} />
        <Campo id="color_ojos" etiqueta="Color de ojos" valor={texto(f["color_ojos"])} onChange={(v) => set("color_ojos", v)} />
        <Interruptor etiqueta="Tatuajes" valor={f["tiene_tatuajes"] === true} onChange={(v) => set("tiene_tatuajes", v)} />
        <Interruptor etiqueta="Cicatrices" valor={f["tiene_cicatrices"] === true} onChange={(v) => set("tiene_cicatrices", v)} />
        <Interruptor etiqueta="Ortodoncia" valor={f["tiene_ortodoncia"] === true} onChange={(v) => set("tiene_ortodoncia", v)} />
      </Seccion>

      <Seccion
        titulo="Habilidades"
        onGuardar={() =>
          guardar("habilidades", [
            "canta",
            "toca_instrumentos",
            "baila",
            "hace_deporte",
            "monta_a_caballo",
            "tiene_carnet_conducir",
            "tiene_titulo_patron_barco",
            "habilidad_especial",
            "profesion",
            "idiomas",
          ])
        }
        guardando={guardando === "habilidades"}
      >
        <Interruptor etiqueta="Canta" valor={f["canta"] === true} onChange={(v) => set("canta", v)} />
        <Interruptor etiqueta="Toca instrumentos" valor={f["toca_instrumentos"] === true} onChange={(v) => set("toca_instrumentos", v)} />
        <Interruptor etiqueta="Baila" valor={f["baila"] === true} onChange={(v) => set("baila", v)} />
        <Interruptor etiqueta="Hace deporte" valor={f["hace_deporte"] === true} onChange={(v) => set("hace_deporte", v)} />
        <Interruptor etiqueta="Monta a caballo" valor={f["monta_a_caballo"] === true} onChange={(v) => set("monta_a_caballo", v)} />
        <Interruptor etiqueta="Carnet de conducir" valor={f["tiene_carnet_conducir"] === true} onChange={(v) => set("tiene_carnet_conducir", v)} />
        <Interruptor etiqueta="Título de patrón de barco" valor={f["tiene_titulo_patron_barco"] === true} onChange={(v) => set("tiene_titulo_patron_barco", v)} />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="habilidad_especial">Habilidad especial</Label>
          <Textarea
            id="habilidad_especial"
            value={texto(f["habilidad_especial"])}
            onChange={(e) => set("habilidad_especial", e.target.value)}
          />
        </div>
        <Campo id="profesion" etiqueta="Profesión" valor={texto(f["profesion"])} onChange={(v) => set("profesion", v)} />
        <Campo id="idiomas" etiqueta="Idiomas" valor={texto(f["idiomas"])} onChange={(v) => set("idiomas", v)} />
      </Seccion>

      <Seccion
        titulo="Redes"
        onGuardar={() => guardar("redes", ["video_book_url", "tiktok_url", "instagram_url"])}
        guardando={guardando === "redes"}
      >
        <Campo id="video_book_url" etiqueta="Enlace a tu video book" valor={texto(f["video_book_url"])} onChange={(v) => set("video_book_url", v)} ancho />
        <Campo id="tiktok_url" etiqueta="TikTok" valor={texto(f["tiktok_url"])} onChange={(v) => set("tiktok_url", v)} />
        <Campo id="instagram_url" etiqueta="Instagram" valor={texto(f["instagram_url"])} onChange={(v) => set("instagram_url", v)} />
      </Seccion>

      <VideoPresentacion
        videoUrlActual={texto(f["video_youtube_url"]) || null}
        nombre={texto(f["nombre"])}
        codigo={ficha.codigo}
      />

      <section className="border border-border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-card-foreground">Tus datos y tus derechos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Puedes descargar una copia de todo lo que guardamos sobre ti o pedir que lo
          eliminemos por completo.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={descargar} disabled={descargando}>
            {descargando ? "Preparando…" : "Descargar mis datos"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmacion("");
              setDialogoBorrado(true);
            }}
          >
            Eliminar mi cuenta y mis datos
          </Button>
        </div>
      </section>

      <Dialog open={dialogoBorrado} onOpenChange={setDialogoBorrado}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tu cuenta y tus datos</DialogTitle>
            <DialogDescription>
              Se borrarán tu ficha, tus fotos, tu vídeo y tu historial de proyectos. Es
              definitivo: no podremos recuperarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmar_borrado">
              Escribe ELIMINAR para confirmar
            </Label>
            <Input
              id="confirmar_borrado"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="ELIMINAR"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogoBorrado(false)}
              disabled={borrando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={confirmacion.trim().toUpperCase() !== "ELIMINAR" || borrando}
              onClick={confirmarBorrado}
            >
              {borrando ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

}
