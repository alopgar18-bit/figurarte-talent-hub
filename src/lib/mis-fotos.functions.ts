import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "candidatos-fotos";

/** Tope de fotos que puede gestionar el propio candidato desde su perfil. */
export const MAX_FOTOS_CANDIDATO = 6;

const areaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const anadirSchema = z.object({
  path: z.string().min(1).max(300),
  area: areaSchema.nullable().optional(),
});

const eliminarSchema = z.object({
  indice: z.number().int().min(0).max(199),
});

/**
 * Devuelve la ficha del candidato que pertenece al usuario autenticado.
 * La propiedad se comprueba con `candidatos.user_id = auth.uid()`;
 * nunca se acepta un candidatoId enviado por el cliente.
 */
async function fichaDelUsuario(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("candidatos")
    .select("id, fotos, fotos_recorte")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("No hemos encontrado tu ficha de candidato.");
  return { supabaseAdmin, ficha: data };
}

/** Fotos actuales del candidato autenticado, ya firmadas para poder verlas. */
export const obtenerMisFotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ fotos: string[] }> => {
    const { supabaseAdmin, ficha } = await fichaDelUsuario(context.userId);
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");
    return { fotos: await firmarFotosPrivadas(supabaseAdmin, ficha.fotos ?? []) };
  });

/** Añade una foto ya subida (ruta privada) a la ficha del propio candidato. */
export const anadirMiFoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => anadirSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ fotos: string[] }> => {
    const { supabaseAdmin, ficha } = await fichaDelUsuario(context.userId);
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    const actuales = ficha.fotos ?? [];
    if (actuales.length >= MAX_FOTOS_CANDIDATO) {
      throw new Error(
        `Puedes tener como máximo ${MAX_FOTOS_CANDIDATO} fotos. Elimina alguna antes de añadir otra.`,
      );
    }

    const fotos = [...actuales, data.path];
    const recortes = {
      ...((ficha.fotos_recorte as Record<string, unknown> | null) ?? {}),
      ...(data.area ? { [data.path]: data.area } : {}),
    };

    const { error } = await supabaseAdmin
      .from("candidatos")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ fotos, fotos_recorte: recortes as any })
      .eq("id", ficha.id);
    if (error) throw new Error("No hemos podido guardar la foto en tu ficha.");

    return { fotos: await firmarFotosPrivadas(supabaseAdmin, fotos) };
  });

/** Elimina una foto propia: del array de la ficha y del almacenamiento. */
export const eliminarMiFoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => eliminarSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ fotos: string[] }> => {
    const { supabaseAdmin, ficha } = await fichaDelUsuario(context.userId);
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    const actuales = ficha.fotos ?? [];
    const quitada = actuales[data.indice];
    if (!quitada) throw new Error("Esa foto ya no existe en tu ficha.");

    const fotos = actuales.filter((_, i) => i !== data.indice);
    const recortes = { ...((ficha.fotos_recorte as Record<string, unknown> | null) ?? {}) };
    delete recortes[quitada];

    const { error } = await supabaseAdmin
      .from("candidatos")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ fotos, fotos_recorte: recortes as any })
      .eq("id", ficha.id);
    if (error) throw new Error("No hemos podido quitar la foto de tu ficha.");

    if (!/^https?:\/\//i.test(quitada) && !quitada.startsWith("placeholder://")) {
      const { error: errorStorage } = await supabaseAdmin.storage.from(BUCKET).remove([quitada]);
      if (errorStorage) console.error("[fotos] No se pudo borrar del almacenamiento:", quitada);
    }

    return { fotos: await firmarFotosPrivadas(supabaseAdmin, fotos) };
  });
