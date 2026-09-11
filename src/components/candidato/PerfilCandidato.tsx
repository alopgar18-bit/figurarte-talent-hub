import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Circle, CircleAlert } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  obtenerMisProcesos,
  rechazarPreseleccion,
  type ProcesoCandidato,
} from "@/lib/procesos-candidato.functions";
import {
  ACENTOS,
  COLORES_CABELLO,
  COLORES_OJOS,
  GENEROS,
  PAISES,
  PROVINCIAS_ES,
  TALLAS_CALZADO,
  TALLAS_CAMISA,
  TALLAS_PANTALON,
  aTextoLista,
  conValorActual,
  desdeTextoLista,
} from "@/lib/catalogos";


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
type Enlace = { url: string; descripcion: string };

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

function SelectCampoPares({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  opciones: { valor: string; etiqueta: string }[];
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
            <SelectItem key={o.valor} value={o.valor}>
              {o.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MultiSelectChips({
  etiqueta,
  descripcion,
  opciones,
  seleccionados,
  onChange,
  buscador = false,
  ancho = true,
}: {
  etiqueta: string;
  descripcion?: string;
  opciones: string[];
  seleccionados: string[];
  onChange: (lista: string[]) => void;
  buscador?: boolean;
  ancho?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const filtradas = buscador
    ? opciones.filter((o) => o.toLowerCase().includes(busqueda.trim().toLowerCase()))
    : opciones;
  return (
    <div className={ancho ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label>{etiqueta}</Label>
      {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      {buscador && (
        <Input
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      )}
      <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
        {filtradas.map((o) => (
          <Chip
            key={o}
            activo={seleccionados.includes(o)}
            onClick={() => onChange(alternar(seleccionados, o))}
          >
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

const CAMPOS_IDENTIDAD_FISCAL = [
  "pasaporte",
  "numero_seguridad_social",
  "nacionalidad",
  "nacionalidad_multiple",
  "lugar_nacimiento",
  "representacion",
  "domicilio_fiscal_pais",
  "domicilio_fiscal_provincia",
  "domicilio_fiscal_localidad",
  "domicilio_fiscal_cp",
  "domicilio_fiscal_direccion",
];

const SECCIONES = [
  { id: "basicos", etiqueta: "Datos básicos" },
  { id: "identidad", etiqueta: "Identidad" },
  { id: "fisico", etiqueta: "Físico" },
  { id: "habilidades", etiqueta: "Habilidades y perfil" },
  { id: "formacion", etiqueta: "Idiomas y formación" },
  { id: "documentacion", etiqueta: "Carnés y documentación" },
  { id: "redes", etiqueta: "Redes y enlaces" },
  { id: "video", etiqueta: "Vídeo de presentación" },
  { id: "rgpd", etiqueta: "Consentimiento RGPD" },
  { id: "procesos", etiqueta: "Mis procesos de casting" },
] as const;

type SeccionId = (typeof SECCIONES)[number]["id"];

function tieneDato(valor: unknown) {
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === "string") return valor.trim() !== "";
  if (typeof valor === "number") return true;
  return valor === true;
}

const CAMPOS_COMPLETADO: Record<Exclude<SeccionId, "rgpd" | "procesos">, string[]> = {
  basicos: ["nombre", "apellidos", "telefono", "ciudad", "provincia"],
  identidad: ["genero", "fecha_nacimiento", "dni", "nacionalidad"],
  fisico: ["altura_cm", "peso_kg", "color_piel", "color_cabello", "color_ojos", "talla_camisa", "talla_pantalon", "talla_chaqueta", "talla_calzado"],
  habilidades: ["profesion", "habilidad_especial", "habilidades", "tipo_perfil", "canta", "baila", "hace_deporte"],
  formacion: ["estudios", "idiomas", "idiomas_detalle", "acentos"],
  documentacion: ["pasaporte", "numero_seguridad_social", "carnes_conducir", "tiene_carnet_conducir", "tiene_titulo_patron_barco"],
  redes: ["video_book_url", "instagram_url", "tiktok_url", "web_url", "enlaces", "otras_residencias"],
  video: ["video_youtube_url"],
};

export function PerfilCandidato({ candidatoId }: { candidatoId: string }) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, unknown>>({});
  const [firmando, setFirmando] = useState(false);
  const firmar = useServerFn(darConsentimientoRgpd);
  const descargarDatos = useServerFn(obtenerMisDatos);
  const eliminarCuenta = useServerFn(eliminarMisDatos);
  const cargarProcesos = useServerFn(obtenerMisProcesos);
  const [descargando, setDescargando] = useState(false);
  const [dialogoBorrado, setDialogoBorrado] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [busquedaIdioma, setBusquedaIdioma] = useState("");
  const [otroIdioma, setOtroIdioma] = useState("");
  const [busquedaHabilidad, setBusquedaHabilidad] = useState("");
  const [otrasResidenciasActivo, setOtrasResidenciasActivo] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<SeccionId>("basicos");
  const [procesos, setProcesos] = useState<ProcesoCandidato[]>([]);
  const [cargandoProcesos, setCargandoProcesos] = useState(true);
  const [errorProcesos, setErrorProcesos] = useState(false);
  const [rechazando, setRechazando] = useState<string | null>(null);
  const rechazar = useServerFn(rechazarPreseleccion);

  async function rechazarProceso(proyectoId: string) {
    setRechazando(proyectoId);
    try {
      await rechazar({ data: { proyectoId } });
      setProcesos((prev) =>
        prev.map((p) =>
          p.proyecto_id === proyectoId
            ? { ...p, estado: "rechazado_por_candidato" as const }
            : p,
        ),
      );
      toast.success("Hemos registrado que rechazas este proceso.");
    } catch {
      toast.error("No hemos podido registrar tu rechazo. Inténtalo de nuevo.");
    } finally {
      setRechazando(null);
    }
  }

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
      setSeccionActiva(data.consentimiento_rgpd === true ? "basicos" : "rgpd");
      setOtrasResidenciasActivo(
        listaTextos((data as unknown as Record<string, unknown>)["otras_residencias"]).some(
          (x) => x.trim() !== "",
        ),
      );
      setCargando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [candidatoId]);

  useEffect(() => {
    let cancelado = false;
    void cargarProcesos({ data: undefined as never })
      .then((lista) => {
        if (!cancelado) setProcesos(lista);
      })
      .catch(() => {
        if (!cancelado) setErrorProcesos(true);
      })
      .finally(() => {
        if (!cancelado) setCargandoProcesos(false);
      });
    return () => {
      cancelado = true;
    };
  }, [cargarProcesos]);

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
  const completadas = Object.entries(CAMPOS_COMPLETADO).filter(([, campos]) =>
    campos.some((campo) => tieneDato(f[campo])),
  ).length;
  const porcentaje = (completadas / 8) * 100;

  function irASeccion(id: SeccionId) {
    setSeccionActiva(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-30 border border-border bg-background/95 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="truncate text-xl font-black tracking-tight">{texto(f["nombre"])}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ficha.codigo}</p>
          </div>
          <p className="shrink-0 text-sm font-semibold">{completadas} de 8</p>
        </div>
        <Progress value={porcentaje} className="mt-3 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">{completadas} de 8 secciones completadas</p>
      </div>

      <div className="lg:hidden">
        <Label htmlFor="seccion-candidato" className="sr-only">Seleccionar sección</Label>
        <Select value={seccionActiva} onValueChange={(v) => irASeccion(v as SeccionId)}>
          <SelectTrigger id="seccion-candidato" className={`w-full bg-card ${ficha["consentimiento_rgpd"] !== true && seccionActiva === "rgpd" ? "border-destructive text-destructive" : ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECCIONES.map((seccion) => {
              const completa = seccion.id === "rgpd"
                ? ficha["consentimiento_rgpd"] === true
                : seccion.id === "procesos"
                  ? procesos.length > 0
                  : CAMPOS_COMPLETADO[seccion.id].some((campo) => tieneDato(f[campo]));
              return <SelectItem key={seccion.id} value={seccion.id}>{seccion.id === "rgpd" && !completa ? "⚠ " : completa ? "✓ " : "○ "}{seccion.etiqueta}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-32 hidden border border-border bg-card p-2 lg:block">
          <nav aria-label="Secciones de tu ficha" className="space-y-1">
            {SECCIONES.map((seccion) => {
              const completa = seccion.id === "rgpd"
                ? ficha["consentimiento_rgpd"] === true
                : seccion.id === "procesos"
                  ? procesos.length > 0
                  : CAMPOS_COMPLETADO[seccion.id].some((campo) => tieneDato(f[campo]));
              const pendienteRgpd = seccion.id === "rgpd" && !completa;
              return (
                <Button
                  key={seccion.id}
                  type="button"
                  variant={seccionActiva === seccion.id ? "secondary" : "ghost"}
                  onClick={() => irASeccion(seccion.id)}
                  className={`grid h-auto w-full grid-cols-[20px_minmax(0,1fr)] justify-start gap-2 px-3 py-2 text-left ${pendienteRgpd ? "text-destructive" : ""}`}
                >
                  {pendienteRgpd ? <CircleAlert className="size-4 shrink-0" /> : completa ? <Check className="size-4 shrink-0 text-primary" /> : <Circle className="size-3 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 whitespace-normal leading-snug">{seccion.etiqueta}</span>
                </Button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">

      {seccionActiva === "rgpd" && ficha["consentimiento_rgpd"] !== true && (
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


      {seccionActiva === "basicos" && <><Seccion
        titulo="Datos básicos"
        onGuardar={() =>
          guardar("basicos", [
            "nombre",
            "apellidos",
            "telefono",
            "ciudad",
            "provincia",
          ])
        }
        guardando={guardando === "basicos"}
      >
        <Campo id="nombre" etiqueta="Nombre" valor={texto(f["nombre"])} onChange={(v) => set("nombre", v)} />
        <Campo id="apellidos" etiqueta="Apellidos" valor={texto(f["apellidos"])} onChange={(v) => set("apellidos", v)} />
        <Campo id="telefono" etiqueta="Teléfono" valor={texto(f["telefono"])} onChange={(v) => set("telefono", v)} />
        <Campo id="ciudad" etiqueta="Ciudad" valor={texto(f["ciudad"])} onChange={(v) => set("ciudad", v)} />
        <SelectCampo
          etiqueta="Provincia"
          valor={texto(f["provincia"])}
          opciones={conValorActual(PROVINCIAS_ES, f["provincia"])}
          onChange={(v) => set("provincia", v)}
        />
      </Seccion>

      <Seccion
        titulo="Contacto adicional"
        descripcion="Otro teléfono u otro correo donde localizarte."
        onGuardar={() => guardar("contacto_adicional", ["telefono_2", "email_2"])}
        guardando={guardando === "contacto_adicional"}
      >
        <Campo id="telefono_2" etiqueta="Teléfono secundario" valor={texto(f["telefono_2"])} onChange={(v) => set("telefono_2", v)} />
        <Campo id="email_2" etiqueta="Email secundario" tipo="email" valor={texto(f["email_2"])} onChange={(v) => set("email_2", v)} />
      </Seccion></>}


      {seccionActiva === "identidad" && <Seccion
        titulo="Identidad"
        onGuardar={() => guardar("identidad", ["genero", "fecha_nacimiento", "dni"])}
        guardando={guardando === "identidad"}
      >
        <SelectCampo
          etiqueta="Género"
          valor={texto(f["genero"])}
          opciones={conValorActual(GENEROS, f["genero"])}
          onChange={(v) => set("genero", v)}
        />
        <Campo
          id="fecha_nacimiento"
          etiqueta="Fecha de nacimiento"
          tipo="date"
          valor={texto(f["fecha_nacimiento"])}
          onChange={(v) => set("fecha_nacimiento", v)}
        />
        <Campo id="dni" etiqueta="DNI" valor={texto(f["dni"])} onChange={(v) => set("dni", v)} />
      </Seccion>}

      {seccionActiva === "identidad" && <Seccion
        titulo="Identidad y datos fiscales"
        descripcion="Documentación y datos que usamos para contratos y facturación. Solo los ve el equipo de FigurArte."
        onGuardar={() => guardar("identidad_fiscal", CAMPOS_IDENTIDAD_FISCAL)}
        guardando={guardando === "identidad_fiscal"}
      >
        <Campo id="pasaporte" etiqueta="Pasaporte" valor={texto(f["pasaporte"])} onChange={(v) => set("pasaporte", v)} />
        <Campo
          id="numero_seguridad_social"
          etiqueta="Número de la Seguridad Social"
          valor={texto(f["numero_seguridad_social"])}
          onChange={(v) => set("numero_seguridad_social", v)}
        />
        <SelectCampo
          etiqueta="Nacionalidad"
          valor={texto(f["nacionalidad"])}
          opciones={conValorActual(PAISES, f["nacionalidad"])}
          onChange={(v) => set("nacionalidad", v)}
        />
        <MultiSelectChips
          etiqueta="Otras nacionalidades"
          descripcion="Selecciona todos los países de los que tengas nacionalidad."
          buscador
          opciones={PAISES}
          seleccionados={desdeTextoLista(f["nacionalidad_multiple"])}
          onChange={(lista) => set("nacionalidad_multiple", aTextoLista(lista))}
        />
        <Campo
          id="lugar_nacimiento"
          etiqueta="Lugar de nacimiento"
          valor={texto(f["lugar_nacimiento"])}
          onChange={(v) => set("lugar_nacimiento", v)}
        />
        <SelectCampoPares
          etiqueta="Representación"
          valor={texto(f["representacion"])}
          opciones={[
            { valor: "sin_representacion", etiqueta: "Sin representación" },
            { valor: "con_representacion", etiqueta: "Con representación / agencia" },
          ]}
          onChange={(v) => set("representacion", v)}
        />

        <div className="sm:col-span-2">
          <Accordion type="single" collapsible>
            <AccordionItem value="domicilio_fiscal" className="border border-border px-4">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="text-left">
                  <h3 className="text-base font-bold tracking-tight text-card-foreground">
                    Domicilio fiscal
                  </h3>
                  <p className="mt-1 text-sm font-normal text-muted-foreground">
                    Para facturación y contratos
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectCampo
                    etiqueta="País"
                    valor={texto(f["domicilio_fiscal_pais"])}
                    opciones={conValorActual(PAISES, f["domicilio_fiscal_pais"])}
                    onChange={(v) => set("domicilio_fiscal_pais", v)}
                  />
                  <SelectCampo
                    etiqueta="Provincia"
                    valor={texto(f["domicilio_fiscal_provincia"])}
                    opciones={conValorActual(PROVINCIAS_ES, f["domicilio_fiscal_provincia"])}
                    onChange={(v) => set("domicilio_fiscal_provincia", v)}
                  />
                  <Campo
                    id="domicilio_fiscal_localidad"
                    etiqueta="Localidad"
                    valor={texto(f["domicilio_fiscal_localidad"])}
                    onChange={(v) => set("domicilio_fiscal_localidad", v)}
                  />
                  <Campo
                    id="domicilio_fiscal_cp"
                    etiqueta="Código postal"
                    valor={texto(f["domicilio_fiscal_cp"])}
                    onChange={(v) => set("domicilio_fiscal_cp", v)}
                  />
                  <div className="sm:col-span-2">
                    <Campo
                      id="domicilio_fiscal_direccion"
                      etiqueta="Dirección"
                      valor={texto(f["domicilio_fiscal_direccion"])}
                      onChange={(v) => set("domicilio_fiscal_direccion", v)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Seccion>}

      {seccionActiva === "formacion" && <Seccion
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
        <MultiSelectChips
          etiqueta="¿Dominas algún acento? ¿Cuáles?"
          opciones={ACENTOS}
          seleccionados={desdeTextoLista(f["acentos"])}
          onChange={(lista) => set("acentos", aTextoLista(lista))}
        />
      </Seccion>}

      {seccionActiva === "identidad" && menor && (
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

      {seccionActiva === "fisico" && <><Seccion
        titulo="Altura y peso"
        onGuardar={() => guardar("medidas_basicas", ["altura_cm", "peso_kg"])}
        guardando={guardando === "medidas_basicas"}
      >
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
        <SelectCampo
          etiqueta="Color de cabello"
          valor={texto(f["color_cabello"])}
          opciones={conValorActual(COLORES_CABELLO, f["color_cabello"])}
          onChange={(v) => set("color_cabello", v)}
        />
        <SelectCampo
          etiqueta="Color de ojos"
          valor={texto(f["color_ojos"])}
          opciones={conValorActual(COLORES_OJOS, f["color_ojos"])}
          onChange={(v) => set("color_ojos", v)}
        />
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
              "talla_calzado",
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
        <SelectCampo
          etiqueta="Talla de calzado (EU)"
          valor={texto(f["talla_calzado"])}
          opciones={conValorActual(TALLAS_CALZADO, f["talla_calzado"])}
          onChange={(v) => set("talla_calzado", v)}
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
      </Seccion></>}

      {seccionActiva === "habilidades" && <><Seccion
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
      </Seccion></>}

      {seccionActiva === "documentacion" && <section className="border border-border bg-card p-4 sm:p-6">
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
      </section>}

      {seccionActiva === "redes" && <><Seccion
        titulo="Redes"
        onGuardar={() =>
          guardar("redes", [
            "video_book_url",
            "tiktok_url",
            "instagram_url",
            "facebook_url",
            "twitter_url",
            "linkedin_url",
            "youtube_url",
            "twitch_url",
            "web_url",
          ])
        }
        guardando={guardando === "redes"}
      >
        <Campo id="video_book_url" etiqueta="Enlace a tu video book" valor={texto(f["video_book_url"])} onChange={(v) => set("video_book_url", v)} ancho />
        <Campo id="tiktok_url" etiqueta="TikTok" valor={texto(f["tiktok_url"])} onChange={(v) => set("tiktok_url", v)} />
        <Campo id="instagram_url" etiqueta="Instagram" valor={texto(f["instagram_url"])} onChange={(v) => set("instagram_url", v)} />
        <Campo id="facebook_url" etiqueta="Facebook" valor={texto(f["facebook_url"])} onChange={(v) => set("facebook_url", v)} />
        <Campo id="twitter_url" etiqueta="X (Twitter)" valor={texto(f["twitter_url"])} onChange={(v) => set("twitter_url", v)} />
        <Campo id="linkedin_url" etiqueta="LinkedIn" valor={texto(f["linkedin_url"])} onChange={(v) => set("linkedin_url", v)} />
        <Campo id="youtube_url" etiqueta="Canal de YouTube" valor={texto(f["youtube_url"])} onChange={(v) => set("youtube_url", v)} />
        <Campo id="twitch_url" etiqueta="Twitch" valor={texto(f["twitch_url"])} onChange={(v) => set("twitch_url", v)} />
        <Campo id="web_url" etiqueta="Web personal" valor={texto(f["web_url"])} onChange={(v) => set("web_url", v)} ancho />
      </Seccion>

      <Seccion
        titulo="Enlaces adicionales"
        descripcion="Enlaces a fotos, book, CV o vídeos adicionales de interés."
        onGuardar={() =>
          void guardar("enlaces", [], {
            enlaces: enlaces.filter(
              (e) => e.url.trim() !== "" || e.descripcion.trim() !== "",
            ),
          })
        }
        guardando={guardando === "enlaces"}
      >
        <div className="space-y-3 sm:col-span-2">
          {enlaces.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no has añadido ningún enlace.</p>
          )}
          {enlaces.map((e, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="sm:flex-1"
                placeholder="https://..."
                value={e.url}
                onChange={(ev) =>
                  set(
                    "enlaces",
                    enlaces.map((x, j) => (j === i ? { ...x, url: ev.target.value } : x)),
                  )
                }
              />
              <Input
                className="sm:flex-1"
                placeholder="Breve descripción"
                value={e.descripcion}
                onChange={(ev) =>
                  set(
                    "enlaces",
                    enlaces.map((x, j) => (j === i ? { ...x, descripcion: ev.target.value } : x)),
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                className="sm:w-auto"
                onClick={() => set("enlaces", enlaces.filter((_, j) => j !== i))}
              >
                Quitar
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => set("enlaces", [...enlaces, { url: "", descripcion: "" }])}
          >
            + Añadir enlace
          </Button>
        </div>
      </Seccion>

      <Seccion
        titulo="Disponibilidad para otras residencias"
        descripcion="¿Podrías residir temporalmente en otra localidad si el proyecto lo requiere?"
        onGuardar={() =>
          void guardar("residencias", [], {
            otras_residencias: otrasResidenciasActivo
              ? otrasResidencias.filter((x) => x.trim() !== "")
              : [],
          })
        }
        guardando={guardando === "residencias"}
      >
        <div className="space-y-3 sm:col-span-2">
          <Interruptor
            etiqueta="¿Tienes disponibilidad para otras residencias?"
            valor={otrasResidenciasActivo}
            onChange={setOtrasResidenciasActivo}
          />
          {otrasResidenciasActivo && (
            <MultiSelectChips
              etiqueta="Provincias donde podrías residir"
              buscador
              opciones={PROVINCIAS_ES}
              seleccionados={otrasResidencias}
              onChange={(lista) => set("otras_residencias", lista)}
            />
          )}
        </div>
      </Seccion></>}

      {seccionActiva === "video" && <VideoPresentacion
        videoUrlActual={texto(f["video_youtube_url"]) || null}
        nombre={texto(f["nombre"])}
        codigo={ficha.codigo}
      />}

      {seccionActiva === "rgpd" && <section className="border border-border bg-card p-4 sm:p-6">
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
      </section>}

      {seccionActiva === "procesos" && (
        <section className="border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-bold tracking-tight text-card-foreground">Mis procesos de casting</h2>
          <p className="mt-1 text-sm text-muted-foreground">Aquí puedes consultar los procesos en los que participas.</p>
          {cargandoProcesos ? (
            <p className="mt-5 text-sm text-muted-foreground">Cargando tus procesos...</p>
          ) : errorProcesos ? (
            <p className="mt-5 text-sm text-destructive">No hemos podido cargar tus procesos. Vuelve a intentarlo.</p>
          ) : procesos.length === 0 ? (
            <p className="mt-5 border border-border bg-muted/40 p-4 text-sm">Aún no estás en ningún proceso de casting.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {procesos.map((proceso, indice) => (
                <article key={`${proceso.proyecto}-${proceso.fecha}-${indice}`} className="border border-border p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{proceso.proyecto}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{proceso.categoria.replaceAll("_", " ")}</p>
                    </div>
                    <span className="shrink-0 border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold capitalize text-primary">{proceso.estado.replaceAll("_", " ")}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <p>{proceso.origen === "web_directa" ? "Te apuntaste tú" : "Te añadió el equipo"}</p>
                    <time className="text-muted-foreground sm:text-right" dateTime={proceso.fecha}>{new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(proceso.fecha))}</time>
                  </div>
                  {proceso.estado === "preseleccionado" && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rechazando === proceso.proyecto_id}
                        onClick={() => rechazarProceso(proceso.proyecto_id)}
                      >
                        {rechazando === proceso.proyecto_id ? "Rechazando…" : "Rechazar"}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Si no te interesa este proceso, avísanos y lo retiramos.
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

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
      </div>
    </div>
  );

}
