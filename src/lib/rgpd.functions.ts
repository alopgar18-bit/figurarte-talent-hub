import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const TEXTO_CESION =
  "Acepto la cesión de mis datos y fotografías para su presentación a clientes de FIGURARTE, según la política de privacidad.";

const entradaAsignar = z.object({
  proyectoId: z.string().uuid(),
  candidatoIds: z.array(z.string().uuid()).min(1).max(200),
});

export type ResultadoAsignacion = {
  asignados: number;
  bloqueados: { id: string; nombre: string }[];
  yaEstaban: number;
};

function origenPeticion() {
  const request = getRequest();
  const host = request?.headers.get("host") ?? "figurarte-casting.lovable.app";
  return `https://${host}`;
}

/**
 * Email genérico al candidato pidiéndole la autorización de cesión de imagen.
 * Nunca menciona cliente ni proyecto. Los fallos solo se registran.
 */
async function avisarConsentimiento(nombre: string, email: string | null) {
  try {
    if (!email) return;
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      console.error("[email] RESEND_API_KEY no está configurado");
      return;
    }
    const enlace = `${origenPeticion()}/candidato`;

    const text = `Hola ${nombre}, tu perfil podría presentarte a nuevas oportunidades, pero para poder hacerlo antes necesitamos tu autorización de cesión de imagen.

Entra en tu área de candidato para darla: ${enlace}

— FIGURARTE · Agencia de casting & producción`;

    const html = `
      <p>Hola ${nombre}, tu perfil podría presentarte a nuevas oportunidades, pero para poder hacerlo antes necesitamos tu autorización de cesión de imagen.</p>
      <p>Entra en tu área de candidato para darla: <a href="${enlace}">${enlace}</a></p>
      <p>— FIGURARTE · Agencia de casting &amp; producción</p>
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "FIGURARTE Casting & Producción <casting@figurarte.app>",
        to: [email],
        subject: "Necesitamos tu autorización — FigurArte",
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error(`[email] Resend respondió ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    console.error("[email] Error avisando de consentimiento:", err);
  }
}

/**
 * Asigna candidatos a un proyecto comprobando antes el consentimiento RGPD.
 * Quien no lo tenga firmado NO entra en el proyecto: queda en espera y recibe
 * un aviso por email (solo la primera vez para esa pareja candidato+proyecto).
 */
export const asignarCandidatosAProyecto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof entradaAsignar>) => entradaAsignar.parse(data))
  .handler(async ({ data, context }): Promise<ResultadoAsignacion> => {
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

    const { data: candidatos } = await supabaseAdmin
      .from("candidatos")
      .select("id, nombre, email, consentimiento_rgpd")
      .in("id", data.candidatoIds);

    const { data: existentes } = await supabaseAdmin
      .from("proyecto_candidatos")
      .select("candidato_id")
      .eq("proyecto_id", data.proyectoId)
      .in("candidato_id", data.candidatoIds);
    const yaEstaban = new Set((existentes ?? []).map((r) => r.candidato_id));

    const conConsentimiento: string[] = [];
    const bloqueados: { id: string; nombre: string }[] = [];

    for (const c of candidatos ?? []) {
      if (yaEstaban.has(c.id)) continue;
      if (c.consentimiento_rgpd) {
        conConsentimiento.push(c.id);
      } else {
        bloqueados.push({ id: c.id, nombre: c.nombre });

        const { data: pendiente } = await supabaseAdmin
          .from("asignaciones_pendientes_rgpd")
          .select("id")
          .eq("candidato_id", c.id)
          .eq("proyecto_id", data.proyectoId)
          .maybeSingle();

        if (!pendiente) {
          const { error } = await supabaseAdmin
            .from("asignaciones_pendientes_rgpd")
            .insert({ candidato_id: c.id, proyecto_id: data.proyectoId });
          // Solo se avisa la primera vez, para no spamear.
          if (!error) await avisarConsentimiento(c.nombre, c.email);
        }
      }
    }

    if (conConsentimiento.length) {
      const { error } = await supabaseAdmin.from("proyecto_candidatos").insert(
        conConsentimiento.map((candidato_id) => ({
          proyecto_id: data.proyectoId,
          candidato_id,
          origen: "manual" as const,
          estado: "preseleccionado" as const,
        })),
      );
      if (error && error.code !== "23505") {
        throw new Error("No se pudieron asignar los candidatos.");
      }
    }

    return {
      asignados: conConsentimiento.length,
      bloqueados,
      yaEstaban: yaEstaban.size,
    };
  });

export type ResultadoConsentimiento = { liberadas: number };

/**
 * El candidato firma la cesión de imagen desde su área privada: se guarda el
 * consentimiento y se liberan todas las asignaciones que estaban en espera.
 */
export const darConsentimientoRgpd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ResultadoConsentimiento> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!candidato) throw new Error("Acceso restringido a candidatos.");

    const { error: errUpd } = await supabaseAdmin
      .from("candidatos")
      .update({
        consentimiento_rgpd: true,
        fecha_consentimiento: new Date().toISOString(),
      })
      .eq("id", candidato.id);
    if (errUpd) throw new Error("No se pudo guardar tu autorización.");

    return { liberadas: await liberarPendientes(candidato.id) };
  });

/** Pasa las asignaciones en espera de un candidato a `proyecto_candidatos`. */
async function liberarPendientes(candidatoId: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: pendientes } = await supabaseAdmin
    .from("asignaciones_pendientes_rgpd")
    .select("id, proyecto_id")
    .eq("candidato_id", candidatoId);

  if (!pendientes || pendientes.length === 0) return 0;

  const { data: yaEstan } = await supabaseAdmin
    .from("proyecto_candidatos")
    .select("proyecto_id")
    .eq("candidato_id", candidatoId)
    .in(
      "proyecto_id",
      pendientes.map((p) => p.proyecto_id),
    );
  const existentes = new Set((yaEstan ?? []).map((r) => r.proyecto_id));

  const nuevos = pendientes.filter((p) => !existentes.has(p.proyecto_id));
  if (nuevos.length) {
    const { error } = await supabaseAdmin.from("proyecto_candidatos").insert(
      nuevos.map((p) => ({
        proyecto_id: p.proyecto_id,
        candidato_id: candidatoId,
        origen: "manual" as const,
        estado: "preseleccionado" as const,
      })),
    );
    if (error && error.code !== "23505") {
      throw new Error("No se pudieron activar tus asignaciones pendientes.");
    }
  }

  await supabaseAdmin
    .from("asignaciones_pendientes_rgpd")
    .delete()
    .eq("candidato_id", candidatoId);

  return nuevos.length;
}

/** Igual que la anterior, pero invocable por el propio candidato si hiciera falta. */
export const liberarAsignacionesPendientes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ResultadoConsentimiento> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("id, consentimiento_rgpd")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!candidato || !candidato.consentimiento_rgpd) return { liberadas: 0 };
    return { liberadas: await liberarPendientes(candidato.id) };
  });
