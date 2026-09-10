import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const entradaRegistro = z.object({
  accion: z.enum(["vio_ficha", "genero_dossier", "exporto_excel"]),
  candidatoId: z.string().uuid().nullable().optional(),
  detalle: z.string().max(300).nullable().optional(),
});

/** Anota una acción del equipo sobre datos de candidatos. */
export const registrarAccesoStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entradaRegistro.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { data: esStaff } = await context.supabase.rpc("es_staff", {
      _user_id: context.userId,
    });
    if (!esStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { anotarAcceso } = await import("@/lib/registro-accesos.server");
    await anotarAcceso(supabaseAdmin, {
      userId: context.userId,
      accion: data.accion,
      candidatoId: data.candidatoId ?? null,
      detalle: data.detalle ?? null,
    });
    return { ok: true };
  });

export type EntradaRegistro = {
  id: string;
  actor_email: string | null;
  accion: string;
  detalle: string | null;
  creado_en: string;
  codigo_candidato: string | null;
};

/** Últimos accesos registrados. Solo staff. */
export const listarRegistroAccesos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EntradaRegistro[]> => {
    const { data: esStaff } = await context.supabase.rpc("es_staff", {
      _user_id: context.userId,
    });
    if (!esStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("registro_accesos")
      .select("id, actor_email, accion, detalle, creado_en, candidatos(codigo)")
      .order("creado_en", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[registro-accesos] No se pudo leer el registro:", error);
      throw new Error("No se pudo cargar el registro de accesos.");
    }

    return (data ?? []).map((r) => {
      const rel = r.candidatos as { codigo: string } | null;
      return {
        id: r.id,
        actor_email: r.actor_email,
        accion: r.accion,
        detalle: r.detalle,
        creado_en: r.creado_en,
        codigo_candidato: rel?.codigo ?? null,
      };
    });
  });
