import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Tv, ImageOff } from "lucide-react";
import { CabeceraPublica, PieLegal } from "@/components/publico/CabeceraPublica";
import { Button } from "@/components/ui/button";
import { cargarProgramasTv } from "@/lib/programas-tv";

export const Route = createFileRoute("/programas-tv")({
  loader: async () => ({ programas: await cargarProgramasTv() }),
  head: () => {
    const titulo = "Programas de TV | FigurArte.es";
    const descripcion =
      "Apúntate como público o participante en los programas de televisión que gestiona FigurArte. Inscripción abierta en los formularios oficiales.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descripcion },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descripcion },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProgramasTvPublico,
});

function ProgramasTvPublico() {
  const { programas } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <CabeceraPublica />

      <header className="border-b border-border bg-brand-charcoal text-brand-cream">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Participa
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Programas de TV
          </h1>
          <p className="mt-5 max-w-2xl text-brand-cream/80">
            Apúntate como público o participante en los programas de televisión
            que gestionamos. Cada tarjeta lleva al formulario oficial de
            inscripción.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {programas.length === 0 ? (
          <div className="flex flex-col items-center border border-dashed border-border bg-card px-6 py-16 text-center">
            <Tv className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-lg font-semibold">
              Ahora mismo no hay inscripciones abiertas
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Publicamos nuevos programas con frecuencia. Vuelve a visitarnos o
              regístrate como candidato para enterarte antes que nadie.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programas.map((programa) => (
              <article
                key={programa.id}
                className="flex flex-col overflow-hidden border border-border bg-card"
              >
                {programa.imagen_url ? (
                  <img
                    src={programa.imagen_url}
                    alt={programa.nombre}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex aspect-video w-full items-center justify-center bg-brand-charcoal text-brand-cream/40"
                    aria-hidden="true"
                  >
                    <Tv className="h-10 w-10" />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <h2 className="text-base font-semibold leading-snug">
                    {programa.nombre}
                  </h2>
                  <Button asChild className="mt-auto w-full">
                    <a
                      href={programa.link_formulario}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Inscribirme
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <PieLegal />
    </main>
  );
}
