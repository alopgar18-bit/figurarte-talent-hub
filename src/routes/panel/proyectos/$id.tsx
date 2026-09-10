import { createFileRoute } from "@tanstack/react-router";
import { DetalleProyecto } from "@/components/panel/DetalleProyecto";

export const Route = createFileRoute("/panel/proyectos/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de proyecto | Panel FigurArte" },
      { name: "description", content: "Detalle del proyecto de casting: brief, candidatos asignados y generación de dossier." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Detalle de proyecto | Panel FigurArte" },
      { property: "og:description", content: "Detalle del proyecto de casting: brief, candidatos asignados y generación de dossier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetalleProyectoRoute,
});

function DetalleProyectoRoute() {
  const { id } = Route.useParams();
  return <DetalleProyecto id={id} />;
}
