import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { obtenerSesionCandidato } from "@/lib/auth.functions";
import { CandidatoShell } from "@/components/candidato/CandidatoShell";

export const Route = createFileRoute("/candidato")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { motivo: "candidato" } });
    }
    const sesion = await obtenerSesionCandidato({});
    if (!sesion.esCandidato) {
      throw redirect({ to: "/auth", search: { motivo: "candidato" } });
    }
    return { candidato: sesion };
  },
  component: CandidatoLayout,
});

function CandidatoLayout() {
  const { candidato } = Route.useRouteContext();
  return (
    <CandidatoShell nombre={candidato.nombre} codigo={candidato.codigo}>
      <Outlet />
    </CandidatoShell>
  );
}
