import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Programa = {
  id: string;
  nombre: string;
  imagen_url: string | null;
  link_formulario: string;
  activo: boolean;
  orden: number;
};

const VACIO = { nombre: "", imagen_url: "", link_formulario: "", orden: "0" };

function enlaceValido(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Gestión de los programas de TV que se muestran en la Home pública. */
export function ProgramasTv({ esAdmin }: { esAdmin: boolean }) {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const { data, error: err } = await supabase
      .from("programas_tv")
      .select("id, nombre, imagen_url, link_formulario, activo, orden")
      .order("orden", { ascending: true });
    if (err) {
      setError("No se pudieron cargar los programas de TV. Reintenta.");
    } else {
      setError(null);
      setProgramas((data as Programa[] | null) ?? []);
    }
    setCargando(false);
  }

  useEffect(() => {
    void cargar();
  }, []);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(VACIO);
    setDialogo(true);
  }

  function abrirEdicion(p: Programa) {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      imagen_url: p.imagen_url ?? "",
      link_formulario: p.link_formulario,
      orden: String(p.orden),
    });
    setDialogo(true);
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      toast.error("Indica el nombre del programa.");
      return;
    }
    if (!enlaceValido(form.link_formulario.trim())) {
      toast.error("El enlace del formulario debe empezar por http:// o https://");
      return;
    }
    if (form.imagen_url.trim() && !enlaceValido(form.imagen_url.trim())) {
      toast.error("La imagen debe ser una dirección http:// o https://");
      return;
    }
    setGuardando(true);
    const valores = {
      nombre: form.nombre.trim(),
      imagen_url: form.imagen_url.trim() || null,
      link_formulario: form.link_formulario.trim(),
      orden: Number(form.orden) || 0,
    };
    const { error: err } = editandoId
      ? await supabase.from("programas_tv").update(valores).eq("id", editandoId)
      : await supabase.from("programas_tv").insert(valores);
    setGuardando(false);
    if (err) {
      toast.error(
        editandoId ? "No se pudo guardar el programa." : "No se pudo crear el programa.",
      );
      return;
    }
    toast.success(editandoId ? "Programa actualizado." : "Programa creado.");
    setForm(VACIO);
    setEditandoId(null);
    setDialogo(false);
    void cargar();
  }

  async function cambiarActivo(programa: Programa, activo: boolean) {
    const { error: err } = await supabase
      .from("programas_tv")
      .update({ activo })
      .eq("id", programa.id);
    if (err) {
      toast.error("No se pudo cambiar la visibilidad.");
      return;
    }
    setProgramas((lista) =>
      lista.map((p) => (p.id === programa.id ? { ...p, activo } : p)),
    );
  }

  async function eliminar(programa: Programa) {
    if (!window.confirm(`¿Eliminar "${programa.nombre}"?`)) return;
    const { error: err } = await supabase
      .from("programas_tv")
      .delete()
      .eq("id", programa.id);
    if (err) {
      toast.error("No se pudo eliminar el programa.");
      return;
    }
    toast.success("Programa eliminado.");
    void cargar();
  }

  return (
    <section className="border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Programas de TV</h2>
          <p className="text-sm text-muted-foreground">
            Tarjetas que se muestran en la Home pública y enlazan a formularios externos.
          </p>
        </div>
        <Button size="sm" onClick={abrirNuevo}>
          <Plus className="mr-1.5 h-4 w-4" />
          Añadir programa
        </Button>
      </div>

      {error && <p className="p-4 text-sm text-destructive">{error}</p>}

      {cargando ? (
        <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : programas.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Todavía no hay programas. Añade el primero para que aparezca en la Home.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {programas.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.nombre}</p>
                <a
                  href={p.link_formulario}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs text-muted-foreground underline"
                >
                  {p.link_formulario}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={p.activo}
                  onCheckedChange={(v) => void cambiarActivo(p, v)}
                  aria-label={`Mostrar ${p.nombre} en la Home`}
                />
                <span className="text-xs text-muted-foreground">
                  {p.activo ? "Visible" : "Oculto"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Editar ${p.nombre}`}
                  onClick={() => abrirEdicion(p)}
                >
                  Editar
                </Button>
                {esAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${p.nombre}`}
                    onClick={() => void eliminar(p)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editandoId ? "Editar programa de TV" : "Nuevo programa de TV"}
            </DialogTitle>
            <DialogDescription>
              El enlace lleva al formulario externo de inscripción.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="programa_nombre">Nombre</Label>
              <Input
                id="programa_nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programa_link">Enlace al formulario</Label>
              <Input
                id="programa_link"
                placeholder="https://…"
                value={form.link_formulario}
                onChange={(e) => setForm({ ...form, link_formulario: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programa_imagen">Imagen (opcional)</Label>
              <Input
                id="programa_imagen"
                placeholder="https://…"
                value={form.imagen_url}
                onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programa_orden">Orden</Label>
              <Input
                id="programa_orden"
                type="number"
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void guardar()} disabled={guardando}>
              {guardando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editandoId ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
