import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { buscarCandidatosPortal, type CandidatoPortal } from "@/lib/portal.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIAS = [
  { valor: "todas", etiqueta: "Todas las categorías" },
  { valor: "actor", etiqueta: "Actores" },
  { valor: "modelo", etiqueta: "Modelos" },
  { valor: "figurante", etiqueta: "Figurantes" },
  { valor: "casting_plus", etiqueta: "Casting Plus" },
];

const ETIQUETA: Record<string, string> = {
  actor: "Actor",
  modelo: "Modelo",
  figurante: "Figurante",
  casting_plus: "Casting Plus",
};

function iniciales(codigo: string) {
  const num = codigo.split("-")[1] ?? codigo;
  return num.slice(-2);
}

export function BuscarCandidatos() {
  const buscar = useServerFn(buscarCandidatosPortal);
  const [categoria, setCategoria] = useState("todas");
  const [codigo, setCodigo] = useState("");
  const [filas, setFilas] = useState<CandidatoPortal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const t = setTimeout(async () => {
      setCargando(true);
      try {
        const res = await buscar({
          data: { categoria: categoria === "todas" ? "" : categoria, codigo },
        });
        if (!vivo) return;
        setFilas(res);
        setError(null);
      } catch {
        if (vivo) setError("No se pudieron cargar los candidatos.");
      } finally {
        if (vivo) setCargando(false);
      }
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [categoria, codigo, buscar]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Buscar candidatos</h1>
        <p className="text-sm text-muted-foreground">
          Vista anónima de la base de candidatos. Los datos personales solo los ve el
          equipo de FigurArte.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select value={categoria} onValueChange={setCategoria}>
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
          <Label htmlFor="codigo">Buscar por código</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="codigo"
              className="pl-9"
              placeholder="FIG-00012"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando candidatos…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : filas.length === 0 ? (
        <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Ningún candidato coincide con la búsqueda.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Candidato</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Altura</th>
                <th className="px-3 py-2">Ciudad</th>
                <th className="px-3 py-2">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-muted text-xs font-semibold">
                        {iniciales(c.codigo)}
                      </span>
                      <span className="font-medium">{c.codigo}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {ETIQUETA[c.categoria] ?? c.categoria}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.altura_cm ? `${c.altura_cm} cm` : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.ciudad ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={c.disponible ? "default" : "outline"}>
                      {c.disponible ? "Sí" : "No"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
