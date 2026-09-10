import { createFileRoute } from "@tanstack/react-router";
import { ImportarCandidatos } from "@/components/panel/ImportarCandidatos";

export const Route = createFileRoute("/panel/candidatos/importar")({
  component: ImportarCandidatos,
  head: () => ({
    meta: [
      { title: "Importar candidatos desde Excel | FigurArte" },
      {
        name: "description",
        content:
          "Asistente de importación de candidatos desde Excel para el equipo de FigurArte: mapeo de columnas y revisión de duplicados.",
      },
      { property: "og:title", content: "Importar candidatos desde Excel | FigurArte" },
      {
        property: "og:description",
        content: "Asistente interno de importación de candidatos de casting desde archivos Excel o CSV.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
