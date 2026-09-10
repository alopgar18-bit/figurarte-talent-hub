import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const EXTENSIONES = ["jpg", "jpeg", "png", "webp", "heic"] as const;

const schema = z.object({
  extension: z.enum(EXTENSIONES),
});

/** Límite básico por IP: 20 permisos de subida por hora. */
const VENTANA_MS = 60 * 60 * 1000;
const MAX_POR_VENTANA = 20;
const contador = new Map<string, { desde: number; usos: number }>();

function ipPermitida(ip: string): boolean {
  const ahora = Date.now();
  const actual = contador.get(ip);
  if (!actual || ahora - actual.desde > VENTANA_MS) {
    contador.set(ip, { desde: ahora, usos: 1 });
    return true;
  }
  actual.usos += 1;
  return actual.usos <= MAX_POR_VENTANA;
}

export type PermisoSubida =
  | { estado: "ok"; path: string; token: string }
  | { estado: "limite" }
  | { estado: "error" };

/**
 * Genera una URL de subida firmada de un solo uso para una ruta aleatoria del
 * bucket privado `candidatos-fotos`. El bucket ya no admite INSERT directo.
 */
export const obtenerUrlSubidaFoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<PermisoSubida> => {
    const request = getRequest();
    const ip =
      request?.headers.get("cf-connecting-ip") ??
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "desconocida";

    if (!ipPermitida(ip)) return { estado: "limite" };

    const path = `${crypto.randomUUID()}/${crypto.randomUUID()}.${data.extension}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: firmada, error } = await supabaseAdmin.storage
      .from("candidatos-fotos")
      .createSignedUploadUrl(path);

    if (error || !firmada) {
      console.error("[fotos] No se pudo firmar la subida:", error);
      return { estado: "error" };
    }

    return { estado: "ok", path: firmada.path, token: firmada.token };
  });
