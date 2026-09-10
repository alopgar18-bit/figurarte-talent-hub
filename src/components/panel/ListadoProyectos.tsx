import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type Proyecto = {
  id: string;
  nombre: string;
  estado: string;
  publicado: boolean;
  cliente_id: string | null;
  creado_en: string;
};

type Cliente = { id: string; razon_social: string };

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  en_curso: "En curso",
  cerrado: "Cerrado",
};

const CATEGORIAS = [
  { valor: "actor", etiqueta: "Actores" },
  { valor: "modelo", etiqueta: "Modelos" },
  { valor: "figurante", etiqueta: "Figurantes" },
  { valor: "casting_plus", etiqueta: "Casting Plus" },
];

export function ListadoProyectos() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogo, setDialogo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [clienteId, setClienteId] = useState<string>("sin");
  const [categoria, setCategoria] = useState<string>("actor");

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      const [p, c, pc] = await Promise.all([
        supabase
          .from("proyectos_casting")
          .select("id,nombre,estado,publicado,cliente_id,creado_en")
          .order("creado_en", { ascending: false }),
        supabase.from("clientes").select("id,razon_social").order("razon_social"),
        supabase.from("proyecto_candidatos").select("proyecto_id,estado"),
      ]);
      if (!activo) return;
      if (p.error || c.error || pc.error) {
        setError(p.error?.message ?? c.error?.message ?? pc.error?.message ?? null);
        setCargando(false);
        return;
      }
      const mapa: Record<string, number> = {};
      for (const fila of pc.data ?? []) {
        if (fila.estado === "preseleccionado") {
          mapa[fila.proyecto_id] = (mapa[fila.proyecto_id] ?? 0) + 1;
        }
      }
      setProyectos(p.data ?? []);
      setClientes(c.data ?? []);
      setConteos(mapa);
      setError(null);
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  async function crear() {
    if (!nombre.trim()) {
      toast.error("Escribe un nombre para el proyecto.");
      return;
    }
    setGuardando(true);
    const { data, error: errCrear } = await supabase
      .from("proyectos_casting")
      .insert({
        nombre: nombre.trim(),
        cliente_id: clienteId === "sin" ? null : clienteId,
        estado: "borrador",
        publicado: false,
        brief_publico: { categoria },
      })
      .select("id")
      .single();
    setGuardando(false);
    if (errCrear || !data) {
      toast.error("No se pudo crear el proyecto.");
      return;
    }
    setDialogo(false);
    setNombre("");
    navigate({ to: "/panel/proyectos/$id", params: { id: data.id } });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos / Casting</h1>
          <p className="text-sm text-muted-foreground">
            Crea castings, publícalos y gestiona los candidatos asociados.
          </p>
        </div>
        <Button onClick={() => setDialogo(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
        </Button>
      </header>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando proyectos…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : proyectos.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay proyectos. Crea el primero con “Nuevo proyecto”.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Publicado</th>
                <th className="px-4 py-3 font-semibold">Preseleccionados</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  onClick={() =>
                    navigate({ to: "/panel/proyectos/$id", params: { id: p.id } })
                  }
                >
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {clientes.find((c) => c.id === p.cliente_id)?.razon_social ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.estado === "en_curso" ? "default" : "secondary"}>
                      {ETIQUETA_ESTADO[p.estado] ?? p.estado}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{p.publicado ? "Sí" : "No"}</td>
                  <td className="px-4 py-3">{conteos[p.id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
            <DialogDescription>
              Se crea como borrador y sin publicar. Podrás completar el brief en el detalle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-proyecto">Nombre</Label>
              <Input
                id="nombre-proyecto"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Campaña verano — Resort"
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin">Sin cliente</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría objetivo</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button onClick={crear} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
