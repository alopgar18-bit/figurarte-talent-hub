import { createFileRoute } from "@tanstack/react-router";
import { ListadoProyectos } from "@/components/panel/ListadoProyectos";

export const Route = createFileRoute("/panel/proyectos/")({
  head: () => ({
    meta: [
      { title: "Proyectos | Panel FigurArte" },
      { name: "description", content: "Proyectos de casting de FigurArte: estado, cliente y candidatos asignados." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Proyectos | Panel FigurArte" },
      { property: "og:description", content: "Proyectos de casting de FigurArte: estado, cliente y candidatos asignados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListadoProyectos,
});
