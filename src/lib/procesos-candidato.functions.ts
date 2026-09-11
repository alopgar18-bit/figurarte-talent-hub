import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProcesoCandidato = {
  proyecto: string;
  categoria: string;
  estado: "preseleccionado" | "enviado" | "contratado";
  origen: "manual" | "web_directa";
  fecha: string;
};

/** Devuelve al candidato únicamente la información de sus propios procesos. */
export const obtenerMisProcesos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProcesoCandidato[]> => {
    const { data: candidato, error: errorCandidato } = await context.supabase
      .from("candidatos")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (errorCandidato) throw new Error("No se pudo comprobar tu ficha.");
    if (!candidato) throw new Error("No hemos encontrado tu ficha.");

    const { data, error } = await context.supabase
      .from("proyecto_candidatos")
      .select("estado, origen, creado_en, proyectos_casting(nombre, brief_publico)")
      .eq("candidato_id", candidato.id)
      .order("creado_en", { ascending: false });

    if (error) throw new Error("No se pudieron cargar tus procesos de casting.");

    return (data ?? []).map((fila) => {
      const proyecto = fila.proyectos_casting as {
        nombre: string;
        brief_publico: unknown;
      } | null;
      const brief =
        proyecto?.brief_publico && typeof proyecto.brief_publico === "object"
          ? (proyecto.brief_publico as Record<string, unknown>)
          : null;
      const categoria =
        typeof brief?.["categoria"] === "string" ? brief["categoria"] : "Casting";

      return {
        proyecto: proyecto?.nombre ?? "Proceso de casting",
        categoria,
        estado: fila.estado,
        origen: fila.origen,
        fecha: fila.creado_en,
      };
    });
  });