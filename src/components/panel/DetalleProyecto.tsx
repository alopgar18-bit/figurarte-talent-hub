import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, FileText, Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { asignarCandidatosAProyecto } from "@/lib/rgpd.functions";
import { registrarAccesoStaff } from "@/lib/registro-accesos.functions";
import { firmarFotosStaff } from "@/lib/fotos.functions";


type Brief = {
  categoria?: string;
  subtitulo?: string;
  fechas_rodaje?: string;
  ubicacion?: string;
  remuneracion?: string;
  requisitos?: string[];
  sobre_el_papel?: string;
  cierre_en?: string;
};

type Proyecto = {
  id: string;
  nombre: string;
  estado: string;
  publicado: boolean;
  slug_publico: string | null;
  cliente_id: string | null;
  brief_publico: Brief | null;
  campos_personalizados_activados: string[];
  creado_en: string;
};

type Candidato = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  altura_cm: number | null;
  peso_kg: number | null;
  edad: number | null;
  provincia: string | null;
  fotos: string[];
};

type Asociacion = {
  candidato_id: string;
  estado: string;
  origen: string;
  creado_en: string;
};

type Dossier = {
  id: string;
  slug_publico: string | null;
  fecha_caducidad: string | null;
  candidatos_incluidos: string[];
  creado_en: string;
};

type CampoPersonalizado = {
  id: string;
  nombre: string;
  tipo: string;
  categoria_aplicable: string | null;
};

const ESTADOS_PROYECTO = [
  { valor: "borrador", etiqueta: "Borrador" },
  { valor: "en_curso", etiqueta: "En curso" },
  { valor: "cerrado", etiqueta: "Cerrado" },
];

const ESTADOS_CANDIDATO = [
  { valor: "preseleccionado", etiqueta: "Preseleccionado" },
  { valor: "enviado", etiqueta: "Enviado" },
  { valor: "contratado", etiqueta: "Contratado" },
];

const CATEGORIAS = [
  { valor: "actor", etiqueta: "Actores" },
  { valor: "modelo", etiqueta: "Modelos" },
  { valor: "figurante", etiqueta: "Figurantes" },
  { valor: "casting_plus", etiqueta: "Casting Plus" },
];

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function Tarjeta({
  titulo,
  children,
  accion,
}: {
  titulo: string;
  children: React.ReactNode;
  accion?: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {titulo}
        </h3>
        {accion}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DetalleProyecto({ id }: { id: string }) {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string | null>(null);
  const [asociaciones, setAsociaciones] = useState<Asociacion[]>([]);
  const [candidatos, setCandidatos] = useState<Record<string, Candidato>>({});
  const [campos, setCampos] = useState<CampoPersonalizado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [brief, setBrief] = useState<Brief>({});
  const [guardandoBrief, setGuardandoBrief] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const [dialogoAnadir, setDialogoAnadir] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Candidato[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [dialogoDossier, setDialogoDossier] = useState(false);
  const asignar = useServerFn(asignarCandidatosAProyecto);
  const anotarAccesoStaff = useServerFn(registrarAccesoStaff);
  const firmarFotos = useServerFn(firmarFotosStaff);

  /** Las fotos se guardan como rutas privadas: hay que firmarlas para poder verlas. */
  async function conFotosFirmadas(lista: Candidato[]): Promise<Candidato[]> {
    const rutas = lista
      .map((c) => c.fotos?.[0])
      .filter(
        (f): f is string =>
          !!f && !/^https?:\/\//i.test(f) && !f.startsWith("placeholder://"),
      );
    if (rutas.length === 0) return lista;
    try {
      const mapa = await firmarFotos({ data: { rutas } });
      return lista.map((c) => {
        const primera = c.fotos?.[0];
        if (!primera || !mapa[primera]) return c;
        return { ...c, fotos: [mapa[primera], ...c.fotos.slice(1)] };
      });
    } catch {
      return lista;
    }
  }

  const [seleccionDossier, setSeleccionDossier] = useState<Record<string, boolean>>({});
  const [caducidadDossier, setCaducidadDossier] = useState("");
  const [generandoDossier, setGenerandoDossier] = useState(false);

  async function cargarDossier() {
    const { data } = await supabase
      .from("dossiers")
      .select("id,slug_publico,fecha_caducidad,candidatos_incluidos,creado_en")
      .eq("proyecto_id", id)
      .order("creado_en", { ascending: false })
      .limit(1);
    setDossier(((data ?? [])[0] as Dossier | undefined) ?? null);
  }

  function abrirDialogoDossier() {
    const marcados: Record<string, boolean> = {};
    for (const a of asociaciones) marcados[a.candidato_id] = true;
    setSeleccionDossier(marcados);
    const en14 = new Date(Date.now() + 14 * 86400000);
    setCaducidadDossier(en14.toISOString().slice(0, 10));
    setDialogoDossier(true);
  }

  /** Sufijo aleatorio: el enlace del dossier no debe ser adivinable. */
  function sufijoAleatorio(longitud = 8) {
    const alfabeto = "abcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(longitud));
    return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
  }

  function generarSlugDossier(base: string) {
    const raiz = slugify(base).slice(0, 40) || "dossier";
    return `${raiz}-${sufijoAleatorio()}`;
  }

  async function generarDossier() {
    const incluidos = Object.entries(seleccionDossier)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (incluidos.length === 0) {
      toast.error("Selecciona al menos un candidato.");
      return;
    }
    setGenerandoDossier(true);
    const base = [clienteNombre, proyecto?.nombre].filter(Boolean).join(" ");
    const slug = generarSlugDossier(base);
    const { data: sesion } = await supabase.auth.getUser();
    const { data, error: errIns } = await supabase
      .from("dossiers")
      .insert({
        proyecto_id: id,
        candidatos_incluidos: incluidos,
        slug_publico: slug,
        fecha_caducidad: caducidadDossier
          ? new Date(`${caducidadDossier}T23:59:59`).toISOString()
          : null,
        creado_por: sesion.user?.id ?? null,
      })
      .select("id,slug_publico,fecha_caducidad,candidatos_incluidos,creado_en")
      .maybeSingle();
    setGenerandoDossier(false);
    if (errIns || !data) {
      toast.error("No se pudo generar el dossier.");
      return;
    }
    setDossier(data as Dossier);
    setDialogoDossier(false);
    toast.success("Dossier generado.");
    // Registro mínimo de accesos (RGPD): informativo, no bloquea nada.
    void anotarAccesoStaff({
      data: {
        accion: "genero_dossier" as const,
        detalle: `${incluidos.length} candidatos · ${proyecto?.nombre ?? id}`,
      },
    }).catch(() => {});
    window.open(`/dossier/${slug}`, "_blank", "noopener");

  }

  async function cargarAsociaciones() {
    const { data } = await supabase
      .from("proyecto_candidatos")
      .select("candidato_id,estado,origen,creado_en")
      .eq("proyecto_id", id)
      .order("creado_en", { ascending: false });
    const filas = (data ?? []) as Asociacion[];
    setAsociaciones(filas);
    const ids = filas.map((f) => f.candidato_id);
    if (ids.length) {
      const { data: cands } = await supabase
        .from("candidatos")
        .select("id,codigo,nombre,categoria,altura_cm,peso_kg,edad,provincia,fotos")
        .in("id", ids);
      const firmados = await conFotosFirmadas((cands ?? []) as Candidato[]);
      const mapa: Record<string, Candidato> = {};
      for (const c of firmados) mapa[c.id] = c;
      setCandidatos(mapa);
    } else {
      setCandidatos({});
    }
  }

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      const { data, error: errProyecto } = await supabase
        .from("proyectos_casting")
        .select(
          "id,nombre,estado,publicado,slug_publico,cliente_id,brief_publico,campos_personalizados_activados,creado_en",
        )
        .eq("id", id)
        .maybeSingle();
      if (!activo) return;
      if (errProyecto || !data) {
        setError(errProyecto?.message ?? "No se encontró el proyecto.");
        setCargando(false);
        return;
      }
      const p = data as unknown as Proyecto;
      setProyecto(p);
      setNombre(p.nombre);
      setBrief((p.brief_publico ?? {}) as Brief);
      let fallo: string | null = null;
      if (p.cliente_id) {
        const { data: cli, error: errCli } = await supabase
          .from("clientes")
          .select("razon_social")
          .eq("id", p.cliente_id)
          .maybeSingle();
        if (errCli) fallo = "No se pudo cargar el cliente del proyecto. Reintenta.";
        if (activo) setClienteNombre(cli?.razon_social ?? null);
      }
      const { data: cp, error: errCampos } = await supabase
        .from("campos_personalizados")
        .select("id,nombre,tipo,categoria_aplicable")
        .order("nombre");
      if (errCampos) fallo = "No se pudieron cargar los campos personalizados. Reintenta.";
      if (activo) setCampos((cp ?? []) as CampoPersonalizado[]);
      await cargarAsociaciones();
      await cargarDossier();
      if (activo) {
        setError(fallo);
        setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function actualizar(cambios: Partial<Proyecto>) {
    const { error: errUpd } = await supabase
      .from("proyectos_casting")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(cambios as any)

      .eq("id", id);
    if (errUpd) {
      toast.error("No se pudo guardar el cambio.");
      return false;
    }
    setProyecto((prev) => (prev ? ({ ...prev, ...cambios } as Proyecto) : prev));
    return true;
  }

  async function guardarNombre() {
    if (!proyecto || !nombre.trim() || nombre.trim() === proyecto.nombre) return;
    const ok = await actualizar({ nombre: nombre.trim() });
    if (ok) toast.success("Nombre actualizado.");
  }

  async function generarSlugUnico(base: string) {
    const raiz = slugify(base) || "casting";
    const { data } = await supabase
      .from("proyectos_casting")
      .select("slug_publico")
      .not("slug_publico", "is", null);
    const usados = new Set((data ?? []).map((f) => f.slug_publico as string));
    if (!usados.has(raiz)) return raiz;
    let n = 2;
    while (usados.has(`${raiz}-${n}`)) n += 1;
    return `${raiz}-${n}`;
  }

  async function alternarPublicado(valor: boolean) {
    if (!proyecto) return;
    setPublicando(true);
    if (!valor) {
      await actualizar({ publicado: false });
      setPublicando(false);
      toast.success("Casting despublicado.");
      return;
    }
    let slug = proyecto.slug_publico;
    if (!slug) slug = await generarSlugUnico(proyecto.nombre);
    const ok = await actualizar({ publicado: true, slug_publico: slug });
    setPublicando(false);
    if (ok) toast.success("Casting publicado.");
  }

  async function guardarBrief() {
    setGuardandoBrief(true);
    const limpio: Brief = {
      ...brief,
      requisitos: (brief.requisitos ?? []).filter((r) => r.trim() !== ""),
    };
    const ok = await actualizar({ brief_publico: limpio });
    setGuardandoBrief(false);
    if (ok) toast.success("Brief guardado.");
  }

  async function alternarCampo(campoId: string, activo: boolean) {
    if (!proyecto) return;
    const actuales = proyecto.campos_personalizados_activados ?? [];
    const nuevos = activo
      ? [...new Set([...actuales, campoId])]
      : actuales.filter((c) => c !== campoId);
    await actualizar({ campos_personalizados_activados: nuevos });
  }

  async function buscarCandidatos(texto: string) {
    setBusqueda(texto);
    if (texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const patron = `%${texto.trim()}%`;
    const { data } = await supabase
      .from("candidatos")
      .select("id,codigo,nombre,categoria,altura_cm,peso_kg,edad,provincia,fotos")
      .or(`nombre.ilike.${patron},codigo.ilike.${patron}`)
      .limit(20);
    setResultados(await conFotosFirmadas((data ?? []) as Candidato[]));
    setBuscando(false);
  }

  async function anadirCandidato(candidato: Candidato) {
    if (asociaciones.some((a) => a.candidato_id === candidato.id)) {
      toast.info("Ese candidato ya está en el proyecto.");
      return;
    }
    let res;
    try {
      res = await asignar({ data: { proyectoId: id, candidatoIds: [candidato.id] } });
    } catch {
      toast.error("No se pudo añadir el candidato.");
      return;
    }
    if (res.bloqueados.length) {
      toast.warning(
        `${candidato.nombre} no tiene el consentimiento RGPD firmado. Se le ha avisado para que lo complete; se añadirá automáticamente al proyecto en cuanto lo haga.`,
        { duration: 10000 },
      );
      return;
    }
    toast.success(`${candidato.nombre} añadido.`);
    await cargarAsociaciones();
  }

  async function cambiarEstadoCandidato(candidatoId: string, estado: string) {
    const { error: errUpd } = await supabase
      .from("proyecto_candidatos")
      .update({ estado: estado as "preseleccionado" | "enviado" | "contratado" })

      .eq("proyecto_id", id)
      .eq("candidato_id", candidatoId);
    if (errUpd) {
      toast.error("No se pudo cambiar el estado.");
      return;
    }
    setAsociaciones((prev) =>
      prev.map((a) => (a.candidato_id === candidatoId ? { ...a, estado } : a)),
    );
  }

  const manuales = useMemo(
    () => asociaciones.filter((a) => a.origen === "manual"),
    [asociaciones],
  );
  const web = useMemo(
    () => asociaciones.filter((a) => a.origen === "web_directa"),
    [asociaciones],
  );

  const camposAplicables = useMemo(() => {
    const cat = brief.categoria;
    return campos.filter((c) => !c.categoria_aplicable || c.categoria_aplicable === cat);
  }, [campos, brief.categoria]);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando proyecto…
      </div>
    );
  }

  if (error || !proyecto) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link to="/panel/proyectos">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a proyectos
          </Link>
        </Button>
      </div>
    );
  }

  const enlacePublico = proyecto.slug_publico ? `/casting/${proyecto.slug_publico}` : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/panel/proyectos">
          <ArrowLeft className="mr-2 h-4 w-4" /> Proyectos
        </Link>
      </Button>

      <header className="border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={guardarNombre}
              className="h-auto border-0 bg-transparent px-0 text-xl font-black tracking-tight shadow-none focus-visible:ring-0 sm:text-2xl"
            />
            <p className="text-sm text-muted-foreground">
              {clienteNombre ?? "Sin cliente"} · Creado el{" "}
              {new Date(proyecto.creado_en).toLocaleDateString("es-ES")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={proyecto.estado}
              onValueChange={(v) => actualizar({ estado: v })}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_PROYECTO.map((e) => (
                  <SelectItem key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dossier?.slug_publico ? (
              <div className="flex flex-col gap-1 sm:items-end">
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a
                      href={`/dossier/${dossier.slug_publico}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="mr-2 h-4 w-4" /> Ver dossier
                    </a>
                  </Button>
                  <Button variant="ghost" onClick={abrirDialogoDossier}>
                    Regenerar
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {dossier.fecha_caducidad
                    ? `Caduca el ${new Date(dossier.fecha_caducidad).toLocaleDateString("es-ES")}`
                    : "Sin caducidad"}
                </span>
              </div>
            ) : (
              <Button variant="outline" onClick={abrirDialogoDossier}>
                <FileText className="mr-2 h-4 w-4" /> Generar dossier
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="publicado"
              checked={proyecto.publicado}
              disabled={publicando}
              onCheckedChange={alternarPublicado}
            />
            <Label htmlFor="publicado" className="cursor-pointer">
              Publicado
            </Label>
          </div>
          {proyecto.publicado && enlacePublico && (
            <div className="flex min-w-0 items-center gap-2">
              <code className="truncate bg-muted px-2 py-1 text-xs">{enlacePublico}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}${enlacePublico}`,
                  );
                  toast.success("Enlace copiado.");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <Tarjeta
        titulo="Brief público"
        accion={
          <Button size="sm" onClick={guardarBrief} disabled={guardandoBrief}>
            {guardandoBrief && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar brief
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={brief.categoria ?? "actor"}
              onValueChange={(v) => setBrief((b) => ({ ...b, categoria: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitulo">Subtítulo</Label>
            <Input
              id="subtitulo"
              value={brief.subtitulo ?? ""}
              onChange={(e) => setBrief((b) => ({ ...b, subtitulo: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechas">Fechas de rodaje</Label>
            <Input
              id="fechas"
              value={brief.fechas_rodaje ?? ""}
              onChange={(e) => setBrief((b) => ({ ...b, fechas_rodaje: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input
              id="ubicacion"
              value={brief.ubicacion ?? ""}
              onChange={(e) => setBrief((b) => ({ ...b, ubicacion: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remuneracion">Remuneración</Label>
            <Input
              id="remuneracion"
              value={brief.remuneracion ?? ""}
              onChange={(e) => setBrief((b) => ({ ...b, remuneracion: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cierre">Cierre de inscripción</Label>
            <Input
              id="cierre"
              type="date"
              value={brief.cierre_en ? brief.cierre_en.slice(0, 10) : ""}
              onChange={(e) => setBrief((b) => ({ ...b, cierre_en: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Requisitos</Label>
          <div className="space-y-2">
            {(brief.requisitos ?? []).map((req, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={req}
                  onChange={(e) =>
                    setBrief((b) => {
                      const lista = [...(b.requisitos ?? [])];
                      lista[i] = e.target.value;
                      return { ...b, requisitos: lista };
                    })
                  }
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setBrief((b) => ({
                      ...b,
                      requisitos: (b.requisitos ?? []).filter((_, j) => j !== i),
                    }))
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setBrief((b) => ({ ...b, requisitos: [...(b.requisitos ?? []), ""] }))
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Añadir requisito
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="sobre">Sobre el papel</Label>
          <Textarea
            id="sobre"
            rows={5}
            value={brief.sobre_el_papel ?? ""}
            onChange={(e) => setBrief((b) => ({ ...b, sobre_el_papel: e.target.value }))}
          />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Campos personalizados activados">
        {camposAplicables.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay campos personalizados aplicables. Créalos en Administración.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {camposAplicables.map((c) => {
              const activo = (proyecto.campos_personalizados_activados ?? []).includes(
                c.id,
              );
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 border border-border p-3 text-sm"
                >
                  <Checkbox
                    checked={activo}
                    onCheckedChange={(v) => alternarCampo(c.id, v === true)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.nombre}</span>
                    <span className="text-xs text-muted-foreground">{c.tipo}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Candidatos preseleccionados"
        accion={
          <Button size="sm" onClick={() => setDialogoAnadir(true)}>
            <Plus className="mr-2 h-4 w-4" /> Añadir candidato
          </Button>
        }
      >
        {manuales.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no has añadido candidatos a este proyecto.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {manuales.map((a) => {
              const c = candidatos[a.candidato_id];
              if (!c) return null;
              return (
                <div key={a.candidato_id} className="border border-border p-3">
                  <Link
                    to="/panel/candidatos/$id"
                    params={{ id: a.candidato_id }}
                    search={{ desde: id }}
                    className="flex items-start gap-3 transition-opacity hover:opacity-80"
                  >
                    {c.fotos?.[0] ? (
                      <img
                        src={c.fotos[0]}
                        alt={c.nombre}
                        className="h-16 w-12 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-12 shrink-0 items-center justify-center bg-muted text-lg font-bold tracking-tight text-muted-foreground">
                        {c.nombre.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.codigo}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          c.edad ? `${c.edad} años` : null,
                          c.altura_cm ? `${c.altura_cm} cm` : null,
                          c.peso_kg ? `${c.peso_kg} kg` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Sin medidas"}
                      </p>
                    </div>
                  </Link>
                  <Select
                    value={a.estado}
                    onValueChange={(v) => cambiarEstadoCandidato(a.candidato_id, v)}
                  >
                    <SelectTrigger className="mt-3 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_CANDIDATO.map((e) => (
                        <SelectItem key={e.valor} value={e.valor}>
                          {e.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Inscritos por la web">
        {web.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay inscripciones desde la ficha pública.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Código</th>
                  <th className="px-3 py-2 font-semibold">Nombre</th>
                  <th className="px-3 py-2 font-semibold">Inscripción</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {web.map((a) => {
                  const c = candidatos[a.candidato_id];
                  return (
                    <tr key={a.candidato_id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{c?.codigo ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{c?.nombre ?? "—"}</span>
                          {a.estado === "preseleccionado" && (
                            <Badge className="h-5 px-1.5 text-[10px]">nuevo</Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(a.creado_en).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={a.estado}
                          onValueChange={(v) => cambiarEstadoCandidato(a.candidato_id, v)}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_CANDIDATO.map((e) => (
                              <SelectItem key={e.valor} value={e.valor}>
                                {e.etiqueta}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <Dialog open={dialogoDossier} onOpenChange={setDialogoDossier}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generar dossier</DialogTitle>
            <DialogDescription>
              Elige qué candidatos incluir y hasta cuándo estará disponible el enlace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 space-y-2 overflow-y-auto border border-border p-3">
              {asociaciones.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Este proyecto todavía no tiene candidatos asociados.
                </p>
              )}
              {asociaciones.map((a) => {
                const c = candidatos[a.candidato_id];
                if (!c) return null;
                return (
                  <label
                    key={a.candidato_id}
                    className="flex cursor-pointer items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={!!seleccionDossier[a.candidato_id]}
                      onCheckedChange={(v) =>
                        setSeleccionDossier((prev) => ({
                          ...prev,
                          [a.candidato_id]: v === true,
                        }))
                      }
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.codigo} · {a.estado}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="caducidad">Fecha de caducidad</Label>
              <Input
                id="caducidad"
                type="date"
                value={caducidadDossier}
                onChange={(e) => setCaducidadDossier(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={generarDossier}
              disabled={generandoDossier || asociaciones.length === 0}
            >
              {generandoDossier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar y abrir dossier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoAnadir} onOpenChange={setDialogoAnadir}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Añadir candidato</DialogTitle>
            <DialogDescription>Busca por nombre o código (FIG-00001).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="pl-9"
                value={busqueda}
                onChange={(e) => buscarCandidatos(e.target.value)}
                placeholder="Nombre o código…"
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {buscando && (
                <p className="text-sm text-muted-foreground">Buscando…</p>
              )}
              {!buscando && busqueda.trim().length >= 2 && resultados.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin resultados.</p>
              )}
              {resultados.map((c) => {
                const yaEsta = asociaciones.some((a) => a.candidato_id === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={yaEsta}
                    onClick={() => anadirCandidato(c)}
                    className={cn(
                      "flex w-full items-center justify-between border border-border p-3 text-left text-sm",
                      yaEsta ? "opacity-50" : "hover:bg-muted/50",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.codigo} · {c.categoria}
                        {c.provincia ? ` · ${c.provincia}` : ""}
                      </span>
                    </span>
                    {yaEsta ? (
                      <Check className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
