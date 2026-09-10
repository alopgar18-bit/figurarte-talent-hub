import { getRequest } from "@tanstack/react-start/server";

/**
 * Límite de peticiones por IP, en memoria del proceso.
 * No es distribuido: es una barrera básica contra abuso automatizado,
 * no un control de cuota exacto.
 */
type Registro = { desde: number; usos: number };

const contadores = new Map<string, Registro>();

/** Evita que el mapa crezca sin control en procesos de larga vida. */
function limpiar(ahora: number) {
  if (contadores.size < 5000) return;
  for (const [clave, reg] of contadores) {
    if (ahora - reg.desde > 2 * 60 * 60 * 1000) contadores.delete(clave);
  }
}

export function ipPeticion(): string {
  const request = getRequest();
  return (
    request?.headers.get("cf-connecting-ip") ??
    request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request?.headers.get("x-real-ip") ??
    "desconocida"
  );
}

/**
 * Devuelve `true` si la petición cabe dentro del límite.
 * @param ambito identificador de la función limitada (p. ej. "registro")
 */
export function dentroDeLimite(
  ambito: string,
  opciones: { max: number; ventanaMs: number },
  ip = ipPeticion(),
): boolean {
  const ahora = Date.now();
  limpiar(ahora);
  const clave = `${ambito}:${ip}`;
  const actual = contadores.get(clave);
  if (!actual || ahora - actual.desde > opciones.ventanaMs) {
    contadores.set(clave, { desde: ahora, usos: 1 });
    return true;
  }
  actual.usos += 1;
  return actual.usos <= opciones.max;
}

export const MINUTO = 60 * 1000;
export const HORA = 60 * MINUTO;

/** Límites aplicados en la plataforma, centralizados para poder revisarlos. */
export const LIMITES = {
  registro: { max: 5, ventanaMs: 10 * MINUTO },
  dossier: { max: 20, ventanaMs: 10 * MINUTO },
  video: { max: 5, ventanaMs: HORA },
  subidaFoto: { max: 20, ventanaMs: HORA },
} as const;
