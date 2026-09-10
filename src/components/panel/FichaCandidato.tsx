import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const CAMPOS_PERFIL: { clave: string; etiqueta: string; tipo?: "bool" | "fecha" }[] = [
  { clave: "genero", etiqueta: "Género" },
  { clave: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha" },
  { clave: "dni", etiqueta: "DNI" },
  { clave: "tutor_nombre", etiqueta: "Tutor/a (nombre)" },
  { clave: "tutor_apellidos", etiqueta: "Tutor/a (apellidos)" },
  { clave: "tutor_dni", etiqueta: "Tutor/a (DNI)" },
  { clave: "pais_origen", etiqueta: "País de origen" },
  { clave: "color_piel", etiqueta: "Color de piel" },
  { clave: "color_cabello", etiqueta: "Color de cabello" },
  { clave: "color_ojos", etiqueta: "Color de ojos" },
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

export function FichaCandidato({ id }: { id: string }) {
  const obtenerFicha = useServerFn(obtenerFichaCandidatoStaff);
  const [candidato, setCandidato] = useState<CandidatoCompleto | null>(null);
  const [castings, setCastings] = useState<CastingAsociado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [guardandoDisponible, setGuardandoDisponible] = useState(false);

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
        setCandidato(resultado.candidato as CandidatoCompleto);
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
        <p className="text-lg font-semibold">Candidato no encontrado</p>
        <p className="text-sm text-muted-foreground">
          Es posible que la ficha se haya eliminado o que el enlace no sea correcto.
        </p>
        <Link to="/panel/candidatos" className="text-sm text-primary underline underline-offset-4">
          ← Volver al listado
        </Link>
      </div>
    );
  }

  const nombreCompleto = [candidato.nombre, candidato.apellidos].filter(Boolean).join(" ");
  const camposPerfilConValor = CAMPOS_PERFIL.filter(({ clave }) => {
    const v = candidato[clave];
    return v !== null && v !== undefined && v !== "";
  });

  return (
    <div className="space-y-6">
      <Link
        to="/panel/candidatos"
        className="inline-block text-sm text-muted-foreground underline underline-offset-4"
      >
        ← Volver al listado
      </Link>

      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={COLOR_CATEGORIA[candidato.categoria] ?? ""}>
              {ETIQUETA_CATEGORIA[candidato.categoria] ?? candidato.categoria}
            </Badge>
            <span className="font-mono text-sm text-muted-foreground">{candidato.codigo}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{nombreCompleto}</h2>
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
              {camposPerfilConValor.map(({ clave, etiqueta, tipo }) => {
                const bruto = candidato[clave];
                let valor: string;
                if (tipo === "bool") {
                  valor = bruto ? "Sí" : "No";
                } else if (tipo === "fecha") {
                  valor = formateaFecha(String(bruto));
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
        </CardContent>
      </Card>
    </div>
  );
}
