import { createFileRoute } from "@tanstack/react-router";
import { MisDossiers } from "@/components/portal/MisDossiers";

export const Route = createFileRoute("/portal/dossiers")({
  head: () => ({
    meta: [
      { title: "Mis dossiers | Portal FigurArte" },
      { name: "description", content: "Consulta los dossiers de candidatos preparados por FigurArte para tus proyectos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Mis dossiers | Portal FigurArte" },
      { property: "og:description", content: "Consulta los dossiers de candidatos preparados por FigurArte para tus proyectos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MisDossiers,
});
