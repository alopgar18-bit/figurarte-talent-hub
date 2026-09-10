import { createFileRoute } from "@tanstack/react-router";
import { ListadoCandidatos } from "@/components/panel/ListadoCandidatos";

export const Route = createFileRoute("/panel/candidatos/")({
  component: ListadoCandidatos,
});
