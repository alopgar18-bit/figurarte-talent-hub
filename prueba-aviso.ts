import { createClient } from "@supabase/supabase-js";
import { enviarEmailFigurarte } from "./src/lib/comunicaciones.server";

const ETIQUETA_CATEGORIA: Record<string, string> = {
  actor: "Actores", modelo: "Modelos", figurante: "Figurantes", casting_plus: "Casting Plus",
};
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data: pendientes } = await sb.from("solicitudes_proyecto")
  .select("nombre_proyecto, categoria, recibida_en, cliente_id")
  .eq("estado", "pendiente").order("recibida_en", { ascending: true });
const filas = pendientes ?? [];
const ids = [...new Set(filas.map((f: any) => f.cliente_id))];
const { data: clientes } = await sb.from("clientes").select("id, razon_social").in("id", ids);
const nombres: Record<string, string> = {};
for (const c of clientes ?? []) nombres[(c as any).id] = (c as any).razon_social;
const lineas = filas.map((f: any) => {
  const cliente = nombres[f.cliente_id] ?? "Cliente";
  const cat = ETIQUETA_CATEGORIA[f.categoria] ?? f.categoria;
  const fecha = f.recibida_en ? new Date(f.recibida_en).toLocaleDateString("es-ES") : "";
  return `• ${cliente} — ${f.nombre_proyecto} (${cat})${fecha ? ` · recibida el ${fecha}` : ""}`;
});
const cuerpo = `Ha entrado una nueva solicitud de proyecto desde el portal de cliente.

Solicitudes pendientes de gestionar (${filas.length}):
${lineas.length > 0 ? lineas.join("\n") : "—"}

Entra en el panel para revisarlas y convertirlas en proyectos.`;
console.log(cuerpo);
const ok = await enviarEmailFigurarte({
  email: "alopgar18+admin@gmail.com",
  asunto: "Tienes una nueva solicitud",
  cuerpo,
  enlace: "https://casting.figurarte.app/panel/dashboard",
  textoBoton: "Gestionar solicitudes",
});
console.log("enviado:", ok);
