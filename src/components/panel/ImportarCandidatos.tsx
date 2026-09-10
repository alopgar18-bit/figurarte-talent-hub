import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIAS = ["actor", "modelo", "figurante", "casting_plus"] as const;
type Categoria = (typeof CATEGORIAS)[number];

const ALIAS_CATEGORIA: Record<string, Categoria> = {
  actor: "actor",
  actriz: "actor",
  actores: "actor",
  modelo: "modelo",
  model: "modelo",
  figurante: "figurante",
  extra: "figurante",
  figuracion: "figurante",
  casting_plus: "casting_plus",
  "casting plus": "casting_plus",
};

type CampoId =
  | "nombre"
  | "categoria"
  | "email"
  | "telefono"
  | "ciudad"
  | "provincia"
  | "altura_cm"
  | "peso_kg"
  | "edad";

const CAMPOS: { id: CampoId; etiqueta: string; obligatorio?: boolean; alias: string[]; numero?: boolean }[] = [
  { id: "nombre", etiqueta: "Nombre", obligatorio: true, alias: ["nombre", "name", "nombre completo"] },
  { id: "categoria", etiqueta: "Categoría", obligatorio: true, alias: ["categoria", "categoría", "tipo", "perfil"] },
  { id: "email", etiqueta: "Email", obligatorio: true, alias: ["email", "correo", "e-mail", "mail"] },
  { id: "telefono", etiqueta: "Teléfono", alias: ["telefono", "teléfono", "phone", "movil", "móvil"] },
  { id: "ciudad", etiqueta: "Ciudad", alias: ["ciudad", "city", "localidad"] },
  { id: "provincia", etiqueta: "Provincia", alias: ["provincia", "province"] },
  { id: "altura_cm", etiqueta: "Altura (cm)", numero: true, alias: ["altura", "altura_cm", "estatura", "height"] },
  { id: "peso_kg", etiqueta: "Peso (kg)", numero: true, alias: ["peso", "peso_kg", "weight"] },
  { id: "edad", etiqueta: "Edad", numero: true, alias: ["edad", "age", "años"] },
];

const NO_IMPORTAR = "__no__";

type Fila = Record<string, unknown>;

type Existente = { id: string; codigo: string; nombre: string; email: string | null; telefono: string | null };

type Clasificada = {
  indice: number;
  datos: Partial<Record<CampoId, string | number>>;
  tipo: "nueva" | "duplicado" | "incompleta";
  motivo?: string;
  existente?: Existente;
  accion: "omitir" | "actualizar" | "crear";
};

const norm = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const soloDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export function ImportarCandidatos() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [paso, setPaso] = useState(1);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [cabeceras, setCabeceras] = useState<string[]>([]);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [mapa, setMapa] = useState<Record<CampoId, string>>(
    Object.fromEntries(CAMPOS.map((c) => [c.id, NO_IMPORTAR])) as Record<CampoId, string>,
  );
  const [clasificadas, setClasificadas] = useState<Clasificada[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number; omitidos: number } | null>(null);

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCargando(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const libro = XLSX.read(buf, { type: "array" });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const datos = XLSX.utils.sheet_to_json<Fila>(hoja, { defval: "" });
      if (!datos.length) {
        setError("El archivo no contiene filas de datos.");
        setCargando(false);
        return;
      }
      const cols = Object.keys(datos[0]);
      setCabeceras(cols);
      setFilas(datos);
      setNombreArchivo(file.name);
      const auto = { ...mapa };
      for (const campo of CAMPOS) {
        const encontrada = cols.find((c) => campo.alias.includes(norm(c)));
        auto[campo.id] = encontrada ?? NO_IMPORTAR;
      }
      setMapa(auto);
      setPaso(2);
    } catch {
      setError("No se ha podido leer el archivo. Comprueba que es un Excel o CSV válido.");
    }
    setCargando(false);
  }

  const mapaListo = (["nombre", "categoria", "email"] as CampoId[]).every((c) => mapa[c] !== NO_IMPORTAR);

  async function analizar() {
    setCargando(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("candidatos")
      .select("id, codigo, nombre, email, telefono")
      .limit(5000);
    if (e) {
      setError("No se han podido cargar los candidatos existentes.");
      setCargando(false);
      return;
    }
    const existentes = (data ?? []) as Existente[];
    const resultado: Clasificada[] = filas.map((fila, indice) => {
      const datos: Partial<Record<CampoId, string | number>> = {};
      for (const campo of CAMPOS) {
        const col = mapa[campo.id];
        if (col === NO_IMPORTAR) continue;
        const bruto = String(fila[col] ?? "").trim();
        if (!bruto) continue;
        if (campo.numero) {
          const n = Number(bruto.replace(",", "."));
          if (Number.isFinite(n)) datos[campo.id] = Math.round(n);
        } else {
          datos[campo.id] = bruto;
        }
      }
      const cat = ALIAS_CATEGORIA[norm(datos.categoria)];
      if (cat) datos.categoria = cat;

      const faltan: string[] = [];
      if (!datos.nombre) faltan.push("nombre");
      if (!datos.email) faltan.push("email");
      if (!datos.categoria) faltan.push("categoría");
      else if (!cat) faltan.push(`categoría no válida ("${datos.categoria}")`);
      if (faltan.length) {
        return { indice, datos, tipo: "incompleta", motivo: `Falta ${faltan.join(", ")}`, accion: "omitir" };
      }

      const nombreN = norm(datos.nombre);
      const emailN = norm(datos.email);
      const telN = soloDigitos(datos.telefono);
      let coincide: Existente | undefined;
      let motivo = "";
      coincide = existentes.find((x) => norm(x.nombre) === nombreN && norm(x.email) === emailN);
      if (coincide) motivo = "mismo nombre y email";
      if (!coincide && telN) {
        coincide = existentes.find((x) => norm(x.nombre) === nombreN && soloDigitos(x.telefono) === telN);
        if (coincide) motivo = "mismo nombre y teléfono";
      }
      if (coincide) {
        return { indice, datos, tipo: "duplicado", motivo, existente: coincide, accion: "omitir" };
      }
      return { indice, datos, tipo: "nueva", accion: "crear" };
    });
    setClasificadas(resultado);
    setPaso(3);
    setCargando(false);
  }

  const cifras = useMemo(
    () => ({
      nuevas: clasificadas.filter((c) => c.tipo === "nueva").length,
      duplicados: clasificadas.filter((c) => c.tipo === "duplicado").length,
      incompletas: clasificadas.filter((c) => c.tipo === "incompleta").length,
    }),
    [clasificadas],
  );

  const aProcesar = clasificadas.filter(
    (c) => c.tipo !== "incompleta" && (c.tipo === "nueva" || c.accion !== "omitir"),
  );

  async function importar() {
    setCargando(true);
    setError(null);
    const nuevos = aProcesar.filter((c) => c.tipo === "nueva" || c.accion === "crear");
    const actualizar = aProcesar.filter((c) => c.tipo === "duplicado" && c.accion === "actualizar");
    let creados = 0;
    let actualizados = 0;

    if (nuevos.length) {
      const { error: e } = await supabase.from("candidatos").insert(
        nuevos.map((c) => ({
          ...(c.datos as Record<string, unknown>),
          categoria: c.datos.categoria as Categoria,
          nombre: String(c.datos.nombre),
        })) as never,
      );
      if (e) {
        setError("No se han podido crear los candidatos nuevos: " + e.message);
        setCargando(false);
        return;
      }
      creados = nuevos.length;
    }

    for (const c of actualizar) {
      const { error: e } = await supabase
        .from("candidatos")
        .update(c.datos as never)
        .eq("id", c.existente!.id);
      if (e) {
        setError("Error al actualizar " + c.existente!.codigo + ": " + e.message);
        setCargando(false);
        return;
      }
      actualizados++;
    }

    setResultado({
      creados,
      actualizados,
      omitidos: clasificadas.length - creados - actualizados,
    });
    setPaso(4);
    setCargando(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Importar candidatos desde Excel</h1>
          <p className="text-sm text-muted-foreground">Nada se guarda hasta el último paso.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/panel/candidatos">
            <ArrowLeft className="size-4" /> Volver al listado
          </Link>
        </Button>
      </div>

      <ol className="flex flex-wrap gap-2 text-sm">
        {["Subir archivo", "Mapear columnas", "Revisar", "Confirmar"].map((t, i) => (
          <li
            key={t}
            className={
              "border px-3 py-1 " +
              (paso === i + 1
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground")
            }
          >
            {i + 1}. {t}
          </li>
        ))}
      </ol>

      {error && <p className="border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>}

      {paso === 1 && (
        <div className="border border-border p-6 text-center">
          <FileSpreadsheet className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Selecciona un archivo .xlsx, .xls o .csv con una fila de cabeceras.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onArchivo}
          />
          <Button className="mt-4" onClick={() => inputRef.current?.click()} disabled={cargando}>
            {cargando ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Elegir archivo
          </Button>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{nombreArchivo}</span> — {filas.length} filas detectadas.
          </p>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {cabeceras.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, 5).map((f, i) => (
                  <tr key={i} className="border-t border-border">
                    {cabeceras.map((c) => (
                      <td key={c} className="px-3 py-2 text-muted-foreground">
                        {String(f[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CAMPOS.map((campo) => (
              <div key={campo.id} className="space-y-1">
                <label className="text-sm font-medium">
                  {campo.etiqueta}
                  {campo.obligatorio && <span className="text-destructive"> *</span>}
                </label>
                <Select
                  value={mapa[campo.id]}
                  onValueChange={(v) => setMapa((m) => ({ ...m, [campo.id]: v }))}
                >
                  <SelectTrigger aria-label={campo.etiqueta}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_IMPORTAR}>No importar este campo</SelectItem>
                    {cabeceras.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPaso(1)}>
              Atrás
            </Button>
            <Button onClick={analizar} disabled={!mapaListo || cargando}>
              {cargando && <Loader2 className="size-4 animate-spin" />} Revisar duplicidades
            </Button>
            {!mapaListo && (
              <p className="w-full text-sm text-muted-foreground">
                Nombre, categoría y email son obligatorios para continuar.
              </p>
            )}
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-border p-4">
              <p className="text-2xl font-semibold">{cifras.nuevas}</p>
              <p className="text-sm text-muted-foreground">Nuevas, sin conflicto</p>
            </div>
            <div className="border border-border p-4">
              <p className="text-2xl font-semibold">{cifras.duplicados}</p>
              <p className="text-sm text-muted-foreground">Posibles duplicados</p>
            </div>
            <div className="border border-border p-4">
              <p className="text-2xl font-semibold">{cifras.incompletas}</p>
              <p className="text-sm text-muted-foreground">Incompletas (excluidas)</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fila</th>
                  <th className="px-3 py-2 text-left font-medium">Nombre</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="px-3 py-2 text-left font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clasificadas.map((c) => (
                  <tr key={c.indice} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{c.indice + 2}</td>
                    <td className="px-3 py-2">{String(c.datos.nombre ?? "—")}</td>
                    <td className="px-3 py-2 text-muted-foreground">{String(c.datos.email ?? "—")}</td>
                    <td className="px-3 py-2">
                      {c.tipo === "nueva" && <Badge variant="outline">Nueva</Badge>}
                      {c.tipo === "duplicado" && (
                        <span className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit border-primary/40 text-primary">
                            Posible duplicado
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {c.existente!.codigo} · {c.existente!.nombre} ({c.motivo})
                          </span>
                        </span>
                      )}
                      {c.tipo === "incompleta" && (
                        <span className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit border-destructive/40 text-destructive">
                            Incompleta
                          </Badge>
                          <span className="text-xs text-muted-foreground">{c.motivo}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {c.tipo === "duplicado" ? (
                        <Select
                          value={c.accion}
                          onValueChange={(v) =>
                            setClasificadas((prev) =>
                              prev.map((x) =>
                                x.indice === c.indice ? { ...x, accion: v as Clasificada["accion"] } : x,
                              ),
                            )
                          }
                        >
                          <SelectTrigger className="w-[210px]" aria-label="Acción para la fila">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="omitir">Omitir (ya existe)</SelectItem>
                            <SelectItem value="actualizar">Actualizar ficha existente</SelectItem>
                            <SelectItem value="crear">Crear como nuevo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : c.tipo === "nueva" ? (
                        <span className="text-muted-foreground">Crear</span>
                      ) : (
                        <span className="text-muted-foreground">Excluida</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPaso(2)}>
              Atrás
            </Button>
            <Button onClick={importar} disabled={aProcesar.length === 0 || cargando}>
              {cargando && <Loader2 className="size-4 animate-spin" />}
              Confirmar e importar {aProcesar.length} candidatos
            </Button>
          </div>
        </div>
      )}

      {paso === 4 && resultado && (
        <div className="border border-border p-6 text-center">
          <CheckCircle2 className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Importación completada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {resultado.creados} creados · {resultado.actualizados} actualizados · {resultado.omitidos} omitidos
          </p>
          <Button className="mt-4" onClick={() => navigate({ to: "/panel/candidatos" })}>
            Ir al listado de candidatos
          </Button>
        </div>
      )}
    </div>
  );
}
