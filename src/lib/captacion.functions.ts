import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ codigo: z.string().min(3).max(40) });

export type EnlaceCaptacion =
  | { estado: "ok"; convocatoria_id: string; categoria: string; canal: string }
  | { estado: "no_encontrado" }
  | { estado: "limite" };

/**
 * Resuelve un enlace corto de captación (/c/$codigo) sin exponer la tabla
 * `convocatorias_rrss`, que ya no es legible públicamente. Solo devuelve lo
 * imprescindible para redirigir al formulario de registro.
 */
export const resolverEnlaceCaptacion = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<EnlaceCaptacion> => {
    const { dentroDeLimite, LIMITES } = await import("@/lib/rate-limit.server");
    if (!dentroDeLimite("captacion", LIMITES.captacion)) return { estado: "limite" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: filas, error } = await supabaseAdmin.rpc("fn_resolver_enlace_captacion", {
      _codigo: data.codigo,
    });

    if (error) {
      console.error("[captacion] No se pudo resolver el enlace corto:", error);
      return { estado: "no_encontrado" };
    }

    const fila = (filas ?? [])[0];
    if (!fila) return { estado: "no_encontrado" };

    return {
      estado: "ok",
      convocatoria_id: fila.convocatoria_id,
      categoria: fila.categoria,
      canal: fila.canal,
    };
  });
