import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { enviarComunicacionExpress } from "@/lib/comunicaciones-express.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";

export type DestinatarioPrecargado = { id: string; etiqueta: string };

type FilaCandidato = { id: string; codigo: string; nombre: string };
type FilaCliente = { id: string; razon_social: string };

/**
 * Envío puntual de una comunicación (email o WhatsApp) a candidatos y/o clientes.
 * Reutilizable desde la pantalla de Comunicaciones, el listado de candidatos,
 * la ficha de proyecto y el listado de clientes.
 */
export function DialogoEnviarComunicacion({
  abierto,
  onOpenChange,
  candidatosIniciales = [],
  clientesIniciales = [],
  proyectoId = null,
  onEnviado,
}: {
  abierto: boolean;
  onOpenChange: (v: boolean) => void;
  candidatosIniciales?: DestinatarioPrecargado[];
  clientesIniciales?: DestinatarioPrecargado[];
  proyectoId?: string | null;
  onEnviado?: () => void;
}) {
  const enviar = useServerFn(enviarComunicacionExpress);
  const [canal, setCanal] = useState<"email" | "whatsapp">("email");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [plantillaWati, setPlantillaWati] = useState("");
  const [plantillasWati, setPlantillasWati] = useState<string[]>([]);
  const [candidatos, setCandidatos] = useState<DestinatarioPrecargado[]>([]);
  const [clientes, setClientes] = useState<DestinatarioPrecargado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [opcionesCand, setOpcionesCand] = useState<FilaCandidato[]>([]);
  const [opcionesCli, setOpcionesCli] = useState<FilaCliente[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCandidatos(candidatosIniciales);
    setClientes(clientesIniciales);
    setBusqueda("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    (async () => {
      const [{ data: c }, { data: cl }, { data: pw }] = await Promise.all([
        supabase.from("candidatos").select("id, codigo, nombre").order("codigo").limit(1000),
        supabase.from("clientes").select("id, razon_social").order("razon_social").limit(500),
        supabase
          .from("plantillas_comunicacion")
          .select("plantilla_wati")
          .eq("canal", "whatsapp")
          .eq("activo", true),
      ]);
      if (!activo) return;
      setOpcionesCand((c ?? []) as FilaCandidato[]);
      setOpcionesCli((cl ?? []) as FilaCliente[]);
      setPlantillasWati(
        Array.from(
          new Set(
            ((pw ?? []) as { plantilla_wati: string | null }[])
              .map((p) => p.plantilla_wati)
              .filter((v): v is string => Boolean(v && v.trim())),
          ),
        ),
      );
    })();
    return () => {
      activo = false;
    };
  }, [abierto]);

  const resultadosCand = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return opcionesCand
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [busqueda, opcionesCand]);

  const resultadosCli = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return opcionesCli.filter((c) => c.razon_social.toLowerCase().includes(q)).slice(0, 20);
  }, [busqueda, opcionesCli]);

  function alternarCandidato(f: FilaCandidato) {
    setCandidatos((prev) =>
      prev.some((p) => p.id === f.id)
        ? prev.filter((p) => p.id !== f.id)
        : [...prev, { id: f.id, etiqueta: `${f.codigo} — ${f.nombre}` }],
    );
  }
  function alternarCliente(f: FilaCliente) {
    setClientes((prev) =>
      prev.some((p) => p.id === f.id)
        ? prev.filter((p) => p.id !== f.id)
        : [...prev, { id: f.id, etiqueta: f.razon_social }],
    );
  }

  const total = candidatos.length + clientes.length;

  async function hacerEnvio() {
    if (total === 0) {
      toast.error("Elige al menos un destinatario.");
      return;
    }
    if (canal === "email" && (!asunto.trim() || !cuerpo.trim())) {
      toast.error("Escribe el asunto y el cuerpo del correo.");
      return;
    }
    if (canal === "whatsapp" && !plantillaWati.trim()) {
      toast.error("Elige la plantilla de WhatsApp aprobada en Wati.");
      return;
    }
    setEnviando(true);
    try {
      const r = await enviar({
        data: {
          canal,
          asunto: asunto.trim(),
          cuerpo: cuerpo.trim(),
          plantillaWati: plantillaWati.trim(),
          candidatoIds: candidatos.map((c) => c.id),
          clienteIds: clientes.map((c) => c.id),
          proyectoId,
        },
      });
      const partes = [`${r.enviados} enviada(s)`];
      if (r.omitidos.length) partes.push(`${r.omitidos.length} omitida(s)`);
      if (r.fallidos.length) partes.push(`${r.fallidos.length} fallida(s)`);
      toast.success(partes.join(" · "));
      if (r.omitidos.length) {
        toast.warning(
          `Omitidos: ${r.omitidos.map((o) => `${o.destinatario} (${o.motivo})`).join("; ")}`,
        );
      }
      if (r.enviados > 0) {
        onEnviado?.();
        onOpenChange(false);
        setAsunto("");
        setCuerpo("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar comunicación</DialogTitle>
          <DialogDescription>
            Envío puntual a candidatos y/o clientes. Queda registrado en el historial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Canal</Label>
            <Select value={canal} onValueChange={(v) => setCanal(v as "email" | "whatsapp")}>
              <SelectTrigger className="mt-2 sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="busca-dest">Destinatarios ({total})</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidatos.map((c) => (
                <Badge
                  key={c.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setCandidatos((p) => p.filter((x) => x.id !== c.id))}
                >
                  {c.etiqueta} ✕
                </Badge>
              ))}
              {clientes.map((c) => (
                <Badge
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => setClientes((p) => p.filter((x) => x.id !== c.id))}
                >
                  {c.etiqueta} ✕
                </Badge>
              ))}
            </div>
            <Input
              id="busca-dest"
              className="mt-2"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar candidato (nombre o FIG-00001) o cliente…"
            />
            {(resultadosCand.length > 0 || resultadosCli.length > 0) && (
              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto border border-border p-2">
                {resultadosCli.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={clientes.some((x) => x.id === c.id)}
                      onCheckedChange={() => alternarCliente(c)}
                    />
                    <span>{c.razon_social}</span>
                    <Badge variant="outline">Cliente</Badge>
                  </label>
                ))}
                {resultadosCand.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={candidatos.some((x) => x.id === c.id)}
                      onCheckedChange={() => alternarCandidato(c)}
                    />
                    <span>
                      {c.codigo} — {c.nombre}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {canal === "email" ? (
            <>
              <div>
                <Label htmlFor="asunto-express">Asunto</Label>
                <Input
                  id="asunto-express"
                  className="mt-2"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cuerpo-express">Mensaje</Label>
                <Textarea
                  id="cuerpo-express"
                  className="mt-2 min-h-40"
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  placeholder="Puedes usar {nombre} y {enlace}."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Variables disponibles: {"{nombre}"} y {"{enlace}"}.
                </p>
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="wati-express">Plantilla de WhatsApp (aprobada en Wati)</Label>
              {plantillasWati.length > 0 ? (
                <Select value={plantillaWati} onValueChange={setPlantillaWati}>
                  <SelectTrigger id="wati-express" className="mt-2">
                    <SelectValue placeholder="Elige una plantilla…" />
                  </SelectTrigger>
                  <SelectContent>
                    {plantillasWati.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="wati-express"
                  className="mt-2"
                  value={plantillaWati}
                  onChange={(e) => setPlantillaWati(e.target.value)}
                  placeholder="nombre_de_la_plantilla_aprobada"
                />
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                WhatsApp solo admite plantillas ya aprobadas en Wati; se envían las
                variables nombre y enlace.
              </p>
            </div>
          )}

          <Button className="w-full" onClick={hacerEnvio} disabled={enviando}>
            {enviando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
