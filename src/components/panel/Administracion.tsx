import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock, Plus } from "lucide-react";
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
import { ETIQUETAS_ROL } from "@/components/panel/PanelShell";
import { RegistroAccesos } from "@/components/panel/RegistroAccesos";
import { ProgramasTv } from "@/components/panel/ProgramasTv";

import type { Database } from "@/integrations/supabase/types";

type RolUsuario = Database["public"]["Enums"]["rol_usuario"];
type TipoCampo = Database["public"]["Enums"]["tipo_campo_personalizado"];
type CategoriaCandidato = Database["public"]["Enums"]["categoria_candidato"];

type Usuario = {
  id: string;
  email: string;
  rol: string;
  ultimo_acceso: string | null;
  user_id: string | null;
};

type Campo = {
  id: string;
  nombre: string;
  tipo: string;
  categoria_aplicable: string | null;
  creado_en: string;
};

const ROLES_ASIGNABLES = ["admin_figurarte", "coordinador", "validador"] as const;

const ETIQUETA_CATEGORIA: Record<string, string> = {
  actor: "Actor",
  modelo: "Modelo",
  figurante: "Figurante",
  casting_plus: "Casting Plus",
};

const COLOR_ROL: Record<string, string> = {
  superadmin: "bg-primary/15 text-primary border-primary/30",
  admin_figurarte: "bg-primary/15 text-primary border-primary/30",
  coordinador: "bg-muted text-foreground border-border",
  validador: "bg-accent text-accent-foreground border-border",
  cliente: "bg-muted text-muted-foreground border-border",
};

function fecha(valor: string | null) {
  if (!valor) return "Nunca";
  return new Date(valor).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Administracion({ rol, email }: { rol: string; email: string }) {
  const esAdmin = rol === "admin_figurarte" || rol === "superadmin";
  const miEmail = email.toLowerCase();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [usoCampos, setUsoCampos] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardandoRol, setGuardandoRol] = useState<string | null>(null);

  const [dialogoUsuario, setDialogoUsuario] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoRol, setNuevoRol] = useState<string>("coordinador");
  const [invitando, setInvitando] = useState(false);

  const [dialogoCampo, setDialogoCampo] = useState(false);
  const [campoNombre, setCampoNombre] = useState("");
  const [campoTipo, setCampoTipo] = useState("texto");
  const [campoCategoria, setCampoCategoria] = useState("todas");
  const [creandoCampo, setCreandoCampo] = useState(false);

  async function cargar() {
    const [{ data: us, error: e1 }, { data: cps, error: e2 }, { data: valores }] =
      await Promise.all([
        supabase
          .from("usuarios")
          .select("id, email, rol, ultimo_acceso, user_id")
          .order("creado_en", { ascending: true }),
        supabase
          .from("campos_personalizados")
          .select("id, nombre, tipo, categoria_aplicable, creado_en")
          .order("creado_en", { ascending: true }),
        supabase.from("candidato_campos_valor").select("campo_id"),
      ]);

    if (e1 || e2) setError("No se han podido cargar todos los datos de administración.");

    const uso: Record<string, number> = {};
    for (const v of (valores ?? []) as { campo_id: string }[]) {
      uso[v.campo_id] = (uso[v.campo_id] ?? 0) + 1;
    }

    setUsuarios((us ?? []) as Usuario[]);
    setCampos((cps ?? []) as Campo[]);
    setUsoCampos(uso);
    setCargando(false);
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const equipo = useMemo(
    () => usuarios.filter((u) => u.rol !== "cliente"),
    [usuarios],
  );

  function esYo(u: Usuario) {
    return u.email.toLowerCase() === miEmail;
  }

  async function invitar() {
    const valor = nuevoEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      toast.error("Introduce un email válido.");
      return;
    }
    if (usuarios.some((u) => u.email.toLowerCase() === valor)) {
      toast.error("Ya existe un usuario con ese email.");
      return;
    }
    setInvitando(true);
    const { error: e } = await supabase
      .from("usuarios")
      .insert({ email: valor, rol: nuevoRol as RolUsuario });
    setInvitando(false);

    if (e) {
      toast.error("No se pudo invitar al usuario.");
      return;
    }
    toast.success("Usuario invitado. Entrará con su enlace mágico.");
    setDialogoUsuario(false);
    setNuevoEmail("");
    setNuevoRol("coordinador");
    await cargar();
  }

  async function cambiarRol(u: Usuario, valor: string) {
    if (!esAdmin || esYo(u) || u.rol === "superadmin") return;
    setGuardandoRol(u.id);
    const anterior = u.rol;
    setUsuarios((lista) =>
      lista.map((x) => (x.id === u.id ? { ...x, rol: valor } : x)),
    );
    const { error: e } = await supabase
      .from("usuarios")
      .update({ rol: valor as RolUsuario })
      .eq("id", u.id);
    setGuardandoRol(null);
    if (e) {
      setUsuarios((lista) =>
        lista.map((x) => (x.id === u.id ? { ...x, rol: anterior } : x)),
      );
      toast.error("No se pudo cambiar el rol.");
      return;
    }
    toast.success("Rol actualizado");
  }

  async function crearCampo() {
    if (campoNombre.trim().length < 2) {
      toast.error("Indica el nombre del campo.");
      return;
    }
    setCreandoCampo(true);
    const { error: e } = await supabase.from("campos_personalizados").insert({
      nombre: campoNombre.trim(),
      tipo: campoTipo as TipoCampo,
      categoria_aplicable:
        campoCategoria === "todas"
          ? null
          : (campoCategoria as CategoriaCandidato),
    });
    setCreandoCampo(false);
    if (e) {
      toast.error("No se pudo crear el campo.");
      return;
    }
    toast.success("Campo creado");
    setDialogoCampo(false);
    setCampoNombre("");
    setCampoTipo("texto");
    setCampoCategoria("todas");
    await cargar();
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando administración…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="border border-border bg-card p-4 text-sm text-primary">{error}</p>
      )}

      {/* Usuarios del equipo */}
      <section className="border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Usuarios del equipo</h2>
            <p className="text-xs text-muted-foreground">
              {equipo.length} {equipo.length === 1 ? "persona" : "personas"} con acceso al panel
            </p>
          </div>
          <Button size="sm" disabled={!esAdmin} onClick={() => setDialogoUsuario(true)}>
            <Plus className="size-4" />
            Invitar usuario
          </Button>
        </div>

        {!esAdmin && (
          <p className="flex items-start gap-2 border-b border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Solo un administrador puede invitar usuarios o cambiar roles. Puedes consultar la
            lista, pero no modificarla.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Rol</th>
                <th className="px-4 py-2 font-semibold">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {equipo.map((u) => {
                const propio = esYo(u);
                const bloqueado = !esAdmin || propio || u.rol === "superadmin";
                return (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="px-4 py-3">
                      <span className="break-all font-medium text-foreground">{u.email}</span>
                      {propio && (
                        <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {bloqueado ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={COLOR_ROL[u.rol]}>
                            {ETIQUETAS_ROL[u.rol] ?? u.rol}
                          </Badge>
                          {propio && esAdmin && (
                            <span className="text-xs text-muted-foreground">
                              No puedes cambiar tu propio rol
                            </span>
                          )}
                        </div>
                      ) : (
                        <Select
                          value={u.rol}
                          onValueChange={(v) => cambiarRol(u, v)}
                          disabled={guardandoRol === u.id}
                        >
                          <SelectTrigger className="h-9 w-[190px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES_ASIGNABLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ETIQUETAS_ROL[r] ?? r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fecha(u.ultimo_acceso)}</td>
                  </tr>
                );
              })}
              {equipo.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-sm text-muted-foreground">
                    Todavía no hay usuarios del equipo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Campos personalizados */}
      <section className="border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Campos personalizados de ficha
            </h2>
            <p className="text-xs text-muted-foreground">
              Se definen una vez y se activan por proyecto.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setDialogoCampo(true)}>
            <Plus className="size-4" />
            Nuevo campo
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Nombre</th>
                <th className="px-4 py-2 font-semibold">Tipo</th>
                <th className="px-4 py-2 font-semibold">Categoría aplicable</th>
                <th className="px-4 py-2 text-right font-semibold">En uso</th>
              </tr>
            </thead>
            <tbody>
              {campos.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium text-foreground">{c.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.tipo === "numero" ? "Número" : "Texto"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.categoria_aplicable
                      ? (ETIQUETA_CATEGORIA[c.categoria_aplicable] ?? c.categoria_aplicable)
                      : "Todas"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {usoCampos[c.id] ?? 0}
                  </td>
                </tr>
              ))}
              {campos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-muted-foreground">
                    Todavía no hay campos personalizados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ProgramasTv esAdmin={esAdmin} />

      <RegistroAccesos />



      {/* Diálogo invitar usuario */}
      <Dialog open={dialogoUsuario} onOpenChange={setDialogoUsuario}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
            <DialogDescription>
              Se creará la ficha con su rol. La cuenta se vincula sola la primera vez que esa
              persona entre con su enlace de acceso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nuevo_email">Email</Label>
              <Input
                id="nuevo_email"
                type="email"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nuevo_rol">Rol</Label>
              <Select value={nuevoRol} onValueChange={setNuevoRol}>
                <SelectTrigger id="nuevo_rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_ASIGNABLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ETIQUETAS_ROL[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoUsuario(false)} disabled={invitando}>
              Cancelar
            </Button>
            <Button onClick={invitar} disabled={invitando}>
              {invitando && <Loader2 className="size-4 animate-spin" />}
              Invitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo nuevo campo */}
      <Dialog open={dialogoCampo} onOpenChange={setDialogoCampo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo campo personalizado</DialogTitle>
            <DialogDescription>
              Se podrá activar en los proyectos que lo necesiten.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="campo_nombre">Nombre</Label>
              <Input
                id="campo_nombre"
                value={campoNombre}
                onChange={(e) => setCampoNombre(e.target.value)}
                placeholder="Ej. Talla de calzado"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campo_tipo">Tipo</Label>
              <Select value={campoTipo} onValueChange={setCampoTipo}>
                <SelectTrigger id="campo_tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="numero">Número</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campo_categoria">Categoría aplicable</Label>
              <Select value={campoCategoria} onValueChange={setCampoCategoria}>
                <SelectTrigger id="campo_categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {Object.entries(ETIQUETA_CATEGORIA).map(([valor, etiqueta]) => (
                    <SelectItem key={valor} value={valor}>
                      {etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoCampo(false)} disabled={creandoCampo}>
              Cancelar
            </Button>
            <Button onClick={crearCampo} disabled={creandoCampo}>
              {creandoCampo && <Loader2 className="size-4 animate-spin" />}
              Crear campo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
