CREATE TABLE public.plantillas_comunicacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  canal text NOT NULL CHECK (canal IN ('email','whatsapp')),
  activo boolean NOT NULL DEFAULT true,
  asunto text,
  cuerpo text,
  plantilla_wati text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento, canal)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plantillas_comunicacion TO authenticated;
GRANT ALL ON public.plantillas_comunicacion TO service_role;

ALTER TABLE public.plantillas_comunicacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plantillas_select_staff" ON public.plantillas_comunicacion
  FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));
CREATE POLICY "plantillas_insert_admin" ON public.plantillas_comunicacion
  FOR INSERT TO authenticated WITH CHECK (public.es_admin(auth.uid()));
CREATE POLICY "plantillas_update_admin" ON public.plantillas_comunicacion
  FOR UPDATE TO authenticated USING (public.es_admin(auth.uid())) WITH CHECK (public.es_admin(auth.uid()));
CREATE POLICY "plantillas_delete_admin" ON public.plantillas_comunicacion
  FOR DELETE TO authenticated USING (public.es_admin(auth.uid()));

CREATE TRIGGER update_plantillas_comunicacion_updated_at
  BEFORE UPDATE ON public.plantillas_comunicacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plantillas_comunicacion (evento, canal, activo, asunto, cuerpo) VALUES
  ('contratado','email', true,
   '¡Buenas noticias! Has sido seleccionado/a — FigurArte',
   'Hola {nombre}, tenemos buenas noticias: has sido seleccionado/a para uno de los procesos en los que participabas. En breve nos pondremos en contacto contigo con los detalles.'),
  ('descartado','email', true,
   'Sobre tu candidatura — FigurArte',
   'Hola {nombre}, gracias por participar. En esta ocasión no hemos seguido adelante con tu candidatura en uno de los procesos, pero tu perfil sigue activo para futuras oportunidades.');

INSERT INTO public.plantillas_comunicacion (evento, canal, activo, plantilla_wati) VALUES
  ('contratado','whatsapp', true, NULL),
  ('descartado','whatsapp', true, NULL);

ALTER TABLE public.comunicaciones
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'automatica',
  ADD COLUMN IF NOT EXISTS contenido text,
  ADD COLUMN IF NOT EXISTS destinatario_tipo text NOT NULL DEFAULT 'candidato',
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;