import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AccionAcceso =
  | "vio_ficha"
  | "genero_dossier"
  | "exporto_excel"
  | "borro_candidato";

type Admin = SupabaseClient<Database>;

/**
 * Registro mínimo de accesos exigido por RGPD: quién, sobre qué candidato,
 * qué acción y cuándo. Nunca guarda datos personales del candidato.
 * Es puramente informativo: si falla, solo se registra en el log del servidor.
 */
export async function anotarAcceso(
  admin: Admin,
  entrada: {
    userId: string;
    accion: AccionAcceso;
    candidatoId?: string | null;
    detalle?: string | null;
  },
): Promise<void> {
  try {
    const { data: usuario } = await admin
      .from("usuarios")
      .select("email")
      .eq("user_id", entrada.userId)
      .maybeSingle();

    const { error } = await admin.from("registro_accesos").insert({
      actor_user_id: entrada.userId,
      actor_email: usuario?.email ?? null,
      candidato_id: entrada.candidatoId ?? null,
      accion: entrada.accion,
      detalle: entrada.detalle ?? null,
    });
    if (error) console.error("[registro-accesos] No se pudo anotar:", error);
  } catch (err) {
    console.error("[registro-accesos] Error inesperado:", err);
  }
}
