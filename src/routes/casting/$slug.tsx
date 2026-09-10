import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";

export const Route = createFileRoute("/casting/$slug")({
  head: () => ({
    meta: [
      { title: "Casting — FigurArte.es" },
      {
        name: "description",
        content: "Ficha pública de casting de FigurArte.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CastingPlaceholder,
});

function CastingPlaceholder() {
  const { slug } = Route.useParams();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Clapperboard className="h-10 w-10 text-primary" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        Ficha de casting
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        La ficha pública del casting «{slug}» estará disponible próximamente.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
