import { plantillaEmail, botonEmail } from "@/lib/email-layout";

export type TipoAviso = "descartado" | "contratado";

/**
 * Envía al candidato el aviso de resultado del proceso.
 * Los fallos solo se registran: nunca rompen el cambio de estado.
 */
export async function enviarAvisoEstado(
  tipo: TipoAviso,
  nombre: string,
  email: string | null,
  baseUrl: string,
): Promise<boolean> {
  try {
    if (!email) return false;
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      console.error("[email] RESEND_API_KEY no está configurado");
      return false;
    }
    const enlace = `${baseUrl}/candidato`;

    const asunto =
      tipo === "contratado"
        ? "¡Buenas noticias! Has sido seleccionado/a — FigurArte"
        : "Sobre tu candidatura — FigurArte";

    const cuerpo =
      tipo === "contratado"
        ? `Hola ${nombre}, tenemos buenas noticias: has sido seleccionado/a para uno de los procesos en los que participabas. En breve nos pondremos en contacto contigo con los detalles.`
        : `Hola ${nombre}, gracias por participar. En esta ocasión no hemos seguido adelante con tu candidatura en uno de los procesos, pero tu perfil sigue activo para futuras oportunidades.`;

    const text = `${cuerpo}

Puedes consultar tus procesos en tu área de candidato: ${enlace}

— FIGURARTE · Agencia de casting & producción`;

    const html = plantillaEmail(
      `
      <p style="margin:0 0 16px;">${cuerpo}</p>
      <p style="margin:0;">Puedes consultar tus procesos en tu área de candidato:</p>
      ${botonEmail("Ver mis procesos", enlace)}
    `.trim(),
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "FIGURARTE Casting & Producción <casting@figurarte.app>",
        to: [email],
        subject: asunto,
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error(
        `[email] Resend respondió ${response.status}: ${await response.text()}`,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Error avisando del cambio de estado:", err);
    return false;
  }
}
