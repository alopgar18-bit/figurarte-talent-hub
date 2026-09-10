import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONFIRMACION = "ELIMINAR";

export type MisDatos = {
  candidato: Record<string, unknown>;
  historial: { proyecto: string; fecha: string; estado: string }[];
  generado_en: string;
};

/** Derecho de acceso y portabilidad: el candidato descarga sus propios datos. */
export const obtenerMisDatos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MisDatos> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: candidato, error } = await supabaseAdmin
      .from("candidatos")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("No se pudieron cargar tus datos.");
    if (!candidato) throw new Error("No hemos encontrado tu ficha.");

    const { data: historial, error: errHist } = await supabaseAdmin
      .from("proyecto_candidatos")
      .select("estado, creado_en, proyectos_casting(nombre)")
      .eq("candidato_id", candidato.id)
      .order("creado_en", { ascending: false });
    if (errHist) throw new Error("No se pudo cargar tu historial de proyectos.");

    return {
      candidato: candidato as unknown as Record<string, unknown>,
      historial: (historial ?? []).map((h) => {
        const p = h.proyectos_casting as { nombre: string } | null;
        return {
          proyecto: p?.nombre ?? "Proyecto",
          fecha: h.creado_en,
          estado: h.estado,
        };
      }),
      generado_en: new Date().toISOString(),
    };
  });

export type ResultadoBorrado =
  | { estado: "ok" }
  | { estado: "error"; mensaje: string };

type AdminCliente = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

/**
 * Derecho al olvido: borra archivos y todas las filas relacionadas del
 * candidato. Cualquier fallo se propaga: nunca se dice "borrado" a medias.
 */
async function borrarCandidatoCompleto(
  admin: AdminCliente,
  candidatoId: string,
): Promise<ResultadoBorrado> {
  const { data: candidato, error: errLectura } = await admin
    .from("candidatos")
    .select("id, user_id, fotos")
    .eq("id", candidatoId)
    .maybeSingle();
  if (errLectura) return { estado: "error", mensaje: "No se pudo leer la ficha." };
  if (!candidato) return { estado: "error", mensaje: "La ficha ya no existe." };

  // 1. Fotos del bucket privado (las de prueba con URL externa se ignoran).
  const rutas = (candidato.fotos ?? []).filter(
    (f: string) => !/^https?:\/\//i.test(f) && !f.startsWith("placeholder://"),
  );
  if (rutas.length) {
    const { error } = await admin.storage.from("candidatos-fotos").remove(rutas);
    if (error) console.error("[rgpd] No se pudieron borrar todas las fotos:", error);
  }

  // 2. Vídeos temporales del propio usuario.
  if (candidato.user_id) {
    const { data: archivos } = await admin.storage
      .from("candidatos-videos-temp")
      .list(candidato.user_id);
    const rutasVideo = (archivos ?? []).map((a) => `${candidato.user_id}/${a.name}`);
    if (rutasVideo.length) {
      const { error } = await admin.storage
        .from("candidatos-videos-temp")
        .remove(rutasVideo);
      if (error) console.error("[rgpd] No se pudieron borrar los vídeos:", error);
    }
  }

  // 3. Filas relacionadas, antes de la ficha.
  const relacionadas = [
    "proyecto_candidatos",
    "candidato_campos_valor",
    "asignaciones_pendientes_rgpd",
    "registros_captacion",
  ] as const;

  for (const tabla of relacionadas) {
    const { error } = await admin.from(tabla).delete().eq("candidato_id", candidatoId);
    if (error) {
      console.error(`[rgpd] No se pudo limpiar ${tabla}:`, error);
      return {
        estado: "error",
        mensaje: "No se han podido borrar todos los datos asociados.",
      };
    }
  }

  const { error: errFicha } = await admin.from("candidatos").delete().eq("id", candidatoId);
  if (errFicha) {
    console.error("[rgpd] No se pudo borrar la ficha:", errFicha);
    return { estado: "error", mensaje: "No se ha podido borrar la ficha." };
  }

  return { estado: "ok" };
}

const entradaConfirmacion = z.object({
  confirmacion: z.literal(CONFIRMACION),
});

/** El propio candidato ejerce su derecho al olvido. */
export const eliminarMisDatos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entradaConfirmacion.parse(data))
  .handler(async ({ context }): Promise<ResultadoBorrado> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!candidato) return { estado: "error", mensaje: "No hemos encontrado tu ficha." };

    const resultado = await borrarCandidatoCompleto(supabaseAdmin, candidato.id);
    if (resultado.estado === "ok") {
      const { anotarAcceso } = await import("@/lib/registro-accesos.server");
      await anotarAcceso(supabaseAdmin, {
        userId: context.userId,
        accion: "borro_candidato",
        detalle: "Borrado solicitado por la propia persona",
      });
    }
    return resultado;
  });

const entradaBorradoStaff = z.object({
  candidatoId: z.string().uuid(),
  confirmacion: z.literal(CONFIRMACION),
});

/** El equipo ejecuta un borrado solicitado por otro canal. */
export const eliminarCandidatoStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entradaBorradoStaff.parse(data))
  .handler(async ({ data, context }): Promise<ResultadoBorrado> => {
    const { data: esStaff } = await context.supabase.rpc("es_staff", {
      _user_id: context.userId,
    });
    if (!esStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const resultado = await borrarCandidatoCompleto(supabaseAdmin, data.candidatoId);
    if (resultado.estado === "ok") {
      const { anotarAcceso } = await import("@/lib/registro-accesos.server");
      await anotarAcceso(supabaseAdmin, {
        userId: context.userId,
        accion: "borro_candidato",
        detalle: "Borrado ejecutado por el equipo",
      });
    }
    return resultado;
  });
