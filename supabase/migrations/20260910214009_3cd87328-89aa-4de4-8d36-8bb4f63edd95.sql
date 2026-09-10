CREATE TYPE public.accion_registro_acceso AS ENUM ('vio_ficha','genero_dossier','exporto_excel','borro_candidato');

CREATE TABLE public.registro_accesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  candidato_id uuid REFERENCES public.candidatos(id) ON DELETE SET NULL,
  accion public.accion_registro_acceso NOT NULL,
  detalle text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registro_accesos_creado_en ON public.registro_accesos (creado_en DESC);

GRANT SELECT ON public.registro_accesos TO authenticated;
GRANT ALL ON public.registro_accesos TO service_role;

ALTER TABLE public.registro_accesos ENABLE ROW LEVEL SECURITY;

CREATE POLICY registro_accesos_select_staff ON public.registro_accesos
  FOR SELECT TO authenticated
  USING (public.es_staff(auth.uid()));