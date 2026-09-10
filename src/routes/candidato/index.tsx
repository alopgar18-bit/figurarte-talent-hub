import { createFileRoute } from "@tanstack/react-router";
import { PerfilCandidato } from "@/components/candidato/PerfilCandidato";
import { Route as CandidatoRoute } from "@/routes/candidato/route";

export const Route = createFileRoute("/candidato/")({
  head: () => ({
    meta: [
      { title: "Mi ficha de candidato | FigurArte.es" },
      {
        name: "description",
        content:
          "Completa tu perfil de candidato en FigurArte: datos, físico, habilidades, redes y vídeo de presentación.",
      },
      { property: "og:title", content: "Mi ficha de candidato | FigurArte.es" },
      {
        property: "og:description",
        content: "Área privada del candidato para completar su perfil en FigurArte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaginaPerfil,
});

function PaginaPerfil() {
  const { candidato } = CandidatoRoute.useRouteContext();
  return (
    <>
      <h1 className="sr-only">Mi ficha de candidato</h1>
      <PerfilCandidato candidatoId={candidato.candidatoId} />
    </>
  );
}
