import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const fichaSchema = z.object({ id: z.string().uuid() });

export const obtenerFichaCandidatoStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => fichaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: esStaff, error: errorRol } = await context.supabase.rpc("es_staff", {
      _user_id: context.userId,
    });
    if (errorRol || !esStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");
    const [{ data: candidato, error }, { data: castings }] = await Promise.all([
      supabaseAdmin.from("candidatos").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("proyecto_candidatos")
        .select("estado, origen, creado_en, proyectos_casting(nombre)")
        .eq("candidato_id", data.id)
        .order("creado_en", { ascending: false }),
    ]);

    if (error) throw new Error("No se pudo cargar la ficha del candidato.");
    if (!candidato) return { candidato: null, castings: [] };

    return {
      candidato: {
        ...candidato,
        fotos: await firmarFotosPrivadas(supabaseAdmin, candidato.fotos),
      },
      castings: castings ?? [],
    };
  });
