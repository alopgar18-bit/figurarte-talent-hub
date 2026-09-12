import { createFileRoute } from "@tanstack/react-router";
import { Comunicaciones } from "@/components/panel/Comunicaciones";

export const Route = createFileRoute("/panel/comunicaciones")({
  head: () => ({
    meta: [
      { title: "Comunicaciones | Panel FigurArte" },
      {
        name: "description",
        content: "Historial de avisos enviados a los candidatos por email y WhatsApp.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Comunicaciones | Panel FigurArte" },
      {
        property: "og:description",
        content: "Historial de avisos enviados a los candidatos por email y WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Comunicaciones,
});
