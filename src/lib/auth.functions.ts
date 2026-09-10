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

export const ROLES_STAFF = [
  "superadmin",
  "admin_figurarte",
  "coordinador",
  "validador",
] as const;

export type SesionStaff =
  | { esStaff: true; rol: string; email: string }
  | { esStaff: false };

/**
 * Resuelve si la sesión actual pertenece al equipo (staff) y devuelve rol y email.
 * Reutiliza el mismo orden de resolución que `resolverAcceso`.
 */
export const obtenerSesionStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SesionStaff> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("rol, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (!usuario) return { esStaff: false };
    if (!(ROLES_STAFF as readonly string[]).includes(usuario.rol)) {
      return { esStaff: false };
    }
    return { esStaff: true, rol: usuario.rol, email: usuario.email };
  });

export type SesionCliente =
  | { esCliente: true; clienteId: string; razonSocial: string; email: string }
  | { esCliente: false };

/**
 * Resuelve si la sesión actual pertenece a un cliente con `cliente_id` vinculado.
 * Mismo patrón que `obtenerSesionStaff`, pero para el portal de cliente.
 */
export const obtenerSesionCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SesionCliente> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("rol, email, cliente_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!usuario || usuario.rol !== "cliente" || !usuario.cliente_id) {
      return { esCliente: false };
    }

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id, razon_social")
      .eq("id", usuario.cliente_id)
      .maybeSingle();

    if (!cliente) return { esCliente: false };

    await supabaseAdmin
      .from("usuarios")
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq("user_id", userId);

    return {
      esCliente: true,
      clienteId: cliente.id,
      razonSocial: cliente.razon_social,
      email: usuario.email,
    };
  });
