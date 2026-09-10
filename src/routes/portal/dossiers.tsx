import { createFileRoute } from "@tanstack/react-router";
import { MisDossiers } from "@/components/portal/MisDossiers";

export const Route = createFileRoute("/portal/dossiers")({
  component: MisDossiers,
});
