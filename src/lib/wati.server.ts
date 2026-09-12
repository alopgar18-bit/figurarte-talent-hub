/**
 * Envío de WhatsApp vía Wati.
 *
 * Reutiliza el mismo patrón ya resuelto en el proyecto hermano
 * "FIGURARTE Gatekeeper" (supabase/functions/_shared/wati-format.ts):
 *  - Secretos: WATI_API_ENDPOINT + WATI_ACCESS_TOKEN (y plantillas por evento).
 *  - Endpoint: POST {endpoint}/api/v1/sendTemplateMessage?whatsappNumber=34XXXXXXXXX
 *  - Cabecera: Authorization: Bearer {token}
 *  - Cuerpo: { template_name, broadcast_name, parameters: [{name, value}] }
 *  - Teléfono normalizado a 34 + 9 dígitos; si no es válido, no se envía.
 *
 * Mientras falten los secretos, `watiConfigurado()` devuelve false y el aviso
 * se envía por email como hasta ahora.
 */

/** Normaliza a formato internacional sin "+", optimizado para España. */
export function normalizarTelefonoES(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, "");
  if (!digits) return null;
  if (/^[679]\d{8}$/.test(digits)) return "34" + digits;
  if (/^34[679]\d{8}$/.test(digits)) return digits;
  return null;
}

/** Plantilla aprobada en Wati para cada transición de estado. */
export function plantillaEstado(tipo: "descartado" | "contratado"): string | null {
  const nombre =
    tipo === "contratado"
      ? process.env["WATI_TEMPLATE_CONTRATADO"]
      : process.env["WATI_TEMPLATE_DESCARTADO"];
  return nombre && nombre.trim() !== "" ? nombre.trim() : null;
}

/** ¿Están los secretos de Wati disponibles en este proyecto? */
export function watiConfigurado(): boolean {
  return Boolean(
    process.env["WATI_API_ENDPOINT"]?.trim() && process.env["WATI_ACCESS_TOKEN"]?.trim(),
  );
}

export type ResultadoWati = {
  ok: boolean;
  motivo?: string;
};

/** Envío individual de una plantilla aprobada (mismo contrato que Gatekeeper). */
export async function watiEnviarPlantilla(opts: {
  telefono: string;
  plantilla: string;
  broadcast: string;
  parametros: { name: string; value: string }[];
}): Promise<ResultadoWati> {
  const endpoint = process.env["WATI_API_ENDPOINT"]?.trim();
  const token = process.env["WATI_ACCESS_TOKEN"]?.trim();
  if (!endpoint || !token) return { ok: false, motivo: "Wati no está configurado" };

  const url = `${endpoint.replace(/\/+$/, "")}/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(
    opts.telefono,
  )}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_name: opts.plantilla,
        broadcast_name: opts.broadcast,
        parameters: opts.parametros,
      }),
    });
    const texto = await res.text();
    if (!res.ok) {
      console.error(`[wati] HTTP ${res.status}: ${texto.slice(0, 300)}`);
      return { ok: false, motivo: `HTTP ${res.status}` };
    }
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(texto) as Record<string, unknown>;
    } catch {
      json = null;
    }
    const receptor =
      (json?.["receivers"] as { isValidWhatsAppNumber?: boolean }[] | undefined)?.[0] ?? null;
    if (json?.["result"] === false || receptor?.isValidWhatsAppNumber === false) {
      console.error(`[wati] Envío rechazado: ${texto.slice(0, 300)}`);
      return { ok: false, motivo: "Wati rechazó el envío" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[wati] Error de red:", err);
    return { ok: false, motivo: "Error de red" };
  }
}

/**
 * Aviso de resultado del proceso por WhatsApp.
 * Devuelve false (sin romper nada) si falta configuración, plantilla o teléfono.
 */
export async function enviarAvisoEstadoWhatsapp(
  tipo: "descartado" | "contratado",
  nombre: string,
  telefono: string | null,
  baseUrl: string,
): Promise<boolean> {
  if (!watiConfigurado()) return false;
  const plantilla = plantillaEstado(tipo);
  if (!plantilla) return false;
  const numero = normalizarTelefonoES(telefono);
  if (!numero) return false;

  const { ok } = await watiEnviarPlantilla({
    telefono: numero,
    plantilla,
    broadcast: `figurarte_${tipo}_${new Date().toISOString().slice(0, 10)}`,
    parametros: [
      { name: "nombre", value: nombre || "" },
      { name: "enlace", value: `${baseUrl}/candidato` },
    ],
  });
  return ok;
}
