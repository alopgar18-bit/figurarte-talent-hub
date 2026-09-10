import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CandidatoPortal = {
  id: string;
  codigo: string;
  categoria: string;
  altura_cm: number | null;
  ciudad: string | null;
  disponible: boolean;
};

export type DossierPortal = {
  id: string;
  slug_publico: string | null;
  creado_en: string;
  fecha_caducidad: string | null;
  proyecto_nombre: string;
  num_candidatos: number;
};

/**
 * Comprueba en servidor que la sesión actual es un cliente con cliente_id
 * vinculado. No confía en el guard del layout: se valida en cada llamada.
 */
async function clienteDeLaSesion(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: usuario } = await supabaseAdmin
    .from("usuarios")
    .select("rol, cliente_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!usuario || usuario.rol !== "cliente" || !usuario.cliente_id) return null;
  return { clienteId: usuario.cliente_id, supabaseAdmin };
}

/**
 * Búsqueda de candidatos para el portal de cliente.
 * Devuelve SOLO datos no identificativos: código, categoría, altura,
 * ciudad y disponibilidad. Nunca nombre, email ni teléfono.
 */
export const buscarCandidatosPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { categoria?: string; codigo?: string }) => ({
    categoria: typeof input?.categoria === "string" ? input.categoria : "",
    codigo: typeof input?.codigo === "string" ? input.codigo.slice(0, 40) : "",
  }))
  .handler(async ({ data, context }): Promise<CandidatoPortal[]> => {
    const sesion = await clienteDeLaSesion(context.userId);
    if (!sesion) throw new Error("Acceso restringido al portal de cliente.");

    let consulta = sesion.supabaseAdmin
      .from("candidatos")
      .select("id, codigo, categoria, altura_cm, ciudad, disponible")
      .order("codigo")
      .limit(200);

    if (data.categoria) consulta = consulta.eq("categoria", data.categoria as never);
    if (data.codigo) consulta = consulta.ilike("codigo", `%${data.codigo}%`);

    const { data: filas, error } = await consulta;
    if (error) throw new Error("No se pudo cargar la lista de candidatos.");

    return (filas ?? []).map((f) => ({
      id: f.id,
      codigo: f.codigo,
      categoria: f.categoria,
      altura_cm: f.altura_cm,
      ciudad: f.ciudad,
      disponible: f.disponible,
    }));
  });

/**
 * Dossiers de los proyectos del cliente de la sesión. El filtrado por
 * cliente_id se hace en servidor, no vía RLS pública de `dossiers`.
 */
export const misDossiersPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DossierPortal[]> => {
    const sesion = await clienteDeLaSesion(context.userId);
    if (!sesion) throw new Error("Acceso restringido al portal de cliente.");

    const { data: proyectos } = await sesion.supabaseAdmin
      .from("proyectos_casting")
      .select("id, nombre")
      .eq("cliente_id", sesion.clienteId);

    const ids = (proyectos ?? []).map((p) => p.id);
    if (ids.length === 0) return [];
    const nombres: Record<string, string> = {};
    for (const p of proyectos ?? []) nombres[p.id] = p.nombre;

    const { data: dossiers } = await sesion.supabaseAdmin
      .from("dossiers")
      .select("id, slug_publico, creado_en, fecha_caducidad, candidatos_incluidos, proyecto_id")
      .in("proyecto_id", ids)
      .order("creado_en", { ascending: false });

    return (dossiers ?? []).map((d) => ({
      id: d.id,
      slug_publico: d.slug_publico,
      creado_en: d.creado_en,
      fecha_caducidad: d.fecha_caducidad,
      proyecto_nombre: nombres[d.proyecto_id] ?? "—",
      num_candidatos: (d.candidatos_incluidos ?? []).length,
    }));
  });
