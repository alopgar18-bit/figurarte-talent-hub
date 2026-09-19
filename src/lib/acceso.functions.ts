import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

/** Resultado del envío del enlace mágico de acceso. */
export type ResultadoEnlaceAcceso =
  | { estado: "ok" }
  | { estado: "limitado" }
  | { estado: "error" };

const entradaEnlace = z.object({
  email: z.string().email().max(255),
  turnstileToken: z.string().max(4000).optional(),
});

/** Límite del ámbito "auth": 5 enlaces por email cada 15 minutos. */
const LIMITE_AUTH = { max: 5, ventanaSegundos: 900 };

/** Dominio de producción, usado si la petición no trae origen fiable. */
const ORIGEN_POR_DEFECTO = "https://casting.figurarte.app";

async function tokenTurnstileValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secreto = process.env["TURNSTILE_SECRET_KEY"];
  if (!secreto) {
    console.error("[acceso] Falta TURNSTILE_SECRET_KEY");
    return false;
  }
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: secreto, response: token }),
    });
    if (!res.ok) return false;
    const datos = (await res.json()) as { success?: boolean };
    return datos.success === true;
  } catch (e) {
    console.error("[acceso] Error verificando Turnstile:", e);
    return false;
  }
}

function origenPeticion(): string {
  try {
    const origin = getRequestHeader("origin");
    if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, "");
    const host = getRequestHeader("host");
    if (host) {
      const protocolo = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
      return `${protocolo}://${host}`;
    }
  } catch {
    /* fuera de contexto de petición */
  }
  return ORIGEN_POR_DEFECTO;
}

/**
 * Envía el enlace mágico de acceso desde el servidor, protegido contra
 * email-bombing: límite persistente por email (5 / 15 min) + Turnstile.
 */
export const enviarEnlaceAcceso = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => entradaEnlace.parse(data))
  .handler(async ({ data }): Promise<ResultadoEnlaceAcceso> => {
    const email = data.email.trim().toLowerCase();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: dentro, error: errorLimite } = await supabaseAdmin.rpc("fn_verificar_limite", {
      p_ambito: "auth",
      p_clave: email,
      p_max: LIMITE_AUTH.max,
      p_ventana_segundos: LIMITE_AUTH.ventanaSegundos,
    });
    if (errorLimite || dentro !== true) return { estado: "limitado" };

    if (!(await tokenTurnstileValido(data.turnstileToken))) return { estado: "limitado" };

    const url = process.env["SUPABASE_URL"];
    const clavePublica =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    if (!url || !clavePublica) {
      console.error("[acceso] Faltan SUPABASE_URL o la clave pública");
      return { estado: "error" };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const cliente = createClient(url, clavePublica, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { error } = await cliente.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origenPeticion()}/auth/callback` },
    });
    if (error) {
      console.error("[acceso] Error enviando enlace:", error.message);
      return { estado: "error" };
    }
    return { estado: "ok" };
  });
