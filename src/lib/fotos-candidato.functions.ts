import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "candidatos-fotos";

const areaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const anadirSchema = z.object({
  candidatoId: z.string().uuid(),
  path: z.string().min(1).max(300),
  area: areaSchema.nullable().optional(),
});

const eliminarSchema = z.object({
  candidatoId: z.string().uuid(),
  indice: z.number().int().min(0).max(199),
});



/** Añade una foto ya subida (ruta privada) al array de fotos del candidato. */
export const anadirFotoCandidatoStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => anadirSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ fotos: string[] }> => {
    const { data: esStaff, error: errorRol } = await context.supabase.rpc("es_staff", {
      _user_id: context.userId,
    });
    if (errorRol || !esStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    const { data: candidato, error } = await supabaseAdmin
      .from("candidatos")
      .select("fotos, fotos_recorte")
      .eq("id", data.candidatoId)
      .maybeSingle();
    if (error || !candidato) throw new Error("No se encontró el candidato.");

    const fotos = [...(candidato.fotos ?? []), data.path];
    const recortes = {
      ...((candidato.fotos_recorte as Record<string, unknown> | null) ?? {}),
      ...(data.area ? { [data.path]: data.area } : {}),
    };

    const { error: errorUpdate } = await supabaseAdmin
      .from("candidatos")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ fotos, fotos_recorte: recortes as any })
      .eq("id", data.candidatoId);
    if (errorUpdate) throw new Error("No se pudo guardar la foto en la ficha.");

    return { fotos: await firmarFotosPrivadas(supabaseAdmin, fotos) };
  });

/** Elimina la foto en la posición indicada: del array y del almacenamiento. */
export const eliminarFotoCandidatoStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => eliminarSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ fotos: string[] }> => {
    const { data: esStaff, error: errorRol } = await context.supabase.rpc("es_staff", {
      _user_id: context.userId,
    });
    if (errorRol || !esStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    const { data: candidato, error } = await supabaseAdmin
      .from("candidatos")
      .select("fotos, fotos_recorte")
      .eq("id", data.candidatoId)
      .maybeSingle();
    if (error || !candidato) throw new Error("No se encontró el candidato.");

    const actuales = candidato.fotos ?? [];
    const quitada = actuales[data.indice];
    if (!quitada) throw new Error("Esa foto ya no existe en la ficha.");

    const fotos = actuales.filter((_, i) => i !== data.indice);
    const recortes = { ...((candidato.fotos_recorte as Record<string, unknown> | null) ?? {}) };
    delete recortes[quitada];

    const { error: errorUpdate } = await supabaseAdmin
      .from("candidatos")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ fotos, fotos_recorte: recortes as any })
      .eq("id", data.candidatoId);
    if (errorUpdate) throw new Error("No se pudo quitar la foto de la ficha.");

    // Solo borramos del almacenamiento las rutas privadas propias.
    if (!/^https?:\/\//i.test(quitada) && !quitada.startsWith("placeholder://")) {
      const { error: errorStorage } = await supabaseAdmin.storage.from(BUCKET).remove([quitada]);
      if (errorStorage) console.error("[fotos] No se pudo borrar del almacenamiento:", quitada);
    }

    return { fotos: await firmarFotosPrivadas(supabaseAdmin, fotos) };
  });
