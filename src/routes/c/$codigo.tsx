import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { resolverEnlaceCaptacion } from "@/lib/captacion.functions";

export const Route = createFileRoute("/c/$codigo")({
  loader: async ({ params }) => {
    const resultado = await resolverEnlaceCaptacion({ data: { codigo: params.codigo } });

    if (resultado.estado === "ok") {
      throw redirect({
        to: "/registro",
        search: {
          categoria: resultado.categoria,
          convocatoria: resultado.convocatoria_id,
          canal: resultado.canal,
        },
      });
    }
    return { valido: false };
  },
  head: () => ({
    meta: [
      { title: "Enlace de convocatoria — FigurArte.es" },
      {
        name: "description",
        content:
          "Enlace corto de convocatoria de casting de FigurArte. Si no es válido, vuelve al inicio para ver los castings activos.",
      },
      { property: "og:title", content: "Enlace de convocatoria — FigurArte.es" },
      {
        property: "og:description",
        content: "Enlace corto de convocatoria de casting de FigurArte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EnlaceNoValido,
});

function EnlaceNoValido() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">Enlace no válido</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este enlace de convocatoria no existe o ya no está disponible.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
