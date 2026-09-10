import { createFileRoute } from "@tanstack/react-router";
import { BuscarCandidatos } from "@/components/portal/BuscarCandidatos";

export const Route = createFileRoute("/portal/candidatos")({
  head: () => ({
    meta: [
      { title: "Buscar candidatos | Portal FigurArte" },
      { name: "description", content: "Busca perfiles disponibles para tu producción en la base de datos de FigurArte." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Buscar candidatos | Portal FigurArte" },
      { property: "og:description", content: "Busca perfiles disponibles para tu producción en la base de datos de FigurArte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BuscarCandidatos,
});
