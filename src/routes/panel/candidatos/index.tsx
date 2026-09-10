import { createFileRoute } from "@tanstack/react-router";
import { ListadoCandidatos } from "@/components/panel/ListadoCandidatos";

export const Route = createFileRoute("/panel/candidatos/")({
  head: () => ({
    meta: [
      { title: "Candidatos | Panel FigurArte" },
      { name: "description", content: "Listado interno de candidatos de casting: filtros, búsqueda y asignación a proyectos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Candidatos | Panel FigurArte" },
      { property: "og:description", content: "Listado interno de candidatos de casting: filtros, búsqueda y asignación a proyectos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListadoCandidatos,
});
