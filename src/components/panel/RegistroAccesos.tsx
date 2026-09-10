import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import {
  listarRegistroAccesos,
  type EntradaRegistro,
} from "@/lib/registro-accesos.functions";

const ETIQUETA_ACCION: Record<string, string> = {
  vio_ficha: "Vio una ficha",
  genero_dossier: "Generó un dossier",
  exporto_excel: "Exportó a Excel",
  borro_candidato: "Borró un candidato",
};

function fecha(valor: string) {
  return new Date(valor).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Registro mínimo de accesos a datos de candidatos (RGPD). Solo staff. */
export function RegistroAccesos() {
  const listar = useServerFn(listarRegistroAccesos);
  const [filas, setFilas] = useState<EntradaRegistro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setFilas(await listar());
      } catch {
        setError("No se pudo cargar el registro de accesos. Reintenta.");
      } finally {
        setCargando(false);
      }
    })();
  }, [listar]);

  return (
    <section className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-bold">Registro de accesos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Últimos 200 accesos del equipo a datos de candidatos.
        </p>
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando registro…
        </div>
      ) : error ? (
        <p className="px-4 py-6 text-sm text-destructive">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold">Quién</th>
                <th className="px-4 py-2 font-semibold">Acción</th>
                <th className="px-4 py-2 font-semibold">Candidato</th>
                <th className="px-4 py-2 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-border/60">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fecha(f.creado_en)}
                  </td>
                  <td className="px-4 py-3 text-foreground">{f.actor_email ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">
                    {ETIQUETA_ACCION[f.accion] ?? f.accion}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {f.codigo_candidato ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{f.detalle ?? "—"}</td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-muted-foreground">
                    Todavía no hay accesos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
