CREATE TABLE public.dossiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.proyectos_casting(id) ON DELETE CASCADE,
  candidatos_incluidos uuid[] NOT NULL DEFAULT '{}'::uuid[],
  slug_publico text UNIQUE,
  fecha_caducidad timestamp with time zone,
  incluye_word boolean NOT NULL DEFAULT false,
  incluye_pdf boolean NOT NULL DEFAULT false,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  creado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE ON public.dossiers TO authenticated;
GRANT ALL ON public.dossiers TO service_role;

ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dossiers_select_staff" ON public.dossiers
  FOR SELECT TO authenticated
  USING (es_staff(auth.uid()));

CREATE POLICY "dossiers_insert_staff" ON public.dossiers
  FOR INSERT TO authenticated
  WITH CHECK (es_staff(auth.uid()));

CREATE POLICY "dossiers_update_staff" ON public.dossiers
  FOR UPDATE TO authenticated
  USING (es_staff(auth.uid()))
  WITH CHECK (es_staff(auth.uid()));

CREATE POLICY "dossiers_select_publico" ON public.dossiers
  FOR SELECT TO anon, authenticated
  USING (fecha_caducidad IS NULL OR fecha_caducidad > now());