import { supabase } from "@/integrations/supabase/client";

export type ProgramaTV = {
  id: string;
  nombre: string;
  imagen_url: string | null;
  link_formulario: string;
};

/** Programas de TV activos, ordenados para mostrar en la web pública. */
export async function cargarProgramasTv(): Promise<ProgramaTV[]> {
  const { data } = await supabase
    .from("programas_tv")
    .select("id, nombre, imagen_url, link_formulario")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as ProgramaTV[] | null) ?? [];
}
