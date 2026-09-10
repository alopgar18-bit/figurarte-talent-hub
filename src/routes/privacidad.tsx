import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad | FigurArte.es" },
      {
        name: "description",
        content:
          "Cómo trata FigurArte los datos de candidatos y clientes: finalidad, base legal, conservación, destinatarios y derechos RGPD.",
      },
      { property: "og:title", content: "Política de privacidad | FigurArte.es" },
      {
        property: "og:description",
        content: "Información RGPD sobre el tratamiento de datos en la plataforma de casting de FigurArte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidad,
});

function Pendiente({ children }: { children: React.ReactNode }) {
  return (
    <mark className="bg-primary/15 px-1.5 py-0.5 font-semibold text-primary">
      {children}
    </mark>
  );
}

function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Volver al inicio
      </Link>
      <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
        Política de privacidad
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Última actualización: pendiente de revisión antes de la publicación definitiva.
      </p>

      <div className="mt-8 rounded-md border border-primary/40 bg-primary/5 p-4 text-sm">
        <p className="font-semibold text-primary">Texto pendiente de completar</p>
        <p className="mt-1 text-muted-foreground">
          Los datos identificativos marcados en rojo debe rellenarlos Javi antes de publicar
          la web con datos reales. Las cláusulas RGPD sí son las definitivas.
        </p>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">1. Responsable del tratamiento</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>Responsable: <Pendiente>[PENDIENTE — Javi: razón social completa]</Pendiente></li>
          <li>NIF/CIF: <Pendiente>[PENDIENTE — CIF]</Pendiente></li>
          <li>Dirección: <Pendiente>[PENDIENTE — dirección completa]</Pendiente></li>
          <li>Correo de contacto en materia de datos: casting@figurarte.app</li>
          <li>
            Delegado de protección de datos:{" "}
            <Pendiente>[PENDIENTE — DPD, si procede; si no, indicar "no designado"]</Pendiente>
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">2. Datos que tratamos</h2>
        <p className="text-sm leading-relaxed">
          Según el perfil de la persona usuaria, tratamos: datos identificativos y de
          contacto (nombre, apellidos, DNI, correo, teléfono, ciudad y provincia); datos
          físicos y de perfil artístico (edad, altura, peso, características físicas,
          habilidades, idiomas, profesión); imágenes y vídeos aportados voluntariamente;
          enlaces a redes sociales; y datos de la persona con patria potestad o tutela
          cuando el candidato es menor de edad. De los clientes tratamos datos de contacto
          profesional y de la relación comercial.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">3. Finalidad del tratamiento</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>Gestionar la inscripción y el perfil de candidatos en nuestra base de talentos.</li>
          <li>Seleccionar y proponer perfiles para proyectos concretos de casting.</li>
          <li>
            Elaborar dossieres de presentación a clientes, con datos limitados (nombre,
            código, categoría, edad, provincia, medidas y fotografías) y nunca con datos de
            contacto.
          </li>
          <li>Comunicarnos contigo sobre tu candidatura, convocatorias y proyectos.</li>
          <li>Gestionar solicitudes de proyecto de clientes y la relación contractual.</li>
          <li>Cumplir obligaciones legales y acreditar el consentimiento prestado.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">4. Base legal</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            <strong>Consentimiento</strong> (art. 6.1.a RGPD): inscripción en la base de
            talentos y cesión de imagen para su presentación a clientes. Es revocable en
            cualquier momento, sin efectos retroactivos.
          </li>
          <li>
            <strong>Ejecución de un contrato o medidas precontractuales</strong> (art. 6.1.b):
            participación en un proyecto concreto y relación con clientes.
          </li>
          <li>
            <strong>Interés legítimo</strong> (art. 6.1.f): seguridad de la plataforma y
            registro de accesos internos a las fichas.
          </li>
          <li>
            <strong>Obligación legal</strong> (art. 6.1.c): conservación de documentación
            fiscal y laboral cuando proceda.
          </li>
          <li>
            En el caso de menores de 14 años, el tratamiento se basa en la autorización de
            quien ostenta la patria potestad o tutela.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">5. Plazo de conservación</h2>
        <p className="text-sm leading-relaxed">
          Los datos de candidatos se conservan mientras el perfil siga activo en la base de
          talentos y, como máximo, durante{" "}
          <Pendiente>[PENDIENTE — plazo de conservación acordado, p. ej. 3 años]</Pendiente>{" "}
          desde la última actividad, salvo que se solicite antes la supresión. Los datos
          vinculados a proyectos ya ejecutados se conservan durante los plazos de
          prescripción legal aplicables (fiscales, contables y de responsabilidad
          contractual). Transcurridos esos plazos, los datos se suprimen o se anonimizan.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">6. Destinatarios</h2>
        <p className="text-sm leading-relaxed">
          Los perfiles seleccionados se comunican a los clientes (marcas, agencias y
          productoras) para los que se realiza el casting, mediante dossieres con datos
          limitados y enlaces privados y caducables. También acceden a los datos, como
          encargados del tratamiento, los proveedores tecnológicos necesarios para prestar
          el servicio (alojamiento y base de datos, envío de correo y alojamiento de vídeo),
          que pueden implicar transferencias internacionales amparadas en cláusulas
          contractuales tipo de la Comisión Europea. No se venden ni se ceden datos a
          terceros con otra finalidad.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">7. Tus derechos</h2>
        <p className="text-sm leading-relaxed">
          Puedes ejercer en cualquier momento los derechos de acceso, rectificación,
          supresión (derecho al olvido), oposición, limitación del tratamiento y
          portabilidad, así como retirar el consentimiento prestado.
        </p>
        <p className="text-sm leading-relaxed">
          Desde tu{" "}
          <Link to="/candidato" className="text-primary underline underline-offset-4">
            área de candidato
          </Link>{" "}
          puedes descargar una copia completa de tus datos en formato JSON y eliminar tu
          cuenta y todos tus datos de forma inmediata. También puedes escribirnos a
          casting@figurarte.app.
        </p>
        <p className="text-sm leading-relaxed">
          Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar
          ante la Agencia Española de Protección de Datos (www.aepd.es).
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">8. Seguridad</h2>
        <p className="text-sm leading-relaxed">
          Aplicamos medidas técnicas y organizativas adecuadas: acceso por roles, control de
          acceso a nivel de base de datos, almacenamiento privado de fotografías y vídeos
          con enlaces firmados y temporales, enlaces de dossier no adivinables y con fecha
          de caducidad, y un registro interno de los accesos del equipo a las fichas.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">9. Cambios en esta política</h2>
        <p className="text-sm leading-relaxed">
          Podemos actualizar esta política para adaptarla a cambios legales o del servicio.
          Publicaremos siempre la versión vigente en esta página.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link to="/aviso-legal" className="text-primary underline underline-offset-4">
          Ver también el aviso legal
        </Link>
      </p>
    </main>
  );
}
