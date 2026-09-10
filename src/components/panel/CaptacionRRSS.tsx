import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Categoria = "actor" | "modelo" | "figurante" | "casting_plus";

type Convocatoria = {
  id: string;
  nombre: string;
  categoria: Categoria;
  texto_generado: string;
  enlaces_por_canal: Record<string, string> | null;
  fecha_cierre: string | null;
  creado_en: string;
};

type Registro = { convocatoria_id: string; canal: string };

const CATEGORIAS: { valor: Categoria; etiqueta: string; plural: string }[] = [
  { valor: "actor", etiqueta: "Actor / Actriz", plural: "ACTORES Y ACTRICES" },
  { valor: "modelo", etiqueta: "Modelo", plural: "MODELOS" },
  { valor: "figurante", etiqueta: "Figurante", plural: "FIGURANTES" },
  { valor: "casting_plus", etiqueta: "Casting +", plural: "PERFILES CASTING +" },
];

const CANALES = [
  { campo: "instagram", etiqueta: "Instagram", prefijo: "ig" },
  { campo: "whatsapp", etiqueta: "WhatsApp", prefijo: "wa" },
  { campo: "web", etiqueta: "Web", prefijo: "web" },
] as const;

const BASE_ENLACES = "https://casting.figurarte.app";

function textoPlantilla(categoria: Categoria) {
  const cat = CATEGORIAS.find((c) => c.valor === categoria);
  return `📣 FigurArte busca ${cat?.plural ?? "CANDIDATOS"} para nuevos proyectos. Regístrate en el enlace 👇`;
}

function sufijo() {
  return Math.random().toString(36).slice(2, 6);
}

function BotonCopiar({ valor }: { valor: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(valor);
        setCopiado(true);
        toast.success("Enlace copiado");
        setTimeout(() => setCopiado(false), 1500);
      }}
    >
      {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span className="sr-only">Copiar enlace</span>
    </Button>
  );
}

export function CaptacionRRSS() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState<string>("");

  const [dialogo, setDialogo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("figurante");
  const [texto, setTexto] = useState(textoPlantilla("figurante"));
  const [cierre, setCierre] = useState("");

  async function cargar() {
    setCargando(true);
    const [{ data: conv }, { data: reg }] = await Promise.all([
      supabase
        .from("convocatorias_rrss")
        .select("id,nombre,categoria,texto_generado,enlaces_por_canal,fecha_cierre,creado_en")
        .order("creado_en", { ascending: false }),
      supabase.from("registros_captacion").select("convocatoria_id,canal"),
    ]);
    const lista = (conv ?? []) as unknown as Convocatoria[];
    setConvocatorias(lista);
    setRegistros((reg ?? []) as Registro[]);
    setSeleccionada((prev) => prev || lista[0]?.id || "");
    setCargando(false);
  }

  useEffect(() => {
    void cargar();
  }, []);

  const estadisticas = useMemo(() => {
    const mapa: Record<string, { total: number; canales: Record<string, number> }> = {};
    for (const r of registros) {
      const entrada = (mapa[r.convocatoria_id] ??= { total: 0, canales: {} });
      entrada.total += 1;
      entrada.canales[r.canal] = (entrada.canales[r.canal] ?? 0) + 1;
    }
    return mapa;
  }, [registros]);

  const actual = convocatorias.find((c) => c.id === seleccionada) ?? null;

  function abrirDialogo() {
    setNombre("");
    setCategoria("figurante");
    setTexto(textoPlantilla("figurante"));
    setCierre("");
    setDialogo(true);
  }

  async function crear() {
    if (nombre.trim().length < 2) {
      toast.error("Escribe un nombre para la convocatoria.");
      return;
    }
    setGuardando(true);

    const { data: existentes } = await supabase
      .from("convocatorias_rrss")
      .select("enlaces_por_canal");
    const usados = new Set<string>();
    for (const fila of existentes ?? []) {
      const e = (fila.enlaces_por_canal ?? {}) as Record<string, string>;
      for (const v of Object.values(e)) if (v) usados.add(v);
    }

    const enlaces: Record<string, string> = {};
    for (const canal of CANALES) {
      let codigo = `${canal.prefijo}-${sufijo()}`;
      while (usados.has(codigo)) codigo = `${canal.prefijo}-${sufijo()}`;
      usados.add(codigo);
      enlaces[canal.campo] = codigo;
    }

    const { data, error } = await supabase
      .from("convocatorias_rrss")
      .insert({
        nombre: nombre.trim(),
        categoria,
        texto_generado: texto.trim(),
        enlaces_por_canal: enlaces,
        fecha_cierre: cierre || null,
      })
      .select("id,nombre,categoria,texto_generado,enlaces_por_canal,fecha_cierre,creado_en")
      .maybeSingle();

    setGuardando(false);
    if (error || !data) {
      toast.error("No se pudo crear la convocatoria.");
      return;
    }
    const nueva = data as unknown as Convocatoria;
    setConvocatorias((prev) => [nueva, ...prev]);
    setSeleccionada(nueva.id);
    setDialogo(false);
    toast.success("Convocatoria creada con sus 3 enlaces.");
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Captación RRSS</h2>
          <p className="text-sm text-muted-foreground">
            Convocatorias con enlaces trazables por canal.
          </p>
        </div>
        <Button onClick={abrirDialogo}>
          <Plus className="mr-2 size-4" /> Nueva convocatoria
        </Button>
      </div>

      {convocatorias.length === 0 ? (
        <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Todavía no hay convocatorias. Crea la primera para obtener enlaces trazables.
        </div>
      ) : (
        <>
          <div className="border border-border bg-card p-4 sm:p-6">
            <Label htmlFor="convocatoria">Convocatoria</Label>
            <Select value={seleccionada} onValueChange={setSeleccionada}>
              <SelectTrigger id="convocatoria" className="mt-2 sm:max-w-md">
                <SelectValue placeholder="Elige una convocatoria" />
              </SelectTrigger>
              <SelectContent>
                {convocatorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {actual && (
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Texto sugerido
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
                    <p className="flex-1 whitespace-pre-wrap border border-border bg-background p-3 text-sm">
                      {actual.texto_generado || "Sin texto"}
                    </p>
                    <BotonCopiar valor={actual.texto_generado} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enlaces trazables
                  </p>
                  <div className="mt-2 space-y-2">
                    {CANALES.map((canal) => {
                      const codigo = (actual.enlaces_por_canal ?? {})[canal.campo];
                      if (!codigo) return null;
                      const url = `${BASE_ENLACES}/c/${codigo}`;
                      return (
                        <div
                          key={canal.campo}
                          className="flex flex-col gap-2 border border-border bg-background p-3 sm:flex-row sm:items-center"
                        >
                          <span className="w-24 shrink-0 text-sm font-medium">
                            {canal.etiqueta}
                          </span>
                          <span className="min-w-0 flex-1 break-all text-sm text-muted-foreground">
                            {url}
                          </span>
                          <BotonCopiar valor={url} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Convocatorias activas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Canal top</th>
                    <th className="px-4 py-3 font-semibold">Captados</th>
                    <th className="px-4 py-3 font-semibold">Cierre</th>
                  </tr>
                </thead>
                <tbody>
                  {convocatorias.map((c) => {
                    const est = estadisticas[c.id];
                    const top = est
                      ? Object.entries(est.canales).sort((a, b) => b[1] - a[1])[0]
                      : undefined;
                    const etiquetaTop = top
                      ? (CANALES.find((k) => k.campo === top[0])?.etiqueta ?? top[0])
                      : "—";
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{c.nombre}</td>
                        <td className="px-4 py-3">{etiquetaTop}</td>
                        <td className="px-4 py-3">{est?.total ?? 0}</td>
                        <td className="px-4 py-3">
                          {c.fecha_cierre
                            ? new Date(c.fecha_cierre).toLocaleDateString("es-ES")
                            : "Sin cierre"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva convocatoria</DialogTitle>
            <DialogDescription>
              Al guardar se generan tres enlaces cortos, uno por canal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Figurantes Costa del Sol"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={categoria}
                onValueChange={(v) => {
                  const cat = v as Categoria;
                  setCategoria(cat);
                  setTexto(textoPlantilla(cat));
                }}
              >
                <SelectTrigger id="categoria">
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
              <Label htmlFor="texto">Texto sugerido</Label>
              <Textarea
                id="texto"
                rows={4}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cierre">Fecha de cierre (opcional)</Label>
              <Input
                id="cierre"
                type="date"
                value={cierre}
                onChange={(e) => setCierre(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={crear} disabled={guardando} className="w-full sm:w-auto">
              {guardando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Crear convocatoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
