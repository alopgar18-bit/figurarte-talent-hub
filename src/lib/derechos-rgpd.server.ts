import type { supabaseAdmin as AdminCliente } from "@/integrations/supabase/client.server";

export type ResultadoBorrado = { estado: "ok" } | { estado: "error"; mensaje: string };

/**
 * Derecho al olvido: borra archivos y todas las filas relacionadas del
 * candidato. Cualquier fallo se propaga: nunca se dice "borrado" a medias.
 */
export async function borrarCandidatoCompleto(
  admin: typeof AdminCliente,
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
