import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { plantillaEmail } from "@/lib/email-layout";

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

const ETIQUETA_CATEGORIA: Record<string, string> = {
  actor: "Actores",
  modelo: "Modelos",
  figurante: "Figurantes",
  casting_plus: "Casting Plus",
};

/**
 * Avisa por email a todos los administradores (admin_figurarte y superadmin)
 * de una nueva solicitud, incluyendo el resumen de TODAS las pendientes.
 * Nunca lanza: cualquier fallo se registra en el log del servidor.
 */
async function avisarEquipoNuevaSolicitud() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: admins, error: errorAdmins } = await supabaseAdmin
      .from("usuarios")
      .select("email")
      .in("rol", ["admin_figurarte", "superadmin"]);

    if (errorAdmins) {
      console.error("[email] No se pudieron leer los administradores:", errorAdmins.message);
      return;
    }

    const destinatarios = Array.from(
      new Set((admins ?? []).map((a) => a.email).filter((e): e is string => !!e && e.includes("@"))),
    );

    if (destinatarios.length === 0) {
      console.error("[email] No hay administradores con email a quien avisar");
      return;
    }

    const { data: pendientes, error: errorPend } = await supabaseAdmin
      .from("solicitudes_proyecto")
      .select("nombre_proyecto, categoria, recibida_en, cliente_id")
      .eq("estado", "pendiente")
      .order("recibida_en", { ascending: true });

    if (errorPend) {
      console.error("[email] No se pudieron leer las solicitudes pendientes:", errorPend.message);
    }

    const filas = pendientes ?? [];
    const idsCliente = Array.from(new Set(filas.map((f) => f.cliente_id).filter(Boolean)));
    const nombresCliente: Record<string, string> = {};
    if (idsCliente.length > 0) {
      const { data: clientes } = await supabaseAdmin
        .from("clientes")
        .select("id, razon_social")
        .in("id", idsCliente);
      for (const c of clientes ?? []) nombresCliente[c.id] = c.razon_social;
    }

    const lineas = filas.map((f) => {
      const cliente = nombresCliente[f.cliente_id] ?? "Cliente";
      const categoria = ETIQUETA_CATEGORIA[f.categoria] ?? f.categoria;
      const fecha = f.recibida_en ? new Date(f.recibida_en).toLocaleDateString("es-ES") : "";
      return `• ${cliente} — ${f.nombre_proyecto} (${categoria})${fecha ? ` · recibida el ${fecha}` : ""}`;
    });

    const cuerpo = `Ha entrado una nueva solicitud de proyecto desde el portal de cliente.

Solicitudes pendientes de gestionar (${filas.length}):
${lineas.length > 0 ? lineas.join("\n") : "—"}

Entra en el panel para revisarlas y convertirlas en proyectos.`;

    const { enviarEmailFigurarte } = await import("@/lib/comunicaciones.server");
    const enlace = `${origenPeticion()}/panel/dashboard`;

    for (const email of destinatarios) {
      const ok = await enviarEmailFigurarte({
        email,
        asunto: "Tienes una nueva solicitud",
        cuerpo,
        enlace,
        textoBoton: "Gestionar solicitudes",
      });
      if (!ok) console.error(`[email] No se pudo avisar a ${email} de la nueva solicitud`);
    }
  } catch (err) {
    console.error("[email] Error avisando al equipo de nueva solicitud:", err);
  }
}

/**
 * Crea una solicitud de proyecto desde el portal de cliente y avisa al equipo.
 * El `cliente_id` sale siempre de la sesión, nunca del cliente-navegador.
 */
export const crearSolicitudProyecto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    nombreProyecto: string;
    categoria: string;
    numAprox: number | null;
    descripcion: string | null;
    fechaNecesaria: string | null;
  }) => ({
    nombreProyecto: String(input?.nombreProyecto ?? "").trim().slice(0, 200),
    categoria: String(input?.categoria ?? "").trim(),
    numAprox:
      typeof input?.numAprox === "number" && Number.isFinite(input.numAprox)
        ? Math.max(0, Math.round(input.numAprox))
        : null,
    descripcion: input?.descripcion ? String(input.descripcion).slice(0, 4000) : null,
    fechaNecesaria: input?.fechaNecesaria ? String(input.fechaNecesaria) : null,
  }))
  .handler(async ({ data, context }): Promise<{ estado: "ok"; id: string }> => {
    const sesion = await clienteDeLaSesion(context.userId);
    if (!sesion) throw new Error("Acceso restringido al portal de cliente.");
    if (!data.nombreProyecto) throw new Error("Indica el nombre del proyecto.");

    const { data: fila, error } = await sesion.supabaseAdmin
      .from("solicitudes_proyecto")
      .insert({
        cliente_id: sesion.clienteId,
        nombre_proyecto: data.nombreProyecto,
        categoria: data.categoria as never,
        num_candidatos_aprox: data.numAprox,
        descripcion: data.descripcion,
        fecha_necesaria: data.fechaNecesaria,
      })
      .select("id")
      .single();

    if (error || !fila) throw new Error("No se pudo registrar la solicitud.");

    // El aviso nunca puede romper la creación de la solicitud.
    await avisarEquipoNuevaSolicitud();

    return { estado: "ok", id: fila.id };
  });
