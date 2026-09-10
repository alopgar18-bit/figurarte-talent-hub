import { createFileRoute } from "@tanstack/react-router";
import { AccesosInvitados } from "@/components/panel/AccesosInvitados";

export const Route = createFileRoute("/panel/accesos-invitados")({
  head: () => ({
    meta: [
      { title: "Accesos invitados | Panel FigurArte" },
      { name: "description", content: "Gestión de accesos temporales de invitados a la plataforma de casting." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Accesos invitados | Panel FigurArte" },
      { property: "og:description", content: "Gestión de accesos temporales de invitados a la plataforma de casting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccesosInvitados,
});
