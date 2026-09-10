import { createFileRoute } from "@tanstack/react-router";
import { FichaCandidato } from "@/components/panel/FichaCandidato";

export const Route = createFileRoute("/panel/candidatos/$id")({
  head: () => ({
    meta: [
      { title: "Ficha de candidato | Panel FigurArte" },
      { name: "description", content: "Ficha completa del candidato: datos personales, físico, habilidades, fotos y proyectos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ficha de candidato | Panel FigurArte" },
      { property: "og:description", content: "Ficha completa del candidato: datos personales, físico, habilidades, fotos y proyectos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FichaCandidatoRoute,
});

function FichaCandidatoRoute() {
  const { id } = Route.useParams();
  return <FichaCandidato id={id} />;
}
