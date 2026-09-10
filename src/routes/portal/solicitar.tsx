import { createFileRoute } from "@tanstack/react-router";
import { SolicitarProyecto } from "@/components/portal/SolicitarProyecto";

export const Route = createFileRoute("/portal/solicitar")({
  head: () => ({
    meta: [
      { title: "Solicitar proyecto | Portal FigurArte" },
      { name: "description", content: "Solicita un nuevo proyecto de casting al equipo de FigurArte." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Solicitar proyecto | Portal FigurArte" },
      { property: "og:description", content: "Solicita un nuevo proyecto de casting al equipo de FigurArte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SolicitarRoute,
});

function SolicitarRoute() {
  const { cliente } = Route.useRouteContext();
  return <SolicitarProyecto clienteId={cliente.clienteId} />;
}
