/**
 * Criterios de búsqueda internos de un proyecto de casting y la lógica de
 * coincidencia compartida con los filtros del listado de candidatos
 * (misma semántica: coincidencia exacta en catálogos cerrados, rango en
 * edad/altura/peso y "alguno de" en los campos de lista).
 */

export type CriteriosBusqueda = {
  provincias?: string[];
  edadMin?: number | null;
  edadMax?: number | null;
  alturaMin?: number | null;
  alturaMax?: number | null;
  pesoMin?: number | null;
  pesoMax?: number | null;
  tallasCamisa?: string[];
  tallasPantalon?: string[];
  tallasCalzado?: string[];
  idiomas?: string[];
  tiposPerfil?: string[];
  habilidades?: string[];
  soloDisponibles?: boolean;
};

/** Devuelve los valores de texto de una columna jsonb tipo array. */
export function listaTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

/** ¿Hay algún criterio definido? Si no, no se debe recomendar nada. */
export function hayCriterios(c: CriteriosBusqueda | null | undefined): boolean {
  if (!c) return false;
  const listas = [
    c.provincias,
    c.tallasCamisa,
    c.tallasPantalon,
    c.tallasCalzado,
    c.idiomas,
    c.tiposPerfil,
    c.habilidades,
  ];
  if (listas.some((l) => Array.isArray(l) && l.length > 0)) return true;
  const rangos = [c.edadMin, c.edadMax, c.alturaMin, c.alturaMax, c.pesoMin, c.pesoMax];
  if (rangos.some((v) => typeof v === "number" && !Number.isNaN(v))) return true;
  return c.soloDisponibles === true;
}

function enRango(valor: unknown, min?: number | null, max?: number | null): boolean {
  const lo = typeof min === "number" && !Number.isNaN(min) ? min : null;
  const hi = typeof max === "number" && !Number.isNaN(max) ? max : null;
  if (lo === null && hi === null) return true;
  if (typeof valor !== "number") return false;
  if (lo !== null && valor < lo) return false;
  if (hi !== null && valor > hi) return false;
  return true;
}

function alguno(valor: unknown, sel?: string[]): boolean {
  if (!sel || sel.length === 0) return true;
  return listaTextos(valor).some((v) => sel.includes(v));
}

function coincide(valor: unknown, sel?: string[]): boolean {
  if (!sel || sel.length === 0) return true;
  return sel.includes(String(valor ?? ""));
}

/** Idiomas: texto libre `idiomas` o lista `idiomas_detalle`. */
function tieneIdiomas(c: Record<string, unknown>, sel?: string[]): boolean {
  if (!sel || sel.length === 0) return true;
  const libre = String(c["idiomas"] ?? "").toLowerCase();
  const detalle = Array.isArray(c["idiomas_detalle"]) ? c["idiomas_detalle"] : [];
  const nombres = detalle
    .map((d) => (d as { idioma?: unknown } | null)?.idioma)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.toLowerCase());
  return sel.every((idioma) => {
    const q = idioma.toLowerCase();
    return libre.includes(q) || nombres.some((n) => n.includes(q));
  });
}

/** ¿Cumple el candidato todos los criterios definidos? */
export function cumpleCriterios(
  c: Record<string, unknown>,
  cr: CriteriosBusqueda,
): boolean {
  if (cr.soloDisponibles && c["disponible"] !== true) return false;
  if (
    cr.provincias &&
    cr.provincias.length > 0 &&
    !cr.provincias.includes(String(c["provincia"] ?? ""))
  )
    return false;
  if (!enRango(c["edad"], cr.edadMin, cr.edadMax)) return false;
  if (!enRango(c["altura_cm"], cr.alturaMin, cr.alturaMax)) return false;
  if (!enRango(c["peso_kg"], cr.pesoMin, cr.pesoMax)) return false;
  if (!coincide(c["talla_camisa"], cr.tallasCamisa)) return false;
  if (!coincide(c["talla_pantalon"], cr.tallasPantalon)) return false;
  if (!coincide(c["talla_calzado"], cr.tallasCalzado)) return false;
  if (!alguno(c["tipo_perfil"], cr.tiposPerfil)) return false;
  if (!alguno(c["habilidades"], cr.habilidades)) return false;
  if (!tieneIdiomas(c, cr.idiomas)) return false;
  return true;
}
