import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { crearSolicitudProyecto } from "@/lib/portal.functions";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Categoria = "actor" | "modelo" | "figurante" | "casting_plus";

const CATEGORIAS: { valor: Categoria; etiqueta: string }[] = [
  { valor: "actor", etiqueta: "Actores" },
  { valor: "modelo", etiqueta: "Modelos" },
  { valor: "figurante", etiqueta: "Figurantes" },
  { valor: "casting_plus", etiqueta: "Casting Plus" },
];

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  revisada: "Revisada",
  convertida: "Convertida en proyecto",
};

type Solicitud = {
  id: string;
  nombre_proyecto: string;
  categoria: string;
  estado: string;
  recibida_en: string;
  num_candidatos_aprox: number | null;
};

export function SolicitarProyecto({ clienteId }: { clienteId: string }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("figurante");
  const [numero, setNumero] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const enviarSolicitud = useServerFn(crearSolicitudProyecto);

  async function cargar() {
    const { data } = await supabase
      .from("solicitudes_proyecto")
      .select("id,nombre_proyecto,categoria,estado,recibida_en,num_candidatos_aprox")
      .order("recibida_en", { ascending: false });
    setSolicitudes((data ?? []) as Solicitud[]);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("Indica el nombre del proyecto.");
      return;
    }
    setEnviando(true);
    try {
      await enviarSolicitud({
        data: {
          nombreProyecto: nombre.trim(),
          categoria,
          numAprox: numero.trim() ? Number(numero) : null,
          descripcion: descripcion.trim() || null,
          fechaNecesaria: fecha || null,
        },
      });
    } catch {
      setEnviando(false);
      toast.error("No se pudo enviar la solicitud. Inténtalo de nuevo.");
      return;
    }
    setEnviando(false);
    setEnviada(true);
    setNombre("");
    setNumero("");
    setDescripcion("");
    setFecha("");
    await cargar();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Solicitar proyecto</h1>
        <p className="text-sm text-muted-foreground">
          Cuéntanos qué perfiles necesitas y el equipo de FigurArte se pone en marcha.
        </p>
      </header>

      {enviada && (
        <div className="flex items-start gap-3 border border-primary/40 bg-primary/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Solicitud enviada</p>
            <p className="text-sm text-muted-foreground">
              La hemos recibido correctamente. La verás abajo en tu histórico y el equipo se
              pondrá en contacto contigo.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <form onSubmit={enviar} className="space-y-4 border border-border bg-card p-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del proyecto</Label>
            <Input
              id="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Campaña de verano 2026"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría buscada</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as Categoria)}
              >
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
              <Label htmlFor="numero">Nº de candidatos aproximado</Label>
              <Input
                id="numero"
                type="number"
                min={1}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción / briefing</Label>
            <Textarea
              id="descripcion"
              rows={6}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Perfiles, edades, ubicación, tipo de rodaje, referencias…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha necesaria</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={enviando} className="w-full sm:w-auto">
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar solicitud
          </Button>
        </form>

        <aside className="h-fit border border-border bg-muted/30 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Qué pasa después</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            La solicitud llega al equipo de FigurArte con una notificación. El administrador
            la revisa, la convierte en proyecto y arranca la captación de candidatos.
          </p>
        </aside>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tus solicitudes
        </h2>
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : solicitudes.length === 0 ? (
          <div className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Todavía no has enviado ninguna solicitud.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Proyecto</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{s.nombre_proyecto}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {CATEGORIAS.find((c) => c.valor === s.categoria)?.etiqueta ??
                        s.categoria}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.estado === "pendiente" ? "secondary" : "default"}>
                        {ETIQUETA_ESTADO[s.estado] ?? s.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.recibida_en).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
