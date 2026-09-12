import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Inbox,
  TrendingUp,
  Users,
  Clapperboard,
  Building2,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import {
  listarCandidatosPorRevisar,
  listarInscripcionesPendientes,
  decidirVisibilidadPublica,
  type CandidatoPorRevisar,
  type InscripcionPendiente,
} from "@/lib/dashboard-revision.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Solicitud = {
  id: string;
  cliente_id: string;
  nombre_proyecto: string;
  categoria: string;
  num_candidatos_aprox: number | null;
  descripcion: string | null;
  fecha_necesaria: string | null;
  recibida_en: string;
};

type Cliente = { id: string; razon_social: string };
type Proyecto = { id: string; nombre: string; cliente_id: string | null; estado: string };

function cuandoLlego(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  const mismoDia = d.toDateString() === hoy.toDateString();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (mismoDia) return `Hoy ${hora}`;
  if (d.toDateString() === ayer.toDateString()) return `Ayer ${hora}`;
  return d.toLocaleDateString("es-ES");
}

function slugCanal(canal: string) {
  const c = canal.toLowerCase();
  if (c.includes("insta") || c === "ig") return "Instagram";
  if (c.includes("whats") || c === "wa") return "WhatsApp";
  if (c.includes("web")) return "Web";
  return canal;
}

function Kpi({
  titulo,
  valor,
  detalle,
  icono: Icono,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: typeof Users;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {titulo}
        </p>
        <Icono className="size-4 shrink-0 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [candidatos, setCandidatos] = useState<{ id: string; creado_en: string }[]>([]);
  const [asignaciones, setAsignaciones] = useState<
    { candidato_id: string; proyecto_id: string }[]
  >([]);
  const [canales, setCanales] = useState<string[]>([]);

  const [seleccion, setSeleccion] = useState<Solicitud | null>(null);
  const [convirtiendo, setConvirtiendo] = useState(false);

  async function cargar() {
    setCargando(true);
    const [sol, cli, pro, can, asg, reg] = await Promise.all([
      supabase
        .from("solicitudes_proyecto")
        .select(
          "id,cliente_id,nombre_proyecto,categoria,num_candidatos_aprox,descripcion,fecha_necesaria,recibida_en",
        )
        .eq("estado", "pendiente")
        .order("recibida_en", { ascending: false }),
      supabase.from("clientes").select("id,razon_social"),
      supabase.from("proyectos_casting").select("id,nombre,cliente_id,estado"),
      supabase.from("candidatos").select("id,creado_en"),
      supabase.from("proyecto_candidatos").select("candidato_id,proyecto_id"),
      supabase.from("registros_captacion").select("canal"),
    ]);

    if (sol.error || cli.error || pro.error || can.error) {
      setError("No se pudieron cargar todos los datos del dashboard.");
    } else {
      setError(null);
    }
    setSolicitudes((sol.data ?? []) as Solicitud[]);
    setClientes((cli.data ?? []) as Cliente[]);
    setProyectos((pro.data ?? []) as Proyecto[]);
    setCandidatos(can.data ?? []);
    setAsignaciones(asg.data ?? []);
    setCanales((reg.data ?? []).map((r) => r.canal));
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const nombreCliente = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clientes) m[c.id] = c.razon_social;
    return m;
  }, [clientes]);

  const kpis = useMemo(() => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const esteMes = candidatos.filter(
      (c) => new Date(c.creado_en).getTime() >= inicioMes.getTime(),
    ).length;
    const enShortlist = new Set(asignaciones.map((a) => a.candidato_id)).size;
    const conversion = candidatos.length
      ? Math.round((enShortlist / candidatos.length) * 100)
      : 0;
    const activos = proyectos.filter((p) => p.estado === "en_curso");
    const clientesActivos = new Set(
      activos.map((p) => p.cliente_id).filter((x): x is string => !!x),
    ).size;
    return {
      esteMes,
      conversion,
      enShortlist,
      totalCandidatos: candidatos.length,
      activos,
      clientesActivos,
    };
  }, [candidatos, asignaciones, proyectos]);

  const porCanal = useMemo(() => {
    if (canales.length === 0) return [];
    const conteo: Record<string, number> = {};
    for (const c of canales) {
      const k = slugCanal(c);
      conteo[k] = (conteo[k] ?? 0) + 1;
    }
    return Object.entries(conteo)
      .map(([canal, n]) => ({
        canal,
        n,
        pct: Math.round((n / canales.length) * 100),
      }))
      .sort((a, b) => b.n - a.n);
  }, [canales]);

  const candidatosPorProyecto = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of asignaciones) m[a.proyecto_id] = (m[a.proyecto_id] ?? 0) + 1;
    return m;
  }, [asignaciones]);

  async function convertir(s: Solicitud) {
    setConvirtiendo(true);
    const { data, error: errIns } = await supabase
      .from("proyectos_casting")
      .insert({
        nombre: s.nombre_proyecto,
        cliente_id: s.cliente_id,
        estado: "borrador",
        brief_publico: {
          categoria: s.categoria,
          sobre_el_papel: s.descripcion ?? "",
        },
      })
      .select("id")
      .maybeSingle();

    if (errIns || !data) {
      setConvirtiendo(false);
      toast.error("No se pudo crear el proyecto.");
      return;
    }

    const { error: errUpd } = await supabase
      .from("solicitudes_proyecto")
      .update({ estado: "convertida" })
      .eq("id", s.id);
    if (errUpd) toast.warning("Proyecto creado, pero la solicitud sigue como pendiente.");

    setConvirtiendo(false);
    setSeleccion(null);
    toast.success("Proyecto creado a partir de la solicitud.");
    navigate({ to: "/panel/proyectos/$id", params: { id: data.id } });
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
          {error}
        </p>
      )}

      {/* Bandeja de solicitudes */}
      <section
        className={
          solicitudes.length
            ? "border-2 border-primary bg-card p-4 sm:p-5"
            : "border border-border bg-card p-4 sm:p-5"
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Inbox className="size-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Solicitudes pendientes</h2>
          {solicitudes.length > 0 && (
            <Badge className="bg-primary text-primary-foreground">{solicitudes.length}</Badge>
          )}
        </div>

        {solicitudes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No hay solicitudes pendientes ahora mismo.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {solicitudes.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {nombreCliente[s.cliente_id] ?? "Cliente"}
                  </p>
                  <p className="truncate text-sm text-foreground">{s.nombre_proyecto}</p>
                  <p className="text-xs text-muted-foreground">{cuandoLlego(s.recibida_en)}</p>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => setSeleccion(s)}>
                  Revisar y comenzar captación
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo="Captados este mes"
          valor={String(kpis.esteMes)}
          detalle={`${kpis.totalCandidatos} candidatos en total`}
          icono={Users}
        />
        <Kpi
          titulo="Candidatura → shortlist"
          valor={`${kpis.conversion}%`}
          detalle={`${kpis.enShortlist} de ${kpis.totalCandidatos} en algún proyecto`}
          icono={TrendingUp}
        />
        <Kpi
          titulo="Proyectos activos"
          valor={String(kpis.activos.length)}
          detalle="Castings en curso"
          icono={Clapperboard}
        />
        <Kpi
          titulo="Clientes con proyecto"
          valor={String(kpis.clientesActivos)}
          detalle="Con al menos un casting en curso"
          icono={Building2}
        />
      </section>

      {/* Captación por canal */}
      <section className="border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-foreground">Captación por canal</h2>
        {porCanal.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Todavía no hay registros de captación desde enlaces de redes sociales.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {porCanal.map((c) => (
              <div key={c.canal} className="border border-border p-4">
                <p className="text-sm font-medium text-foreground">{c.canal}</p>
                <p className="mt-1 text-2xl font-bold text-primary">{c.pct}%</p>
                <p className="text-xs text-muted-foreground">{c.n} registros</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Proyectos activos por cliente */}
      <section className="border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-foreground">Proyectos activos por cliente</h2>
        {kpis.activos.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No hay proyectos en curso.</p>
        ) : (
          <div className="mt-4 -mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Proyecto</th>
                  <th className="px-4 py-2 font-medium">Candidatos presentados</th>
                </tr>
              </thead>
              <tbody>
                {kpis.activos.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-foreground">
                      {p.cliente_id ? (nombreCliente[p.cliente_id] ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-2 text-foreground">{p.nombre}</td>
                    <td className="px-4 py-2 text-foreground">
                      {candidatosPorProyecto[p.id] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={!!seleccion} onOpenChange={(v) => !v && setSeleccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comenzar captación</DialogTitle>
            <DialogDescription>
              Se creará un proyecto en borrador con los datos de la solicitud.
            </DialogDescription>
          </DialogHeader>
          {seleccion && (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Cliente</dt>
                <dd className="text-foreground">
                  {nombreCliente[seleccion.cliente_id] ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Proyecto</dt>
                <dd className="text-foreground">{seleccion.nombre_proyecto}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Categoría</dt>
                <dd className="text-foreground">{seleccion.categoria}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Nº aproximado</dt>
                <dd className="text-foreground">{seleccion.num_candidatos_aprox ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Fecha necesaria</dt>
                <dd className="text-foreground">
                  {seleccion.fecha_necesaria
                    ? new Date(seleccion.fecha_necesaria).toLocaleDateString("es-ES")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Descripción</dt>
                <dd className="whitespace-pre-wrap text-foreground">
                  {seleccion.descripcion || "—"}
                </dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeleccion(null)}>
              Cancelar
            </Button>
            <Button
              disabled={convirtiendo}
              onClick={() => seleccion && convertir(seleccion)}
            >
              {convirtiendo && <Loader2 className="size-4 animate-spin" />}
              Crear proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
