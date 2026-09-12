import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const entrada = z
  .object({
    canal: z.enum(["email", "whatsapp"]),
    asunto: z.string().max(200).optional(),
    cuerpo: z.string().max(8000).optional(),
    plantillaWati: z.string().max(200).optional(),
    candidatoIds: z.array(z.string().uuid()).max(500).default([]),
    clienteIds: z.array(z.string().uuid()).max(100).default([]),
    proyectoId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (v) =>
      v.canal === "email"
        ? Boolean(v.asunto?.trim() && v.cuerpo?.trim())
        : Boolean(v.plantillaWati?.trim()),
    { message: "Faltan datos del mensaje." },
  );

export type ResultadoEnvioExpress = {
  enviados: number;
  omitidos: { destinatario: string; motivo: string }[];
  fallidos: { destinatario: string; motivo: string }[];
};

/**
 * Envío puntual ("express") de una comunicación a candidatos y/o clientes.
 * Omite sin romper nada a quien no tenga contacto válido para el canal.
 * Cada envío conseguido queda registrado en `comunicaciones` con origen "express".
 */
export const enviarComunicacionExpress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof entrada>) => entrada.parse(data))
  .handler(async ({ data, context }): Promise<ResultadoEnvioExpress> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: staff } = await supabaseAdmin
      .from("usuarios")
      .select("rol")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (
      !staff ||
      !["superadmin", "admin_figurarte", "coordinador", "validador"].includes(staff.rol)
    ) {
      throw new Error("Acceso restringido al equipo de FigurArte.");
    }

    const request = getRequest();
    const host = request?.headers.get("host") ?? "figurarte-casting.lovable.app";
    const baseUrl = `https://${host}`;

    const { aplicarVariables, enviarEmailFigurarte } = await import(
      "@/lib/comunicaciones.server"
    );
    const { watiConfigurado, normalizarTelefonoES, watiEnviarPlantilla } = await import(
      "@/lib/wati.server"
    );

    const resultado: ResultadoEnvioExpress = { enviados: 0, omitidos: [], fallidos: [] };

    if (data.canal === "whatsapp" && !watiConfigurado()) {
      throw new Error(
        "El canal de WhatsApp aún no está configurado en este proyecto (faltan las credenciales de Wati).",
      );
    }

    type Destino = {
      nombre: string;
      email: string | null;
      telefono: string | null;
      candidatoId: string | null;
      clienteId: string | null;
      enlace: string;
    };

    const destinos: Destino[] = [];

    if (data.candidatoIds.length > 0) {
      const { data: candidatos } = await supabaseAdmin
        .from("candidatos")
        .select("id, codigo, nombre, email, telefono")
        .in("id", data.candidatoIds);
      for (const c of candidatos ?? []) {
        destinos.push({
          nombre: `${c.codigo} — ${c.nombre}`,
          email: c.email,
          telefono: c.telefono,
          candidatoId: c.id,
          clienteId: null,
          enlace: `${baseUrl}/candidato`,
        });
      }
    }

    if (data.clienteIds.length > 0) {
      const { data: clientes } = await supabaseAdmin
        .from("clientes")
        .select("id, razon_social, contactos")
        .in("id", data.clienteIds);
      for (const cl of clientes ?? []) {
        const contactos = (cl.contactos ?? []) as {
          email?: string;
          telefono?: string;
        }[];
        const primero = contactos.find((x) => x.email) ?? contactos[0] ?? {};
        destinos.push({
          nombre: cl.razon_social,
          email: primero.email ?? null,
          telefono: primero.telefono ?? null,
          candidatoId: null,
          clienteId: cl.id,
          enlace: `${baseUrl}/portal`,
        });
      }
    }

    for (const d of destinos) {
      let enviado = false;
      let contenido = "";

      if (data.canal === "email") {
        if (!d.email) {
          resultado.omitidos.push({
            destinatario: d.nombre,
            motivo: "Sin dirección de email",
          });
          continue;
        }
        const asunto = aplicarVariables(data.asunto ?? "", {
          nombre: d.nombre,
          enlace: d.enlace,
        });
        const cuerpo = aplicarVariables(data.cuerpo ?? "", {
          nombre: d.nombre,
          enlace: d.enlace,
        });
        enviado = await enviarEmailFigurarte({ email: d.email, asunto, cuerpo });
        contenido = `Asunto: ${asunto}\n\n${cuerpo}`;
      } else {
        const numero = normalizarTelefonoES(d.telefono);
        if (!numero) {
          resultado.omitidos.push({
            destinatario: d.nombre,
            motivo: "Sin teléfono válido para WhatsApp",
          });
          continue;
        }
        const plantilla = (data.plantillaWati ?? "").trim();
        const { ok } = await watiEnviarPlantilla({
          telefono: numero,
          plantilla,
          broadcast: `figurarte_express_${new Date().toISOString().slice(0, 10)}`,
          parametros: [
            { name: "nombre", value: d.nombre },
            { name: "enlace", value: d.enlace },
          ],
        });
        enviado = ok;
        contenido = `Plantilla Wati: ${plantilla}\nnombre=${d.nombre}\nenlace=${d.enlace}`;
      }

      if (!enviado) {
        resultado.fallidos.push({
          destinatario: d.nombre,
          motivo: "El proveedor rechazó el envío",
        });
        continue;
      }

      resultado.enviados += 1;
      const { error } = await supabaseAdmin.from("comunicaciones").insert({
        candidato_id: d.candidatoId,
        cliente_id: d.clienteId,
        proyecto_id: data.proyectoId ?? null,
        tipo: "express",
        canal: data.canal,
        origen: "express",
        destinatario_tipo: d.candidatoId ? "candidato" : "cliente",
        contenido,
      });
      if (error) console.error("[comunicaciones] No se pudo registrar:", error.message);
    }

    return resultado;
  });
