import { useEffect, useRef } from "react";

/** Clave pública del widget de Cloudflare Turnstile (puede ir en el cliente). */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAE849WrD8HMgqEHx";
const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opciones: { sitekey: string; theme?: string; size?: string }) => string;
  getResponse: (id?: string) => string | undefined;
  reset: (id?: string) => void;
};

function turnstileGlobal(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function cargarScriptTurnstile(): Promise<void> {
  if (turnstileGlobal()) return Promise.resolve();
  const existente = document.querySelector<HTMLScriptElement>(
    `script[src="${TURNSTILE_SCRIPT}"]`,
  );
  if (existente) {
    return new Promise((resolve) => existente.addEventListener("load", () => resolve()));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Turnstile"));
    document.head.appendChild(script);
  });
}

/**
 * Widget discreto de Turnstile. Devuelve, vía `onListo`, una función que espera
 * hasta 8 s al token y resetea el widget para obtener uno fresco.
 */
export function VerificacionTurnstile({
  onListo,
  className,
}: {
  onListo: (obtenerToken: () => Promise<string | undefined>) => void;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    let widgetId: string | undefined;

    void cargarScriptTurnstile()
      .then(() => {
        const api = turnstileGlobal();
        if (cancelado || !api || !contenedor.current) return;
        widgetId = api.render(contenedor.current, {
          sitekey: TURNSTILE_SITE_KEY,
          size: "flexible",
        });
        onListo(async () => {
          const limite = Date.now() + 8000;
          let token = api.getResponse(widgetId);
          while (!token && Date.now() < limite) {
            await new Promise((r) => setTimeout(r, 250));
            token = api.getResponse(widgetId);
          }
          if (token) api.reset(widgetId);
          return token;
        });
      })
      .catch(() => {
        /* sin verificación disponible: el servidor rechazará el envío */
      });

    return () => {
      cancelado = true;
    };
  }, [onListo]);

  return <div ref={contenedor} className={className ?? "max-w-xs"} />;
}
