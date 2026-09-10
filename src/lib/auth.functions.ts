import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccesoResuelto =
  | { tipo: "usuario"; rol: string; nombreEmail: string }
  | { tipo: "candidato"; nombre: string }
  | { tipo: "ninguno" };

/**
 * Resuelve el rol de la sesión recién creada y vincula user_id.
 * Orden: usuarios -> candidatos -> sin cuenta.
 */
export const resolverAcceso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccesoResuelto> => {
    const { userId, claims } = context;
    const email = (claims["email"] as string | undefined)?.toLowerCase();
    if (!email) return { tipo: "ninguno" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. ¿Existe en usuarios?
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("id, rol, email, user_id")
      .ilike("email", email)
      .maybeSingle();

    if (usuario) {
      if (usuario.user_id !== userId) {
        await supabaseAdmin
          .from("usuarios")
          .update({ user_id: userId, ultimo_acceso: new Date().toISOString() })
          .eq("id", usuario.id);
      } else {
        await supabaseAdmin
          .from("usuarios")
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq("id", usuario.id);
      }
      return { tipo: "usuario", rol: usuario.rol, nombreEmail: usuario.email };
    }

    // 2. ¿Existe en candidatos?
    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("id, nombre, user_id")
      .ilike("email", email)
      .maybeSingle();

    if (candidato) {
      if (candidato.user_id !== userId) {
        await supabaseAdmin
          .from("candidatos")
          .update({ user_id: userId })
          .eq("id", candidato.id);
      }
      return { tipo: "candidato", nombre: candidato.nombre };
    }

    // 3. Sin cuenta
    return { tipo: "ninguno" };
  });
