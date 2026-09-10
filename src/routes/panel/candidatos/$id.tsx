import { createFileRoute } from "@tanstack/react-router";
import { FichaCandidato } from "@/components/panel/FichaCandidato";

export const Route = createFileRoute("/panel/candidatos/$id")({
  component: FichaCandidatoRoute,
});

function FichaCandidatoRoute() {
  const { id } = Route.useParams();
  return <FichaCandidato id={id} />;
}
