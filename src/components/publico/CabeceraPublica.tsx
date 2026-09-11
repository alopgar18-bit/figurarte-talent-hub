import { Link } from "@tanstack/react-router";

const ENLACES = [
  { hash: "casting", etiqueta: "Casting", oculto: "sm" },
  { hash: "nosotros", etiqueta: "Nosotros", oculto: "sm" },
  { hash: "marcas", etiqueta: "Para marcas", oculto: "md" },
  { hash: "contacto", etiqueta: "Contacto", oculto: "md" },
] as const;

/** Enlace a la vista pública de candidatos disponibles. */
function EnlaceCandidatos({ clase }: { clase: string }) {
  return (
    <Link
      to="/candidatos"
      className={`${clase} text-muted-foreground transition-colors hover:text-foreground`}
    >
      Candidatos
    </Link>
  );
}

/**
 * Cabecera pública común a toda la parte abierta del sitio (Home, registro,
 * casting, acceso y páginas legales). El panel y el portal tienen la suya.
 */
export function CabeceraPublica({ ancho = "max-w-6xl" }: { ancho?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div
        className={`mx-auto flex ${ancho} items-center justify-between gap-4 px-4 py-3 sm:px-6`}
      >
        <Link to="/" className="min-w-0 truncate text-lg font-black tracking-tight">
          FigurArte<span className="text-primary">.</span>es
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm font-medium sm:gap-2">
          {ENLACES.map((enlace) => (
            <Link
              key={enlace.hash}
              to="/"
              hash={enlace.hash}
              className={`${
                enlace.oculto === "sm"
                  ? "hidden sm:inline-block"
                  : "hidden md:inline-block"
              } px-3 py-2 text-muted-foreground transition-colors hover:text-foreground`}
            >
              {enlace.etiqueta}
            </Link>
          ))}
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Acceso
          </Link>
        </nav>
      </div>

      {/* Móvil: los mismos enlaces en una fila deslizable */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-2 py-1.5 text-sm font-medium md:hidden">
        {ENLACES.map((enlace) => (
          <Link
            key={enlace.hash}
            to="/"
            hash={enlace.hash}
            className={`${
              enlace.oculto === "sm" ? "sm:hidden" : ""
            } whitespace-nowrap px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground`}
          >
            {enlace.etiqueta}
          </Link>
        ))}
      </nav>
    </header>
  );
}

/** Pie discreto con los enlaces legales, para páginas públicas sin footer propio. */
export function PieLegal() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p>FigurArte — Casting &amp; Producción</p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/aviso-legal" className="underline underline-offset-4 hover:text-foreground">
            Aviso legal
          </Link>
          <Link to="/privacidad" className="underline underline-offset-4 hover:text-foreground">
            Política de privacidad
          </Link>
        </p>
      </div>
    </footer>
  );
}
