import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FormularioCaptacion,
  type CategoriaCandidato,
} from "@/components/FormularioCaptacion";

const VALIDAS: CategoriaCandidato[] = ["actor", "modelo", "figurante", "casting_plus"];

export const Route = createFileRoute("/registro")({
  validateSearch: (search: Record<string, unknown>): { categoria?: CategoriaCandidato } => {
    const c = search["categoria"];
    return typeof c === "string" && (VALIDAS as string[]).includes(c)
      ? { categoria: c as CategoriaCandidato }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Regístrate como candidato — FigurArte.es" },
      {
        name: "description",
        content:
          "Completa tus datos, medidas y fotos para participar en los castings activos de FigurArte: actores, modelos, figurantes y Casting +.",
      },
      { property: "og:title", content: "Regístrate como candidato — FigurArte.es" },
      {
        property: "og:description",
        content:
          "Formulario de captación de FigurArte: envía tus datos y fotos y entra en nuestra base de candidatos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Registro,
});

function Registro() {
  const { categoria } = Route.useSearch();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-black tracking-tight">
            FigurArte<span className="text-primary">.</span>es
          </Link>
          <Link
            to="/auth"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary"
          >
            Ya tengo ficha
          </Link>
        </div>
      </header>

      <section className="border-b border-border bg-brand-charcoal text-brand-cream">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            FigurArte — Agencia de casting &amp; producción
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Regístrate como candidato
          </h1>
          <p className="mt-4 max-w-2xl text-brand-cream/80">
            Completa tus datos y fotos para participar en nuestros castings
            activos.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <FormularioCaptacion categoriaInicial={categoria} />
      </div>
    </main>
  );
}
