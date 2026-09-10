import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FigurArte.es — Casting para cine, TV y publicidad" },
      {
        name: "description",
        content:
          "Plataforma de captación, gestión y presentación de candidatos de casting para FigurArte.",
      },
      { property: "og:title", content: "FigurArte.es" },
      {
        property: "og:description",
        content:
          "Casting para actores, modelos y figurantes. Gestión y presentación de candidatos para FigurArte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
        FigurArte<span className="text-primary">.</span>es
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">
        Plataforma de casting para actores, modelos y figurantes.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Próximamente.
      </p>
    </main>
  );
}
