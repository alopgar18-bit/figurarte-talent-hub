import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const entrada = z.object({
  ruta: z.string().min(3).max(400),
  titulo: z.string().trim().min(1).max(120),
});

export type ResultadoVideo =
  | { estado: "no_disponible" }
  | { estado: "limite" }
  | { estado: "ok"; videoId: string; url: string }
  | { estado: "error"; mensaje: string };

const BUCKET = "candidatos-videos-temp";

/**
 * Toma un vídeo ya subido al bucket temporal y lo publica en YouTube como "no listado".
 * Si las credenciales de YouTube todavía no están configuradas en los secretos del
 * proyecto, no falla: devuelve `no_disponible` y el archivo se queda esperando.
 */
export const subirVideoYoutube = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof entrada>) => entrada.parse(data))
  .handler(async ({ data, context }): Promise<ResultadoVideo> => {
    const { userId } = context;

    // Límite de frecuencia: 5 intentos por IP y hora.
    const { dentroDeLimite, LIMITES } = await import("@/lib/rate-limit.server");
    if (!dentroDeLimite("video", LIMITES.video)) return { estado: "limite" };

    const clientId = process.env["YOUTUBE_CLIENT_ID"];
    const clientSecret = process.env["YOUTUBE_CLIENT_SECRET"];
    const refreshToken = process.env["YOUTUBE_REFRESH_TOKEN"];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // El archivo debe estar en la carpeta del propio usuario.
    if (!data.ruta.startsWith(`${userId}/`)) {
      return { estado: "error", mensaje: "Vídeo no válido." };
    }

    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!candidato) return { estado: "error", mensaje: "Vídeo no válido." };

    if (!clientId || !clientSecret || !refreshToken) {
      return { estado: "no_disponible" };
    }

    try {
      // 1. Access token a partir del refresh token.
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      if (!tokenRes.ok) {
        console.error("[youtube] token:", await tokenRes.text());
        return { estado: "error", mensaje: "No se pudo conectar con YouTube." };
      }
      const { access_token: accessToken } = (await tokenRes.json()) as {
        access_token: string;
      };

      // 2. Descargar el archivo del bucket temporal.
      const { data: archivo, error: errDescarga } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(data.ruta);
      if (errDescarga || !archivo) {
        return { estado: "error", mensaje: "No se encontró el vídeo subido." };
      }
      const bytes = new Uint8Array(await archivo.arrayBuffer());

      // 3. Subida resumable a YouTube en modo "unlisted".
      const metadata = {
        snippet: { title: data.titulo, description: "Vídeo de presentación — FigurArte" },
        status: { privacyStatus: "unlisted", selfDeclaredMadeForKids: false },
      };
      const initRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Type": archivo.type || "video/*",
            "X-Upload-Content-Length": String(bytes.byteLength),
          },
          body: JSON.stringify(metadata),
        },
      );
      const uploadUrl = initRes.headers.get("location");
      if (!initRes.ok || !uploadUrl) {
        console.error("[youtube] init:", await initRes.text());
        return { estado: "error", mensaje: "No se pudo iniciar la subida a YouTube." };
      }

      const subida = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": archivo.type || "video/*" },
        body: bytes,
      });
      if (!subida.ok) {
        console.error("[youtube] upload:", await subida.text());
        return { estado: "error", mensaje: "No se pudo subir el vídeo a YouTube." };
      }
      const creado = (await subida.json()) as { id: string };
      const url = `https://www.youtube.com/watch?v=${creado.id}`;

      // 4. Guardar en el candidato y limpiar el archivo temporal.
      await supabaseAdmin
        .from("candidatos")
        .update({
          video_youtube_id: creado.id,
          video_youtube_url: url,
          video_privacy: "unlisted",
        })
        .eq("id", candidato.id);

      await supabaseAdmin.storage.from(BUCKET).remove([data.ruta]);

      return { estado: "ok", videoId: creado.id, url };
    } catch (err) {
      console.error("[youtube] error inesperado:", err);
      return { estado: "error", mensaje: "No se pudo procesar el vídeo." };
    }
  });
