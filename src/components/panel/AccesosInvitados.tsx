import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Ban } from "lucide-react";
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

type Acceso = {
  id: string;
  cliente_id: string;
  proyecto_id: string | null;
  creado_en: string;
  caduca_en: string | null;
  ultima_visita: string | null;
  estado: string;
};

type Cliente = { id: string; razon_social: string };
type Proyecto = { id: string; nombre: string; cliente_id: string | null };

const SIN_PROYECTO = "generico";

function fecha(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-ES");
}

function estaCaducado(a: Acceso) {
  if (a.estado === "caducado") return true;
  return !!a.caduca_en && new Date(a.caduca_en).getTime() <= Date.now();
}

export function AccesosInvitados() {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogo, setDialogo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [proyectoId, setProyectoId] = useState(SIN_PROYECTO);
  const [caducidad, setCaducidad] = useState("");

  async function cargar() {
    setCargando(true);
    const [
      { data: acc, error: errAcc },
      { data: cli, error: errCli },
      { data: pro, error: errPro },
    ] = await Promise.all([
      supabase
        .from("accesos_invitados")
        .select("id,cliente_id,proyecto_id,creado_en,caduca_en,ultima_visita,estado")
        .order("creado_en", { ascending: false }),
      supabase.from("clientes").select("id,razon_social").order("razon_social"),
      supabase.from("proyectos_casting").select("id,nombre,cliente_id").order("nombre"),
    ]);
    if (errAcc) setError("No se pudieron cargar los accesos. Reintenta.");
    else if (errCli) setError("No se pudieron cargar los clientes. Reintenta.");
    else if (errPro) setError("No se pudieron cargar los proyectos. Reintenta.");
    else setError(null);
    setAccesos((acc ?? []) as Acceso[]);
    setClientes((cli ?? []) as Cliente[]);
    setProyectos((pro ?? []) as Proyecto[]);
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

  const nombreProyecto = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of proyectos) m[p.id] = p.nombre;
    return m;
  }, [proyectos]);

  const proyectosDelCliente = useMemo(
    () => proyectos.filter((p) => p.cliente_id === clienteId),
    [proyectos, clienteId],
  );

  function abrir() {
    setClienteId("");
    setProyectoId(SIN_PROYECTO);
    setCaducidad("");
    setDialogo(true);
  }

  async function crear() {
    if (!clienteId) {
      toast.error("Elige un cliente.");
      return;
    }
    setGuardando(true);
    const { error: errIns } = await supabase.from("accesos_invitados").insert({
      cliente_id: clienteId,
      proyecto_id: proyectoId === SIN_PROYECTO ? null : proyectoId,
      caduca_en: caducidad ? new Date(`${caducidad}T23:59:59`).toISOString() : null,
      estado: "activo",
    });
    setGuardando(false);
    if (errIns) {
      toast.error("No se pudo crear el acceso.");
      return;
    }
    setDialogo(false);
    toast.success("Acceso creado.");
    await cargar();
  }

  async function revocar(id: string) {
    const { error: errUpd } = await supabase
      .from("accesos_invitados")
      .update({ estado: "caducado" })
      .eq("id", id);
    if (errUpd) {
      toast.error("No se pudo revocar el acceso.");
      return;
    }
    setAccesos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: "caducado" } : a)),
    );
    toast.success("Acceso revocado.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accesos invitados</h1>
          <p className="text-sm text-muted-foreground">
            Invitaciones de acceso para personas de un cliente concreto.
          </p>
        </div>
        <Button onClick={abrir} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Nuevo acceso
        </Button>
      </header>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando accesos…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : accesos.length === 0 ? (
        <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay accesos invitados.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Proyecto</th>
                <th className="px-3 py-2">Creado</th>
                <th className="px-3 py-2">Caduca</th>
                <th className="px-3 py-2">Última visita</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map((a) => {
                const caducado = estaCaducado(a);
                return (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {nombreCliente[a.cliente_id] ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {a.proyecto_id
                        ? (nombreProyecto[a.proyecto_id] ?? "—")
                        : "Acceso genérico"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fecha(a.creado_en)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {fecha(a.caduca_en) ?? "Sin caducidad"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {fecha(a.ultima_visita) ?? "Nunca"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={caducado ? "outline" : "default"}>
                        {caducado ? "Caducado" : "Activo"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={caducado}
                        onClick={() => revocar(a.id)}
                      >
                        <Ban className="mr-2 h-4 w-4" /> Revocar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo acceso invitado</DialogTitle>
            <DialogDescription>
              Un acceso siempre pertenece a un cliente. Si no eliges proyecto, será genérico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={clienteId}
                onValueChange={(v) => {
                  setClienteId(v);
                  setProyectoId(SIN_PROYECTO);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select value={proyectoId} onValueChange={setProyectoId} disabled={!clienteId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_PROYECTO}>Acceso genérico</SelectItem>
                  {proyectosDelCliente.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caduca">Fecha de caducidad (opcional)</Label>
              <Input
                id="caduca"
                type="date"
                value={caducidad}
                onChange={(e) => setCaducidad(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si lo dejas vacío, el acceso no caduca por fecha.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={crear} disabled={guardando} className="w-full sm:w-auto">
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear acceso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
