import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function PortalShell({
  razonSocial,
  children,
}: {
  razonSocial: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  async function salir() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Link to="/" className="text-sm font-bold tracking-tight">
              FigurArte<span className="text-primary">.</span>es
            </Link>
            <p className="truncate text-lg font-semibold leading-tight">{razonSocial}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Portal de cliente
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={salir} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
