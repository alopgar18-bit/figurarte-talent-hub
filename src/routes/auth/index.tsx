import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/")({
  validateSearch: (search: Record<string, unknown>) => ({
    motivo: search["motivo"] === "panel" ? ("panel" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acceder | FigurArte.es" },
      {
        name: "description",
        content:
          "Accede a FigurArte.es con tu email. Te enviamos un enlace de acceso, sin contraseñas.",
      },
      { property: "og:title", content: "Acceder a FigurArte.es" },
      {
        property: "og:description",
        content: "Acceso con enlace por email para candidatos, equipo y clientes de FigurArte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEstado("enviando");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("No hemos podido enviar el enlace. Revisa el email e inténtalo de nuevo.");
      setEstado("idle");
      return;
    }
    setEstado("enviado");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          FigurArte<span className="text-primary">.</span>es
        </h1>

        {estado === "enviado" ? (
          <div className="mt-8 border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-card-foreground">Revisa tu correo</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hemos enviado un enlace de acceso a <strong>{email}</strong>. Ábrelo desde este
              mismo dispositivo para entrar.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setEstado("idle")}
            >
              Usar otro email
            </Button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduce tu email y te enviaremos un enlace para entrar. No necesitas contraseña.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando..." : "Enviar enlace de acceso"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
