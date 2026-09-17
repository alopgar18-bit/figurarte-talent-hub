import { createFileRoute } from "@tanstack/react-router";

/**
 * Baja de comunicaciones informativas.
 * - POST: lo usa el botón "Cancelar suscripción" del cliente de correo
 *   (List-Unsubscribe-Post, un solo clic).
 * - GET: enlace del pie del correo; da de baja y muestra confirmación.
 * El identificador del candidato (uuid) actúa de credencial: no es adivinable
 * y solo permite marcar la baja, nunca leer datos.
 */
async function darDeBaja(candidatoId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("candidatos")
    .update({
      baja_comunicaciones: true,
      fecha_baja_comunicaciones: new Date().toISOString(),
    })
    .eq("id", candidatoId);
  if (error) {
    console.error("[baja] No se pudo registrar la baja:", error.message);
    return false;
  }
  return true;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pagina(titulo: string, mensaje: string, estado: number): Response {
  return new Response(
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} — FigurArte</title></head>
<body style="margin:0;background:#E8E8D8;font-family:Arial,Helvetica,sans-serif;color:#282828;">
<div style="max-width:560px;margin:0 auto;padding:48px 24px;">
<div style="background:#282828;color:#E8E8D8;padding:20px 24px;font-weight:bold;letter-spacing:2px;">FIGURARTE</div>
<div style="background:#ffffff;padding:28px 24px;line-height:1.6;">
<h1 style="margin:0 0 12px;font-size:20px;">${titulo}</h1>
<p style="margin:0;">${mensaje}</p>
</div></div></body></html>`,
    { status: estado, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/public/baja")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("c") ?? "";
        if (!UUID.test(id)) return new Response("Solicitud no válida", { status: 400 });
        const ok = await darDeBaja(id);
        return new Response(ok ? "ok" : "error", { status: ok ? 200 : 500 });
      },
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("c") ?? "";
        if (!UUID.test(id)) {
          return pagina(
            "Enlace no válido",
            "No hemos podido identificar tu suscripción. Escríbenos a casting@figurarte.app y te damos de baja manualmente.",
            400,
          );
        }
        const ok = await darDeBaja(id);
        return ok
          ? pagina(
              "Baja confirmada",
              "Ya no recibirás comunicaciones informativas de FigurArte. Seguirás recibiendo únicamente los correos imprescindibles sobre tu ficha o tus accesos.",
              200,
            )
          : pagina(
              "No hemos podido completar la baja",
              "Inténtalo de nuevo en unos minutos o escríbenos a casting@figurarte.app.",
              500,
            );
      },
    },
  },
});
