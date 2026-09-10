import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { plantillaEmail, botonEmail } from "@/lib/email-layout";

const candidaturaSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(120),
  categoria: z.enum(["actor", "modelo", "figurante", "casting_plus"]),
  email: z.string().trim().email("Email no válido").max(255),
  telefono: z.string().trim().min(6, "Teléfono no válido").max(30),
  consentimiento_rgpd: z.literal(true),
  altura_cm: z.number().int().min(50).max(260).nullable().optional(),
  peso_kg: z.number().int().min(20).max(300).nullable().optional(),
  ciudad: z.string().trim().max(120).nullable().optional(),
  fotos: z.array(z.string().max(300)).max(3).optional(),
  fotos_recorte: z
    .record(
      z.string().max(300),
      z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    )
    .nullable()
    .optional(),
  proyecto_id: z.string().uuid().nullable().optional(),
  convocatoria_id: z.string().uuid().nullable().optional(),
  canal: z.enum(["instagram", "whatsapp", "web"]).nullable().optional(),
});

export type CandidaturaInput = z.input<typeof candidaturaSchema>;

export type CandidaturaResultado =
  /** Respuesta idéntica exista o no ya el email: no revela si hay ficha previa. */
  | { estado: "ok"; avisoCasting?: boolean }
  | { estado: "limite" }
  | { estado: "error"; mensaje: string };

async function enviarConfirmacionResend({
  nombre,
  email,
  codigo,
}: {
  nombre: string;
  email: string;
  codigo: string;
}) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY no está configurado");
    return;
  }

  const request = getRequest();
  const host = request?.headers.get("host") ?? "figurarte-casting.lovable.app";
  const origin = `https://${host}`;
  const authUrl = `${origin}/auth`;

  const html = plantillaEmail(`
    <p style="margin:0 0 16px;">Hola ${nombre},</p>
    <p style="margin:0 0 16px;">Gracias por registrarte en <strong>FigurArte</strong>. Hemos recibido tu candidatura y ya formas parte de nuestra base de talentos.</p>
    <p style="margin:0 0 16px;">Tu código de referencia es: <strong>${codigo}</strong></p>
    <p style="margin:0 0 16px;">Te animamos a completar tu perfil (apellidos, datos físicos, habilidades, idiomas y redes) desde tu área de candidato para que podamos tenerte en cuenta en futuros castings.</p>
    ${botonEmail("Entrar en mi área de candidato", authUrl)}
  `.trim());

  const text = `Hola ${nombre},

Gracias por registrarte en FigurArte. Hemos recibido tu candidatura y ya formas parte de nuestra base de talentos.

Tu código de referencia es: ${codigo}

Te animamos a completar tu perfil (apellidos, datos físicos, habilidades, idiomas y redes) desde tu área de candidato para que podamos tenerte en cuenta en futuros castings.

Puedes entrar aquí cuando quieras: ${authUrl}

— FIGURARTE · Agencia de casting & producción`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "FIGURARTE Casting & Producción <casting@figurarte.app>",
        to: [email],
        subject: "Hemos recibido tu candidatura — FigurArte",
        html,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[email] Resend respondió ${response.status}: ${body}`,
      );
    }
  } catch (err) {
    console.error("[email] Error enviando confirmación:", err);
  }
}

/**
 * Si el email ya tiene ficha, en lugar de crear un duplicado le enviamos un
 * correo con el acceso a su área. Por fuera la respuesta es la misma.
 */
async function enviarRecuperacionAcceso(email: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY no está configurado");
    return;
  }

  const request = getRequest();
  const host = request?.headers.get("host") ?? "figurarte-casting.lovable.app";
  const authUrl = `https://${host}/auth`;

  const html = plantillaEmail(`
    <p style="margin:0 0 16px;">Hola,</p>
    <p style="margin:0 0 16px;">Hemos recibido una solicitud de registro con este correo, y ya tienes una ficha en <strong>FigurArte</strong>.</p>
    <p style="margin:0 0 16px;">No hace falta que te registres de nuevo: entra en tu área de candidato con tu enlace de acceso y actualiza tus datos cuando quieras.</p>
    ${botonEmail("Entrar en mi área de candidato", authUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#6b6b6b;">Si no has sido tú, puedes ignorar este mensaje.</p>
  `.trim());

  const text = `Hola,

Hemos recibido una solicitud de registro con este correo, y ya tienes una ficha en FigurArte.

No hace falta que te registres de nuevo. Entra en tu área de candidato aquí: ${authUrl}

Si no has sido tú, puedes ignorar este mensaje.

— FIGURARTE · Agencia de casting & producción`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "FIGURARTE Casting & Producción <casting@figurarte.app>",
        to: [email],
        subject: "Tu acceso a FigurArte",
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error(`[email] Resend respondió ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    console.error("[email] Error enviando recuperación de acceso:", err);
  }
}

export const crearCandidatura = createServerFn({ method: "POST" })
  .inputValidator((data: CandidaturaInput) => candidaturaSchema.parse(data))
  .handler(async ({ data }): Promise<CandidaturaResultado> => {
    const { dentroDeLimite, LIMITES } = await import("@/lib/rate-limit.server");
    if (!dentroDeLimite("registro", LIMITES.registro)) return { estado: "limite" };

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const email = data.email.toLowerCase();

    const { data: existente } = await supabaseAdmin
      .from("candidatos")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    // Mismo resultado visible que un alta nueva: no revelamos si ya existe.
    if (existente) {
      await enviarRecuperacionAcceso(email);
      return { estado: "ok" };
    }


    const { data: creado, error } = await supabaseAdmin
      .from("candidatos")
      .insert({
        nombre: data.nombre,
        categoria: data.categoria,
        email,
        telefono: data.telefono,
        ciudad: data.ciudad ?? null,
        altura_cm: data.altura_cm ?? null,
        peso_kg: data.peso_kg ?? null,
        fotos: data.fotos ?? [],
        fotos_recorte: data.fotos_recorte ?? null,
        consentimiento_rgpd: true,
        fecha_consentimiento: new Date().toISOString(),
      })
      .select("id, codigo")
      .single();

    if (error || !creado) {
      return { estado: "error", mensaje: "No se pudo registrar la candidatura." };
    }

    if (data.proyecto_id) {
      await supabaseAdmin.from("proyecto_candidatos").insert({
        proyecto_id: data.proyecto_id,
        candidato_id: creado.id,
        origen: "web_directa",
      });
    }

    // Trazabilidad de captación RRSS: nunca debe romper el registro.
    if (data.convocatoria_id && data.canal) {
      const { error: errCap } = await supabaseAdmin
        .from("registros_captacion")
        .insert({
          candidato_id: creado.id,
          convocatoria_id: data.convocatoria_id,
          canal: data.canal,
        });
      if (errCap) console.error("[captacion] No se pudo registrar el origen:", errCap);
    }

    // Envío de confirmación: no debe interrumpir el registro si falla.
    await enviarConfirmacionResend({
      nombre: data.nombre,
      email,
      codigo: creado.codigo,
    });

    return { estado: "ok", codigo: creado.codigo };
  });
