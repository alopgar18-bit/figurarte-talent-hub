import { createFileRoute } from "@tanstack/react-router";
import { Administracion } from "@/components/panel/Administracion";

export const Route = createFileRoute("/panel/administracion")({
  head: () => ({
    meta: [
      { title: "Administración | Panel FigurArte" },
      { name: "description", content: "Ajustes de administración de la plataforma de casting de FigurArte." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Administración | Panel FigurArte" },
      { property: "og:description", content: "Ajustes de administración de la plataforma de casting de FigurArte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaginaAdministracion,
});

function PaginaAdministracion() {
  const { staff } = Route.useRouteContext();
  return <Administracion rol={staff.rol} email={staff.email} />;
}
