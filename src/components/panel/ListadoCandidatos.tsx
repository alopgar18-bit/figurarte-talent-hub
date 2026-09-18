import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Eye,
  EyeOff,
  FolderPlus,
  Loader2,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FiltrosPersonalizados } from "@/components/panel/FiltrosPersonalizados";
import { cumpleTodas, type Condicion } from "@/lib/filtros-personalizados";
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
import { DialogoEnviarComunicacion } from "@/components/panel/DialogoEnviarComunicacion";
import { asignarCandidatosAProyecto } from "@/lib/rgpd.functions";
import { registrarAccesoStaff } from "@/lib/registro-accesos.functions";
import { firmarFotosStaff } from "@/lib/fotos.functions";
import {
  COLORES_CABELLO,
  COLORES_OJOS,
  PAISES,
  TALLAS_CALZADO,
  TALLAS_CAMISA,
  TALLAS_PANTALON,
} from "@/lib/catalogos";


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
  ref_legado: number | null;
};

type Proyecto = { id: string; nombre: string; creado_en: string };

type ColumnaId =
  | "foto"
  | "codigo"
  | "nombre"
  | "categoria"
  | "altura_cm"
  | "ciudad"
  | "disponible"
  | "antiguedad"
  | "provincia"
  | "edad"
  | "nacionalidad"
  | "tipo_perfil"
  | "habilidades";

const COLUMNAS: { id: ColumnaId; etiqueta: string; pordefecto: boolean }[] = [
  { id: "foto", etiqueta: "Foto", pordefecto: true },
  { id: "codigo", etiqueta: "Código", pordefecto: true },
  { id: "nombre", etiqueta: "Nombre", pordefecto: true },
  { id: "categoria", etiqueta: "Categoría", pordefecto: true },
  { id: "altura_cm", etiqueta: "Altura", pordefecto: true },
  { id: "ciudad", etiqueta: "Ciudad", pordefecto: true },
  { id: "disponible", etiqueta: "Disponible", pordefecto: true },
  { id: "antiguedad", etiqueta: "En la base desde", pordefecto: true },
  { id: "provincia", etiqueta: "Provincia", pordefecto: false },
  { id: "edad", etiqueta: "Edad", pordefecto: false },
  { id: "nacionalidad", etiqueta: "Nacionalidad", pordefecto: false },
  { id: "tipo_perfil", etiqueta: "Tipo de perfil", pordefecto: false },
  { id: "habilidades", etiqueta: "Habilidades", pordefecto: false },
];

/** Devuelve los valores de texto de una columna jsonb tipo array. */
function listaTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

const ETIQUETA_CATEGORIA: Record<string, string> = {
  actor: "Actor",
  modelo: "Modelo",
  figurante: "Figurante",
  casting_plus: "Casting Plus",
};

const GENEROS_BASE = ["Hombre", "Mujer", "Otro"];

/** Filas por página en la tabla (paginación en cliente). */
const FILAS_POR_PAGINA = 50;

const RANGOS_VACIOS = {
  edadMin: "",
  edadMax: "",
  alturaMin: "",
  alturaMax: "",
  pesoMin: "",
  pesoMax: "",
};

/** Filtros que sobreviven a la navegación listado → ficha → listado. */
const filtrosGuardados = {
  categorias: [] as string[],
  disponibleSi: false,
  disponibleNo: false,
  busqueda: "",
  provinciasSel: [] as string[],
  generosSel: [] as string[],
  habilidadesSel: [] as string[],
  tiposPerfilSel: [] as string[],
  carnesSel: [] as string[],
  camisaSel: [] as string[],
  pantalonSel: [] as string[],
  calzadoSel: [] as string[],
  nacionalidadSel: [] as string[],
  cabelloSel: [] as string[],
  ojosSel: [] as string[],
  idiomas: "",
  rangos: { ...RANGOS_VACIOS },
  condiciones: [] as Condicion[],
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
    case "foto":
      return "";
    case "categoria":
      return ETIQUETA_CATEGORIA[c.categoria] ?? c.categoria;
    case "altura_cm":
      return c.altura_cm ? `${c.altura_cm} cm` : "—";
    case "disponible":
      return c.disponible ? "Sí" : "No";
    case "antiguedad":
      return antiguedad(c["creado_en"]);
    case "tipo_perfil":
    case "habilidades": {
      const lista = listaTextos(c[col]);
      return lista.length ? lista.join(", ") : "—";
    }
    default:
      return (c[col] as string | number | null) ?? "—";
  }
}


export function ListadoCandidatos({ rol }: { rol: string }) {
  const navigate = useNavigate();
  /** Publicar/despublicar en la web pública: solo el equipo con permisos. */
  const esAdmin = rol === "admin_figurarte" || rol === "superadmin";
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<string[]>(filtrosGuardados.categorias);
  const [disponibleSi, setDisponibleSi] = useState(filtrosGuardados.disponibleSi);
  const [disponibleNo, setDisponibleNo] = useState(filtrosGuardados.disponibleNo);
  const [busqueda, setBusqueda] = useState(filtrosGuardados.busqueda);
  const [avanzados, setAvanzados] = useState(false);
  const [provinciasSel, setProvinciasSel] = useState<string[]>(filtrosGuardados.provinciasSel);
  const [generosSel, setGenerosSel] = useState<string[]>(filtrosGuardados.generosSel);
  const [habilidadesSel, setHabilidadesSel] = useState<string[]>(filtrosGuardados.habilidadesSel);
  const [tiposPerfilSel, setTiposPerfilSel] = useState<string[]>(filtrosGuardados.tiposPerfilSel);
  const [carnesSel, setCarnesSel] = useState<string[]>(filtrosGuardados.carnesSel);
  const [camisaSel, setCamisaSel] = useState<string[]>(filtrosGuardados.camisaSel);
  const [pantalonSel, setPantalonSel] = useState<string[]>(filtrosGuardados.pantalonSel);
  const [calzadoSel, setCalzadoSel] = useState<string[]>(filtrosGuardados.calzadoSel);
  const [nacionalidadSel, setNacionalidadSel] = useState<string[]>(filtrosGuardados.nacionalidadSel);
  const [cabelloSel, setCabelloSel] = useState<string[]>(filtrosGuardados.cabelloSel);
  const [ojosSel, setOjosSel] = useState<string[]>(filtrosGuardados.ojosSel);
  const [fotosFirmadas, setFotosFirmadas] = useState<Record<string, string>>({});
  const [idiomas, setIdiomas] = useState(filtrosGuardados.idiomas);
  const [rangos, setRangos] = useState(filtrosGuardados.rangos);
  const [condiciones, setCondiciones] = useState<Condicion[]>(filtrosGuardados.condiciones);
  /** Por defecto se descartan los candidatos sin ninguna foto. */
  const [sinFotos, setSinFotos] = useState(true);

  /** Filtros fijos que se guardan junto a las condiciones a medida. */
  const basicos = {
    categorias,
    disponibleSi,
    disponibleNo,
    busqueda,
    provinciasSel,
    generosSel,
    habilidadesSel,
    tiposPerfilSel,
    carnesSel,
    camisaSel,
    pantalonSel,
    calzadoSel,
    nacionalidadSel,
    cabelloSel,
    ojosSel,
    idiomas,
    rangos,
  };

  function cargarBasicos(b: Record<string, unknown>) {
    const lista = (k: string) => (Array.isArray(b[k]) ? (b[k] as string[]) : []);
    const texto = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
    setCategorias(lista("categorias"));
    setDisponibleSi(Boolean(b["disponibleSi"]));
    setDisponibleNo(Boolean(b["disponibleNo"]));
    setBusqueda(texto("busqueda"));
    setProvinciasSel(lista("provinciasSel"));
    setGenerosSel(lista("generosSel"));
    setHabilidadesSel(lista("habilidadesSel"));
    setTiposPerfilSel(lista("tiposPerfilSel"));
    setCarnesSel(lista("carnesSel"));
    setCamisaSel(lista("camisaSel"));
    setPantalonSel(lista("pantalonSel"));
    setCalzadoSel(lista("calzadoSel"));
    setNacionalidadSel(lista("nacionalidadSel"));
    setCabelloSel(lista("cabelloSel"));
    setOjosSel(lista("ojosSel"));
    setIdiomas(texto("idiomas"));
    setRangos(
      b["rangos"] && typeof b["rangos"] === "object"
        ? { ...RANGOS_VACIOS, ...(b["rangos"] as typeof RANGOS_VACIOS) }
        : { ...RANGOS_VACIOS },
    );
  }

  // Al desmontar (navegar a la ficha), los filtros quedan guardados y se restauran al volver.
  useEffect(() => {
    filtrosGuardados.categorias = categorias;
    filtrosGuardados.disponibleSi = disponibleSi;
    filtrosGuardados.disponibleNo = disponibleNo;
    filtrosGuardados.busqueda = busqueda;
    filtrosGuardados.provinciasSel = provinciasSel;
    filtrosGuardados.generosSel = generosSel;
    filtrosGuardados.habilidadesSel = habilidadesSel;
    filtrosGuardados.tiposPerfilSel = tiposPerfilSel;
    filtrosGuardados.carnesSel = carnesSel;
    filtrosGuardados.camisaSel = camisaSel;
    filtrosGuardados.pantalonSel = pantalonSel;
    filtrosGuardados.calzadoSel = calzadoSel;
    filtrosGuardados.nacionalidadSel = nacionalidadSel;
    filtrosGuardados.cabelloSel = cabelloSel;
    filtrosGuardados.ojosSel = ojosSel;
    filtrosGuardados.idiomas = idiomas;
    filtrosGuardados.rangos = rangos;
    filtrosGuardados.condiciones = condiciones;
  }, [
    condiciones,
    categorias,
    disponibleSi,
    disponibleNo,
    busqueda,
    provinciasSel,
    generosSel,
    habilidadesSel,
    tiposPerfilSel,
    carnesSel,
    camisaSel,
    pantalonSel,
    calzadoSel,
    nacionalidadSel,
    cabelloSel,
    ojosSel,
    idiomas,
    rangos,
  ]);

  const [visibles, setVisibles] = useState<ColumnaId[]>(
    COLUMNAS.filter((c) => c.pordefecto).map((c) => c.id),
  );
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [pagina, setPagina] = useState(1);
  const [proyectoDestino, setProyectoDestino] = useState("");
  const [asignando, setAsignando] = useState(false);
  /** Publicación web: true = publicar, false = retirar, null = diálogo cerrado. */
  const [publicarPendiente, setPublicarPendiente] = useState<boolean | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [dialogoComunicacion, setDialogoComunicacion] = useState(false);
  const asignar = useServerFn(asignarCandidatosAProyecto);
  const anotar = useServerFn(registrarAccesoStaff);
  const firmarFotos = useServerFn(firmarFotosStaff);

  const [aviso, setAviso] = useState<string | null>(null);
  const [dialogoExport, setDialogoExport] = useState(false);

  useEffect(() => {
    const TAMANO_BLOQUE = 1000;
    async function cargarTodosLosCandidatos(): Promise<Candidato[]> {
      let desde = 0;
      let todos: Candidato[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("candidatos")
          .select("*")
          .order("codigo", { ascending: true })
          .range(desde, desde + TAMANO_BLOQUE - 1);
        if (error) throw error;
        const bloque = (data ?? []) as Candidato[];
        todos = todos.concat(bloque);
        if (bloque.length < TAMANO_BLOQUE) break;
        desde += TAMANO_BLOQUE;
      }
      return todos;
    }
    (async () => {
      const [cands, { data: proys }] = await Promise.all([
        cargarTodosLosCandidatos().catch(() => {
          setError("No se han podido cargar los candidatos.");
          return [] as Candidato[];
        }),
        supabase
          .from("proyectos_casting")
          .select("id, nombre, creado_en")
          .order("creado_en", { ascending: false }),
      ]);
      setCandidatos(cands);
      setProyectos((proys ?? []) as Proyecto[]);
      setCargando(false);
    })();
  }, [firmarFotos]);

  const provincias = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidatos) if (c.provincia) set.add(c.provincia);
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [candidatos]);

  const generos = useMemo(() => {
    const set = new Set<string>(GENEROS_BASE);
    for (const c of candidatos) {
      const g = c["genero"];
      if (typeof g === "string" && g.trim()) set.add(g.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [candidatos]);

  const opcionesArray = useMemo(() => {
    const recoger = (campo: string) => {
      const set = new Set<string>();
      for (const c of candidatos) for (const v of listaTextos(c[campo])) set.add(v);
      return [...set].sort((a, b) => a.localeCompare(b, "es"));
    };
    return {
      habilidades: recoger("habilidades"),
      tipo_perfil: recoger("tipo_perfil"),
      carnes_conducir: recoger("carnes_conducir"),
    };
  }, [candidatos]);

  const opcionesCatalogo = useMemo(() => {
    const recoger = (campo: string, catalogo: string[]) => {
      const set = new Set<string>(catalogo);
      for (const c of candidatos) {
        const v = c[campo];
        if (typeof v === "string" && v.trim()) set.add(v.trim());
      }
      return [...set];
    };
    return {
      talla_camisa: recoger("talla_camisa", TALLAS_CAMISA),
      talla_pantalon: recoger("talla_pantalon", TALLAS_PANTALON),
      talla_calzado: recoger("talla_calzado", TALLAS_CALZADO),
      nacionalidad: recoger("nacionalidad", PAISES).sort((a, b) => a.localeCompare(b, "es")),
      color_cabello: recoger("color_cabello", COLORES_CABELLO),
      color_ojos: recoger("color_ojos", COLORES_OJOS),
    };
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
    const alguno = (valor: unknown, sel: string[]) =>
      sel.length === 0 || listaTextos(valor).some((v) => sel.includes(v));
    return candidatos.filter((c) => {
      const fotos = c["fotos"];
      if (sinFotos && (!Array.isArray(fotos) || fotos.length === 0)) return false;
      if (categorias.length > 0 && !categorias.includes(c.categoria)) return false;
      if (disponibleSi && !disponibleNo && !c.disponible) return false;
      if (disponibleNo && !disponibleSi && c.disponible) return false;
      if (q && !`${c.nombre} ${c.codigo} ${c.ref_legado ?? ""}`.toLowerCase().includes(q))
        return false;
      if (provinciasSel.length > 0 && (!c.provincia || !provinciasSel.includes(c.provincia)))
        return false;
      if (generosSel.length > 0 && !generosSel.includes(String(c["genero"] ?? "")))
        return false;
      if (!alguno(c["habilidades"], habilidadesSel)) return false;
      if (!alguno(c["tipo_perfil"], tiposPerfilSel)) return false;
      if (!alguno(c["carnes_conducir"], carnesSel)) return false;
      const coincide = (valor: unknown, sel: string[]) =>
        sel.length === 0 || sel.includes(String(valor ?? ""));
      if (!coincide(c["talla_camisa"], camisaSel)) return false;
      if (!coincide(c["talla_pantalon"], pantalonSel)) return false;
      if (!coincide(c["talla_calzado"], calzadoSel)) return false;
      if (!coincide(c["nacionalidad"], nacionalidadSel)) return false;
      if (!coincide(c["color_cabello"], cabelloSel)) return false;
      if (!coincide(c["color_ojos"], ojosSel)) return false;
      if (qIdiomas) {
        const enTextoLibre = String(c["idiomas"] ?? "")
          .toLowerCase()
          .includes(qIdiomas);
        const detalle = Array.isArray(c["idiomas_detalle"]) ? c["idiomas_detalle"] : [];
        const enDetalle = detalle.some((d) => {
          const idioma = (d as { idioma?: unknown } | null)?.idioma;
          return typeof idioma === "string" && idioma.toLowerCase().includes(qIdiomas);
        });
        if (!enTextoLibre && !enDetalle) return false;
      }
      if (!enRango(c.edad, rangos.edadMin, rangos.edadMax)) return false;
      if (!enRango(c.altura_cm, rangos.alturaMin, rangos.alturaMax)) return false;
      if (!enRango(c["peso_kg"], rangos.pesoMin, rangos.pesoMax)) return false;
      // Condiciones a medida: todas se combinan con Y.
      if (condiciones.length > 0 && !cumpleTodas(c as Record<string, unknown>, condiciones))
        return false;
      return true;
    });
  }, [
    candidatos,
    sinFotos,
    categorias,
    disponibleSi,
    disponibleNo,
    busqueda,
    provinciasSel,
    generosSel,
    habilidadesSel,
    tiposPerfilSel,
    carnesSel,
    camisaSel,
    pantalonSel,
    calzadoSel,
    nacionalidadSel,
    cabelloSel,
    ojosSel,
    idiomas,
    rangos,
    condiciones,
  ]);

  // Cualquier cambio de filtro o búsqueda vuelve a la página 1 para no quedarse en una página vacía.
  useEffect(() => {
    setPagina(1);
  }, [
    candidatos,
    sinFotos,
    categorias,
    disponibleSi,
    disponibleNo,
    busqueda,
    provinciasSel,
    generosSel,
    habilidadesSel,
    tiposPerfilSel,
    carnesSel,
    camisaSel,
    pantalonSel,
    calzadoSel,
    nacionalidadSel,
    cabelloSel,
    ojosSel,
    idiomas,
    rangos,
    condiciones,
  ]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginaCandidatos = useMemo(
    () => filtrados.slice((paginaActual - 1) * FILAS_POR_PAGINA, paginaActual * FILAS_POR_PAGINA),
    [filtrados, paginaActual],
  );

  // Las fotos se guardan como rutas privadas: hay que firmarlas para poder verlas.
  // Se firman solo las de la página visible (máx. 50 rutas, muy por debajo del
  // límite de 200 de firmarFotosStaff) y se acumulan entre páginas.
  useEffect(() => {
    const rutas = paginaCandidatos
      .map((c) => (Array.isArray(c["fotos"]) ? (c["fotos"] as unknown[])[0] : null))
      .filter(
        (f): f is string =>
          typeof f === "string" &&
          f !== "" &&
          !/^https?:\/\//i.test(f) &&
          !f.startsWith("placeholder://"),
      );
    if (rutas.length === 0) return;
    (async () => {
      try {
        const firmadas = await firmarFotos({ data: { rutas: [...new Set(rutas)] } });
        setFotosFirmadas((prev) => ({ ...prev, ...firmadas }));
      } catch {
        /* si falla la firma, se muestra el hueco sin foto */
      }
    })();
  }, [firmarFotos, paginaCandidatos]);

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

  /** Publica o retira la selección en la web pública (igual que la ficha de candidato). */
  async function cambiarPublicacionWeb(publicar: boolean) {
    if (seleccionados.length === 0) return;
    setPublicando(true);
    setAviso(null);
    try {
      const { error } = await supabase
        .from("candidatos")
        .update({ disponible_publico: publicar, revisado_publico: true })
        .in("id", seleccionados);
      if (error) throw error;
      setAviso(
        publicar
          ? `${seleccionados.length} candidato(s) publicado(s) en la web.`
          : `${seleccionados.length} candidato(s) retirado(s) de la web.`,
      );
      // Refresco local: la tabla refleja el cambio sin recargar.
      setCandidatos((prev) =>
        prev.map((c) =>
          seleccionados.includes(c.id)
            ? { ...c, disponible_publico: publicar, revisado_publico: true }
            : c,
        ),
      );
ality:      setSeleccion([]);
    } catch {
      setAviso(
        publicar
          ? "No se han podido publicar los candidatos."
          : "No se han podido retirar los candidatos.",
      );
    }
    setPublicando(false);
    setPublicarPendiente(null);
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
        <MultiSelect
          etiqueta="Categoría"
          opciones={Object.entries(ETIQUETA_CATEGORIA).map(([valor, etiqueta]) => ({
            valor,
            etiqueta,
          }))}
          seleccionados={categorias}
          alCambiar={setCategorias}
        />
        <MultiSelect
          etiqueta="Disponibilidad"
          opciones={[
            { valor: "si", etiqueta: "Disponibles" },
            { valor: "no", etiqueta: "No disponibles" },
          ]}
          seleccionados={[
            ...(disponibleSi ? ["si"] : []),
            ...(disponibleNo ? ["no"] : []),
          ]}
          alCambiar={(valores) => {
            setDisponibleSi(valores.includes("si"));
            setDisponibleNo(valores.includes("no"));
          }}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="descartar-sin-fotos"
            checked={sinFotos}
            onCheckedChange={(v) => setSinFotos(v === true)}
          />
          <Label htmlFor="descartar-sin-fotos" className="cursor-pointer text-sm">
            Descartar sin fotos
          </Label>
        </div>
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
        <FiltrosPersonalizados
          condiciones={condiciones}
          alCambiar={setCondiciones}
          basicos={basicos}
          alCargarBasicos={cargarBasicos}
        />
      </div>

      {avanzados && (
        <div className="space-y-4 border border-border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Provincia</Label>
              <MultiSelect
                etiqueta="Provincia"
                opciones={provincias.map((p) => ({ valor: p, etiqueta: p }))}
                seleccionados={provinciasSel}
                alCambiar={setProvinciasSel}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Género</Label>
              <MultiSelect
                etiqueta="Género"
                opciones={generos.map((g) => ({ valor: g, etiqueta: g }))}
                seleccionados={generosSel}
                alCambiar={setGenerosSel}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Habilidades</Label>
              <MultiSelect
                etiqueta="Habilidades"
                opciones={opcionesArray.habilidades.map((h) => ({ valor: h, etiqueta: h }))}
                seleccionados={habilidadesSel}
                alCambiar={setHabilidadesSel}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de perfil</Label>
              <MultiSelect
                etiqueta="Tipo de perfil"
                opciones={opcionesArray.tipo_perfil.map((t) => ({ valor: t, etiqueta: t }))}
                seleccionados={tiposPerfilSel}
                alCambiar={setTiposPerfilSel}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Carnés de conducir</Label>
              <MultiSelect
                etiqueta="Carnés de conducir"
                opciones={opcionesArray.carnes_conducir.map((k) => ({ valor: k, etiqueta: k }))}
                seleccionados={carnesSel}
                alCambiar={setCarnesSel}
              />
            </div>
            {(
              [
                { clave: "talla_camisa", etiqueta: "Talla camisa", sel: camisaSel, set: setCamisaSel },
                { clave: "talla_pantalon", etiqueta: "Talla pantalón", sel: pantalonSel, set: setPantalonSel },
                { clave: "talla_calzado", etiqueta: "Talla calzado", sel: calzadoSel, set: setCalzadoSel },
                { clave: "nacionalidad", etiqueta: "Nacionalidad", sel: nacionalidadSel, set: setNacionalidadSel },
                { clave: "color_cabello", etiqueta: "Color de cabello", sel: cabelloSel, set: setCabelloSel },
                { clave: "color_ojos", etiqueta: "Color de ojos", sel: ojosSel, set: setOjosSel },
              ] as const
            ).map((f) => (
              <div key={f.clave} className="space-y-1.5">
                <Label>{f.etiqueta}</Label>
                <MultiSelect
                  etiqueta={f.etiqueta}
                  opciones={opcionesCatalogo[f.clave].map((v) => ({ valor: v, etiqueta: v }))}
                  seleccionados={f.sel}
                  alCambiar={f.set}
                />
              </div>
            ))}
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
              setProvinciasSel([]);
              setGenerosSel([]);
              setHabilidadesSel([]);
              setTiposPerfilSel([]);
              setCarnesSel([]);
              setCamisaSel([]);
              setPantalonSel([]);
              setCalzadoSel([]);
              setNacionalidadSel([]);
              setCabelloSel([]);
              setOjosSel([]);
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
            <Button variant="outline" onClick={() => setDialogoComunicacion(true)}>
              Enviar comunicación
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
            {paginaCandidatos.map((c) => (
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
                    {col.id === "foto" ? (
                      (() => {
                        const primera = Array.isArray(c["fotos"])
                          ? ((c["fotos"] as unknown[])[0] as string | undefined)
                          : undefined;
                        const src =
                          primera && /^https?:\/\//i.test(primera)
                            ? primera
                            : primera
                              ? fotosFirmadas[primera]
                              : undefined;
                        return src ? (
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-14 w-[42px] rounded-sm border border-border object-cover"
                          />
                        ) : (
                          <span className="flex h-14 w-[42px] items-center justify-center rounded-sm border border-dashed border-border text-[10px] text-muted-foreground">
                            —
                          </span>
                        );
                      })()
                    ) : col.id === "categoria" ? (
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

      {filtrados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {filtrados.length} resultado{filtrados.length === 1 ? "" : "s"} · Página {paginaActual} de{" "}
            {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginaActual <= 1}
              onClick={() => setPagina(paginaActual - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPagina(paginaActual + 1)}
              aria-label="Página siguiente"
            >
              Siguiente <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

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

      <DialogoEnviarComunicacion
        abierto={dialogoComunicacion}
        onOpenChange={setDialogoComunicacion}
        candidatosIniciales={filtrados
          .filter((c) => seleccionados.includes(c.id))
          .map((c) => ({ id: c.id, etiqueta: `${c.codigo} — ${c.nombre}` }))}
      />
    </div>
  );
}
