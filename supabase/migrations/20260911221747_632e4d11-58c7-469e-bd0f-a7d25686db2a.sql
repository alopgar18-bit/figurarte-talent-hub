ALTER TYPE public.estado_proyecto_candidato ADD VALUE IF NOT EXISTS 'descartado';
ALTER TYPE public.estado_proyecto_candidato ADD VALUE IF NOT EXISTS 'rechazado_por_candidato';

CREATE POLICY "proyecto_candidatos_update_rechazo_propio"
ON public.proyecto_candidatos
FOR UPDATE
TO authenticated
USING (
  estado::text = 'preseleccionado'
  AND EXISTS (
    SELECT 1 FROM public.candidatos c
    WHERE c.id = proyecto_candidatos.candidato_id AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  estado::text = 'rechazado_por_candidato'
  AND EXISTS (
    SELECT 1 FROM public.candidatos c
    WHERE c.id = proyecto_candidatos.candidato_id AND c.user_id = auth.uid()
  )
);

CREATE TABLE public.comunicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid REFERENCES public.candidatos(id) ON DELETE SET NULL,
  proyecto_id uuid REFERENCES public.proyectos_casting(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  canal text NOT NULL DEFAULT 'email',
  enviado_en timestamptz NOT NULL DEFAULT now(),
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.comunicaciones TO authenticated;
GRANT ALL ON public.comunicaciones TO service_role;

ALTER TABLE public.comunicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comunicaciones_select_staff" ON public.comunicaciones
FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));

CREATE POLICY "comunicaciones_insert_staff" ON public.comunicaciones
FOR INSERT TO authenticated WITH CHECK (public.es_staff(auth.uid()));