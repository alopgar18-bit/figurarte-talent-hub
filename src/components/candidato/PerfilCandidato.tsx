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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

type Estudio = { estudio: string; anios: string };
type IdiomaDetalle = { idioma: string; nivel: string };

const IDIOMAS_LISTA = [
  "Alemán",
  "Árabe",
  "Bengalí",
  "Catalán",
  "Chino cantonés",
  "Chino mandarín",
  "Español",
  "Euskera",
  "Francés",
  "Gallego",
  "Hindi",
  "Inglés",
  "Italiano",
  "Japonés",
  "Portugués",
  "Ruso",
];
const NIVELES_IDIOMA = ["Básico", "Intermedio", "Avanzado", "Nativo o bilingüe"];
const SIN_VALOR = "__sin_valor__";
const TALLAS_CAMISA = ["XS", "S", "M", "L", "XL"];
const TALLAS_PANTALON = ["36", "38", "40", "42", "44"];
const TALLAS_CHAQUETA = ["S", "M", "L"];
const TIPOS_PELO = ["Liso", "Ondulado", "Rizado", "Afro"];
const COMPLEXIONES = [
  {
    valor: "ectomorfo",
    titulo: "Ectomorfo",
    descripcion: "Extremidades largas, apariencia joven, le cuesta ganar masa muscular",
  },
  {
    valor: "mesomorfo",
    titulo: "Mesomorfo",
    descripcion: "Cuerpo moldeable y atlético, gana y pierde masa con facilidad",
  },
  {
    valor: "endomorfo",
    titulo: "Endomorfo",
    descripcion: "Estructura más grande, metabolismo lento, gana musculatura con facilidad",
  },
];

const GRUPOS_HABILIDADES: { titulo: string; opciones: string[] }[] = [
  {
    titulo: "Artes escénicas y circenses",
    opciones: ["Baile / Danza", "Canto", "Circo", "Malabares", "Mago", "Doblador/a", "Locutor/a"],
  },
  {
    titulo: "Música",
    opciones: [
      "Instrumento de cuerda",
      "Instrumento de viento",
      "Instrumento de percusión",
      "Electrófonos",
    ],
  },
  {
    titulo: "Deporte y acción",
    opciones: [
      "Artes marciales",
      "Deportes",
      "Especialista / stunt",
      "Esgrima",
      "Equitación",
      "Culturismo",
    ],
  },
  {
    titulo: "Rasgos y singularidades",
    opciones: ["Tengo un gemelo/a", "Drag queen", "Drag king"],
  },
];

const GRUPOS_TIPO_PERFIL: { titulo: string; opciones: string[] }[] = [
  {
    titulo: "Interpretación",
    opciones: [
      "Actor / actriz",
      "Ficción",
      "Publicidad",
      "Doblaje",
      "Teatro aficionado",
      "Modelo",
      "Bailarín/a",
    ],
  },
  {
    titulo: "Música",
    opciones: [
      "Cantante pop",
      "Cantante rock",
      "Cantante rap / trap",
      "Cantante jazz",
      "Ópera / zarzuela",
    ],
  },
  {
    titulo: "Medios y contenido digital",
    opciones: [
      "Influencer",
      "YouTuber",
      "Tiktoker",
      "Presentador/a",
      "Periodista",
      "Tertuliano/a",
      "Colaborador/a",
    ],
  },
  { titulo: "Otros", opciones: ["Especialista", "Casting de calle"] },
];

const CARNES_OPCIONES = [
  "AM",
  "A1",
  "A2",
  "A",
  "B",
  "B+E",
  "C1",
  "C1+E",
  "C",
  "C+E",
  "D1",
  "D1+E",
  "D",
  "D+E",
  "Licencia LVA",
  "Licencia LCM",
  "ADR",
];

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1 text-sm transition-colors ${
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted/60"
      }`}
    >
      {children}
    </button>
  );
}

function GrupoChips({
  titulo,
  opciones,
  seleccionados,
  onAlternar,
}: {
  titulo: string;
  opciones: string[];
  seleccionados: string[];
  onAlternar: (opcion: string) => void;
}) {
  if (opciones.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => (
          <Chip key={o} activo={seleccionados.includes(o)} onClick={() => onAlternar(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function alternar(lista: string[], valor: string) {
  return lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor];
}

function listaTextos(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string") : [];
}

function SelectCampo({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  opciones: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{etiqueta}</Label>
      <Select
        value={valor === "" ? SIN_VALOR : valor}
        onValueChange={(v) => onChange(v === SIN_VALOR ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="No especificado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SIN_VALOR}>No especificado</SelectItem>
          {opciones.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
  const [busquedaIdioma, setBusquedaIdioma] = useState("");
  const [otroIdioma, setOtroIdioma] = useState("");
  const [busquedaHabilidad, setBusquedaHabilidad] = useState("");
  const [otrasResidenciasActivo, setOtrasResidenciasActivo] = useState(false);

  const habilidadesSel = listaTextos(f["habilidades"]);
  const tipoPerfilSel = listaTextos(f["tipo_perfil"]);
  const carnesSel = listaTextos(f["carnes_conducir"]);
  const otrasResidencias = listaTextos(f["otras_residencias"]);

  const estudios: Estudio[] = Array.isArray(f["estudios"])
    ? (f["estudios"] as unknown[]).map((e) => {
        const o = (e ?? {}) as Record<string, unknown>;
        return { estudio: texto(o["estudio"]), anios: texto(o["anios"]) };
      })
    : [];
  const idiomasDetalle: IdiomaDetalle[] = Array.isArray(f["idiomas_detalle"])
    ? (f["idiomas_detalle"] as unknown[]).map((e) => {
        const o = (e ?? {}) as Record<string, unknown>;
        return { idioma: texto(o["idioma"]), nivel: texto(o["nivel"]) || "Avanzado" };
      })
    : [];
  const enlaces: Enlace[] = Array.isArray(f["enlaces"])
    ? (f["enlaces"] as unknown[]).map((e) => {
        const o = (e ?? {}) as Record<string, unknown>;
        return { url: texto(o["url"]), descripcion: texto(o["descripcion"]) };
      })
    : [];

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

  async function guardar(
    seccion: string,
    campos: string[],
    extra?: Record<string, unknown>,
  ) {
    setGuardando(seccion);
    const payload: Record<string, unknown> = {};
    for (const c of campos) {
      const v = f[c];
      if (typeof v === "string") payload[c] = v.trim() === "" ? null : v.trim();
      else payload[c] = v ?? null;
    }
    if (extra) Object.assign(payload, extra);
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

      <Seccion
        titulo="Formación e idiomas"
        descripcion="Tu formación y los idiomas que hablas, con su nivel."
        onGuardar={() => {
          const otro = otroIdioma.trim();
          const listaIdiomas = otro
            ? [...idiomasDetalle, { idioma: otro, nivel: "No especificado" }]
            : idiomasDetalle;
          void guardar("formacion", ["acentos"], {
            estudios: estudios.filter((e) => e.estudio.trim() !== "" || e.anios.trim() !== ""),
            idiomas_detalle: listaIdiomas,
          });
        }}
        guardando={guardando === "formacion"}
      >
        <div className="space-y-3 sm:col-span-2">
          <Label>Estudios</Label>
          {estudios.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no has añadido ningún estudio.</p>
          )}
          {estudios.map((e, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="sm:flex-1"
                placeholder="Estudio"
                value={e.estudio}
                onChange={(ev) =>
                  set(
                    "estudios",
                    estudios.map((x, j) => (j === i ? { ...x, estudio: ev.target.value } : x)),
                  )
                }
              />
              <Input
                className="sm:w-40"
                placeholder="Años cursados"
                value={e.anios}
                onChange={(ev) =>
                  set(
                    "estudios",
                    estudios.map((x, j) => (j === i ? { ...x, anios: ev.target.value } : x)),
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                className="sm:w-auto"
                onClick={() => set("estudios", estudios.filter((_, j) => j !== i))}
              >
                Quitar
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => set("estudios", [...estudios, { estudio: "", anios: "" }])}
          >
            + Añadir estudio
          </Button>
        </div>

        <div className="space-y-3 sm:col-span-2">
          <Label htmlFor="buscar_idioma">Idiomas</Label>
          <Input
            id="buscar_idioma"
            placeholder="Buscar idioma..."
            value={busquedaIdioma}
            onChange={(ev) => setBusquedaIdioma(ev.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {IDIOMAS_LISTA.filter((i) =>
              i.toLowerCase().includes(busquedaIdioma.trim().toLowerCase()),
            ).map((idioma) => {
              const activo = idiomasDetalle.some((x) => x.idioma === idioma);
              return (
                <button
                  key={idioma}
                  type="button"
                  onClick={() =>
                    set(
                      "idiomas_detalle",
                      activo
                        ? idiomasDetalle.filter((x) => x.idioma !== idioma)
                        : [...idiomasDetalle, { idioma, nivel: "Avanzado" }],
                    )
                  }
                  className={`border px-3 py-1 text-sm transition-colors ${
                    activo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted/60"
                  }`}
                >
                  {idioma}
                </button>
              );
            })}
          </div>

          {idiomasDetalle.length > 0 && (
            <div className="space-y-2">
              {idiomasDetalle.map((x, i) => (
                <div key={x.idioma + i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-sm sm:w-40">{x.idioma}</span>
                  <div className="sm:w-56">
                    <Select
                      value={x.nivel}
                      onValueChange={(v) =>
                        set(
                          "idiomas_detalle",
                          idiomasDetalle.map((y, j) => (j === i ? { ...y, nivel: v } : y)),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVELES_IDIOMA.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      set("idiomas_detalle", idiomasDetalle.filter((_, j) => j !== i))
                    }
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="otro_idioma">Otro idioma no listado</Label>
          <Input
            id="otro_idioma"
            value={otroIdioma}
            onChange={(ev) => setOtroIdioma(ev.target.value)}
          />
        </div>
        <Campo
          id="acentos"
          etiqueta="¿Dominas algún acento? ¿Cuáles?"
          valor={texto(f["acentos"])}
          onChange={(v) => set("acentos", v)}
        />
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
        titulo="Físico ampliado"
        descripcion="Tallas, complexión y otros rasgos que nos piden los clientes."
        onGuardar={() => {
          const activa = f["capacidad_diversa"] === true;
          void guardar(
            "fisico_ampliado",
            [
              "talla_camisa",
              "talla_pantalon",
              "talla_chaqueta",
              "talla_zapato",
              "tipo_pelo",
              "origen_etnia",
              "complexion",
              "albino",
              "barbudo",
              "capacidad_diversa",
              ...(activa ? ["capacidad_diversa_tipo", "capacidad_diversa_obs"] : []),
            ],
            activa ? undefined : { capacidad_diversa_tipo: null, capacidad_diversa_obs: null },
          );
        }}
        guardando={guardando === "fisico_ampliado"}
      >
        <SelectCampo
          etiqueta="Talla de camisa"
          valor={texto(f["talla_camisa"])}
          opciones={TALLAS_CAMISA}
          onChange={(v) => set("talla_camisa", v)}
        />
        <SelectCampo
          etiqueta="Talla de pantalón"
          valor={texto(f["talla_pantalon"])}
          opciones={TALLAS_PANTALON}
          onChange={(v) => set("talla_pantalon", v)}
        />
        <SelectCampo
          etiqueta="Talla de chaqueta"
          valor={texto(f["talla_chaqueta"])}
          opciones={TALLAS_CHAQUETA}
          onChange={(v) => set("talla_chaqueta", v)}
        />
        <Campo
          id="talla_zapato"
          etiqueta="Talla de zapato"
          valor={texto(f["talla_zapato"])}
          onChange={(v) => set("talla_zapato", v)}
        />
        <SelectCampo
          etiqueta="Tipo de pelo"
          valor={texto(f["tipo_pelo"])}
          opciones={TIPOS_PELO}
          onChange={(v) => set("tipo_pelo", v)}
        />
        <Campo
          id="origen_etnia"
          etiqueta="Origen / etnia"
          valor={texto(f["origen_etnia"])}
          onChange={(v) => set("origen_etnia", v)}
        />

        <div className="space-y-2 sm:col-span-2">
          <Label>Complexión</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {COMPLEXIONES.map((c) => {
              const activa = texto(f["complexion"]) === c.valor;
              return (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => set("complexion", activa ? null : c.valor)}
                  className={`border p-3 text-left transition-colors ${
                    activa
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-muted/60"
                  }`}
                >
                  <span className="block text-sm font-bold tracking-tight">{c.titulo}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {c.descripcion}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Interruptor etiqueta="Albino" valor={f["albino"] === true} onChange={(v) => set("albino", v)} />
        <Interruptor etiqueta="Barbudo" valor={f["barbudo"] === true} onChange={(v) => set("barbudo", v)} />
        <Interruptor
          etiqueta="Capacidad diversa"
          valor={f["capacidad_diversa"] === true}
          onChange={(v) => set("capacidad_diversa", v)}
        />

        {f["capacidad_diversa"] === true && (
          <>
            <Campo
              id="capacidad_diversa_tipo"
              etiqueta="Tipo de capacidad diversa"
              valor={texto(f["capacidad_diversa_tipo"])}
              onChange={(v) => set("capacidad_diversa_tipo", v)}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="capacidad_diversa_obs">Observaciones</Label>
              <Textarea
                id="capacidad_diversa_obs"
                value={texto(f["capacidad_diversa_obs"])}
                onChange={(e) => set("capacidad_diversa_obs", e.target.value)}
              />
            </div>
          </>
        )}
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
        titulo="Perfil profesional y especialidades"
        descripcion="Marca todo lo que aplique a ti: habilidades, especialidades y el tipo de perfil con el que encajas en los castings."
        onGuardar={() =>
          guardar(
            "perfil_profesional",
            [],
            { habilidades: habilidadesSel, tipo_perfil: tipoPerfilSel },
          )
        }
        guardando={guardando === "perfil_profesional"}
      >
        <div className="space-y-4 sm:col-span-2">
          <Label htmlFor="buscar_habilidad">Habilidades y especialidades</Label>
          <Input
            id="buscar_habilidad"
            placeholder="Buscar habilidad..."
            value={busquedaHabilidad}
            onChange={(ev) => setBusquedaHabilidad(ev.target.value)}
          />
          {GRUPOS_HABILIDADES.map((g) => {
            const q = busquedaHabilidad.trim().toLowerCase();
            const visibles = q
              ? g.opciones.filter((o) => o.toLowerCase().includes(q))
              : g.opciones;
            return (
              <GrupoChips
                key={g.titulo}
                titulo={g.titulo}
                opciones={visibles}
                seleccionados={habilidadesSel}
                onAlternar={(o) => set("habilidades", alternar(habilidadesSel, o))}
              />
            );
          })}
          {busquedaHabilidad.trim() !== "" &&
            GRUPOS_HABILIDADES.every(
              (g) => !g.opciones.some((o) => o.toLowerCase().includes(busquedaHabilidad.trim().toLowerCase())),
            ) && (
              <p className="text-sm text-muted-foreground">
                Ninguna opción coincide con tu búsqueda.
              </p>
            )}
        </div>

        <div className="space-y-4 sm:col-span-2">
          <Label>Tipo de perfil</Label>
          {GRUPOS_TIPO_PERFIL.map((g) => (
            <GrupoChips
              key={g.titulo}
              titulo={g.titulo}
              opciones={g.opciones}
              seleccionados={tipoPerfilSel}
              onAlternar={(o) => set("tipo_perfil", alternar(tipoPerfilSel, o))}
            />
          ))}
        </div>
      </Seccion>

      <section className="border border-border bg-card p-4 sm:p-6">
        <Accordion type="single" collapsible>
          <AccordionItem value="carnes" className="border-none">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div className="text-left">
                <h2 className="text-lg font-bold tracking-tight text-card-foreground">
                  Carnés de conducir
                </h2>
                <p className="mt-1 text-sm font-normal text-muted-foreground">
                  Solo si aplican a tu perfil
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {CARNES_OPCIONES.map((c) => (
                  <Chip
                    key={c}
                    activo={carnesSel.includes(c)}
                    onClick={() => set("carnes_conducir", alternar(carnesSel, c))}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
              <Button
                className="mt-5 w-full sm:w-auto"
                onClick={() =>
                  guardar("carnes", [], { carnes_conducir: carnesSel })
                }
                disabled={guardando === "carnes"}
              >
                {guardando === "carnes" ? "Guardando..." : "Guardar"}
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

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
