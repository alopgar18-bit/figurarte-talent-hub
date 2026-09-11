import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Columns3,
  Download,
  FolderPlus,
  Loader2,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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


type Candidato = Record<string, unknown> & {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  altura_cm: number | null;
  ciudad: string | null;
  provincia: string | null;
  edad: number | null;
  disponible: boolean;
};

type Proyecto = { id: string; nombre: string; creado_en: string };

type ColumnaId =
  | "codigo"
  | "nombre"
  | "categoria"
  | "altura_cm"
  | "ciudad"
  | "disponible"
  | "antiguedad"
  | "provincia"
  | "edad";

const COLUMNAS: { id: ColumnaId; etiqueta: string; pordefecto: boolean }[] = [
  { id: "codigo", etiqueta: "Código", pordefecto: true },
  { id: "nombre", etiqueta: "Nombre", pordefecto: true },
  { id: "categoria", etiqueta: "Categoría", pordefecto: true },
  { id: "altura_cm", etiqueta: "Altura", pordefecto: true },
  { id: "ciudad", etiqueta: "Ciudad", pordefecto: true },
  { id: "disponible", etiqueta: "Disponible", pordefecto: true },
  { id: "antiguedad", etiqueta: "En la base desde", pordefecto: true },
  { id: "provincia", etiqueta: "Provincia", pordefecto: false },
  { id: "edad", etiqueta: "Edad", pordefecto: false },
];

const ETIQUETA_CATEGORIA: Record<string, string> = {
  actor: "Actor",
  modelo: "Modelo",
  figurante: "Figurante",
  casting_plus: "Casting Plus",
};

const COLOR_CATEGORIA: Record<string, string> = {
  actor: "bg-primary/15 text-primary border-primary/30",
  modelo: "bg-[oklch(0.35_0.15_270_/_0.15)] text-[oklch(0.42_0.17_270)] border-[oklch(0.42_0.17_270_/_0.3)]",
  figurante: "bg-muted text-foreground border-border",
  casting_plus: "bg-accent text-accent-foreground border-border",
};

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

/** Filtro desplegable con selección múltiple (casillas). */
function MultiSelect({
  etiqueta,
  opciones,
  seleccionados,
  alCambiar,
}: {
  etiqueta: string;
  opciones: { valor: string; etiqueta: string }[];
  seleccionados: string[];
  alCambiar: (valores: string[]) => void;
}) {
  function alternar(valor: string) {
    alCambiar(
      seleccionados.includes(valor)
        ? seleccionados.filter((v) => v !== valor)
        : [...seleccionados, valor],
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between">
          {etiqueta}
          {seleccionados.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {seleccionados.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{etiqueta}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opciones.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.valor}
            checked={seleccionados.includes(o.valor)}
            onCheckedChange={() => alternar(o.valor)}
            onSelect={(e) => e.preventDefault()}
          >
            {o.etiqueta}
          </DropdownMenuCheckboxItem>
        ))}
        {seleccionados.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={() => alCambiar([])}
              onSelect={(e) => e.preventDefault()}
            >
              Limpiar selección
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Tiempo transcurrido desde el alta, para vigilar la retención de datos. */
function antiguedad(valor: unknown): string {
  if (typeof valor !== "string") return "—";
  const alta = new Date(valor);
  if (Number.isNaN(alta.getTime())) return "—";
  const dias = Math.floor((Date.now() - alta.getTime()) / 86400000);
  if (dias < 1) return "Hoy";
  if (dias < 30) return `${dias} día${dias === 1 ? "" : "s"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 24) return `${meses} mes${meses === 1 ? "" : "es"}`;
  return `${Math.floor(dias / 365)} años`;
}

function valorCelda(c: Candidato, col: ColumnaId) {
  switch (col) {
    case "categoria":
      return ETIQUETA_CATEGORIA[c.categoria] ?? c.categoria;
    case "altura_cm":
      return c.altura_cm ? `${c.altura_cm} cm` : "—";
    case "disponible":
      return c.disponible ? "Sí" : "No";
    case "antiguedad":
      return antiguedad(c["creado_en"]);
    default:
      return (c[col] as string | number | null) ?? "—";
  }
}


export function ListadoCandidatos() {
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<string[]>([]);
  const [disponibleSi, setDisponibleSi] = useState(false);
  const [disponibleNo, setDisponibleNo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [avanzados, setAvanzados] = useState(false);
  const [provinciasSel, setProvinciasSel] = useState<string[]>([]);
  const [generosSel, setGenerosSel] = useState<string[]>([]);
  const [idiomas, setIdiomas] = useState("");
  const [rangos, setRangos] = useState({
    edadMin: "",
    edadMax: "",
    alturaMin: "",
    alturaMax: "",
    pesoMin: "",
    pesoMax: "",
  });

  const [visibles, setVisibles] = useState<ColumnaId[]>(
    COLUMNAS.filter((c) => c.pordefecto).map((c) => c.id),
  );
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [proyectoDestino, setProyectoDestino] = useState("");
  const [asignando, setAsignando] = useState(false);
  const asignar = useServerFn(asignarCandidatosAProyecto);
  const anotar = useServerFn(registrarAccesoStaff);

  const [aviso, setAviso] = useState<string | null>(null);
  const [dialogoExport, setDialogoExport] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: cands, error: e1 }, { data: proys }] = await Promise.all([
        supabase.from("candidatos").select("*").order("codigo", { ascending: true }),
        supabase
          .from("proyectos_casting")
          .select("id, nombre, creado_en")
          .order("creado_en", { ascending: false }),
      ]);
      if (e1) setError("No se han podido cargar los candidatos.");
      setCandidatos((cands ?? []) as Candidato[]);
      setProyectos((proys ?? []) as Proyecto[]);
      setCargando(false);
    })();
  }, []);

  const provincias = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidatos) if (c.provincia) set.add(c.provincia);
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [candidatos]);

  const generos = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidatos) {
      const g = c["genero"];
      if (typeof g === "string" && g.trim()) set.add(g.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [candidatos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const qIdiomas = idiomas.trim().toLowerCase();
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    const enRango = (valor: unknown, min: string, max: string) => {
      const lo = num(min);
      const hi = num(max);
      if (lo === null && hi === null) return true;
      if (typeof valor !== "number") return false;
      if (lo !== null && valor < lo) return false;
      if (hi !== null && valor > hi) return false;
      return true;
    };
    return candidatos.filter((c) => {
      if (categorias.length > 0 && !categorias.includes(c.categoria)) return false;
      if (disponibleSi && !disponibleNo && !c.disponible) return false;
      if (disponibleNo && !disponibleSi && c.disponible) return false;
      if (q && !`${c.nombre} ${c.codigo}`.toLowerCase().includes(q)) return false;
      if (provinciasSel.length > 0 && (!c.provincia || !provinciasSel.includes(c.provincia)))
        return false;
      if (generosSel.length > 0 && !generosSel.includes(String(c["genero"] ?? "")))
        return false;
      if (
        qIdiomas &&
        !String(c["idiomas"] ?? "")
          .toLowerCase()
          .includes(qIdiomas)
      )
        return false;
      if (!enRango(c.edad, rangos.edadMin, rangos.edadMax)) return false;
      if (!enRango(c.altura_cm, rangos.alturaMin, rangos.alturaMax)) return false;
      if (!enRango(c["peso_kg"], rangos.pesoMin, rangos.pesoMax)) return false;
      return true;
    });
  }, [
    candidatos,
    categoria,
    disponibilidad,
    busqueda,
    provincia,
    genero,
    idiomas,
    rangos,
  ]);

  const idsFiltrados = filtrados.map((c) => c.id);
  const seleccionados = seleccion.filter((id) => idsFiltrados.includes(id));
  const todosMarcados = filtrados.length > 0 && seleccionados.length === filtrados.length;

  const columnasVisibles = COLUMNAS.filter((c) => visibles.includes(c.id));

  function alternarFila(id: string) {
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function exportar(modo: "visibles" | "todos") {
    const base = seleccionados.length
      ? filtrados.filter((c) => seleccionados.includes(c.id))
      : filtrados;
    const filas = base.map((c) => {
      if (modo === "visibles") {
        const fila: Record<string, unknown> = {};
        for (const col of columnasVisibles) fila[col.etiqueta] = valorCelda(c, col.id);
        return fila;
      }
      const fila: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(c)) {
        fila[k] = Array.isArray(v) || (v && typeof v === "object") ? JSON.stringify(v) : v;
      }
      return fila;
    });
    const XLSX = await import("xlsx");
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Candidatos");
    XLSX.writeFile(libro, `candidatos-figurarte-${hoy()}.xlsx`);
    // Registro mínimo de accesos (RGPD): informativo, no bloquea la descarga.
    void anotar({
      data: { accion: "exporto_excel" as const, detalle: `${base.length} candidatos` },
    }).catch(() => {});
    setDialogoExport(false);

  }

  async function asignarAProyecto() {
    if (!proyectoDestino || seleccionados.length === 0) return;
    setAsignando(true);
    setAviso(null);
    try {
      const res = await asignar({
        data: { proyectoId: proyectoDestino, candidatoIds: seleccionados },
      });
      const partes = [`${res.asignados} candidato(s) asignado(s)`];
      if (res.yaEstaban) partes.push(`${res.yaEstaban} ya estaban en el proyecto`);
      if (res.bloqueados.length) {
        partes.push(
          `${res.bloqueados.length} sin consentimiento RGPD firmado (${res.bloqueados
            .map((b) => b.nombre)
            .join(", ")}): se les ha avisado para que lo completen y se añadirán automáticamente al proyecto en cuanto lo hagan`,
        );
      }
      setAviso(`${partes.join(". ")}.`);
    } catch {
      setAviso("No se han podido asignar los candidatos.");
    }
    setAsignando(false);
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando candidatos…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black tracking-tight">Base de candidatos</h1>
        <p className="text-sm text-muted-foreground">
          {filtrados.length} de {candidatos.length} candidatos
        </p>
      </div>

      {error && <p className="border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código"
            className="pl-9"
            aria-label="Buscar candidatos"
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-[170px]" aria-label="Categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {Object.entries(ETIQUETA_CATEGORIA).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={disponibilidad} onValueChange={setDisponibilidad}>
          <SelectTrigger className="w-[170px]" aria-label="Disponibilidad">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="disponibles">Disponibles</SelectItem>
            <SelectItem value="no_disponibles">No disponibles</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Columns3 className="size-4" /> Columnas visibles
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNAS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visibles.includes(col.id)}
                onCheckedChange={(v) =>
                  setVisibles((s) =>
                    v ? [...s, col.id] : s.filter((x) => x !== col.id),
                  )
                }
                onSelect={(e) => e.preventDefault()}
              >
                {col.etiqueta}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={() => setDialogoExport(true)}>
          <Download className="size-4" /> Exportar a Excel
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/panel/candidatos/importar" })}>
          <Upload className="size-4" /> Importar candidatos
        </Button>
        <Button variant="outline" onClick={() => setAvanzados((v) => !v)}>
          <SlidersHorizontal className="size-4" />
          {avanzados ? "Ocultar filtros" : "Filtros avanzados"}
        </Button>
      </div>

      {avanzados && (
        <div className="space-y-4 border border-border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Provincia</Label>
              <Select value={provincia} onValueChange={setProvincia}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {provincias.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Género</Label>
              <Select value={genero} onValueChange={setGenero}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {generos.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="f-idiomas">Idiomas</Label>
              <Input
                id="f-idiomas"
                value={idiomas}
                onChange={(e) => setIdiomas(e.target.value)}
                placeholder="inglés, francés…"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                { etiqueta: "Edad", min: "edadMin", max: "edadMax", unidad: "años" },
                { etiqueta: "Altura", min: "alturaMin", max: "alturaMax", unidad: "cm" },
                { etiqueta: "Peso", min: "pesoMin", max: "pesoMax", unidad: "kg" },
              ] as const
            ).map((r) => (
              <div key={r.etiqueta} className="space-y-1.5">
                <Label>
                  {r.etiqueta} ({r.unidad})
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Mín."
                    value={rangos[r.min]}
                    onChange={(e) => setRangos((s) => ({ ...s, [r.min]: e.target.value }))}
                    aria-label={`${r.etiqueta} mínima`}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Máx."
                    value={rangos[r.max]}
                    onChange={(e) => setRangos((s) => ({ ...s, [r.max]: e.target.value }))}
                    aria-label={`${r.etiqueta} máxima`}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setProvincia("todas");
              setGenero("todos");
              setIdiomas("");
              setRangos({
                edadMin: "",
                edadMax: "",
                alturaMin: "",
                alturaMax: "",
                pesoMin: "",
                pesoMax: "",
              });
            }}
          >
            Limpiar filtros avanzados
          </Button>
        </div>
      )}

      {seleccionados.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border border-border bg-muted/40 p-3">
          <span className="text-sm font-medium">
            {seleccionados.length} seleccionado{seleccionados.length > 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Select
              value={proyectoDestino}
              onValueChange={setProyectoDestino}
              disabled={proyectos.length === 0}
            >
              <SelectTrigger className="w-[220px]" aria-label="Asignar a proyecto">
                <SelectValue
                  placeholder={
                    proyectos.length ? "Asignar a proyecto…" : "No hay proyectos creados"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {proyectos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={asignarAProyecto}
              disabled={!proyectoDestino || proyectos.length === 0 || asignando}
            >
              {asignando ? <Loader2 className="size-4 animate-spin" /> : <FolderPlus className="size-4" />}
              Asignar
            </Button>
            <Button variant="outline" onClick={() => setDialogoExport(true)}>
              <Download className="size-4" /> Exportar selección
            </Button>
          </div>
          {aviso && <p className="w-full text-sm text-muted-foreground">{aviso}</p>}
        </div>
      )}

      <div className="w-full max-w-full overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-10 p-3">
                <Checkbox
                  checked={todosMarcados}
                  onCheckedChange={(v) =>
                    setSeleccion(v ? idsFiltrados : [])
                  }
                  aria-label="Seleccionar todos"
                />
              </th>
              {columnasVisibles.map((col) => (
                <th key={col.id} className="whitespace-nowrap p-3 text-left font-semibold">
                  {col.etiqueta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate({ to: "/panel/candidatos/$id", params: { id: c.id } })}
                className="cursor-pointer border-t border-border hover:bg-muted/40"
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={seleccion.includes(c.id)}
                    onCheckedChange={() => alternarFila(c.id)}
                    aria-label={`Seleccionar ${c.nombre}`}
                  />
                </td>
                {columnasVisibles.map((col) => (
                  <td key={col.id} className="whitespace-nowrap p-3">
                    {col.id === "categoria" ? (
                      <Badge variant="outline" className={cn("font-medium", COLOR_CATEGORIA[c.categoria])}>
                        {ETIQUETA_CATEGORIA[c.categoria] ?? c.categoria}
                      </Badge>
                    ) : (
                      valorCelda(c, col.id)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td
                  colSpan={columnasVisibles.length + 1}
                  className="p-8 text-center text-sm text-muted-foreground"
                >
                  No hay candidatos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogoExport} onOpenChange={setDialogoExport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar a Excel</DialogTitle>
            <DialogDescription>
              Se exportarán{" "}
              {seleccionados.length
                ? `${seleccionados.length} candidato(s) seleccionado(s)`
                : `${filtrados.length} candidato(s) del filtro actual`}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={() => exportar("visibles")}>Columnas visibles</Button>
            <Button variant="outline" onClick={() => exportar("todos")}>
              Todos los campos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
