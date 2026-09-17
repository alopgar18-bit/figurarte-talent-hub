/**
 * Plantilla HTML compartida por todos los correos de FigurArte.
 * Maquetada con tablas y estilos en línea para que funcione en clientes
 * de correo básicos (Outlook, Gmail, Apple Mail).
 */

const CHARCOAL = "#282828";
const CREMA = "#E8E8D8";
const ROJO = "#E03030";
const LOGO_URL = "https://casting.figurarte.app/logo-email.png";

export const PIE_TEXTO = "FIGURARTE · Agencia de casting & producción · figurarte.app";

/** Línea de baja para el pie de los correos informativos. */
export function pieBaja(urlBaja?: string | null): string {
  const destino = urlBaja ?? "mailto:casting@figurarte.app?subject=Baja%20de%20comunicaciones";
  return `
    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #c9c9b8;font-size:12px;color:#6b6b6b;">
      ¿No quieres recibir más comunicaciones informativas?
      <a href="${destino}" style="color:#6b6b6b;">Date de baja aquí</a>.
    </p>
  `.trim();
}

/** Botón destacado en rojo, listo para insertar en el cuerpo del correo. */
export function botonEmail(texto: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" bgcolor="${ROJO}" style="border-radius:2px;">
          <a href="${url}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">${texto}</a>
        </td>
      </tr>
    </table>
  `.trim();
}

/**
 * Envuelve el contenido HTML de un correo en la identidad visual de FigurArte:
 * cabecera charcoal con logo, cuerpo crema y pie en gris tenue.
 */
export function plantillaEmail(contenidoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" bgcolor="${CHARCOAL}" style="background-color:${CHARCOAL};padding:24px;">
            <img src="${LOGO_URL}" alt="FIGURARTE" width="140" style="display:block;width:140px;max-width:140px;height:auto;border:0;">
          </td>
        </tr>
        <tr>
          <td bgcolor="${CREMA}" style="background-color:${CREMA};padding:28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${CHARCOAL};">
            ${contenidoHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a8a8a;">
            ${PIE_TEXTO}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
