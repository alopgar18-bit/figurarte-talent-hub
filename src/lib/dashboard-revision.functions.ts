import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CandidatoPorRevisar = {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string | null;
  categoria: string;
  provincia: string | null;
  creado_en: string;
  foto: string | null;
};

export type InscripcionPendiente = {
  proyecto_id: string;
  proyecto_nombre: string;
  candidato_id: string;
  candidato_nombre: string;
  candidato_codigo: string;
  creado_en: string;
};

async function comprobarStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("es_staff", {
    _user_id: context.userId,
  });
  if (error || !data) throw new Error("Forbidden");
}

/** Candidatos nuevos cuya visibilidad pública nadie ha decidido todavía. */
export const listarCandidatosPorRevisar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CandidatoPorRevisar[]> => {
    await comprobarStaff(context);

    const { data, error } = await context.supabase
      .from("candidatos")
      .select("id,codigo,nombre,apellidos,categoria,provincia,creado_en,fotos")
      .eq("revisado_publico", false)
      .order("creado_en", { ascending: false })
      .limit(50);

    if (error) throw new Error("No se pudieron cargar los candidatos por revisar.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    return Promise.all(
      (data ?? []).map(async (c: any) => {
        const primera = (c.fotos ?? [])[0];
        const firmadas = primera
          ? await firmarFotosPrivadas(supabaseAdmin, [primera])
          : [];
        return {
          id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          apellidos: c.apellidos,
          categoria: c.categoria,
          provincia: c.provincia,
          creado_en: c.creado_en,
          foto: firmadas[0] ?? null,
        };
      }),
    );
  });

const decisionSchema = z.object({
  candidato_id: z.string().uuid(),
  publicar: z.boolean(),
});

/**
 * Decide la visibilidad pública desde el Dashboard.
 * Usa el cliente del usuario: el trigger de la base de datos sigue exigiendo rol admin.
 */
export const decidirVisibilidadPublica = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => decisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    await comprobarStaff(context);

    const { error } = await context.supabase
      .from("candidatos")
      .update({ disponible_publico: data.publicar, revisado_publico: true })
      .eq("id", data.candidato_id);

    if (error) {
      throw new Error(
        "No se pudo guardar la decisión. Solo un administrador puede publicar o retirar candidatos.",
      );
    }
    return { ok: true };
  });

/** Inscripciones web pendientes de validar, de todos los proyectos. */
export const listarInscripcionesPendientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InscripcionPendiente[]> => {
    await comprobarStaff(context);

    const { data, error } = await context.supabase
      .from("proyecto_candidatos")
      .select(
        "proyecto_id,candidato_id,creado_en,candidatos(nombre,apellidos,codigo),proyectos_casting(nombre)",
      )
      .eq("estado", "pendiente_validacion")
      .order("creado_en", { ascending: false })
      .limit(100);

    if (error) throw new Error("No se pudieron cargar las inscripciones pendientes.");

    return (data ?? []).map((r: any) => ({
      proyecto_id: r.proyecto_id,
      proyecto_nombre: r.proyectos_casting?.nombre ?? "Proyecto",
      candidato_id: r.candidato_id,
      candidato_nombre: [r.candidatos?.nombre, r.candidatos?.apellidos]
        .filter(Boolean)
        .join(" "),
      candidato_codigo: r.candidatos?.codigo ?? "",
      creado_en: r.creado_en,
    }));
  });
