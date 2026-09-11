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
