import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Loader2 } from "lucide-react";

type Fila = {
  id: string;
  tipo: string;
  canal: string;
  enviado_en: string;
  candidato_id: string | null;
  proyecto_id: string | null;
  candidatos: { codigo: string; nombre: string } | null;
  proyectos_casting: { nombre: string } | null;
};

const ETIQUETAS_TIPO: Record<string, string> = {
  aviso_seleccionado: "Seleccionado",
  aviso_no_seleccionado: "No seleccionado",
};

const CANALES = [
  { valor: "todos", etiqueta: "Todos los canales" },
  { valor: "email", etiqueta: "Email" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
];

export function Comunicaciones() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [canal, setCanal] = useState("todos");

  useEffect(() => {
    let activo = true;
    (async () => {
      const { data, error: err } = await supabase
        .from("comunicaciones")
        .select(
          "id, tipo, canal, enviado_en, candidato_id, proyecto_id, candidatos(codigo, nombre), proyectos_casting(nombre)",
        )
        .order("enviado_en", { ascending: false })
        .limit(1000);
      if (!activo) return;
      if (err) setError("No se pudo cargar el historial de comunicaciones.");
      else setFilas((data ?? []) as unknown as Fila[]);
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter((f) => {
      if (canal !== "todos" && f.canal !== canal) return false;
      if (!q) return true;
      const texto = [
        f.candidatos?.nombre,
        f.candidatos?.codigo,
        f.proyectos_casting?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [filas, busqueda, canal]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comunicaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de avisos enviados a los candidatos (email y WhatsApp).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por candidato o proyecto…"
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
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Candidato</th>
                <th className="px-3 py-2 font-medium">Proyecto</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Canal</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    {f.candidatos
                      ? `${f.candidatos.codigo} — ${f.candidatos.nombre}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{f.proyectos_casting?.nombre ?? "—"}</td>
                  <td className="px-3 py-2">{ETIQUETAS_TIPO[f.tipo] ?? f.tipo}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
