import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { obtenerSesionStaff } from "@/lib/auth.functions";
import { PanelShell } from "@/components/panel/PanelShell";

export const Route = createFileRoute("/panel")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { motivo: "panel" } });
    }
    const sesion = await obtenerSesionStaff({});
    if (!sesion.esStaff) {
      throw redirect({ to: "/auth", search: { motivo: "panel" } });
    }
    return { staff: sesion };
  },
  component: PanelLayout,
});

function PanelLayout() {
  const { staff } = Route.useRouteContext();
  return (
    <PanelShell rol={staff.rol} email={staff.email}>
      <Outlet />
    </PanelShell>
  );
}
