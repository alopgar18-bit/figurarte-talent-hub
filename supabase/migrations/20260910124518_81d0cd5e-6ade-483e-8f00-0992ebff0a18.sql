-- Función auxiliar: cliente_id del usuario conectado
CREATE OR REPLACE FUNCTION public.mi_cliente_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.cliente_id FROM public.usuarios u
  WHERE u.user_id = auth.uid() AND u.rol = 'cliente'
  LIMIT 1
$$;

CREATE TYPE public.tipo_campo_personalizado AS ENUM ('texto','numero');
CREATE TYPE public.estado_acceso_invitado AS ENUM ('activo','caducado');
CREATE TYPE public.estado_solicitud_proyecto AS ENUM ('pendiente','revisada','convertida');

-- clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social text NOT NULL,
  sector text,
  contactos jsonb NOT NULL DEFAULT '[]'::jsonb,
  condiciones text,
  plantilla_dossier jsonb NOT NULL DEFAULT '{"logo_url": null, "campos_ocultos": [], "orden_medidas": []}'::jsonb,
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY clientes_select_staff ON public.clientes FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));
CREATE POLICY clientes_insert_staff ON public.clientes FOR INSERT TO authenticated WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY clientes_update_staff ON public.clientes FOR UPDATE TO authenticated USING (public.es_staff(auth.uid())) WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY clientes_select_propio ON public.clientes FOR SELECT TO authenticated USING (id = public.mi_cliente_id());

-- campos_personalizados
CREATE TABLE public.campos_personalizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tipo public.tipo_campo_personalizado NOT NULL DEFAULT 'texto',
  categoria_aplicable public.categoria_candidato,
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campos_personalizados TO authenticated;
GRANT ALL ON public.campos_personalizados TO service_role;
ALTER TABLE public.campos_personalizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY campos_personalizados_select_staff ON public.campos_personalizados FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));
CREATE POLICY campos_personalizados_insert_staff ON public.campos_personalizados FOR INSERT TO authenticated WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY campos_personalizados_update_staff ON public.campos_personalizados FOR UPDATE TO authenticated USING (public.es_staff(auth.uid())) WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY campos_personalizados_delete_staff ON public.campos_personalizados FOR DELETE TO authenticated USING (public.es_staff(auth.uid()));

-- candidato_campos_valor
CREATE TABLE public.candidato_campos_valor (
  candidato_id uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  campo_id uuid NOT NULL REFERENCES public.campos_personalizados(id) ON DELETE CASCADE,
  valor text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (candidato_id, campo_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidato_campos_valor TO authenticated;
GRANT ALL ON public.candidato_campos_valor TO service_role;
ALTER TABLE public.candidato_campos_valor ENABLE ROW LEVEL SECURITY;
CREATE POLICY ccv_select_staff ON public.candidato_campos_valor FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));
CREATE POLICY ccv_insert_staff ON public.candidato_campos_valor FOR INSERT TO authenticated WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY ccv_update_staff ON public.candidato_campos_valor FOR UPDATE TO authenticated USING (public.es_staff(auth.uid())) WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY ccv_delete_staff ON public.candidato_campos_valor FOR DELETE TO authenticated USING (public.es_staff(auth.uid()));

-- accesos_invitados
CREATE TABLE public.accesos_invitados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos_casting(id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  caduca_en timestamptz,
  ultima_visita timestamptz,
  estado public.estado_acceso_invitado NOT NULL DEFAULT 'activo'
);
CREATE INDEX idx_accesos_invitados_cliente ON public.accesos_invitados(cliente_id);
GRANT SELECT, INSERT, UPDATE ON public.accesos_invitados TO authenticated;
GRANT ALL ON public.accesos_invitados TO service_role;
ALTER TABLE public.accesos_invitados ENABLE ROW LEVEL SECURITY;
CREATE POLICY accesos_select_staff ON public.accesos_invitados FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));
CREATE POLICY accesos_insert_staff ON public.accesos_invitados FOR INSERT TO authenticated WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY accesos_update_staff ON public.accesos_invitados FOR UPDATE TO authenticated USING (public.es_staff(auth.uid())) WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY accesos_select_propio ON public.accesos_invitados FOR SELECT TO authenticated USING (cliente_id = public.mi_cliente_id());

-- solicitudes_proyecto
CREATE TABLE public.solicitudes_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_proyecto text NOT NULL,
  categoria public.categoria_candidato NOT NULL,
  num_candidatos_aprox integer,
  descripcion text,
  fecha_necesaria date,
  estado public.estado_solicitud_proyecto NOT NULL DEFAULT 'pendiente',
  recibida_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_solicitudes_cliente ON public.solicitudes_proyecto(cliente_id);
GRANT SELECT, INSERT, UPDATE ON public.solicitudes_proyecto TO authenticated;
GRANT ALL ON public.solicitudes_proyecto TO service_role;
ALTER TABLE public.solicitudes_proyecto ENABLE ROW LEVEL SECURITY;
CREATE POLICY solicitudes_select_staff ON public.solicitudes_proyecto FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));
CREATE POLICY solicitudes_update_staff ON public.solicitudes_proyecto FOR UPDATE TO authenticated USING (public.es_staff(auth.uid())) WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY solicitudes_select_propio ON public.solicitudes_proyecto FOR SELECT TO authenticated USING (cliente_id = public.mi_cliente_id());
CREATE POLICY solicitudes_insert_cliente ON public.solicitudes_proyecto FOR INSERT TO authenticated WITH CHECK (cliente_id = public.mi_cliente_id());