/**
 * Datos comunes del remitente y de la baja de comunicaciones.
 * Se comparte entre todos los puntos de envío para que reply-to,
 * List-Unsubscribe y el pie sean idénticos en todos los correos.
 */

export const REMITENTE = "FIGURARTE Casting & Producción <casting@figurarte.app>";

/** Buzón real (con auto-respuesta activa) al que van las contestaciones. */
export const RESPONDER_A = "casting@figurarte.app";

/** Baja por correo, válida como List-Unsubscribe incluso sin enlace web. */
export const BAJA_MAILTO = `mailto:${RESPONDER_A}?subject=Baja%20de%20comunicaciones`;

/** Dominio público de la plataforma (el mismo del remitente). */
export function origenCorreo(host?: string | null): string {
  return `https://${host && host.length > 0 ? host : "casting.figurarte.app"}`;
}

/** Enlace de baja de un candidato concreto (su id es la credencial). */
export function enlaceBaja(origen: string, candidatoId: string): string {
  return `${origen}/api/public/baja?c=${encodeURIComponent(candidatoId)}`;
}

/** Cabeceras de baja para un correo informativo. */
export function cabecerasBaja(urlBaja?: string | null): Record<string, string> {
  const lista = urlBaja ? `<${urlBaja}>, <${BAJA_MAILTO}>` : `<${BAJA_MAILTO}>`;
  const headers: Record<string, string> = { "List-Unsubscribe": lista };
  if (urlBaja) headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  return headers;
}
