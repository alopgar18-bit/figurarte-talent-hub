import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Firma rutas privadas del bucket de fotos para uso interno del panel.
 * Devuelve un mapa ruta -> URL firmada (1 h).
 */
export const firmarFotosStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ rutas: z.array(z.string().min(1)).max(200) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<Record<string, string>> => {
    const { data: esStaff, error: errorRol } = await context.supabase.rpc("es_staff", {
      _user_id: context.userId,
    });
    if (errorRol || !esStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    const unicas = [...new Set(data.rutas)];
    const firmadas = await firmarFotosPrivadas(supabaseAdmin, unicas);
    const mapa: Record<string, string> = {};
    unicas.forEach((ruta, i) => {
      mapa[ruta] = firmadas[i] ?? ruta;
    });
    return mapa;
  });
