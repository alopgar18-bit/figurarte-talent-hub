import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/portal-cliente")({
  head: () => ({
    meta: [
      { title: "Portal cliente | Panel FigurArte" },
      { name: "description", content: "Vista previa interna del portal de cliente de FigurArte." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Portal cliente | Panel FigurArte" },
      { property: "og:description", content: "Vista previa interna del portal de cliente de FigurArte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Proximamente
      titulo="Portal cliente"
      descripcion="Vista previa de lo que ve el cliente: búsqueda sin datos de contacto y dossiers."
    />
  ),
});
