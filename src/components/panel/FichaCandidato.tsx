import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  ImageIcon,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Ruler,
  Weight,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { obtenerFichaCandidatoStaff } from "@/lib/ficha-candidato.functions";
import { eliminarCandidatoStaff } from "@/lib/derechos-rgpd.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACENTOS,
  COLORES_CABELLO,
  COLORES_OJOS,
  GENEROS,
  PAISES,
  PROVINCIAS_ES,
  TALLAS_CALZADO,
  aTextoLista,
  conValorActual,
  desdeTextoLista,
} from "@/lib/catalogos";

const SIN_TALLA = "__sin_talla__";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";


export type CandidatoCompleto = Record<string, unknown> & {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string | null;
  categoria: string;
  edad: number | null;
  provincia: string | null;
  ciudad: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  disponible: boolean;
  fotos: string[];
  email: string | null;
  telefono: string | null;
};

type CastingAsociado = {
  estado: string;
  origen: string;
  creado_en: string;
  proyectos_casting: { nombre: string } | null;
};

export const ETIQUETA_CATEGORIA: Record<string, string> = {
  actor: "Actor",
  modelo: "Modelo",
  figurante: "Figurante",
  casting_plus: "Casting Plus",
};

const COLOR_CATEGORIA: Record<string, string> = {
  actor: "bg-primary/15 text-primary border-primary/30",
  modelo:
    "bg-[oklch(0.35_0.15_270_/_0.15)] text-[oklch(0.42_0.17_270)] border-[oklch(0.42_0.17_270_/_0.3)]",
  figurante: "bg-muted text-foreground border-border",
  casting_plus: "bg-accent text-accent-foreground border-border",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  preseleccionado: "Preseleccionado",
  enviado: "Enviado",
  contratado: "Contratado",
};

const ETIQUETA_ORIGEN: Record<string, string> = {
  manual: "Manual",
  web_directa: "Web directa",
};

const CAMPOS_PERFIL: {
  clave: string;
  etiqueta: string;
  tipo?: "bool" | "fecha" | "etiqueta";
  etiquetas?: Record<string, string>;
}[] = [
  { clave: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha" },
  { clave: "dni", etiqueta: "DNI" },
  { clave: "tutor_nombre", etiqueta: "Tutor/a (nombre)" },
  { clave: "tutor_apellidos", etiqueta: "Tutor/a (apellidos)" },
  { clave: "tutor_dni", etiqueta: "Tutor/a (DNI)" },
  { clave: "pais_origen", etiqueta: "País de origen" },
  { clave: "pasaporte", etiqueta: "Pasaporte" },
  { clave: "numero_seguridad_social", etiqueta: "Nº Seguridad Social" },
  { clave: "nacionalidad_multiple", etiqueta: "Otras nacionalidades" },
  { clave: "lugar_nacimiento", etiqueta: "Lugar de nacimiento" },
  {
    clave: "representacion",
    etiqueta: "Representación",
    tipo: "etiqueta",
    etiquetas: {
      sin_representacion: "Sin representación",
      con_representacion: "Con representación / agencia",
    },
  },
  { clave: "domicilio_fiscal_pais", etiqueta: "Domicilio fiscal (país)" },
  { clave: "domicilio_fiscal_provincia", etiqueta: "Domicilio fiscal (provincia)" },
  { clave: "domicilio_fiscal_localidad", etiqueta: "Domicilio fiscal (localidad)" },
  { clave: "domicilio_fiscal_cp", etiqueta: "Domicilio fiscal (CP)" },
  { clave: "domicilio_fiscal_direccion", etiqueta: "Domicilio fiscal (dirección)" },
  { clave: "telefono_2", etiqueta: "Teléfono secundario" },
  { clave: "email_2", etiqueta: "Email secundario" },
  { clave: "web_url", etiqueta: "Web personal" },
  { clave: "facebook_url", etiqueta: "Facebook" },
  { clave: "twitter_url", etiqueta: "X (Twitter)" },
  { clave: "linkedin_url", etiqueta: "LinkedIn" },
  { clave: "youtube_url", etiqueta: "Canal de YouTube" },
  { clave: "twitch_url", etiqueta: "Twitch" },
  { clave: "color_piel", etiqueta: "Color de piel" },
  { clave: "talla_chaqueta", etiqueta: "Talla chaqueta" },
  
  { clave: "tipo_pelo", etiqueta: "Tipo de pelo" },
  { clave: "complexion", etiqueta: "Complexión" },
  { clave: "origen_etnia", etiqueta: "Origen / etnia" },
  { clave: "albino", etiqueta: "Albino", tipo: "bool" },
  { clave: "barbudo", etiqueta: "Barbudo", tipo: "bool" },
  { clave: "capacidad_diversa", etiqueta: "Capacidad diversa", tipo: "bool" },
  { clave: "capacidad_diversa_tipo", etiqueta: "Tipo de capacidad diversa" },
  { clave: "capacidad_diversa_obs", etiqueta: "Observaciones (capacidad diversa)" },
  { clave: "tiene_tatuajes", etiqueta: "Tatuajes", tipo: "bool" },
  { clave: "tiene_cicatrices", etiqueta: "Cicatrices", tipo: "bool" },
  { clave: "tiene_ortodoncia", etiqueta: "Ortodoncia", tipo: "bool" },
  { clave: "canta", etiqueta: "Canta", tipo: "bool" },
  { clave: "toca_instrumentos", etiqueta: "Toca instrumentos", tipo: "bool" },
  { clave: "baila", etiqueta: "Baila", tipo: "bool" },
  { clave: "hace_deporte", etiqueta: "Hace deporte", tipo: "bool" },
  { clave: "monta_a_caballo", etiqueta: "Monta a caballo", tipo: "bool" },
  { clave: "tiene_carnet_conducir", etiqueta: "Carnet de conducir", tipo: "bool" },
  { clave: "tiene_titulo_patron_barco", etiqueta: "Patrón de barco", tipo: "bool" },
  { clave: "habilidad_especial", etiqueta: "Habilidad especial" },
  { clave: "profesion", etiqueta: "Profesión" },
  { clave: "idiomas", etiqueta: "Idiomas" },
  { clave: "video_book_url", etiqueta: "Vídeo book" },
  { clave: "tiktok_url", etiqueta: "TikTok" },
  { clave: "instagram_url", etiqueta: "Instagram" },
];

const CAMPOS_BADGES: { clave: string; etiqueta: string }[] = [
  { clave: "habilidades", etiqueta: "Habilidades y especialidades" },
  { clave: "tipo_perfil", etiqueta: "Tipo de perfil" },
  { clave: "carnes_conducir", etiqueta: "Carnés de conducir" },
  { clave: "otras_residencias", etiqueta: "Disponibilidad para otras residencias" },
];

function arrayTexto(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
}

function arrayObjetos(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x))
    : [];
}

/** Campos con catálogo cerrado, editables también desde el panel. */
const CAMPOS_CATALOGO: { clave: string; etiqueta: string; opciones: string[] }[] = [
  { clave: "genero", etiqueta: "Género", opciones: GENEROS },
  { clave: "provincia", etiqueta: "Provincia", opciones: PROVINCIAS_ES },
  { clave: "nacionalidad", etiqueta: "Nacionalidad", opciones: PAISES },
  { clave: "color_cabello", etiqueta: "Color de cabello", opciones: COLORES_CABELLO },
  { clave: "color_ojos", etiqueta: "Color de ojos", opciones: COLORES_OJOS },
];

export const CAMPOS_VESTUARIO = [
  { clave: "talla_camisa", etiqueta: "Talla camisa", tipo: "texto" },
  { clave: "anchura_pecho", etiqueta: "Anchura pecho (cm)", tipo: "numero" },
  { clave: "talla_pantalon", etiqueta: "Talla pantalón", tipo: "texto" },
  { clave: "anchura_cintura", etiqueta: "Anchura cintura (cm)", tipo: "numero" },
  { clave: "talla_calzado", etiqueta: "Talla calzado (EU)", tipo: "catalogo" },
] as const;

function formateaFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono?: React.ComponentType<{ className?: string }>;
  etiqueta: string;
  valor: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icono ? <Icono className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : null}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
        <p className="break-words font-medium">{valor || "—"}</p>
      </div>
    </div>
  );
}

export function FichaCandidato({
  id,
  volverAProyectoId,
}: {
  id: string;
  volverAProyectoId?: string | undefined;
}) {
  const obtenerFicha = useServerFn(obtenerFichaCandidatoStaff);
  const [candidato, setCandidato] = useState<CandidatoCompleto | null>(null);
  const [castings, setCastings] = useState<CastingAsociado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [guardandoDisponible, setGuardandoDisponible] = useState(false);
  const navigate = useNavigate();
  const borrarCandidato = useServerFn(eliminarCandidatoStaff);
  const [dialogoBorrado, setDialogoBorrado] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [vestuario, setVestuario] = useState<Record<string, string>>({});
  const [guardandoVestuario, setGuardandoVestuario] = useState(false);
  const [catalogo, setCatalogo] = useState<Record<string, string>>({});
  const [acentosSel, setAcentosSel] = useState<string[]>([]);
  const [guardandoCatalogo, setGuardandoCatalogo] = useState(false);

  async function confirmarBorrado() {
    setBorrando(true);
    try {
      const res = await borrarCandidato({
        data: { candidatoId: id, confirmacion: "ELIMINAR" as const },
      });
      if (res.estado !== "ok") {
        toast.error(res.mensaje, { duration: 10000 });
        setBorrando(false);
        return;
      }
      toast.success("Candidato y todos sus datos eliminados.");
      void navigate({ to: "/panel/candidatos" });
    } catch {
      toast.error("No se pudieron eliminar los datos. Inténtalo de nuevo.");
      setBorrando(false);
    }
  }


  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      let resultado;
      try {
        resultado = await obtenerFicha({ data: { id } });
      } catch {
        if (activo) {
          setNoEncontrado(true);
          setCargando(false);
        }
        return;
      }
      if (!activo) return;
      if (!resultado.candidato) {
        setNoEncontrado(true);
      } else {
        const ficha = resultado.candidato as CandidatoCompleto;
        setCandidato(ficha);
        const inicial: Record<string, string> = {};
        for (const { clave } of CAMPOS_VESTUARIO) {
          const v = ficha[clave];
          inicial[clave] =
            typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
        }
        setVestuario(inicial);
        const inicialCatalogo: Record<string, string> = {};
        for (const { clave } of CAMPOS_CATALOGO) {
          const v = ficha[clave];
          inicialCatalogo[clave] = typeof v === "string" ? v : "";
        }
        setCatalogo(inicialCatalogo);
        setAcentosSel(desdeTextoLista(ficha["acentos"]));
        setCastings((resultado.castings as CastingAsociado[] | null) ?? []);
      }
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, [id, obtenerFicha]);

  async function cambiarDisponible(valor: boolean) {
    if (!candidato) return;
    setGuardandoDisponible(true);
    const anterior = candidato.disponible;
    setCandidato({ ...candidato, disponible: valor });
    const { error } = await supabase
      .from("candidatos")
      .update({ disponible: valor })
      .eq("id", candidato.id);
    setGuardandoDisponible(false);
    if (error) {
      setCandidato({ ...candidato, disponible: anterior });
      toast.error("No se pudo guardar la disponibilidad. Inténtalo de nuevo.");
    } else {
      toast.success(valor ? "Marcado como disponible" : "Marcado como no disponible");
    }
  }

  async function guardarCatalogo() {
    if (!candidato) return;
    setGuardandoCatalogo(true);
    const valores: Record<string, string | null> = { acentos: aTextoLista(acentosSel) };
    for (const { clave } of CAMPOS_CATALOGO) valores[clave] = catalogo[clave] || null;
    const { error } = await supabase
      .from("candidatos")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(valores as any)
      .eq("id", candidato.id);
    setGuardandoCatalogo(false);
    if (error) {
      toast.error("No se pudieron guardar los datos de perfil.");
      return;
    }
    setCandidato({ ...candidato, ...valores });
    toast.success("Datos de perfil guardados");
  }

  async function guardarVestuario() {
    if (!candidato) return;
    setGuardandoVestuario(true);
    const valores: Record<string, string | number | null> = {};
    for (const { clave, tipo } of CAMPOS_VESTUARIO) {
      const bruto = (vestuario[clave] ?? "").trim();
      if (tipo === "numero") {
        const n = Number(bruto.replace(",", "."));
        if (bruto !== "" && (!Number.isFinite(n) || n <= 0 || n > 300)) {
          setGuardandoVestuario(false);
          toast.error("Las medidas de pecho y cintura deben ser un número en centímetros.");
          return;
        }
        valores[clave] = bruto === "" ? null : Math.round(n);
      } else {
        valores[clave] = bruto || null;
      }
    }
    const { error } = await supabase
      .from("candidatos")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(valores as any)
      .eq("id", candidato.id);
    setGuardandoVestuario(false);
    if (error) {
      toast.error("No se pudieron guardar las medidas de vestuario.");
      return;
    }
    setCandidato({ ...candidato, ...valores });
    toast.success("Medidas guardadas");
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando ficha…
      </div>
    );
  }

  if (noEncontrado || !candidato) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-lg font-bold tracking-tight">Candidato no encontrado</p>
        <p className="text-sm text-muted-foreground">
          Es posible que la ficha se haya eliminado o que el enlace no sea correcto.
        </p>
        {volverAProyectoId ? (
          <Link
            to="/panel/proyectos/$id"
            params={{ id: volverAProyectoId }}
            className="text-sm text-primary underline underline-offset-4"
          >
            ← Volver al proyecto
          </Link>
        ) : (
          <Link to="/panel/candidatos" className="text-sm text-primary underline underline-offset-4">
            ← Volver al listado
          </Link>
        )}
      </div>
    );
  }

  const nombreCompleto = [candidato.nombre, candidato.apellidos].filter(Boolean).join(" ");
  const camposPerfilConValor = CAMPOS_PERFIL.filter(({ clave }) => {
    const v = candidato[clave];
    return v !== null && v !== undefined && v !== "";
  });
  const badgesConValor = CAMPOS_BADGES.map((campo) => ({
    ...campo,
    valores: arrayTexto(candidato[campo.clave]),
  })).filter((campo) => campo.valores.length > 0);
  const estudios = arrayObjetos(candidato["estudios"]);
  const idiomasDetalle = arrayObjetos(candidato["idiomas_detalle"]);
  const enlaces = arrayObjetos(candidato["enlaces"]);
  const haySeccionesListas =
    badgesConValor.length > 0 || estudios.length > 0 || idiomasDetalle.length > 0 || enlaces.length > 0;

  return (
    <div className="space-y-6">
      {volverAProyectoId ? (
        <Link
          to="/panel/proyectos/$id"
          params={{ id: volverAProyectoId }}
          className="inline-block text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Volver al proyecto
        </Link>
      ) : (
        <Link
          to="/panel/candidatos"
          className="inline-block text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Volver al listado
        </Link>
      )}

      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={COLOR_CATEGORIA[candidato.categoria] ?? ""}>
              {ETIQUETA_CATEGORIA[candidato.categoria] ?? candidato.categoria}
            </Badge>
            <span className="font-mono text-sm text-muted-foreground">{candidato.codigo}</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">{nombreCompleto}</h2>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {[candidato.ciudad, candidato.provincia].filter(Boolean).join(", ") ||
              "Ubicación sin indicar"}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-md border bg-card px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Disponible</p>
            <Badge variant={candidato.disponible ? "default" : "secondary"}>
              {candidato.disponible ? "Disponible" : "No disponible"}
            </Badge>
          </div>
          <Switch
            checked={candidato.disponible}
            disabled={guardandoDisponible}
            onCheckedChange={cambiarDisponible}
            aria-label="Cambiar disponibilidad"
          />
        </div>
      </div>

      {/* Datos y medidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos y medidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Dato
            icono={Ruler}
            etiqueta="Altura"
            valor={candidato.altura_cm ? `${candidato.altura_cm} cm` : null}
          />
          <Dato
            icono={Weight}
            etiqueta="Peso"
            valor={candidato.peso_kg ? `${candidato.peso_kg} kg` : null}
          />
          <Dato
            icono={User}
            etiqueta="Edad"
            valor={candidato.edad ? `${candidato.edad} años` : null}
          />
          <Dato icono={Mail} etiqueta="Email" valor={candidato.email} />
          <Dato icono={Phone} etiqueta="Teléfono" valor={candidato.telefono} />
          <Dato icono={MapPin} etiqueta="Ciudad" valor={candidato.ciudad} />
          <Dato icono={MapPin} etiqueta="Provincia" valor={candidato.provincia} />
        </CardContent>
      </Card>

      {/* Datos de perfil con catálogo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de perfil (catálogo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CAMPOS_CATALOGO.map(({ clave, etiqueta, opciones }) => (
              <div key={clave} className="space-y-1.5">
                <Label htmlFor={`cat-${clave}`} className="text-xs text-muted-foreground">
                  {etiqueta}
                </Label>
                <Select
                  value={catalogo[clave] ? catalogo[clave] : SIN_TALLA}
                  onValueChange={(v) =>
                    setCatalogo((s) => ({ ...s, [clave]: v === SIN_TALLA ? "" : v }))
                  }
                >
                  <SelectTrigger id={`cat-${clave}`} aria-label={etiqueta}>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_TALLA}>Sin especificar</SelectItem>
                    {conValorActual(opciones, catalogo[clave]).map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Acentos</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[...new Set([...ACENTOS, ...acentosSel])].map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={acentosSel.includes(a)}
                    onChange={() =>
                      setAcentosSel((s) =>
                        s.includes(a) ? s.filter((x) => x !== a) : [...s, a],
                      )
                    }
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <Button onClick={guardarCatalogo} disabled={guardandoCatalogo}>
            {guardandoCatalogo && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar datos de perfil
          </Button>
        </CardContent>
      </Card>

      {/* Medidas de vestuario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medidas de vestuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CAMPOS_VESTUARIO.map(({ clave, etiqueta, tipo }) => (
              <div key={clave} className="space-y-1.5">
                <Label htmlFor={`v-${clave}`} className="text-xs text-muted-foreground">
                  {etiqueta}
                </Label>
                {tipo === "catalogo" ? (
                  <Select
                    value={vestuario[clave] ? vestuario[clave] : SIN_TALLA}
                    onValueChange={(v) =>
                      setVestuario((s) => ({ ...s, [clave]: v === SIN_TALLA ? "" : v }))
                    }
                  >
                    <SelectTrigger id={`v-${clave}`} aria-label={etiqueta}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SIN_TALLA}>Sin especificar</SelectItem>
                      {TALLAS_CALZADO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`v-${clave}`}
                    type={tipo === "numero" ? "number" : "text"}
                    inputMode={tipo === "numero" ? "numeric" : undefined}
                    value={vestuario[clave] ?? ""}
                    onChange={(e) =>
                      setVestuario((s) => ({ ...s, [clave]: e.target.value }))
                    }
                    placeholder="—"
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={guardarVestuario} disabled={guardandoVestuario}>
            {guardandoVestuario && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar medidas
          </Button>
        </CardContent>
      </Card>

      {/* Fotos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fotos ({candidato.fotos?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {candidato.fotos && candidato.fotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {candidato.fotos.map((foto) => {
                const esPlaceholder = !/^https?:\/\//.test(foto);
                return esPlaceholder ? (
                  <div
                    key={foto}
                    className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/50 p-3 text-center"
                  >
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="break-all text-[10px] leading-tight text-muted-foreground">
                      {foto}
                    </span>
                  </div>
                ) : (
                  <img
                    key={foto}
                    src={foto}
                    alt={`Foto de ${nombreCompleto}`}
                    loading="lazy"
                    className="aspect-[3/4] w-full rounded-md border object-cover"
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin fotos todavía.</p>
          )}
        </CardContent>
      </Card>

      {/* Historial de castings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de castings</CardTitle>
        </CardHeader>
        <CardContent>
          {castings.length > 0 ? (
            <div className="-mx-6 overflow-x-auto px-6">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Proyecto</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Origen</th>
                    <th className="py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {castings.map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">
                        {c.proyectos_casting?.nombre ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline">{ETIQUETA_ESTADO[c.estado] ?? c.estado}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {ETIQUETA_ORIGEN[c.origen] ?? c.origen}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formateaFecha(c.creado_en)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin castings asociados todavía.</p>
          )}
        </CardContent>
      </Card>

      {/* Perfil ampliado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil completo</CardTitle>
        </CardHeader>
        <CardContent>
          {camposPerfilConValor.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {camposPerfilConValor.map(({ clave, etiqueta, tipo, etiquetas }) => {
                const bruto = candidato[clave];
                let valor: string;
                if (tipo === "bool") {
                  valor = bruto ? "Sí" : "No";
                } else if (tipo === "fecha") {
                  valor = formateaFecha(String(bruto));
                } else if (tipo === "etiqueta") {
                  valor = etiquetas?.[String(bruto)] ?? String(bruto);
                } else {
                  valor = String(bruto);
                }
                return <Dato key={clave} etiqueta={etiqueta} valor={valor} />;
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este candidato aún no ha completado su perfil ampliado.
            </p>
          )}

          {haySeccionesListas ? (
            <div className="mt-6 space-y-4 border-t pt-6">
              {badgesConValor.map(({ clave, etiqueta, valores }) => (
                <div key={clave} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">{etiqueta}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {valores.map((valor, i) => (
                      <Badge key={`${valor}-${i}`} variant="outline">
                        {valor}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}

              {estudios.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Formación</p>
                  <ul className="space-y-0.5 text-sm font-medium">
                    {estudios.map((e, i) => (
                      <li key={i}>
                        {String(e["estudio"] ?? "")}
                        {e["anios"] ? ` — ${String(e["anios"])}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {idiomasDetalle.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Idiomas (detalle)</p>
                  <ul className="space-y-0.5 text-sm font-medium">
                    {idiomasDetalle.map((l, i) => (
                      <li key={i}>
                        {String(l["idioma"] ?? "")}
                        {l["nivel"] ? ` — ${String(l["nivel"])}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {enlaces.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Enlaces adicionales</p>
                  <ul className="space-y-0.5 text-sm">
                    {enlaces.map((en, i) => (
                      <li key={i} className="break-words">
                        <a
                          href={String(en["url"] ?? "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary underline underline-offset-4"
                        >
                          {String(en["url"] ?? "")}
                        </a>
                        {en["descripcion"] ? (
                          <span className="text-muted-foreground"> — {String(en["descripcion"])}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Derecho al olvido */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">Eliminar datos del candidato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para solicitudes de borrado recibidas por otro canal (teléfono, email o
            WhatsApp). Se borran su ficha, sus fotos, su vídeo y todo su historial. Es
            definitivo y queda anotado en el registro de accesos.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmacion("");
              setDialogoBorrado(true);
            }}
          >
            Eliminar candidato y sus datos
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogoBorrado} onOpenChange={setDialogoBorrado}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar {nombreCompleto}</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se borran la ficha, los archivos y todas las
              filas asociadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmar_borrado_staff">Escribe ELIMINAR para confirmar</Label>
            <Input
              id="confirmar_borrado_staff"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="ELIMINAR"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogoBorrado(false)} disabled={borrando}>
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
