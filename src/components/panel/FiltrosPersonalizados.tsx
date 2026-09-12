import { useEffect, useState } from "react";
import { Bookmark, Plus, Trash2, X } from "lucide-react";
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
import { MultiSelect } from "@/components/panel/MultiSelect";
import {
  CAMPOS_FILTRABLES,
  OPERADORES_POR_TIPO,
  campoPorNombre,
  describirCondicion,
  type Condicion,
  type Operador,
} from "@/lib/filtros-personalizados";

type FiltroGuardado = {
  id: string;
  nombre: string;
  condiciones: unknown;
};

function condicionInicial(campo: string): Condicion {
  const def = campoPorNombre(campo);
  const tipo = def?.tipo ?? "texto";
  const operador = (OPERADORES_POR_TIPO[tipo][0]?.valor ?? "contiene") as Operador;
  const base: Condicion = { campo, operador };
  if (tipo === "booleano") base.booleano = true;
  if (tipo === "array" || tipo === "catalogo") base.valores = [];
  return base;
}

export function FiltrosPersonalizados({
  condiciones,
  alCambiar,
  basicos,
  alCargarBasicos,
}: {
  condiciones: Condicion[];
  alCambiar: (c: Condicion[]) => void;
  /** Resto de filtros de la pantalla, para guardarlos junto a las condiciones. */
  basicos: Record<string, unknown>;
  alCargarBasicos: (b: Record<string, unknown>) => void;
}) {
  const [dialogo, setDialogo] = useState(false);
  const [borrador, setBorrador] = useState<Condicion[]>([]);
  const [guardados, setGuardados] = useState<FiltroGuardado[]>([]);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function cargarGuardados() {
    const { data } = await supabase
      .from("filtros_guardados")
      .select("id, nombre, condiciones")
      .order("creado_en", { ascending: false });
    setGuardados((data ?? []) as FiltroGuardado[]);
  }

  useEffect(() => {
    void cargarGuardados();
  }, []);

  function abrir() {
    setBorrador(condiciones.length ? condiciones.map((c) => ({ ...c })) : []);
    setAviso(null);
    setDialogo(true);
  }

  function actualizar(indice: number, cambios: Partial<Condicion>) {
    setBorrador((prev) =>
      prev.map((c, i) => (i === indice ? { ...c, ...cambios } : c)),
    );
  }

  function cambiarCampo(indice: number, campo: string) {
    setBorrador((prev) => prev.map((c, i) => (i === indice ? condicionInicial(campo) : c)));
  }

  async function guardarActual() {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    setGuardando(true);
    setAviso(null);
    const { data: sesion } = await supabase.auth.getUser();
    const usuarioId = sesion.user?.id;
    if (!usuarioId) {
      setAviso("Tu sesión ha caducado. Vuelve a entrar para guardar el filtro.");
      setGuardando(false);
      return;
    }
    const { error } = await supabase.from("filtros_guardados").insert({
      usuario_id: usuarioId,
      nombre,
      condiciones: JSON.parse(
        JSON.stringify({ version: 1, condiciones: borrador, basicos }),
      ),
    });
    setGuardando(false);
    if (error) {
      setAviso("No se ha podido guardar el filtro.");
      return;
    }
    setNombreNuevo("");
    setAviso(`Filtro "${nombre}" guardado.`);
    await cargarGuardados();
  }

  function cargarFiltro(id: string) {
    const f = guardados.find((g) => g.id === id);
    if (!f) return;
    const cont = (f.condiciones ?? {}) as {
      condiciones?: Condicion[];
      basicos?: Record<string, unknown>;
    };
    const lista = Array.isArray(cont.condiciones) ? cont.condiciones : [];
    setBorrador(lista.map((c) => ({ ...c })));
    alCambiar(lista);
    if (cont.basicos && typeof cont.basicos === "object") alCargarBasicos(cont.basicos);
    setAviso(`Filtro "${f.nombre}" cargado.`);
  }

  async function borrarFiltro(id: string) {
    const { error } = await supabase.from("filtros_guardados").delete().eq("id", id);
    if (error) {
      setAviso("No se ha podido eliminar el filtro.");
      return;
    }
    await cargarGuardados();
    setAviso("Filtro eliminado.");
  }

  function aplicar() {
    alCambiar(borrador.filter((c) => c.campo));
    setDialogo(false);
  }

  return (
    <>
      <Button variant="outline" onClick={abrir}>
        <Plus className="size-4" /> Nuevo filtro
        {condiciones.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {condiciones.length}
          </Badge>
        )}
      </Button>

      {condiciones.length > 0 && (
        <div className="flex w-full flex-wrap gap-2">
          {condiciones.map((c, i) => (
            <Badge key={`${c.campo}-${i}`} variant="secondary" className="gap-1">
              {describirCondicion(c)}
              <button
                type="button"
                aria-label="Quitar condición"
                onClick={() => alCambiar(condiciones.filter((_, j) => j !== i))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={() => alCambiar([])}>
            Quitar todos
          </Button>
        </div>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filtro a medida</DialogTitle>
            <DialogDescription>
              Combina condiciones sobre cualquier campo de la ficha. Todas se aplican a
              la vez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {borrador.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no has añadido ninguna condición.
              </p>
            )}

            {borrador.map((cond, i) => {
              const def = campoPorNombre(cond.campo);
              const tipo = def?.tipo ?? "texto";
              return (
                <div
                  key={i}
                  className="space-y-2 border border-border p-3 sm:flex sm:items-end sm:gap-2 sm:space-y-0"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label className="text-xs">Campo</Label>
                    <Select value={cond.campo} onValueChange={(v) => cambiarCampo(i, v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {CAMPOS_FILTRABLES.map((c) => (
                          <SelectItem key={c.campo} value={c.campo}>
                            {c.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full space-y-1 sm:w-44">
                    <Label className="text-xs">Condición</Label>
                    <Select
                      value={cond.operador}
                      onValueChange={(v) => actualizar(i, { operador: v as Operador })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERADORES_POR_TIPO[tipo].map((o) => (
                          <SelectItem key={o.valor} value={o.valor}>
                            {o.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full space-y-1 sm:w-56">
                    <Label className="text-xs">Valor</Label>
                    {(cond.operador === "contiene" || cond.operador === "igual") &&
                      tipo !== "catalogo" && (
                        <Input
                          value={cond.texto ?? ""}
                          onChange={(e) => actualizar(i, { texto: e.target.value })}
                          placeholder="Escribe un valor"
                        />
                      )}

                    {tipo === "catalogo" && cond.operador === "igual" && (
                      <Select
                        value={cond.texto ?? ""}
                        onValueChange={(v) => actualizar(i, { texto: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Elige un valor" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {(def?.opciones ?? []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {(cond.operador === "alguno" || cond.operador === "todos") && (
                      <MultiSelect
                        etiqueta="Valores"
                        opciones={(def?.opciones ?? []).map((o) => ({
                          valor: o,
                          etiqueta: o,
                        }))}
                        seleccionados={cond.valores ?? []}
                        alCambiar={(v) => actualizar(i, { valores: v })}
                      />
                    )}

                    {cond.operador === "rango" && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={cond.min ?? ""}
                          onChange={(e) => actualizar(i, { min: e.target.value })}
                          placeholder="Mín."
                        />
                        <Input
                          type="number"
                          value={cond.max ?? ""}
                          onChange={(e) => actualizar(i, { max: e.target.value })}
                          placeholder="Máx."
                        />
                      </div>
                    )}

                    {cond.operador === "es" && (
                      <Select
                        value={cond.booleano ? "si" : "no"}
                        onValueChange={(v) => actualizar(i, { booleano: v === "si" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="si">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar condición"
                    onClick={() => setBorrador((p) => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}

            <Button
              variant="outline"
              onClick={() =>
                setBorrador((p) => [
                  ...p,
                  condicionInicial(CAMPOS_FILTRABLES[0]?.campo ?? "nombre"),
                ])
              }
            >
              <Plus className="size-4" /> Añadir condición
            </Button>

            <div className="space-y-2 border-t border-border pt-4">
              <Label className="text-xs">Mis filtros guardados</Label>
              {guardados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no has guardado ningún filtro.
                </p>
              ) : (
                <div className="space-y-1">
                  {guardados.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">{f.nombre}</span>
                      <span className="flex shrink-0 gap-1">
                        <Button size="sm" variant="outline" onClick={() => cargarFiltro(f.id)}>
                          Cargar
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Eliminar ${f.nombre}`}
                          onClick={() => void borrarFiltro(f.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Input
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  placeholder="Nombre para guardar este filtro"
                />
                <Button
                  variant="secondary"
                  disabled={guardando || !nombreNuevo.trim()}
                  onClick={() => void guardarActual()}
                >
                  <Bookmark className="size-4" /> Guardar
                </Button>
              </div>
              {aviso && <p className="text-sm text-muted-foreground">{aviso}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button onClick={aplicar}>Aplicar filtro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
