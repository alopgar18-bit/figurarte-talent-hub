import { createFileRoute } from "@tanstack/react-router";
import { CaptacionRRSS } from "@/components/panel/CaptacionRRSS";

export const Route = createFileRoute("/panel/captacion")({
  component: CaptacionRRSS,
});
