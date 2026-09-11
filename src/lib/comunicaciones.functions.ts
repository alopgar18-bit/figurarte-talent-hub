import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { plantillaEmail, botonEmail } from "@/lib/email-layout";
import { getRequest } from "@tanstack/react-start/server";

export const ESTADOS_PROYECTO_CANDIDATO = [
  "preseleccionado",
  "enviado",
  "contratado",
  "descartado",
  "rechazado_por_candidato",
] as const;

export type EstadoProyectoCandidato = (typeof ESTADOS_PROYECTO_CANDIDATO)[number];

const entrada = z.object({
  proyectoId: z.string().uuid(),
  candidatoId: z.string().uuid(),
  estado: z.enum(ESTADOS_PROYECTO_CANDIDATO),
});

function origenPeticion() {
  const request = getRequest();
  const host = request?.headers.get("host") ?? "figurarte-casting.lovable.app";
  return `https://${host}`;
}


export type ResultadoCambioEstado = {
  estado: EstadoProyectoCandidato;
  emailEnviado: boolean;
};

/**
 * Cambia el estado de un candidato dentro de un proyecto (solo staff).
 * En "descartado" y "contratado" avisa al candidato por email y deja
 * constancia del envío en `comunicaciones`.
 */
export const cambiarEstadoProyectoCandidato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof entrada>) => entrada.parse(data))
  .handler(async ({ data, context }): Promise<ResultadoCambioEstado> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: staff } = await supabaseAdmin
      .from("usuarios")
      .select("rol")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (
      !staff ||
      !["superadmin", "admin_figurarte", "coordinador", "validador"].includes(staff.rol)
    ) {
      throw new Error("Acceso restringido al equipo de FigurArte.");
    }

    const { error: errUpd } = await supabaseAdmin
      .from("proyecto_candidatos")
      .update({ estado: data.estado })
      .eq("proyecto_id", data.proyectoId)
      .eq("candidato_id", data.candidatoId);
    if (errUpd) throw new Error("No se pudo cambiar el estado.");

    if (data.estado !== "descartado" && data.estado !== "contratado") {
      return { estado: data.estado, emailEnviado: false };
    }

    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("nombre, email")
      .eq("id", data.candidatoId)
      .maybeSingle();

    const enviado = await enviarAviso(
      data.estado,
      candidato?.nombre ?? "",
      candidato?.email ?? null,
    );

    if (enviado) {
      const { error: errCom } = await supabaseAdmin.from("comunicaciones").insert({
        candidato_id: data.candidatoId,
        proyecto_id: data.proyectoId,
        tipo: data.estado === "contratado" ? "aviso_seleccionado" : "aviso_no_seleccionado",
        canal: "email",
      });
      if (errCom) console.error("[comunicaciones] No se pudo registrar:", errCom.message);
    }

    return { estado: data.estado, emailEnviado: enviado };
  });
