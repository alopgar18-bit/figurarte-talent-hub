CREATE TABLE public.convocatorias_rrss (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria categoria_candidato NOT NULL,
  texto_generado text NOT NULL DEFAULT '',
  imagen_generada_url text,
  enlaces_por_canal jsonb NOT NULL DEFAULT '{}'::jsonb,
  fecha_cierre date,
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.convocatorias_rrss TO anon;
GRANT SELECT, INSERT, UPDATE ON public.convocatorias_rrss TO authenticated;
GRANT ALL ON public.convocatorias_rrss TO service_role;

ALTER TABLE public.convocatorias_rrss ENABLE ROW LEVEL SECURITY;

CREATE POLICY convocatorias_select_publico ON public.convocatorias_rrss
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY convocatorias_insert_staff ON public.convocatorias_rrss
  FOR INSERT TO authenticated WITH CHECK (es_staff(auth.uid()));
CREATE POLICY convocatorias_update_staff ON public.convocatorias_rrss
  FOR UPDATE TO authenticated USING (es_staff(auth.uid())) WITH CHECK (es_staff(auth.uid()));

CREATE TABLE public.registros_captacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  convocatoria_id uuid NOT NULL REFERENCES public.convocatorias_rrss(id) ON DELETE CASCADE,
  canal text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX registros_captacion_convocatoria_idx ON public.registros_captacion(convocatoria_id);

GRANT SELECT ON public.registros_captacion TO authenticated;
GRANT ALL ON public.registros_captacion TO service_role;

ALTER TABLE public.registros_captacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY registros_captacion_select_staff ON public.registros_captacion
  FOR SELECT TO authenticated USING (es_staff(auth.uid()));