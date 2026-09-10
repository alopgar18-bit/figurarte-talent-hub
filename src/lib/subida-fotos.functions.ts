import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EXTENSIONES = ["jpg", "jpeg", "png", "webp", "heic"] as const;

const schema = z.object({
  extension: z.enum(EXTENSIONES),
});

export type PermisoSubida =
  | { estado: "ok"; path: string; token: string }
  | { estado: "limite" }
  | { estado: "error" };

/**
 * Genera una URL de subida firmada de un solo uso para una ruta aleatoria del
 * bucket privado `candidatos-fotos`. El bucket ya no admite INSERT directo.
 * Límite: 20 permisos por IP y hora.
 */
export const obtenerUrlSubidaFoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<PermisoSubida> => {
    const { dentroDeLimite, LIMITES } = await import("@/lib/rate-limit.server");
    if (!dentroDeLimite("subidaFoto", LIMITES.subidaFoto)) return { estado: "limite" };

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
