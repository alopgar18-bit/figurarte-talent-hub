/**
 * Catálogos cerrados compartidos por el autoservicio del candidato
 * y el panel de staff. Ampliables sin cambios de esquema.
 */

export const PROVINCIAS_ES = [
  "A Coruña",
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Baleares",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ceuta",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Guipúzcoa",
  "Huelva",
  "Huesca",
  "Jaén",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Melilla",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Vizcaya",
  "Zamora",
  "Zaragoza",
];

export const GENEROS = ["Hombre", "Mujer", "No binario", "Prefiero no decirlo"];

export const COLORES_CABELLO = [
  "Rubio",
  "Castaño",
  "Moreno",
  "Pelirrojo",
  "Canoso",
  "Otro",
];

export const COLORES_OJOS = ["Azules", "Marrones", "Verdes", "Grises", "Avellana"];

export const ACENTOS = [
  "Neutro",
  "Andaluz",
  "Canario",
  "Catalán",
  "Gallego",
  "Vasco",
  "Madrileño",
  "Murciano",
  "Extremeño",
  "Aragonés",
  "Asturiano",
  "Valenciano",
  "Latinoamericano",
  "Argentino",
  "Mexicano",
  "Caribeño",
  "Extranjero",
];

export const TALLAS_CALZADO = Array.from({ length: 14 }, (_, i) => String(35 + i));

export const TALLAS_CAMISA = ["XS", "S", "M", "L", "XL"];

export const TALLAS_PANTALON = ["36", "38", "40", "42", "44"];

/**
 * Correspondencia oficial de los dos primeros dígitos del código postal
 * español con la provincia (01 Álava … 52 Melilla).
 */
const CP_PROVINCIA: Record<string, string> = {
  "01": "Álava",
  "02": "Albacete",
  "03": "Alicante",
  "04": "Almería",
  "05": "Ávila",
  "06": "Badajoz",
  "07": "Baleares",
  "08": "Barcelona",
  "09": "Burgos",
  "10": "Cáceres",
  "11": "Cádiz",
  "12": "Castellón",
  "13": "Ciudad Real",
  "14": "Córdoba",
  "15": "A Coruña",
  "16": "Cuenca",
  "17": "Girona",
  "18": "Granada",
  "19": "Guadalajara",
  "20": "Guipúzcoa",
  "21": "Huelva",
  "22": "Huesca",
  "23": "Jaén",
  "24": "León",
  "25": "Lleida",
  "26": "La Rioja",
  "27": "Lugo",
  "28": "Madrid",
  "29": "Málaga",
  "30": "Murcia",
  "31": "Navarra",
  "32": "Ourense",
  "33": "Asturias",
  "34": "Palencia",
  "35": "Las Palmas",
  "36": "Pontevedra",
  "37": "Salamanca",
  "38": "Santa Cruz de Tenerife",
  "39": "Cantabria",
  "40": "Segovia",
  "41": "Sevilla",
  "42": "Soria",
  "43": "Tarragona",
  "44": "Teruel",
  "45": "Toledo",
  "46": "Valencia",
  "47": "Valladolid",
  "48": "Vizcaya",
  "49": "Zamora",
  "50": "Zaragoza",
  "51": "Ceuta",
  "52": "Melilla",
};

/** Inverso del anterior: nombre de provincia → código de dos dígitos. */
export const CODIGO_POR_PROVINCIA: Record<string, string> = Object.fromEntries(
  Object.entries(CP_PROVINCIA).map(([codigo, nombre]) => [nombre, codigo]),
);

/** Provincia deducida de un código postal español de 5 dígitos, o null. */
export function provinciaPorCp(cp: string): string | null {
  const limpio = cp.replace(/\D/g, "");
  if (limpio.length < 2) return null;
  return CP_PROVINCIA[limpio.slice(0, 2)] ?? null;
}

export const PAISES = [
  "Alemania",
  "Andorra",
  "Argelia",
  "Argentina",
  "Australia",
  "Austria",
  "Bélgica",
  "Bolivia",
  "Brasil",
  "Bulgaria",
  "Canadá",
  "Chile",
  "China",
  "Colombia",
  "Corea del Sur",
  "Costa Rica",
  "Croacia",
  "Cuba",
  "Dinamarca",
  "Ecuador",
  "Egipto",
  "El Salvador",
  "Emiratos Árabes Unidos",
  "Eslovaquia",
  "Eslovenia",
  "España",
  "Estados Unidos",
  "Estonia",
  "Filipinas",
  "Finlandia",
  "Francia",
  "Georgia",
  "Ghana",
  "Grecia",
  "Guatemala",
  "Guinea Ecuatorial",
  "Haití",
  "Honduras",
  "Hungría",
  "India",
  "Indonesia",
  "Irlanda",
  "Islandia",
  "Israel",
  "Italia",
  "Japón",
  "Letonia",
  "Líbano",
  "Lituania",
  "Luxemburgo",
  "Marruecos",
  "México",
  "Nicaragua",
  "Nigeria",
  "Noruega",
  "Nueva Zelanda",
  "Países Bajos",
  "Pakistán",
  "Panamá",
  "Paraguay",
  "Perú",
  "Polonia",
  "Portugal",
  "Reino Unido",
  "República Checa",
  "República Dominicana",
  "Rumanía",
  "Rusia",
  "Senegal",
  "Serbia",
  "Sudáfrica",
  "Suecia",
  "Suiza",
  "Túnez",
  "Turquía",
  "Ucrania",
  "Uruguay",
  "Venezuela",
  "Otro",
];

/** Idiomas del autoservicio del candidato. */
export const IDIOMAS = [
  "Alemán",
  "Árabe",
  "Bengalí",
  "Catalán",
  "Chino cantonés",
  "Chino mandarín",
  "Español",
  "Euskera",
  "Francés",
  "Gallego",
  "Hindi",
  "Inglés",
  "Italiano",
  "Japonés",
  "Portugués",
  "Ruso",
];

/** Habilidades (mismos valores que los chips del autoservicio). */
export const HABILIDADES = [
  "Baile / Danza",
  "Canto",
  "Circo",
  "Malabares",
  "Mago",
  "Doblador/a",
  "Locutor/a",
  "Instrumento de cuerda",
  "Instrumento de viento",
  "Instrumento de percusión",
  "Electrófonos",
  "Artes marciales",
  "Deportes",
  "Especialista / stunt",
  "Esgrima",
  "Equitación",
  "Culturismo",
  "Tengo un gemelo/a",
  "Drag queen",
  "Drag king",
];

/** Tipos de perfil (mismos valores que los chips del autoservicio). */
export const TIPOS_PERFIL = [
  "Actor / actriz",
  "Ficción",
  "Publicidad",
  "Doblaje",
  "Teatro aficionado",
  "Modelo",
  "Bailarín/a",
  "Cantante pop",
  "Cantante rock",
  "Cantante rap / trap",
  "Cantante jazz",
  "Ópera / zarzuela",
  "Influencer",
  "YouTuber",
  "Tiktoker",
  "Presentador/a",
  "Periodista",
  "Tertuliano/a",
  "Colaborador/a",
  "Especialista",
  "Casting de calle",
];

/** Habilidades agrupadas (fuente única para autoservicio y panel). */
export const GRUPOS_HABILIDADES: { titulo: string; opciones: string[] }[] = [
  {
    titulo: "Artes escénicas y circenses",
    opciones: ["Baile / Danza", "Canto", "Circo", "Malabares", "Mago", "Doblador/a", "Locutor/a"],
  },
  {
    titulo: "Música",
    opciones: [
      "Instrumento de cuerda",
      "Instrumento de viento",
      "Instrumento de percusión",
      "Electrófonos",
    ],
  },
  {
    titulo: "Deporte y acción",
    opciones: [
      "Artes marciales",
      "Deportes",
      "Especialista / stunt",
      "Esgrima",
      "Equitación",
      "Culturismo",
    ],
  },
  {
    titulo: "Rasgos y singularidades",
    opciones: ["Tengo un gemelo/a", "Drag queen", "Drag king"],
  },
];

/** Tipos de perfil agrupados (fuente única para autoservicio y panel). */
export const GRUPOS_TIPO_PERFIL: { titulo: string; opciones: string[] }[] = [
  {
    titulo: "Interpretación",
    opciones: [
      "Actor / actriz",
      "Ficción",
      "Publicidad",
      "Doblaje",
      "Teatro aficionado",
      "Modelo",
      "Bailarín/a",
    ],
  },
  {
    titulo: "Música",
    opciones: [
      "Cantante pop",
      "Cantante rock",
      "Cantante rap / trap",
      "Cantante jazz",
      "Ópera / zarzuela",
    ],
  },
  {
    titulo: "Medios y contenido digital",
    opciones: [
      "Influencer",
      "YouTuber",
      "Tiktoker",
      "Presentador/a",
      "Periodista",
      "Tertuliano/a",
      "Colaborador/a",
    ],
  },
  { titulo: "Otros", opciones: ["Especialista", "Casting de calle"] },
];

/** Carnés de conducir y licencias. */
export const CARNES_OPCIONES = [
  "AM",
  "A1",
  "A2",
  "A",
  "B",
  "B+E",
  "C1",
  "C1+E",
  "C",
  "C+E",
  "D1",
  "D1+E",
  "D",
  "D+E",
  "Licencia LVA",
  "Licencia LCM",
  "ADR",
];

/** Añade un valor ya guardado que no esté en el catálogo, para no perderlo. */
export function conValorActual(opciones: string[], valor: unknown): string[] {
  const v = typeof valor === "string" ? valor.trim() : "";
  if (!v || opciones.includes(v)) return opciones;
  return [...opciones, v];
}

/** Texto separado por comas -> lista. */
export function desdeTextoLista(v: unknown): string[] {
  return typeof v === "string"
    ? v.split(",").map((x) => x.trim()).filter((x) => x !== "")
    : [];
}

/** Lista -> texto separado por comas (o null si está vacía). */
export function aTextoLista(lista: string[]): string | null {
  const limpia = lista.map((x) => x.trim()).filter((x) => x !== "");
  return limpia.length ? limpia.join(", ") : null;
}
