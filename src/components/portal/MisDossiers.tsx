import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { misDossiersPortal, type DossierPortal } from "@/lib/portal.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function fecha(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-ES");
}

export function MisDossiers() {
  const cargar = useServerFn(misDossiersPortal);
  const [filas, setFilas] = useState<DossierPortal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await cargar({});
        if (vivo) setFilas(res);
      } catch {
        if (vivo) setError("No se pudieron cargar tus dossiers.");
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [cargar]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mis dossiers</h1>
        <p className="text-sm text-muted-foreground">
          Selecciones de candidatos que el equipo de FigurArte ha preparado para tus
          proyectos.
        </p>
      </header>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando dossiers…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : filas.length === 0 ? (
        <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay ningún dossier preparado para tus proyectos.
        </p>
      ) : (
        <ul className="space-y-3">
          {filas.map((d) => {
            const caducado =
              !!d.fecha_caducidad && new Date(d.fecha_caducidad).getTime() <= Date.now();
            return (
              <li
                key={d.id}
                className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{d.proyecto_nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Creado el {fecha(d.creado_en)} · {d.num_candidatos} candidatos ·{" "}
                    {d.fecha_caducidad
                      ? `caduca el ${fecha(d.fecha_caducidad)}`
                      : "sin caducidad"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={caducado ? "outline" : "default"}>
                    {caducado ? "Caducado" : "Disponible"}
                  </Badge>
                  {d.slug_publico && !caducado && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/dossier/${d.slug_publico}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> Abrir
                      </a>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
