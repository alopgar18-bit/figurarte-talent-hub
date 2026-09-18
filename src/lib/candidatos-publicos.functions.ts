import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Candidato tal y como se muestra en la vista pública abierta.
 * NUNCA incluye datos de contacto, nombre, ni datos de categoría especial:
 * `origen_etnia` y `color_piel` quedan excluidos a propósito (esta vista es
 * de acceso abierto, no un dossier a un cliente identificado).
 */
export type CandidatoPublico = {
  id: string;
  codigo: string;
  categoria: string;
  genero: string | null;
  edad: number | null;
  provincia: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  foto: string | null;
  talla_camisa: string | null;
  talla_pantalon: string | null;
  talla_calzado: string | null;
  talla_chaqueta: string | null;
  complexion: string | null;
  tipo_pelo: string | null;
  color_cabello: string | null;
  color_ojos: string | null;
  tipo_perfil: string[];
  habilidades: string[];
  idiomas: string[];
};

export type ListadoPublico =
  | {
      estado: "ok";
      candidatos: CandidatoPublico[];
      total: number;
      hayMas: boolean;
      offset: number;
      limit: number;
    }
  | { estado: "limitado" };

const entradaListado = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).max(100000).optional(),
  categoria: z.string().max(40).optional(),
  genero: z.string().max(40).optional(),
  edadMin: z.number().int().min(0).max(120).optional(),
  edadMax: z.number().int().min(0).max(120).optional(),
});

export type EntradaListadoPublico = z.input<typeof entradaListado>;

function comoArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Listado público de candidatos verificados (`disponible_publico = true`).
 * Usa la función SQL `fn_candidatos_publicos`, que proyecta únicamente las
 * columnas autorizadas: es el backstop de privacidad de esta vista.
 */
export const listarCandidatosPublicos = createServerFn({ method: "GET" })
  .inputValidator((entrada: { limit?: number; offset?: number } | undefined) =>
    entradaListado.parse(entrada ?? {}),
  )
  .handler(async ({ data }): Promise<ListadoPublico> => {
    const limit = data.limit ?? 60;
    const offset = data.offset ?? 0;
    const { dentroDeLimite, LIMITES } = await import("@/lib/rate-limit.server");
    if (!dentroDeLimite("candidatosPublicos", LIMITES.candidatosPublicos)) {
      return { estado: "limitado" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: filas, error } = await supabaseAdmin.rpc("fn_candidatos_publicos", {
      p_limit: limit,
      p_offset: offset,
    });
    if (error) {
      console.error("[candidatos-publicos] No se pudo cargar el listado:", error);
      throw new Error("No se pudo cargar el listado de candidatos.");
    }

    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    const total = Number(filas?.[0]?.total_disponibles ?? 0);

    return {
      estado: "ok",
      total,
      offset,
      limit,
      hayMas: offset + (filas?.length ?? 0) < total,
      candidatos: await Promise.all(
        (filas ?? []).map(async (c) => {
          const fotos = await firmarFotosPrivadas(supabaseAdmin, c.fotos);
          const foto = fotos.find((f) => /^https?:\/\//.test(f)) ?? null;
          return {
            id: c.id,
            codigo: c.codigo,
            categoria: c.categoria,
            genero: c.genero ?? null,
            edad: c.edad,
            provincia: c.provincia,
            altura_cm: c.altura_cm,
            peso_kg: c.peso_kg,
            foto,
            talla_camisa: c.talla_camisa ?? null,
            talla_pantalon: c.talla_pantalon ?? null,
            talla_calzado: c.talla_calzado ?? null,
            talla_chaqueta: c.talla_chaqueta ?? null,
            complexion: c.complexion ?? null,
            tipo_pelo: c.tipo_pelo ?? null,
            color_cabello: c.color_cabello ?? null,
            color_ojos: c.color_ojos ?? null,
            tipo_perfil: comoArray<string>(c.tipo_perfil),
            habilidades: comoArray<string>(c.habilidades),
            idiomas: comoArray<{ idioma?: string }>(c.idiomas_detalle)
              .map((i) => i?.idioma ?? "")
              .filter((i) => i !== ""),
          };
        }),
      ),
    };
  });
