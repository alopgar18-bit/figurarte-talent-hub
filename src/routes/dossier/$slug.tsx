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
  const { dossier, limitado } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const [indice, setIndice] = useState(0);

  if (limitado) {
    return (
      <Aviso
        titulo="Demasiados intentos"
        texto="Has abierto muchos dossiers seguidos. Prueba de nuevo en unos minutos."
      />
    );
  }

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
      <section className="dossier-slide flex min-h-[420px] flex-col justify-between border-b border-border bg-brand-charcoal px-6 py-14 text-brand-cream sm:px-12 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-10">
          <p className="shrink-0 text-2xl font-black tracking-[0.18em] text-brand-cream sm:self-center sm:text-3xl">
            [FIGURARTE]
          </p>
          <span
            aria-hidden="true"
            className="hidden w-px bg-brand-cream/40 sm:block"
          />
          <div className="min-w-0">
            <h1 className="text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
              {dossier.proyectoNombre}
            </h1>
            {dossier.clienteNombre && (
              <p className="mt-3 text-base font-semibold uppercase tracking-[0.2em] text-brand-cream/80 sm:text-lg">
                {dossier.clienteNombre}
              </p>
            )}
            <p className="mt-2 text-sm uppercase tracking-widest text-brand-cream/60">
              {new Date(dossier.creadoEn).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" · "}
              {dossier.categoria
                ? CATEGORIA_LABEL[dossier.categoria] ?? dossier.categoria
                : "Casting"}
              {" · "}
              {total} candidato{total === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <p className="mt-14 text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-cream/70">
          Agencia de casting &amp; producción
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
          <div className="no-print">
            {actual && <Diapositiva candidato={actual} pagina={indice + 1} total={total} />}
          </div>

          {/* Impresión: todas las diapositivas, una por página */}
          <div className="hidden print:block">
            {dossier.candidatos.map((c, i) => (
              <Diapositiva key={c.id} candidato={c} pagina={i + 1} total={total} />
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

      <footer className="no-print border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        figurarte.es/dossier/{slug}
        {dias === null
          ? " · sin caducidad"
          : ` · caduca en ${dias} día${dias === 1 ? "" : "s"}`}
      </footer>
    </main>
  );
}

function Medida({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="border border-border p-2">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{valor || "—"}</dd>
    </div>
  );
}

function GrupoChips({ titulo, valores }: { titulo: string; valores: string[] }) {
  const limpios = valores.filter((v) => typeof v === "string" && v.trim() !== "");
  if (limpios.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {titulo}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {limpios.map((v) => (
          <li
            key={v}
            className="border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground"
          >
            {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Diapositiva({
  candidato,
  pagina,
  total,
}: {
  candidato: DossierPublico["candidatos"][number];
  pagina: number;
  total: number;
}) {
  const fisicos = [
    candidato.edad != null ? `${candidato.edad} años` : null,
    candidato.provincia,
    candidato.altura_cm != null ? `${candidato.altura_cm} cm` : null,
    candidato.peso_kg != null ? `${candidato.peso_kg} kg` : null,
  ].filter(Boolean) as string[];

  const rasgos = (
    [
      ["Complexión", candidato.complexion],
      ["Tipo de pelo", candidato.tipo_pelo],
      ["Origen / etnia", candidato.origen_etnia],
    ] as const
  ).filter(([, v]) => v && v.trim() !== "") as [string, string][];

  const idiomas = candidato.idiomas_detalle.filter((i) => i && (i.idioma ?? "").trim() !== "");

  const fotos = candidato.fotos.slice(0, 3);

  return (
    <article className="dossier-slide mx-auto flex max-w-5xl flex-col px-4 py-8 sm:px-10 sm:py-12">
      {/* Banner rojo */}
      <div className="flex items-center justify-between gap-4 bg-primary px-4 py-2.5 text-primary-foreground">
        <p className="text-xs font-bold uppercase tracking-[0.3em]">
          {CATEGORIA_LABEL[candidato.categoria] ?? candidato.categoria}
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.3em]">{candidato.codigo}</p>
      </div>

      {/* Fotos en fila */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
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

      {/* Lockup + identificación */}
      <header className="mt-6 flex items-stretch gap-4 sm:gap-6">
        <p className="shrink-0 self-center text-sm font-black tracking-[0.18em] text-foreground sm:text-base">
          [FIGURARTE]
        </p>
        <span aria-hidden="true" className="w-px bg-border" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {candidato.codigo}
          </p>
          <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
            {candidato.nombre}
          </h2>
          {fisicos.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{fisicos.join(" · ")}</p>
          )}
        </div>
      </header>

      {/* Medidas de vestuario */}
      <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Medida etiqueta="Camisa" valor={candidato.talla_camisa} />
        <Medida etiqueta="Pecho" valor={candidato.anchura_pecho} />
        <Medida etiqueta="Pantalón" valor={candidato.talla_pantalon} />
        <Medida etiqueta="Cintura" valor={candidato.anchura_cintura} />
        <Medida etiqueta="Calzado" valor={candidato.talla_calzado} />
        {candidato.talla_chaqueta && (
          <Medida etiqueta="Chaqueta" valor={candidato.talla_chaqueta} />
        )}
        {candidato.talla_zapato && <Medida etiqueta="Zapato" valor={candidato.talla_zapato} />}
      </dl>

      {rasgos.length > 0 && (
        <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-3">
          {rasgos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{etiqueta}</dt>
              <dd className="font-medium">{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {(candidato.tipo_perfil.length > 0 ||
        candidato.habilidades.length > 0 ||
        candidato.carnes_conducir.length > 0 ||
        idiomas.length > 0) && (
        <div className="mt-5 grid gap-4 border-t border-border pt-4">
          <GrupoChips titulo="Tipo de perfil" valores={candidato.tipo_perfil} />
          <GrupoChips titulo="Habilidades" valores={candidato.habilidades} />
          <GrupoChips titulo="Carnés de conducir" valores={candidato.carnes_conducir} />
          {idiomas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Idiomas
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {idiomas.map((i, n) => (
                  <li key={`${i.idioma}-${n}`}>
                    <span className="font-medium">{i.idioma}</span>
                    {i.nivel && <span className="text-muted-foreground"> — {i.nivel}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {candidato.campos.length > 0 && (
        <dl className="mt-5 grid gap-x-8 gap-y-2 border-t border-border pt-4 sm:grid-cols-2">
          {candidato.campos.map((c) => (
            <div key={c.nombre} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{c.nombre}</dt>
              <dd className="font-medium">{c.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Pie de página */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        <span>www.figurarte.es</span>
        <span>
          {pagina} / {total}
        </span>
      </div>
    </article>
  );
}
