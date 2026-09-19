import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

/** Enlace a la página pública de programas de TV con inscripción abierta. */
function EnlaceProgramasTv({ clase }: { clase: string }) {
  return (
    <Link
      to="/programas-tv"
      className={`${clase} text-muted-foreground transition-colors hover:text-foreground`}
    >
      Programas TV
    </Link>
  );
}

/**
 * Cabecera pública común a toda la parte abierta del sitio (Home, registro,
 * casting, acceso y páginas legales). El panel y el portal tienen la suya.
 */
export function CabeceraPublica({ ancho = "max-w-6xl" }: { ancho?: string }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div
        className={`mx-auto flex ${ancho} items-center justify-between gap-4 px-4 py-3 sm:px-6`}
      >
        <Link to="/" className="min-w-0 truncate text-lg font-black tracking-tight">
          FigurArte<span className="text-primary">.</span>es
        </Link>
        <nav className="hidden shrink-0 items-center gap-1 text-sm font-medium lg:flex lg:gap-2">
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
          <EnlaceCandidatos clase="hidden px-3 py-2 sm:inline-block" />
          <EnlaceProgramasTv clase="hidden px-3 py-2 lg:inline-block" />
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Acceso
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 lg:hidden"
          >
            Acceso
          </Link>
          <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-80 p-0">
            <SheetHeader className="border-b border-border px-5 py-5 text-left">
              <SheetTitle className="text-lg font-black tracking-tight">
                FigurArte<span className="text-primary">.</span>es
              </SheetTitle>
              <SheetDescription>Navegación principal</SheetDescription>
            </SheetHeader>
            <nav aria-label="Navegación móvil" className="space-y-1 p-3">
              {ENLACES.map((enlace) => (
                <SheetClose key={enlace.hash} asChild>
                  <Link
                    to="/"
                    hash={enlace.hash}
                    className="block px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {enlace.etiqueta}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link
                  to="/candidatos"
                  className="block px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Candidatos
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  to="/programas-tv"
                  className="block px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Programas TV
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  to="/auth"
                  className="mt-3 block bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Acceso
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
          </Sheet>
        </div>
        </div>
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
