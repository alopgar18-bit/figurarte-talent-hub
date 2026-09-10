import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CandidatoDossier = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  edad: number | null;
  provincia: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  fotos: string[];
  campos: { nombre: string; valor: string }[];
};

export type DossierPublico = {
  slug: string;
  caducado: boolean;
  fechaCaducidad: string | null;
  proyectoNombre: string;
  clienteNombre: string | null;
  categoria: string | null;
  creadoEn: string;
  candidatos: CandidatoDossier[];
};

/**
 * Lectura pública del dossier por slug. Usa el cliente de servicio porque
 * `candidatos` no es legible por `anon`; devuelve solo campos no sensibles
 * (nunca email ni teléfono).
 */
export const obtenerDossierPublico = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        slug: z
          .string()
          .trim()
          .min(8)
          .max(120)
          .regex(/^[a-z0-9-]+$/),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<DossierPublico | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Backstop de acceso: la tabla `dossiers` no tiene lectura pública. Esta
    // función SQL devuelve como mucho una fila, por slug exacto y no caducada.
    const { data: filas, error: errorDossier } = await supabaseAdmin.rpc("fn_dossier_publico", {
      _slug: data.slug,
    });
    if (errorDossier) {
      console.error("[dossier] No se pudo resolver el enlace:", errorDossier);
      throw new Error("No se pudo cargar el dossier.");
    }

    const dossier = (filas ?? [])[0];
    if (!dossier) return null;

    const caducado = false;

    const { data: proyecto } = await supabaseAdmin
      .from("proyectos_casting")
      .select("nombre,cliente_id,brief_publico,campos_personalizados_activados")
      .eq("id", dossier.proyecto_id)
      .maybeSingle();

    let clienteNombre: string | null = null;
    if (proyecto?.cliente_id) {
      const { data: cliente } = await supabaseAdmin
        .from("clientes")
        .select("razon_social")
        .eq("id", proyecto.cliente_id)
        .maybeSingle();
      clienteNombre = cliente?.razon_social ?? null;
    }

    const brief = (proyecto?.brief_publico ?? null) as { categoria?: string } | null;

    const base: DossierPublico = {
      slug: data.slug,
      caducado,
      fechaCaducidad: dossier.fecha_caducidad,
      proyectoNombre: proyecto?.nombre ?? "Dossier",
      clienteNombre,
      categoria: brief?.categoria ?? null,
      creadoEn: dossier.creado_en,
      candidatos: [],
    };

    if (caducado) return base;

    const ids = (dossier.candidatos_incluidos ?? []) as string[];
    if (ids.length === 0) return base;

    // Backstop de privacidad: esta función SQL solo puede devolver los campos
    // no identificativos autorizados para un dossier público.
    const { data: candidatos, error: errorCandidatos } = await supabaseAdmin.rpc(
      "fn_datos_publicos_candidato",
      { ids },
    );
    if (errorCandidatos) {
      console.error("[dossier] No se pudieron cargar los candidatos públicos:", errorCandidatos);
      throw new Error("No se pudo cargar el dossier.");
    }

    const { firmarFotosPrivadas } = await import("@/lib/fotos.server");
    const candidatosConFotos = await Promise.all(
      (candidatos ?? []).map(async (c) => ({
        ...c,
        fotos: await firmarFotosPrivadas(supabaseAdmin, c.fotos),
      })),
    );

    const camposActivados = (proyecto?.campos_personalizados_activados ?? []) as string[];
    const nombresCampo: Record<string, string> = {};
    const valores: Record<string, { nombre: string; valor: string }[]> = {};

    if (camposActivados.length > 0) {
      const { data: defs } = await supabaseAdmin
        .from("campos_personalizados")
        .select("id,nombre")
        .in("id", camposActivados);
      for (const d of defs ?? []) nombresCampo[d.id] = d.nombre;

      const { data: vals } = await supabaseAdmin
        .from("candidato_campos_valor")
        .select("candidato_id,campo_id,valor")
        .in("candidato_id", ids)
        .in("campo_id", camposActivados);

      for (const v of vals ?? []) {
        if (!v.valor || v.valor.trim() === "") continue;
        const nombre = nombresCampo[v.campo_id];
        if (!nombre) continue;
        (valores[v.candidato_id] ??= []).push({ nombre, valor: v.valor });
      }
    }

    const porId = new Map(candidatosConFotos.map((c) => [c.id, c]));
    base.candidatos = ids
      .map((id) => porId.get(id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({
        id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        categoria: c.categoria,
        edad: c.edad,
        provincia: c.provincia,
        altura_cm: c.altura_cm,
        peso_kg: c.peso_kg,
        fotos: (c.fotos ?? []).filter((f: string) => /^https?:\/\//.test(f)),
        campos: valores[c.id] ?? [],
      }));

    return base;
  });
