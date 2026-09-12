/**
 * Filtros a medida sobre cualquier campo relevante de la ficha de candidato.
 * Se evalúan en memoria sobre la lista ya cargada, igual que los filtros fijos.
 */
import {
  CARNES_OPCIONES,
  COLORES_CABELLO,
  COLORES_OJOS,
  GRUPOS_HABILIDADES,
  GRUPOS_TIPO_PERFIL,
  PAISES,
  PROVINCIAS_ES,
  TALLAS_CALZADO,
  TALLAS_CAMISA,
  TALLAS_PANTALON,
} from "@/lib/catalogos";

export type TipoCampo = "texto" | "numero" | "booleano" | "catalogo" | "array";

export type CampoFiltrable = {
  campo: string;
  etiqueta: string;
  tipo: TipoCampo;
  /** Opciones cerradas para catálogos y arrays. */
  opciones?: string[];
};

function valoresDeGrupos(grupos: { opciones: string[] }[]): string[] {
  return grupos.flatMap((g) => g.opciones);
}

export const CAMPOS_FILTRABLES: CampoFiltrable[] = [
  // Identidad y contacto
  { campo: "nombre", etiqueta: "Nombre", tipo: "texto" },
  { campo: "apellidos", etiqueta: "Apellidos", tipo: "texto" },
  { campo: "codigo", etiqueta: "Código", tipo: "texto" },
  { campo: "email", etiqueta: "Email", tipo: "texto" },
  { campo: "telefono", etiqueta: "Teléfono", tipo: "texto" },
  {
    campo: "categoria",
    etiqueta: "Categoría",
    tipo: "catalogo",
    opciones: ["actor", "modelo", "figurante", "casting_plus"],
  },
  { campo: "genero", etiqueta: "Género", tipo: "texto" },
  { campo: "profesion", etiqueta: "Profesión", tipo: "texto" },
  {
    campo: "representacion",
    etiqueta: "Representación",
    tipo: "catalogo",
    opciones: ["con_representante", "sin_representante"],
  },

  // Ubicación
  { campo: "provincia", etiqueta: "Provincia", tipo: "catalogo", opciones: PROVINCIAS_ES },
  { campo: "ciudad", etiqueta: "Ciudad", tipo: "texto" },
  { campo: "codigo_postal", etiqueta: "Código postal", tipo: "texto" },
  { campo: "pais_origen", etiqueta: "País de origen", tipo: "catalogo", opciones: PAISES },
  { campo: "nacionalidad", etiqueta: "Nacionalidad", tipo: "catalogo", opciones: PAISES },
  { campo: "lugar_nacimiento", etiqueta: "Lugar de nacimiento", tipo: "texto" },

  // Datos físicos
  { campo: "edad", etiqueta: "Edad", tipo: "numero" },
  { campo: "altura_cm", etiqueta: "Altura (cm)", tipo: "numero" },
  { campo: "peso_kg", etiqueta: "Peso (kg)", tipo: "numero" },
  { campo: "complexion", etiqueta: "Complexión", tipo: "texto" },
  { campo: "tipo_pelo", etiqueta: "Tipo de pelo", tipo: "texto" },
  {
    campo: "color_cabello",
    etiqueta: "Color de cabello",
    tipo: "catalogo",
    opciones: COLORES_CABELLO,
  },
  { campo: "color_ojos", etiqueta: "Color de ojos", tipo: "catalogo", opciones: COLORES_OJOS },
  { campo: "color_piel", etiqueta: "Color de piel", tipo: "texto" },
  { campo: "origen_etnia", etiqueta: "Origen / etnia", tipo: "texto" },
  { campo: "tiene_tatuajes", etiqueta: "Tiene tatuajes", tipo: "booleano" },
  { campo: "tiene_cicatrices", etiqueta: "Tiene cicatrices", tipo: "booleano" },
  { campo: "tiene_ortodoncia", etiqueta: "Lleva ortodoncia", tipo: "booleano" },
  { campo: "albino", etiqueta: "Albino", tipo: "booleano" },
  { campo: "barbudo", etiqueta: "Barbudo", tipo: "booleano" },
  { campo: "capacidad_diversa", etiqueta: "Capacidad diversa", tipo: "booleano" },

  // Vestuario
  {
    campo: "talla_camisa",
    etiqueta: "Talla de camisa",
    tipo: "catalogo",
    opciones: TALLAS_CAMISA,
  },
  {
    campo: "talla_pantalon",
    etiqueta: "Talla de pantalón",
    tipo: "catalogo",
    opciones: TALLAS_PANTALON,
  },
  {
    campo: "talla_calzado",
    etiqueta: "Talla de calzado",
    tipo: "catalogo",
    opciones: TALLAS_CALZADO,
  },
  { campo: "talla_chaqueta", etiqueta: "Talla de chaqueta", tipo: "texto" },
  { campo: "anchura_pecho", etiqueta: "Anchura de pecho (cm)", tipo: "numero" },
  { campo: "anchura_cintura", etiqueta: "Anchura de cintura (cm)", tipo: "numero" },

  // Habilidades y perfil
  {
    campo: "habilidades",
    etiqueta: "Habilidades",
    tipo: "array",
    opciones: valoresDeGrupos(GRUPOS_HABILIDADES),
  },
  {
    campo: "tipo_perfil",
    etiqueta: "Tipo de perfil",
    tipo: "array",
    opciones: valoresDeGrupos(GRUPOS_TIPO_PERFIL),
  },
  {
    campo: "carnes_conducir",
    etiqueta: "Carnés de conducir",
    tipo: "array",
    opciones: CARNES_OPCIONES,
  },
  {
    campo: "otras_residencias",
    etiqueta: "Otras residencias",
    tipo: "array",
    opciones: PROVINCIAS_ES,
  },
  { campo: "idiomas", etiqueta: "Idiomas (texto)", tipo: "texto" },
  { campo: "acentos", etiqueta: "Acentos", tipo: "texto" },
  { campo: "habilidad_especial", etiqueta: "Habilidad especial", tipo: "texto" },
  { campo: "canta", etiqueta: "Canta", tipo: "booleano" },
  { campo: "baila", etiqueta: "Baila", tipo: "booleano" },
  { campo: "toca_instrumentos", etiqueta: "Toca instrumentos", tipo: "booleano" },
  { campo: "hace_deporte", etiqueta: "Hace deporte", tipo: "booleano" },
  { campo: "monta_a_caballo", etiqueta: "Monta a caballo", tipo: "booleano" },
  { campo: "tiene_carnet_conducir", etiqueta: "Tiene carnet de conducir", tipo: "booleano" },
  {
    campo: "tiene_titulo_patron_barco",
    etiqueta: "Título de patrón de barco",
    tipo: "booleano",
  },

  // Estado en la plataforma
  { campo: "disponible", etiqueta: "Disponible", tipo: "booleano" },
  { campo: "disponible_publico", etiqueta: "Visible en la web pública", tipo: "booleano" },
  { campo: "consentimiento_rgpd", etiqueta: "Consentimiento RGPD firmado", tipo: "booleano" },
];

export const OPERADORES_POR_TIPO: Record<TipoCampo, { valor: Operador; etiqueta: string }[]> = {
  texto: [
    { valor: "contiene", etiqueta: "contiene" },
    { valor: "igual", etiqueta: "es igual a" },
  ],
  catalogo: [
    { valor: "alguno", etiqueta: "es alguno de" },
    { valor: "igual", etiqueta: "es igual a" },
  ],
  numero: [{ valor: "rango", etiqueta: "entre" }],
  booleano: [{ valor: "es", etiqueta: "es" }],
  array: [
    { valor: "alguno", etiqueta: "incluye alguno de" },
    { valor: "todos", etiqueta: "incluye todos" },
  ],
};

export type Operador = "contiene" | "igual" | "rango" | "es" | "alguno" | "todos";

export type Condicion = {
  campo: string;
  operador: Operador;
  /** Texto para contiene/igual. */
  texto?: string;
  /** Rango numérico. */
  min?: string;
  max?: string;
  /** Booleano. */
  booleano?: boolean;
  /** Valores para alguno/todos. */
  valores?: string[];
};

function textosDe(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

/** ¿Cumple el candidato una condición concreta? */
export function cumpleCondicion(fila: Record<string, unknown>, cond: Condicion): boolean {
  const valor = fila[cond.campo];
  switch (cond.operador) {
    case "contiene": {
      const q = (cond.texto ?? "").trim().toLowerCase();
      if (!q) return true;
      return String(valor ?? "").toLowerCase().includes(q);
    }
    case "igual": {
      const q = (cond.texto ?? "").trim().toLowerCase();
      if (!q) return true;
      return String(valor ?? "").trim().toLowerCase() === q;
    }
    case "rango": {
      const lo = (cond.min ?? "").trim() === "" ? null : Number(cond.min);
      const hi = (cond.max ?? "").trim() === "" ? null : Number(cond.max);
      if (lo === null && hi === null) return true;
      const n = typeof valor === "number" ? valor : Number(valor);
      if (!Number.isFinite(n)) return false;
      if (lo !== null && n < lo) return false;
      if (hi !== null && n > hi) return false;
      return true;
    }
    case "es":
      return Boolean(valor) === Boolean(cond.booleano);
    case "alguno": {
      const sel = cond.valores ?? [];
      if (sel.length === 0) return true;
      const lista = Array.isArray(valor) ? textosDe(valor) : [String(valor ?? "")];
      return lista.some((v) => sel.includes(v));
    }
    case "todos": {
      const sel = cond.valores ?? [];
      if (sel.length === 0) return true;
      const lista = Array.isArray(valor) ? textosDe(valor) : [String(valor ?? "")];
      return sel.every((v) => lista.includes(v));
    }
    default:
      return true;
  }
}

/** Todas las condiciones se combinan con Y. */
export function cumpleTodas(
  fila: Record<string, unknown>,
  condiciones: Condicion[],
): boolean {
  return condiciones.every((c) => cumpleCondicion(fila, c));
}

export function campoPorNombre(campo: string): CampoFiltrable | undefined {
  return CAMPOS_FILTRABLES.find((c) => c.campo === campo);
}

export function describirCondicion(cond: Condicion): string {
  const campo = campoPorNombre(cond.campo);
  const etiqueta = campo?.etiqueta ?? cond.campo;
  switch (cond.operador) {
    case "contiene":
      return `${etiqueta} contiene "${cond.texto ?? ""}"`;
    case "igual":
      return `${etiqueta} = "${cond.texto ?? ""}"`;
    case "rango":
      return `${etiqueta} entre ${cond.min || "—"} y ${cond.max || "—"}`;
    case "es":
      return `${etiqueta}: ${cond.booleano ? "Sí" : "No"}`;
    case "alguno":
      return `${etiqueta}: ${(cond.valores ?? []).join(", ")}`;
    case "todos":
      return `${etiqueta} incluye todos: ${(cond.valores ?? []).join(", ")}`;
    default:
      return etiqueta;
  }
}
