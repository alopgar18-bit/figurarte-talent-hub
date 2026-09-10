import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerDossierPublico, type DossierPublico } from "@/lib/dossier.functions";

const CATEGORIA_LABEL: Record<string, string> = {
  actor: "Actores",
  modelo: "Modelos",
  figurante: "Figurantes",
  casting_plus: "Casting +",
};

export const Route = createFileRoute("/dossier/$slug")({
  loader: async ({
    params,
  }): Promise<{ dossier: DossierPublico | null; limitado: boolean }> => {
    const res = await obtenerDossierPublico({ data: { slug: params.slug } });
    if (res && "limitado" in res) return { dossier: null, limitado: true };
    return { dossier: res, limitado: false };
  },
  head: ({ loaderData }) => {
    const d = loaderData?.dossier ?? null;
    const titulo = d
      ? `Dossier de casting: ${d.proyectoNombre} | FigurArte`
      : "Dossier no disponible | FigurArte";
    const descripcion = d
      ? `Selección de candidatos para ${d.proyectoNombre}${d.clienteNombre ? ` — ${d.clienteNombre}` : ""}. Dossier de casting preparado por FigurArte.`
      : "Este dossier de casting no está disponible o ha caducado.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descripcion },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descripcion },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: PaginaDossier,
  errorComponent: () => (
    <Aviso titulo="No se pudo cargar el dossier" texto="Vuelve a intentarlo en unos minutos." />
  ),
  notFoundComponent: () => (
    <Aviso titulo="Dossier no encontrado" texto="Comprueba el enlace que te han enviado." />
  ),
});

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">FIGURARTE</p>
        <h1 className="mt-4 text-2xl font-semibold">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
      </div>
    </main>
  );
}

function diasRestantes(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function PaginaDossier() {
  const { dossier } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const [indice, setIndice] = useState(0);

  if (!dossier) {
    return <Aviso titulo="Dossier no encontrado" texto="Comprueba el enlace que te han enviado." />;
  }

  if (dossier.caducado) {
    return (
      <Aviso
        titulo="Este dossier ha caducado"
        texto="Pide al equipo de FigurArte un enlace nuevo para volver a verlo."
      />
    );
  }

  const dias = diasRestantes(dossier.fechaCaducidad);
  const total = dossier.candidatos.length;
  const actual = dossier.candidatos[indice];

  return (
    <main className="min-h-screen bg-background print:bg-white">
      {/* Portada */}
      <section className="dossier-slide border-b border-border bg-brand-charcoal px-6 py-14 text-brand-cream sm:px-10 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">FIGURARTE</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          {dossier.proyectoNombre}
        </h1>
        <p className="mt-3 text-sm uppercase tracking-widest text-brand-cream/70">
          {dossier.categoria ? CATEGORIA_LABEL[dossier.categoria] ?? dossier.categoria : "Casting"}
          {dossier.clienteNombre ? ` · ${dossier.clienteNombre}` : ""}
        </p>
        <p className="mt-8 text-sm text-brand-cream/60">
          {new Date(dossier.creadoEn).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {total} candidato{total === 1 ? "" : "s"}
        </p>
      </section>

      {/* Acciones (no se imprimen) */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-8">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {total > 0 ? `Candidato ${indice + 1} de ${total}` : "Sin candidatos"}
        </span>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Guardar como PDF
        </Button>
      </div>

      {total === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-muted-foreground">
          Este dossier todavía no incluye candidatos.
        </p>
      ) : (
        <>
          {/* Vista web: una diapositiva */}
          <div className="no-print">{actual && <Diapositiva candidato={actual} />}</div>

          {/* Impresión: todas las diapositivas, una por página */}
          <div className="hidden print:block">
            {dossier.candidatos.map((c) => (
              <Diapositiva key={c.id} candidato={c} />
            ))}
          </div>

          {/* Paginador */}
          <nav className="no-print flex flex-wrap items-center justify-center gap-2 px-4 py-8">
            <Button
              size="sm"
              variant="outline"
              disabled={indice === 0}
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {dossier.candidatos.map((c, i) => (
              <Button
                key={c.id}
                size="sm"
                variant={i === indice ? "default" : "outline"}
                onClick={() => setIndice(i)}
                className="w-9 px-0"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={indice === total - 1}
              onClick={() => setIndice((i) => Math.min(total - 1, i + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </>
      )}

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        figurarte.es/dossier/{slug}
        {dias === null
          ? " · sin caducidad"
          : ` · caduca en ${dias} día${dias === 1 ? "" : "s"}`}
      </footer>
    </main>
  );
}

function Diapositiva({
  candidato,
}: {
  candidato: DossierPublico["candidatos"][number];
}) {
  const medidas = [
    candidato.edad != null ? `${candidato.edad} años` : null,
    candidato.provincia,
    candidato.altura_cm != null ? `${candidato.altura_cm} cm` : null,
    candidato.peso_kg != null ? `${candidato.peso_kg} kg` : null,
  ].filter(Boolean) as string[];

  const fotos = candidato.fotos.slice(0, 2);

  return (
    <article className="dossier-slide mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <p className="inline-block bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
        {CATEGORIA_LABEL[candidato.categoria] ?? candidato.categoria}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {fotos.length > 0 ? (
          fotos.map((foto) => (
            <img
              key={foto}
              src={foto}
              alt={`Foto de ${candidato.nombre}`}
              className="aspect-[3/4] w-full border border-border object-cover"
            />
          ))
        ) : (
          <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/40 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">Sin fotos</span>
          </div>
        )}
      </div>

      <header className="mt-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {candidato.codigo}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{candidato.nombre}</h2>
        {medidas.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">{medidas.join(" · ")}</p>
        )}
      </header>

      {candidato.campos.length > 0 && (
        <dl className="mt-6 grid gap-x-8 gap-y-2 border-t border-border pt-4 sm:grid-cols-2">
          {candidato.campos.map((c) => (
            <div key={c.nombre} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{c.nombre}</dt>
              <dd className="font-medium">{c.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
