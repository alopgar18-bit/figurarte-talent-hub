import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { obtenerSesionCliente } from "@/lib/auth.functions";
import { PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/portal")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { motivo: "portal" } });
    }
    const sesion = await obtenerSesionCliente({});
    if (!sesion.esCliente) {
      throw redirect({ to: "/auth", search: { motivo: "portal" } });
    }
    return { cliente: sesion };
  },
  component: PortalLayout,
});

function PortalLayout() {
  const { cliente } = Route.useRouteContext();
  return (
    <PortalShell razonSocial={cliente.razonSocial}>
      <Outlet />
    </PortalShell>
  );
}
