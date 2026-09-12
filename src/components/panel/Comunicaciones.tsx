import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Mail, MessageCircle, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { DialogoEnviarComunicacion } from "@/components/panel/DialogoEnviarComunicacion";

type Fila = {
  id: string;
  tipo: string;
  canal: string;
  origen: string | null;
  contenido: string | null;
  destinatario_tipo: string | null;
  enviado_en: string;
  candidato_id: string | null;
  cliente_id: string | null;
  proyecto_id: string | null;
  candidatos: { codigo: string; nombre: string } | null;
  clientes: { razon_social: string } | null;
  proyectos_casting: { nombre: string } | null;
};

type Plantilla = {
  id: string;
  evento: string;
  canal: string;
  activo: boolean;
  asunto: string | null;
  cuerpo: string | null;
  plantilla_wati: string | null;
};

const ETIQUETAS_TIPO: Record<string, string> = {
  aviso_seleccionado: "Seleccionado",
  aviso_no_seleccionado: "No seleccionado",
  express: "Comunicación puntual",
};

const CANALES = [
  { valor: "todos", etiqueta: "Todos los canales" },
  { valor: "email", etiqueta: "Email" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
];

const EVENTOS = [
  "contratado",
  "descartado",
  "preseleccionado",
  "enviado",
  "pendiente_validacion",
  "rechazado_por_candidato",
];

export function Comunicaciones() {
  const { staff } = useRouteContext({ from: "/panel" });
  const esAdmin = staff.esStaff
    ? ["superadmin", "admin_figurarte"].includes(staff.rol)
    : false;

  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [canal, setCanal] = useState("todos");
  const [verContenido, setVerContenido] = useState<Fila | null>(null);
  const [dialogoEnvio, setDialogoEnvio] = useState(false);
  const [pestana, setPestana] = useState("historial");

  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargarHistorial = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("comunicaciones")
      .select(
        "id, tipo, canal, origen, contenido, destinatario_tipo, enviado_en, candidato_id, cliente_id, proyecto_id, candidatos(codigo, nombre), clientes(razon_social), proyectos_casting(nombre)",
      )
      .order("enviado_en", { ascending: false })
      .limit(1000);
    if (err) setError("No se pudo cargar el historial de comunicaciones.");
    else setFilas((data ?? []) as unknown as Fila[]);
    setCargando(false);
  }, []);

  const cargarPlantillas = useCallback(async () => {
    const { data } = await supabase
      .from("plantillas_comunicacion")
      .select("id, evento, canal, activo, asunto, cuerpo, plantilla_wati")
      .order("evento")
      .order("canal");
    setPlantillas((data ?? []) as Plantilla[]);
  }, []);

  useEffect(() => {
    void cargarHistorial();
    void cargarPlantillas();
  }, [cargarHistorial, cargarPlantillas]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter((f) => {
      if (canal !== "todos" && f.canal !== canal) return false;
      if (!q) return true;
      const texto = [
        f.candidatos?.nombre,
        f.candidatos?.codigo,
        f.clientes?.razon_social,
        f.proyectos_casting?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [filas, busqueda, canal]);

  function actualizarLocal(id: string, campos: Partial<Plantilla>) {
    setPlantillas((prev) => prev.map((p) => (p.id === id ? { ...p, ...campos } : p)));
  }

  async function guardarPlantilla(p: Plantilla) {
    setGuardando(p.id);
    const { error: err } = await supabase
      .from("plantillas_comunicacion")
      .update({
        activo: p.activo,
        asunto: p.asunto,
        cuerpo: p.cuerpo,
        plantilla_wati: p.plantilla_wati,
      })
      .eq("id", p.id);
    setGuardando(null);
    if (err) toast.error("No se pudo guardar (¿tienes permisos de administrador?).");
    else toast.success("Plantilla guardada.");
  }

  async function crearPlantilla(evento: string, canalNuevo: "email" | "whatsapp") {
    const { error: err } = await supabase.from("plantillas_comunicacion").insert({
      evento,
      canal: canalNuevo,
      activo: false,
      asunto: canalNuevo === "email" ? "Mensaje de FigurArte" : null,
      cuerpo: canalNuevo === "email" ? "Hola {nombre}," : null,
    });
    if (err) toast.error("No se pudo crear la plantilla (¿ya existe para ese evento?).");
    else {
      toast.success("Plantilla creada.");
      void cargarPlantillas();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comunicaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de avisos, plantillas estándar y envíos puntuales.
        </p>
      </div>

      <Tabs value={pestana} onValueChange={setPestana}>
        <div className="md:hidden">
          <Label htmlFor="seccion-comunicaciones" className="sr-only">
            Seleccionar sección
          </Label>
          <Select value={pestana} onValueChange={setPestana}>
            <SelectTrigger id="seccion-comunicaciones" className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="historial">Historial</SelectItem>
              <SelectItem value="plantillas">Reglas y plantillas</SelectItem>
              <SelectItem value="enviar">Enviar comunicación</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TabsList className="hidden md:inline-flex">
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="plantillas">Reglas y plantillas</TabsTrigger>
          <TabsTrigger value="enviar">Enviar comunicación</TabsTrigger>
        </TabsList>

        <TabsContent value="historial" className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por candidato, cliente o proyecto…"
              className="sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {CANALES.map((c) => (
                <Button
                  key={c.valor}
                  type="button"
                  size="sm"
                  variant={canal === c.valor ? "default" : "outline"}
                  onClick={() => setCanal(c.valor)}
                >
                  {c.etiqueta}
                </Button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : visibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay comunicaciones que coincidan con la búsqueda.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Destinatario</th>
                    <th className="px-3 py-2 font-medium">Proyecto</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Origen</th>
                    <th className="px-3 py-2 font-medium">Canal</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((f) => (
                    <tr key={f.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        {f.clientes ? (
                          <span className="flex flex-wrap items-center gap-2">
                            {f.clientes.razon_social}
                            <Badge variant="outline">Cliente</Badge>
                          </span>
                        ) : f.candidatos ? (
                          `${f.candidatos.codigo} — ${f.candidatos.nombre}`
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">{f.proyectos_casting?.nombre ?? "—"}</td>
                      <td className="px-3 py-2">{ETIQUETAS_TIPO[f.tipo] ?? f.tipo}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {f.origen === "express" ? "Puntual" : "Automática"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="gap-1">
                          {f.canal === "whatsapp" ? (
                            <MessageCircle className="h-3 w-3" />
                          ) : (
                            <Mail className="h-3 w-3" />
                          )}
                          {f.canal === "whatsapp" ? "WhatsApp" : "Email"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(f.enviado_en).toLocaleString("es-ES")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!f.contenido}
                          onClick={() => setVerContenido(f)}
                        >
                          Ver contenido
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="plantillas" className="mt-6 space-y-4">
          {!esAdmin && (
            <p className="text-sm text-muted-foreground">
              Solo los administradores pueden editar las plantillas. Puedes consultarlas.
            </p>
          )}
          {esAdmin && <NuevaPlantilla onCrear={crearPlantilla} />}
          <div className="grid gap-4 lg:grid-cols-2">
            {plantillas.map((p) => (
              <div key={p.id} className="space-y-3 border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{p.evento}</h2>
                  <Badge variant="secondary">
                    {p.canal === "whatsapp" ? "WhatsApp" : "Email"}
                  </Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <Label htmlFor={`activo-${p.id}`} className="text-xs">
                      Activa
                    </Label>
                    <Switch
                      id={`activo-${p.id}`}
                      checked={p.activo}
                      disabled={!esAdmin}
                      onCheckedChange={(v) => actualizarLocal(p.id, { activo: v })}
                    />
                  </div>
                </div>

                {p.canal === "email" ? (
                  <>
                    <div>
                      <Label htmlFor={`asunto-${p.id}`}>Asunto</Label>
                      <Input
                        id={`asunto-${p.id}`}
                        className="mt-2"
                        value={p.asunto ?? ""}
                        disabled={!esAdmin}
                        onChange={(e) => actualizarLocal(p.id, { asunto: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cuerpo-${p.id}`}>Cuerpo</Label>
                      <Textarea
                        id={`cuerpo-${p.id}`}
                        className="mt-2 min-h-32"
                        value={p.cuerpo ?? ""}
                        disabled={!esAdmin}
                        onChange={(e) => actualizarLocal(p.id, { cuerpo: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Variables: {"{nombre}"} y {"{enlace}"}.
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor={`wati-${p.id}`}>Plantilla aprobada en Wati</Label>
                    <Input
                      id={`wati-${p.id}`}
                      className="mt-2"
                      value={p.plantilla_wati ?? ""}
                      disabled={!esAdmin}
                      placeholder="nombre_de_la_plantilla"
                      onChange={(e) =>
                        actualizarLocal(p.id, { plantilla_wati: e.target.value })
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      WhatsApp solo envía plantillas ya aprobadas en Wati: aquí se elige
                      cuál, no se redacta el texto.
                    </p>
                  </div>
                )}

                {esAdmin && (
                  <Button
                    size="sm"
                    onClick={() => guardarPlantilla(p)}
                    disabled={guardando === p.id}
                  >
                    {guardando === p.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enviar" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Envía un mensaje puntual a uno o varios candidatos, o a un cliente.
          </p>
          <Button onClick={() => setDialogoEnvio(true)}>Abrir formulario de envío</Button>
        </TabsContent>
      </Tabs>

      <DialogoEnviarComunicacion
        abierto={dialogoEnvio}
        onOpenChange={setDialogoEnvio}
        onEnviado={() => void cargarHistorial()}
      />

      <Dialog open={!!verContenido} onOpenChange={(v) => !v && setVerContenido(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Contenido enviado</DialogTitle>
            <DialogDescription>
              {verContenido
                ? new Date(verContenido.enviado_en).toLocaleString("es-ES")
                : ""}
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap break-words text-sm">
            {verContenido?.contenido ?? "Sin contenido guardado."}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NuevaPlantilla({
  onCrear,
}: {
  onCrear: (evento: string, canal: "email" | "whatsapp") => void;
}) {
  const [evento, setEvento] = useState(EVENTOS[0] as string);
  const [canal, setCanal] = useState<"email" | "whatsapp">("email");
  return (
    <div className="flex flex-wrap items-end gap-3 border border-border p-4">
      <div>
        <Label>Evento</Label>
        <Select value={evento} onValueChange={setEvento}>
          <SelectTrigger className="mt-2 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENTOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Canal</Label>
        <Select value={canal} onValueChange={(v) => setCanal(v as "email" | "whatsapp")}>
          <SelectTrigger className="mt-2 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={() => onCrear(evento, canal)}>
        <Plus className="mr-2 h-4 w-4" /> Crear plantilla
      </Button>
    </div>
  );
}
