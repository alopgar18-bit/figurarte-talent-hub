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
 * Avisa por email al equipo (usuarios con rol admin_figurarte) de una nueva
 * solicitud. Nunca lanza: cualquier fallo se registra en el log del servidor.
 */
async function avisarEquipoNuevaSolicitud(datos: {
  razonSocial: string;
  nombreProyecto: string;
  categoria: string;
  numAprox: number | null;
  fechaNecesaria: string | null;
}) {
  try {
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      console.error("[email] RESEND_API_KEY no está configurado");
      return;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admins, error } = await supabaseAdmin
      .from("usuarios")
      .select("email")
      .eq("rol", "admin_figurarte");

    if (error) {
      console.error("[email] No se pudieron leer los destinatarios:", error.message);
      return;
    }

    const destinatarios = (admins ?? [])
      .map((a) => a.email)
      .filter((e): e is string => !!e);

    if (destinatarios.length === 0) {
      console.error("[email] No hay usuarios con rol admin_figurarte a quien avisar");
      return;
    }

    const categoria = ETIQUETA_CATEGORIA[datos.categoria] ?? datos.categoria;
    const fecha = datos.fechaNecesaria
      ? new Date(datos.fechaNecesaria).toLocaleDateString("es-ES")
      : "Sin fecha indicada";
    const numero = datos.numAprox != null ? String(datos.numAprox) : "Sin concretar";

    const text = `Nueva solicitud de proyecto recibida en el portal de cliente.

Cliente: ${datos.razonSocial}
Proyecto solicitado: ${datos.nombreProyecto}
Categoría: ${categoria}
Nº aproximado de candidatos: ${numero}
Fecha necesaria: ${fecha}

Ya está disponible en la bandeja de solicitudes pendientes del dashboard del panel.

— FIGURARTE · Agencia de casting & producción`;

    const html = plantillaEmail(`
      <p style="margin:0 0 16px;">Nueva solicitud de proyecto recibida en el portal de cliente.</p>
      <ul style="margin:0 0 16px;padding-left:20px;">
        <li><strong>Cliente:</strong> ${datos.razonSocial}</li>
        <li><strong>Proyecto solicitado:</strong> ${datos.nombreProyecto}</li>
        <li><strong>Categoría:</strong> ${categoria}</li>
        <li><strong>Nº aproximado de candidatos:</strong> ${numero}</li>
        <li><strong>Fecha necesaria:</strong> ${fecha}</li>
      </ul>
      <p style="margin:0;">Ya está disponible en la bandeja de solicitudes pendientes del dashboard del panel.</p>
    `.trim());

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "FIGURARTE Casting & Producción <casting@figurarte.app>",
        to: destinatarios,
        subject: `Nueva solicitud de proyecto — ${datos.razonSocial}`,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[email] Resend respondió ${response.status}: ${body}`);
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

    const { data: cliente } = await sesion.supabaseAdmin
      .from("clientes")
      .select("razon_social")
      .eq("id", sesion.clienteId)
      .maybeSingle();

    // El aviso nunca puede romper la creación de la solicitud.
    await avisarEquipoNuevaSolicitud({
      razonSocial: cliente?.razon_social ?? "Cliente",
      nombreProyecto: data.nombreProyecto,
      categoria: data.categoria,
      numAprox: data.numAprox,
      fechaNecesaria: data.fechaNecesaria,
    });

    return { estado: "ok", id: fila.id };
  });
