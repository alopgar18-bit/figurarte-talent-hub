import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FichaCandidato } from "@/components/panel/FichaCandidato";

const busquedaSchema = z.object({
  /** Id del proyecto desde el que se abrió la ficha, para poder volver a él. */
  desde: z.string().uuid().optional(),
});

export const Route = createFileRoute("/panel/candidatos/$id")({
  validateSearch: (search: Record<string, unknown>) => busquedaSchema.parse(search),
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
  const { desde } = Route.useSearch();
  return <FichaCandidato id={id} volverAProyectoId={desde} />;
}
