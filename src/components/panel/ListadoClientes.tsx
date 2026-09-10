import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Contacto = { nombre?: string; email?: string; telefono?: string };

type PlantillaDossier = {
  logo_url?: string | null;
  campos_ocultos?: string[];
  orden_medidas?: string[];
};

type Cliente = {
  id: string;
  razon_social: string;
  sector: string | null;
  contactos: Contacto[];
  condiciones: string | null;
  plantilla_dossier: PlantillaDossier | null;
  creado_en: string;
};

type Proyecto = {
  id: string;
  nombre: string;
  estado: string;
  cliente_id: string | null;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  en_curso: "En curso",
  cerrado: "Cerrado",
};

type FormCliente = {
  razon_social: string;
  sector: string;
  condiciones: string;
  logo_url: string;
  contactos: Contacto[];
};

const FORM_VACIO: FormCliente = {
  razon_social: "",
  sector: "",
  condiciones: "",
  logo_url: "",
  contactos: [{ nombre: "", email: "", telefono: "" }],
};

function Tarjeta({
  titulo,
  children,
  className,
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-border bg-card p-4 sm:p-5", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** El logo del cliente suele ser un SVG en negro: se muestra siempre sobre blanco. */
function LogoCliente({
  url,
  nombre,
  className,
}: {
  url: string | null;
  nombre: string;
  className?: string;
}) {
  if (!url) {
    return (
      <div
        className={cn(
          "flex size-14 shrink-0 items-center justify-center border border-border bg-muted",
          className,
        )}
      >
        <Building2 className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 items-center justify-center border border-border bg-white p-1.5",
        className,
      )}
    >
      <img
        src={url}
        alt={`Logo de ${nombre}`}
        className="max-h-full max-w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export function ListadoClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [presentados, setPresentados] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [detalleMovil, setDetalleMovil] = useState(false);

  const [dialogo, setDialogo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<FormCliente>(FORM_VACIO);

  async function cargar(seleccionarId?: string) {
    const [{ data: cls, error: e1 }, { data: prys }, { data: pcs }] = await Promise.all([
      supabase
        .from("clientes")
        .select("*")
        .order("razon_social", { ascending: true }),
      supabase.from("proyectos_casting").select("id, nombre, estado, cliente_id"),
      supabase.from("proyecto_candidatos").select("proyecto_id"),
    ]);

    if (e1) {
      setError("No se han podido cargar los clientes.");
      setCargando(false);
      return;
    }

    const listaClientes = (cls ?? []) as unknown as Cliente[];
    const listaProyectos = (prys ?? []) as Proyecto[];

    const porProyecto: Record<string, number> = {};
    for (const fila of (pcs ?? []) as { proyecto_id: string }[]) {
      porProyecto[fila.proyecto_id] = (porProyecto[fila.proyecto_id] ?? 0) + 1;
    }
    const porCliente: Record<string, number> = {};
    for (const p of listaProyectos) {
      if (!p.cliente_id) continue;
      porCliente[p.cliente_id] = (porCliente[p.cliente_id] ?? 0) + (porProyecto[p.id] ?? 0);
    }

    setClientes(listaClientes);
    setProyectos(listaProyectos);
    setPresentados(porCliente);
    setSeleccionado((actual) => seleccionarId ?? actual ?? listaClientes[0]?.id ?? null);
    setCargando(false);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cliente = useMemo(
    () => clientes.find((c) => c.id === seleccionado) ?? null,
    [clientes, seleccionado],
  );

  const proyectosCliente = useMemo(
    () => proyectos.filter((p) => p.cliente_id === seleccionado),
    [proyectos, seleccionado],
  );

  function contarProyectos(id: string) {
    return proyectos.filter((p) => p.cliente_id === id).length;
  }

  function abrirNuevo() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setDialogo(true);
  }

  function abrirEdicion(c: Cliente) {
    setEditandoId(c.id);
    setForm({
      razon_social: c.razon_social,
      sector: c.sector ?? "",
      condiciones: c.condiciones ?? "",
      logo_url: c.plantilla_dossier?.logo_url ?? "",
      contactos: c.contactos?.length
        ? c.contactos.map((x) => ({
            nombre: x.nombre ?? "",
            email: x.email ?? "",
            telefono: x.telefono ?? "",
          }))
        : [{ nombre: "", email: "", telefono: "" }],
    });
    setDialogo(true);
  }

  function cambiarContacto(i: number, campo: keyof Contacto, valor: string) {
    setForm((f) => ({
      ...f,
      contactos: f.contactos.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c)),
    }));
  }

  async function guardarCliente() {
    if (form.razon_social.trim().length < 2) {
      toast.error("Indica la razón social.");
      return;
    }
    setGuardando(true);

    const contactos = form.contactos
      .map((c) => ({
        nombre: (c.nombre ?? "").trim(),
        email: (c.email ?? "").trim(),
        telefono: (c.telefono ?? "").trim(),
      }))
      .filter((c) => c.nombre || c.email || c.telefono);

    const plantillaBase =
      (editandoId && clientes.find((c) => c.id === editandoId)?.plantilla_dossier) || {};
    const plantilla_dossier = {
      ...plantillaBase,
      logo_url: form.logo_url.trim() || null,
    };

    const valores = {
      razon_social: form.razon_social.trim(),
      sector: form.sector.trim() || null,
      contactos,
      condiciones: form.condiciones.trim() || null,
      plantilla_dossier,
    };

    if (editandoId) {
      const { error: e } = await supabase
        .from("clientes")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(valores as any)
        .eq("id", editandoId);
      setGuardando(false);
      if (e) {
        toast.error("No se pudieron guardar los cambios.");
        return;
      }
      toast.success("Cliente actualizado");
      setDialogo(false);
      await cargar(editandoId);
      return;
    }

    const { data, error: e } = await supabase
      .from("clientes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(valores as any)
      .select("id")
      .single();

    setGuardando(false);

    if (e || !data) {
      toast.error("No se pudo crear el cliente.");
      return;
    }

    toast.success("Cliente creado");
    setDialogo(false);
    setForm(FORM_VACIO);
    await cargar(data.id);
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando clientes…
      </div>
    );
  }

  if (error) {
    return <p className="border border-border bg-card p-6 text-sm text-primary">{error}</p>;
  }

  const logo = cliente?.plantilla_dossier?.logo_url ?? null;

  const lista = (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          Clientes <span className="text-muted-foreground">({clientes.length})</span>
        </p>
        <Button size="sm" onClick={abrirNuevo}>
          <Plus className="size-4" />
          Nuevo cliente
        </Button>
      </div>

      {clientes.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          Todavía no hay clientes registrados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Razón social</th>
                <th className="px-4 py-2 font-semibold">Sector</th>
                <th className="px-4 py-2 text-right font-semibold">Proyectos</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => {
                    setSeleccionado(c.id);
                    setDetalleMovil(true);
                  }}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors hover:bg-accent",
                    seleccionado === c.id && "bg-accent",
                  )}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{c.razon_social}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.sector ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {contarProyectos(c.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const detalle = cliente ? (
    <div className="space-y-4">
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground lg:hidden"
        onClick={() => setDetalleMovil(false)}
      >
        <ArrowLeft className="size-4" />
        Volver a la lista
      </button>

      <header className="border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <LogoCliente url={logo} nombre={cliente.razon_social} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {cliente.razon_social}
            </h2>
            <p className="text-sm text-muted-foreground">{cliente.sector ?? "Sector sin definir"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => abrirEdicion(cliente)}>
            <Pencil className="size-4" />
            Editar
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Proyectos</p>
            <p className="text-lg font-semibold text-foreground">{proyectosCliente.length}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Contactos</p>
            <p className="text-lg font-semibold text-foreground">
              {cliente.contactos?.length ?? 0}
            </p>
          </div>
          <div className="border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Candidatos presentados
            </p>
            <p className="text-lg font-semibold text-foreground">
              {presentados[cliente.id] ?? 0}
            </p>
          </div>
        </div>
      </header>

      <Tarjeta titulo="Contactos">
        {cliente.contactos?.length ? (
          <ul className="space-y-3">
            {cliente.contactos.map((c, i) => (
              <li key={i} className="border border-border p-3">
                <p className="text-sm font-medium text-foreground">{c.nombre || "Sin nombre"}</p>
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="block break-all text-sm text-primary hover:underline"
                  >
                    {c.email}
                  </a>
                )}
                {c.telefono && (
                  <a
                    href={`tel:${c.telefono}`}
                    className="block text-sm text-muted-foreground hover:underline"
                  >
                    {c.telefono}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin contactos registrados.</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Condiciones">
        {cliente.condiciones ? (
          <p className="whitespace-pre-line text-sm text-foreground">{cliente.condiciones}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Sin condiciones registradas.</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Plantilla de dossier">
        {logo ? (
          <div className="flex items-center gap-3">
            <LogoCliente url={logo} nombre={cliente.razon_social} className="h-14 w-32 size-auto" />
            <span className="break-all text-xs text-muted-foreground">{logo}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin logo configurado.</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Proyectos del cliente">
        {proyectosCliente.length ? (
          <ul className="space-y-2">
            {proyectosCliente.map((p) => (
              <li key={p.id}>
                <Link
                  to="/panel/proyectos/$id"
                  params={{ id: p.id }}
                  className="flex items-center justify-between gap-3 border border-border p-3 transition-colors hover:bg-accent"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {p.nombre}
                  </span>
                  <Badge variant="outline">{ETIQUETA_ESTADO[p.estado] ?? p.estado}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin proyectos todavía.</p>
        )}
      </Tarjeta>
    </div>
  ) : (
    <p className="border border-border bg-card p-6 text-sm text-muted-foreground">
      Selecciona un cliente para ver su ficha.
    </p>
  );

  return (
    <div className="space-y-4">
      {/* Escritorio: maestro-detalle */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(320px,420px)_1fr] lg:items-start">
        {lista}
        {detalle}
      </div>

      {/* Móvil: apilado */}
      <div className="lg:hidden">{detalleMovil && cliente ? detalle : lista}</div>

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>
              Datos del cliente, contactos, condiciones y logo para sus dossiers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="razon_social">Razón social *</Label>
              <Input
                id="razon_social"
                value={form.razon_social}
                onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Contactos</Label>
              {form.contactos.map((c, i) => (
                <div key={i} className="space-y-2 border border-border p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="Nombre"
                      value={c.nombre ?? ""}
                      onChange={(e) => cambiarContacto(i, "nombre", e.target.value)}
                      aria-label={`Nombre del contacto ${i + 1}`}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={c.email ?? ""}
                      onChange={(e) => cambiarContacto(i, "email", e.target.value)}
                      aria-label={`Email del contacto ${i + 1}`}
                    />
                    <Input
                      placeholder="Teléfono"
                      value={c.telefono ?? ""}
                      onChange={(e) => cambiarContacto(i, "telefono", e.target.value)}
                      aria-label={`Teléfono del contacto ${i + 1}`}
                    />
                  </div>
                  {form.contactos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          contactos: f.contactos.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      <Trash2 className="size-4" /> Quitar contacto
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    contactos: [...f.contactos, { nombre: "", email: "", telefono: "" }],
                  }))
                }
              >
                <Plus className="size-4" /> Añadir contacto
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condiciones">Condiciones</Label>
              <Textarea
                id="condiciones"
                rows={3}
                value={form.condiciones}
                onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logo_url">Logo para el dossier (URL)</Label>
              <Input
                id="logo_url"
                placeholder="https://…"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogo(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardarCliente} disabled={guardando}>
              {guardando && <Loader2 className="size-4 animate-spin" />}
              {editandoId ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
