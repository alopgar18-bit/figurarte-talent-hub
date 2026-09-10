import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Columns3, Download, FolderPlus, Loader2, Search, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ColumnaId = "codigo" | "nombre" | "categoria" | "altura_cm" | "ciudad" | "disponible" | "provincia" | "edad";

const COLUMNAS: { id: ColumnaId; etiqueta: string; pordefecto: boolean }[] = [
  { id: "codigo", etiqueta: "Código", pordefecto: true },
  { id: "nombre", etiqueta: "Nombre", pordefecto: true },
  { id: "categoria", etiqueta: "Categoría", pordefecto: true },
  { id: "altura_cm", etiqueta: "Altura", pordefecto: true },
  { id: "ciudad", etiqueta: "Ciudad", pordefecto: true },
  { id: "disponible", etiqueta: "Disponible", pordefecto: true },
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

function valorCelda(c: Candidato, col: ColumnaId) {
  switch (col) {
    case "categoria":
      return ETIQUETA_CATEGORIA[c.categoria] ?? c.categoria;
    case "altura_cm":
      return c.altura_cm ? `${c.altura_cm} cm` : "—";
    case "disponible":
      return c.disponible ? "Sí" : "No";
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

  const [categoria, setCategoria] = useState("todas");
  const [disponibilidad, setDisponibilidad] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const [visibles, setVisibles] = useState<ColumnaId[]>(
    COLUMNAS.filter((c) => c.pordefecto).map((c) => c.id),
  );
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [proyectoDestino, setProyectoDestino] = useState("");
  const [asignando, setAsignando] = useState(false);
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

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return candidatos.filter((c) => {
      if (categoria !== "todas" && c.categoria !== categoria) return false;
      if (disponibilidad === "disponibles" && !c.disponible) return false;
      if (disponibilidad === "no_disponibles" && c.disponible) return false;
      if (q && !`${c.nombre} ${c.codigo}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [candidatos, categoria, disponibilidad, busqueda]);

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
    setDialogoExport(false);
  }

  async function asignarAProyecto() {
    if (!proyectoDestino || seleccionados.length === 0) return;
    setAsignando(true);
    setAviso(null);
    const { data: existentes } = await supabase
      .from("proyecto_candidatos")
      .select("candidato_id")
      .eq("proyecto_id", proyectoDestino)
      .in("candidato_id", seleccionados);
    const yaAsignados = new Set((existentes ?? []).map((r) => r.candidato_id));
    const nuevos = seleccionados.filter((id) => !yaAsignados.has(id));
    if (nuevos.length) {
      const { error: e } = await supabase.from("proyecto_candidatos").insert(
        nuevos.map((candidato_id) => ({
          proyecto_id: proyectoDestino,
          candidato_id,
          origen: "manual" as const,
          estado: "preseleccionado" as const,
        })),
      );
      if (e) {
        setAviso("No se han podido asignar los candidatos.");
        setAsignando(false);
        return;
      }
    }
    setAviso(
      `${nuevos.length} candidato(s) asignado(s)` +
        (yaAsignados.size ? `, ${yaAsignados.size} ya estaban en el proyecto.` : "."),
    );
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
        <h1 className="text-xl font-semibold">Base de candidatos</h1>
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
      </div>

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
