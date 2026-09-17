import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";

export const ESTADOS_PROYECTO_CANDIDATO = [
  "pendiente_validacion",
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
  canal: "email" | "whatsapp" | null;
};

/**
 * Cambia el estado de un candidato dentro de un proyecto (solo staff).
 * El aviso al candidato ya no está fijado en código: se busca una plantilla
 * activa en `plantillas_comunicacion` para ese evento (el propio estado),
 * primero WhatsApp y si no email. Añadir un evento nuevo es añadir una fila.
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

    const { data: plantillas } = await supabaseAdmin
      .from("plantillas_comunicacion")
      .select("canal, asunto, cuerpo, plantilla_wati")
      .eq("evento", data.estado)
      .eq("activo", true);

    if (!plantillas || plantillas.length === 0) {
      return { estado: data.estado, emailEnviado: false, canal: null };
    }

    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("nombre, email, telefono")
      .eq("id", data.candidatoId)
      .maybeSingle();

    const baseUrl = origenPeticion();
    const enlace = `${baseUrl}/candidato`;
    const nombre = candidato?.nombre ?? "";

    const { aplicarVariables, enviarEmailFigurarte } = await import(
      "@/lib/comunicaciones.server"
    );

    let canal: "email" | "whatsapp" | null = null;
    let contenido: string | null = null;

    // 1) WhatsApp (Wati) si hay plantilla activa, está configurado y el teléfono vale.
    const pWhats = plantillas.find((p) => p.canal === "whatsapp" && p.plantilla_wati);
    if (pWhats?.plantilla_wati) {
      const { watiConfigurado, normalizarTelefonoES, watiEnviarPlantilla } = await import(
        "@/lib/wati.server"
      );
      const numero = normalizarTelefonoES(candidato?.telefono ?? null);
      if (watiConfigurado() && numero) {
        const { ok } = await watiEnviarPlantilla({
          telefono: numero,
          plantilla: pWhats.plantilla_wati,
          broadcast: `figurarte_${data.estado}_${new Date().toISOString().slice(0, 10)}`,
          parametros: [
            { name: "nombre", value: nombre },
            { name: "enlace", value: enlace },
          ],
        });
        if (ok) {
          canal = "whatsapp";
          contenido = `Plantilla Wati: ${pWhats.plantilla_wati}\nnombre=${nombre}\nenlace=${enlace}`;
        }
      }
    }

    // 2) Si no, email con la plantilla editable.
    const pEmail = plantillas.find((p) => p.canal === "email");
    if (!canal && pEmail?.asunto && pEmail.cuerpo) {
      const asunto = aplicarVariables(pEmail.asunto, { nombre, enlace });
      const cuerpo = aplicarVariables(pEmail.cuerpo, { nombre, enlace });
      const ok = await enviarEmailFigurarte({
        email: candidato?.email ?? null,
        candidatoId: data.candidatoId,
        asunto,
        cuerpo,
        enlace,
        textoBoton: "Ver mis procesos",
      });
      if (ok) {
        canal = "email";
        contenido = `Asunto: ${asunto}\n\n${cuerpo}`;
      }
    }

    if (canal) {
      const { error: errCom } = await supabaseAdmin.from("comunicaciones").insert({
        candidato_id: data.candidatoId,
        proyecto_id: data.proyectoId,
        tipo:
          data.estado === "contratado"
            ? "aviso_seleccionado"
            : data.estado === "descartado"
              ? "aviso_no_seleccionado"
              : `aviso_${data.estado}`,
        canal,
        origen: "automatica",
        destinatario_tipo: "candidato",
        contenido,
      });
      if (errCom) console.error("[comunicaciones] No se pudo registrar:", errCom.message);
    }

    return { estado: data.estado, emailEnviado: canal !== null, canal };
  });
