import { createServerFn } from "@tanstack/react-start";
import { dentroDeLimite, LIMITES } from "@/lib/rate-limit.server";

export type ResultadoRegistroCliente =
  | { estado: "ok" }
  | { estado: "limite" }
  | { estado: "datos_invalidos"; mensaje: string };

/**
 * Alta pública de cliente (marca o productora) desde la Home.
 * Crea la ficha de cliente y su usuario con rol `cliente` para que
 * pueda entrar al portal y solicitar un proyecto.
 *
 * Respuesta indistinguible: si el email ya existe NO se duplica nada y
 * se devuelve el mismo "ok", igual que en el registro de candidatos.
 */
export const registrarCliente = createServerFn({ method: "POST" })
  .inputValidator((input: {
    razonSocial: string;
    sector: string | null;
    nombreContacto: string;
    email: string;
    telefono: string | null;
  }) => ({
    razonSocial: String(input?.razonSocial ?? "").trim().slice(0, 200),
    sector: input?.sector ? String(input.sector).trim().slice(0, 120) : null,
    nombreContacto: String(input?.nombreContacto ?? "").trim().slice(0, 120),
    email: String(input?.email ?? "").trim().toLowerCase().slice(0, 255),
    telefono: input?.telefono ? String(input.telefono).trim().slice(0, 40) : null,
  }))
  .handler(async ({ data }): Promise<ResultadoRegistroCliente> => {
    if (!dentroDeLimite("registroCliente", LIMITES.registro)) {
      return { estado: "limite" };
    }
    if (!data.razonSocial) {
      return { estado: "datos_invalidos", mensaje: "Indica la razón social." };
    }
    if (!data.nombreContacto) {
      return { estado: "datos_invalidos", mensaje: "Indica la persona de contacto." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { estado: "datos_invalidos", mensaje: "Revisa el email de contacto." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // ¿Ya hay una cuenta con ese email? Entonces no se crea nada nuevo.
    const { data: existente, error: errBusca } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (errBusca) throw new Error("No se pudo comprobar la cuenta.");
    if (existente) return { estado: "ok" };

    const { data: cliente, error: errCliente } = await supabaseAdmin
      .from("clientes")
      .insert({
        razon_social: data.razonSocial,
        sector: data.sector,
        contactos: [
          {
            nombre: data.nombreContacto,
            email: data.email,
            telefono: data.telefono,
          },
        ],
      })
      .select("id")
      .single();

    if (errCliente || !cliente) throw new Error("No se pudo crear la ficha de cliente.");

    const { error: errUsuario } = await supabaseAdmin.from("usuarios").insert({
      email: data.email,
      rol: "cliente",
      cliente_id: cliente.id,
    });

    if (errUsuario) {
      // No dejamos una ficha de cliente huérfana sin acceso.
      await supabaseAdmin.from("clientes").delete().eq("id", cliente.id);
      throw new Error("No se pudo crear el acceso del cliente.");
    }

    return { estado: "ok" };
  });
