import { plantillaEmail, botonEmail, pieBaja } from "@/lib/email-layout";
import { getRequest } from "@tanstack/react-start/server";
import {
  REMITENTE,
  RESPONDER_A,
  cabecerasBaja,
  enlaceBaja,
  origenCorreo,
} from "@/lib/email-remitente";

export type TipoAviso = "descartado" | "contratado";

/** Sustituye las variables admitidas en asunto y cuerpo de una plantilla. */
export function aplicarVariables(
  texto: string,
  vars: { nombre?: string; enlace?: string },
): string {
  return texto
    .replaceAll("{nombre}", vars.nombre ?? "")
    .replaceAll("{enlace}", vars.enlace ?? "");
}

/**
 * Envío genérico de un correo con la identidad de FigurArte.
 * Los fallos solo se registran: nunca rompen la operación que lo dispara.
 */
export async function enviarEmailFigurarte(opts: {
  email: string | null;
  asunto: string;
  cuerpo: string;
  enlace?: string | null;
  textoBoton?: string;
}): Promise<boolean> {
  try {
    if (!opts.email) return false;
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      console.error("[email] RESEND_API_KEY no está configurado");
      return false;
    }

    const parrafos = opts.cuerpo
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const html = plantillaEmail(
      opts.enlace
        ? `${parrafos}${botonEmail(opts.textoBoton ?? "Ver más", opts.enlace)}`
        : parrafos,
    );

    const text = `${opts.cuerpo}${opts.enlace ? `\n\n${opts.enlace}` : ""}

— FIGURARTE · Agencia de casting & producción`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "FIGURARTE Casting & Producción <casting@figurarte.app>",
        to: [opts.email],
        subject: opts.asunto,
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
    console.error("[email] Error enviando el correo:", err);
    return false;
  }
}
