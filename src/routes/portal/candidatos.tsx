import { createFileRoute } from "@tanstack/react-router";
import { BuscarCandidatos } from "@/components/portal/BuscarCandidatos";

export const Route = createFileRoute("/portal/candidatos")({
  component: BuscarCandidatos,
});
