import { createFileRoute } from "@tanstack/react-router";
import { CaptacionRRSS } from "@/components/panel/CaptacionRRSS";

export const Route = createFileRoute("/panel/captacion")({
  head: () => ({
    meta: [
      { title: "Captación RRSS | Panel FigurArte" },
      { name: "description", content: "Convocatorias en redes sociales y enlaces trazables de captación de candidatos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Captación RRSS | Panel FigurArte" },
      { property: "og:description", content: "Convocatorias en redes sociales y enlaces trazables de captación de candidatos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CaptacionRRSS,
});
