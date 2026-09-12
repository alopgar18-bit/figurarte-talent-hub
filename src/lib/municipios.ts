/**
 * Municipios españoles por provincia.
 *
 * Los datos viven en `municipios.data.ts` (unos 400 KB) y se cargan con
 * import dinámico, para que el formulario público no los descargue hasta
 * que el candidato abre el desplegable de ciudad.
 */

import { CODIGO_POR_PROVINCIA } from "@/lib/catalogos";

type Datos = typeof import("@/lib/municipios.data");

let cache: Datos | null = null;
let cargando: Promise<Datos> | null = null;

export async function cargarMunicipios(): Promise<Datos> {
  if (cache) return cache;
  if (!cargando) cargando = import("@/lib/municipios.data").then((m) => (cache = m));
  return cargando;
}

/** Municipios de una provincia (por nombre de provincia). Vacío si no hay provincia. */
export async function municipiosDeProvincia(provincia: string): Promise<string[]> {
  const codigo = CODIGO_POR_PROVINCIA[provincia];
  if (!codigo) return [];
  const datos = await cargarMunicipios();
  return datos.MUNICIPIOS_POR_CODIGO_PROVINCIA[codigo] ?? [];
}

/** Municipio más probable para un código postal de 5 dígitos, o null. */
export async function municipioPorCp(cp: string): Promise<string | null> {
  const limpio = cp.replace(/\D/g, "");
  if (limpio.length !== 5) return null;
  const datos = await cargarMunicipios();
  return datos.MUNICIPIO_POR_CP[limpio] ?? null;
}

/** Normaliza para buscar sin acentos ni mayúsculas. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
