import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { registrarCliente } from "@/lib/registro-cliente.functions";
import { CabeceraPublica, PieLegal } from "@/components/publico/CabeceraPublica";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/registro-cliente")({
  head: () => ({
    meta: [
      { title: "Solicitar un proyecto | FigurArte.es" },
      {
        name: "description",
        content:
          "Regístrate como cliente de FigurArte y accede a tu portal para solicitar un proyecto de casting.",
      },
      { property: "og:title", content: "Solicitar un proyecto | FigurArte.es" },
      {
        property: "og:description",
        content:
          "Alta de marcas y productoras: crea tu cuenta de cliente y solicita tu proyecto de casting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistroClientePage,
});

function RegistroClientePage() {
  const alta = useServerFn(registrarCliente);
  const [razonSocial, setRazonSocial] = useState("");
  const [sector, setSector] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    let resultado;
    try {
      resultado = await alta({
        data: {
          razonSocial,
          sector: sector.trim() || null,
          nombreContacto,
          email,
          telefono: telefono.trim() || null,
        },
      });
    } catch {
      setEnviando(false);
      setError("No hemos podido crear tu cuenta. Inténtalo de nuevo en un momento.");
      return;
    }

    if (resultado.estado === "limite") {
      setEnviando(false);
      setError("Demasiados intentos, prueba de nuevo en unos minutos.");
      return;
    }
    if (resultado.estado === "datos_invalidos") {
      setEnviando(false);
      setError(resultado.mensaje);
      return;
    }

    const { error: errEnlace } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?destino=solicitar`,
      },
    });
    setEnviando(false);
    if (errEnlace) {
      setError(
        "Tu cuenta está creada, pero no hemos podido enviarte el enlace de acceso. Entra desde “Acceder”.",
      );
      return;
    }
    setListo(true);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <CabeceraPublica />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Para marcas y productoras
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Solicitar un proyecto
        </h1>

        {listo ? (
          <div className="mt-8 flex items-start gap-3 border border-primary/40 bg-primary/5 p-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Revisa tu correo</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Hemos enviado un enlace de acceso a <strong>{email}</strong>. Al
                abrirlo entrarás en tu área de cliente, directamente en el
                formulario para crear tu proyecto.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 border border-border bg-muted/30 p-4 text-sm">
              ¿Ya trabajas con nosotros?{" "}
              <Link
                to="/auth"
                className="font-semibold text-primary underline underline-offset-4"
              >
                Entra en tu área de cliente
              </Link>{" "}
              y crea el proyecto desde allí.
            </div>

            <p className="mt-6 text-muted-foreground">
              Si todavía no eres cliente, déjanos tus datos: creamos tu cuenta y
              te llevamos directamente a crear tu proyecto.
            </p>

            <form onSubmit={enviar} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razon">Razón social / nombre de la empresa</Label>
                <Input
                  id="razon"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Producciones Ejemplo S.L."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector (opcional)</Label>
                  <Input
                    id="sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Publicidad, hostelería, cine…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contacto">Persona de contacto</Label>
                  <Input
                    id="contacto"
                    required
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    placeholder="Nombre y apellidos"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="600 000 000"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={enviando} className="gap-2">
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta y continuar
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-xs text-muted-foreground">
                Al continuar aceptas nuestro{" "}
                <Link to="/aviso-legal" className="underline underline-offset-4">
                  aviso legal
                </Link>{" "}
                y la{" "}
                <Link to="/privacidad" className="underline underline-offset-4">
                  política de privacidad
                </Link>
                .
              </p>
            </form>
          </>
        )}
      </div>

      <PieLegal />
    </main>
  );
}
