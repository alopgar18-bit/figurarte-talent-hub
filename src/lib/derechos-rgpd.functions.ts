import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONFIRMACION = "ELIMINAR";

export type MisDatos = {
  /** Ficha completa serializada (evita tipos no serializables en el RPC). */
  candidato_json: string;
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
      candidato_json: JSON.stringify(candidato),
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

import type { ResultadoBorrado } from "@/lib/derechos-rgpd.server";
export type { ResultadoBorrado };



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

    const { borrarCandidatoCompleto } = await import("@/lib/derechos-rgpd.server");
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
    const { borrarCandidatoCompleto } = await import("@/lib/derechos-rgpd.server");
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
