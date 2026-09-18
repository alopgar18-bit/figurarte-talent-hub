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
  excluidosPorInactivos: number;
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

    let idsObjetivo = data.candidatoIds;
    let excluidosPorInactivos = 0;

    // Al publicar, la base de datos solo admite candidatos activos (disponible):
    // filtramos antes para devolver un mensaje útil en vez de un error crudo.
    if (data.publicar) {
      const disponibles = new Set<string>();
      for (let i = 0; i < data.candidatoIds.length; i += TAMANO_BLOQUE) {
        const bloque = data.candidatoIds.slice(i, i + TAMANO_BLOQUE);
        const { data: filas } = await supabaseAdmin
          .from("candidatos")
          .select("id, disponible")
          .in("id", bloque);
        for (const fila of filas ?? []) {
          if (fila.disponible) disponibles.add(fila.id);
        }
      }
      idsObjetivo = data.candidatoIds.filter((id) => disponibles.has(id));
      excluidosPorInactivos = data.candidatoIds.length - idsObjetivo.length;
    }

    let actualizados = 0;
    let fallidos = 0;

    for (let i = 0; i < idsObjetivo.length; i += TAMANO_BLOQUE) {
      const bloque = idsObjetivo.slice(i, i + TAMANO_BLOQUE);
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

    return { actualizados, fallidos, excluidosPorInactivos };
  });
