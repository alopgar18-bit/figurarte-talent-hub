import { createServerFn } from "@tanstack/react-start";

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
  | { estado: "ok"; candidatos: CandidatoPublico[] }
  | { estado: "limitado" };

function comoArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Listado público de candidatos verificados (`disponible_publico = true`).
 * Usa la función SQL `fn_candidatos_publicos`, que proyecta únicamente las
 * columnas autorizadas: es el backstop de privacidad de esta vista.
 */
export const listarCandidatosPublicos = createServerFn({ method: "GET" }).handler(
  async (): Promise<ListadoPublico> => {
    const { dentroDeLimite, LIMITES } = await import("@/lib/rate-limit.server");
    if (!dentroDeLimite("candidatosPublicos", LIMITES.candidatosPublicos)) {
      return { estado: "limitado" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("fn_candidatos_publicos");
    if (error) {
      console.error("[candidatos-publicos] No se pudo cargar el listado:", error);
      throw new Error("No se pudo cargar el listado de candidatos.");
    }

    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");

    return {
      estado: "ok",
      candidatos: await Promise.all(
        (data ?? []).map(async (c) => {
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
  },
);
