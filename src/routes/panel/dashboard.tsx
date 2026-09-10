import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/panel/Dashboard";

export const Route = createFileRoute("/panel/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Panel FigurArte" },
      { name: "description", content: "Resumen de actividad: solicitudes pendientes, captación y proyectos activos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Dashboard | Panel FigurArte" },
      { property: "og:description", content: "Resumen de actividad: solicitudes pendientes, captación y proyectos activos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});
