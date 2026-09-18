import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const entradaPublicacion = z.object({
  candidatoIds: z.array(z.string().uuid()).min(1).max(10000),
  publicar: z.boolean(),
});

export type ResultadoPublicacionWeb = {
  actualizados: number;
  fallidos: number;
};

const TAMANO_BLOQUE = 200;

/**
 * Publica o retira candidatos de la web pública en bloques.
 * Va por servidor porque un `.in()` con miles de UUIDs genera una URL
 * demasiado larga para PostgREST si se hace desde el navegador.
 * Más restrictivo que asignar a proyecto: solo superadmin/admin_figurarte.
 */
export const cambiarPublicacionWebMasiva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof entradaPublicacion>) =>
    entradaPublicacion.parse(data),
  )
  .handler(async ({ data, context }): Promise<ResultadoPublicacionWeb> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: staff } = await supabaseAdmin
      .from("usuarios")
      .select("rol")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!staff || !["superadmin", "admin_figurarte"].includes(staff.rol)) {
      throw new Error("Solo un administrador puede cambiar la publicación en la web.");
    }

    let actualizados = 0;
    let fallidos = 0;

    for (let i = 0; i < data.candidatoIds.length; i += TAMANO_BLOQUE) {
      const bloque = data.candidatoIds.slice(i, i + TAMANO_BLOQUE);
      const { error, count } = await supabaseAdmin
        .from("candidatos")
        .update(
          { disponible_publico: data.publicar, revisado_publico: true },
          { count: "exact" },
        )
        .in("id", bloque);
      if (error) {
        console.error("[publicacion-web] Falló un bloque:", error);
        fallidos += bloque.length;
      } else {
        actualizados += count ?? bloque.length;
      }
    }

    return { actualizados, fallidos };
  });
