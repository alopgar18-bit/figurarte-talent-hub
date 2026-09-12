import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inscripcionSchema = z.object({
  proyecto_id: z.string().uuid(),
});

export type InscripcionResultado =
  | { estado: "inscrito" | "ya_inscrito"; nombreCasting: string }
  | { estado: "no_candidato" }
  | { estado: "casting_no_disponible" }
  | { estado: "error" };

/**
 * Apunta al candidato de la sesión actual a un casting publicado.
 * Idempotente: si ya existe la fila (proyecto_id, candidato_id) no inserta nada.
 */
export const inscribirEnCasting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof inscripcionSchema>) =>
    inscripcionSchema.parse(data),
  )
  .handler(async ({ data, context }): Promise<InscripcionResultado> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Solo candidatos: si el email pertenece al equipo/cliente, se ignora.
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (usuario) return { estado: "no_candidato" };

    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!candidato) return { estado: "no_candidato" };

    const { data: proyecto } = await supabaseAdmin
      .from("proyectos_casting")
      .select("id, nombre, publicado")
      .eq("id", data.proyecto_id)
      .maybeSingle();
    if (!proyecto || !proyecto.publicado) return { estado: "casting_no_disponible" };

    // Comprobación previa de duplicado antes de insertar.
    const { data: existente } = await supabaseAdmin
      .from("proyecto_candidatos")
      .select("proyecto_id")
      .eq("proyecto_id", proyecto.id)
      .eq("candidato_id", candidato.id)
      .maybeSingle();

    if (existente) return { estado: "ya_inscrito", nombreCasting: proyecto.nombre };

    const { error } = await supabaseAdmin.from("proyecto_candidatos").insert({
      proyecto_id: proyecto.id,
      candidato_id: candidato.id,
      origen: "web_directa",
      // Las inscripciones por la web quedan a la espera de revisión del equipo.
      estado: "pendiente_validacion",
    });

    // La clave primaria compuesta protege de duplicados por carrera.
    if (error) {
      if (error.code === "23505") {
        return { estado: "ya_inscrito", nombreCasting: proyecto.nombre };
      }
      return { estado: "error" };
    }

    return { estado: "inscrito", nombreCasting: proyecto.nombre };
  });
