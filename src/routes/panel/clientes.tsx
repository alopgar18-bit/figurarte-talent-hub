import { createFileRoute } from "@tanstack/react-router";
import { ListadoClientes } from "@/components/panel/ListadoClientes";

export const Route = createFileRoute("/panel/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | Panel FigurArte" },
      { name: "description", content: "Gestión de clientes de FigurArte: fichas, contactos y proyectos asociados." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Clientes | Panel FigurArte" },
      { property: "og:description", content: "Gestión de clientes de FigurArte: fichas, contactos y proyectos asociados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListadoClientes,
});
