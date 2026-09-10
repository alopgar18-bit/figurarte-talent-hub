import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const candidaturaSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(120),
  categoria: z.enum(["actor", "modelo", "figurante", "casting_plus"]),
  email: z.string().trim().email("Email no válido").max(255),
  telefono: z.string().trim().min(6, "Teléfono no válido").max(30),
  consentimiento_rgpd: z.literal(true),
  altura_cm: z.number().int().min(50).max(260).nullable().optional(),
  peso_kg: z.number().int().min(20).max(300).nullable().optional(),
  ciudad: z.string().trim().max(120).nullable().optional(),
  fotos: z.array(z.string().max(300)).max(3).optional(),
  fotos_recorte: z
    .record(
      z.string().max(300),
      z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    )
    .nullable()
    .optional(),
  proyecto_id: z.string().uuid().nullable().optional(),
});

export type CandidaturaInput = z.input<typeof candidaturaSchema>;

export type CandidaturaResultado =
  | { estado: "ok"; codigo: string }
  | { estado: "duplicado" }
  | { estado: "error"; mensaje: string };

export const crearCandidatura = createServerFn({ method: "POST" })
  .inputValidator((data: CandidaturaInput) => candidaturaSchema.parse(data))
  .handler(async ({ data }): Promise<CandidaturaResultado> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const email = data.email.toLowerCase();

    const { data: existente } = await supabaseAdmin
      .from("candidatos")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existente) return { estado: "duplicado" };

    const { data: creado, error } = await supabaseAdmin
      .from("candidatos")
      .insert({
        nombre: data.nombre,
        categoria: data.categoria,
        email,
        telefono: data.telefono,
        ciudad: data.ciudad ?? null,
        altura_cm: data.altura_cm ?? null,
        peso_kg: data.peso_kg ?? null,
        fotos: data.fotos ?? [],
        fotos_recorte: data.fotos_recorte ?? null,
        consentimiento_rgpd: true,
        fecha_consentimiento: new Date().toISOString(),
      })
      .select("id, codigo")
      .single();

    if (error || !creado) {
      return { estado: "error", mensaje: "No se pudo registrar la candidatura." };
    }

    if (data.proyecto_id) {
      await supabaseAdmin.from("proyecto_candidatos").insert({
        proyecto_id: data.proyecto_id,
        candidato_id: creado.id,
        origen: "web_directa",
      });
    }

    return { estado: "ok", codigo: creado.codigo };
  });
