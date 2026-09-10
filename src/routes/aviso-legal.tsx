import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/aviso-legal")({
  head: () => ({
    meta: [
      { title: "Aviso legal | FigurArte.es" },
      {
        name: "description",
        content:
          "Aviso legal de FigurArte: titularidad del sitio, condiciones de uso, propiedad intelectual y legislación aplicable.",
      },
      { property: "og:title", content: "Aviso legal | FigurArte.es" },
      {
        property: "og:description",
        content: "Información legal y condiciones de uso de la plataforma de casting de FigurArte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AvisoLegal,
});

function Pendiente({ children }: { children: React.ReactNode }) {
  return (
    <mark className="bg-primary/15 px-1.5 py-0.5 font-semibold text-primary">
      {children}
    </mark>
  );
}

function AvisoLegal() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Volver al inicio
      </Link>
      <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">Aviso legal</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Última actualización: pendiente de revisión antes de la publicación definitiva.
      </p>

      <div className="mt-8 rounded-md border border-primary/40 bg-primary/5 p-4 text-sm">
        <p className="font-semibold text-primary">Texto pendiente de completar</p>
        <p className="mt-1 text-muted-foreground">
          Los datos identificativos marcados en rojo debe rellenarlos Javi antes de publicar
          la web con datos reales. Las cláusulas legales sí son las definitivas.
        </p>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">1. Datos identificativos del titular</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>Denominación social: <Pendiente>[PENDIENTE — Javi: razón social completa]</Pendiente></li>
          <li>Nombre comercial: FigurArte — Casting &amp; Producción</li>
          <li>NIF/CIF: <Pendiente>[PENDIENTE — CIF]</Pendiente></li>
          <li>Domicilio social: <Pendiente>[PENDIENTE — dirección completa]</Pendiente></li>
          <li>Teléfono: 655 666 899</li>
          <li>Correo electrónico: casting@figurarte.app</li>
          <li>Datos registrales: <Pendiente>[PENDIENTE — registro mercantil, tomo, folio, hoja]</Pendiente></li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">2. Objeto y condiciones de uso</h2>
        <p className="text-sm leading-relaxed">
          Este sitio web tiene por objeto la captación, gestión y presentación de candidatos
          para proyectos de casting y producción audiovisual. El acceso al sitio atribuye la
          condición de usuario e implica la aceptación de este aviso legal. El usuario se
          compromete a hacer un uso lícito del sitio, a facilitar información veraz y
          actualizada, y a no utilizar los contenidos con fines contrarios a la ley, a la
          buena fe o a los derechos de terceros.
        </p>
        <p className="text-sm leading-relaxed">
          Las áreas privadas (candidato, cliente y equipo) son de acceso personal e
          intransferible. El usuario es responsable de la custodia de su enlace de acceso.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">3. Propiedad intelectual e industrial</h2>
        <p className="text-sm leading-relaxed">
          Los contenidos del sitio (textos, diseño, marca, logotipos, código y bases de
          datos) son titularidad del titular del sitio o de terceros que han autorizado su
          uso, y están protegidos por la normativa de propiedad intelectual e industrial.
          Queda prohibida su reproducción, distribución o transformación sin autorización
          expresa.
        </p>
        <p className="text-sm leading-relaxed">
          Las fotografías y vídeos aportados por los candidatos siguen siendo de su
          titularidad; su uso se limita a lo autorizado en la cesión de imagen y en la
          política de privacidad.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">4. Responsabilidad</h2>
        <p className="text-sm leading-relaxed">
          El titular no se responsabiliza de los daños derivados del uso indebido del sitio,
          de interrupciones temporales del servicio por causas técnicas, ni de los
          contenidos de sitios de terceros enlazados desde esta web.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">5. Protección de datos</h2>
        <p className="text-sm leading-relaxed">
          El tratamiento de los datos personales recogidos a través de este sitio se rige
          por la{" "}
          <Link to="/privacidad" className="text-primary underline underline-offset-4">
            política de privacidad
          </Link>
          , que forma parte inseparable de este aviso legal.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">6. Legislación aplicable y jurisdicción</h2>
        <p className="text-sm leading-relaxed">
          Este aviso legal se rige por la legislación española. Para la resolución de
          cualquier controversia, las partes se someten a los juzgados y tribunales de{" "}
          <Pendiente>[PENDIENTE — ciudad de los juzgados competentes]</Pendiente>, salvo que
          la normativa de consumo establezca otro fuero.
        </p>
      </section>
    </main>
  );
}
