CREATE TABLE public.asignaciones_pendientes_rgpd (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidato_id uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.proyectos_casting(id) ON DELETE CASCADE,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (candidato_id, proyecto_id)
);

GRANT SELECT, INSERT, DELETE ON public.asignaciones_pendientes_rgpd TO authenticated;
GRANT ALL ON public.asignaciones_pendientes_rgpd TO service_role;

ALTER TABLE public.asignaciones_pendientes_rgpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pendientes_rgpd_select_staff" ON public.asignaciones_pendientes_rgpd
  FOR SELECT TO authenticated USING (public.es_staff(auth.uid()));
CREATE POLICY "pendientes_rgpd_insert_staff" ON public.asignaciones_pendientes_rgpd
  FOR INSERT TO authenticated WITH CHECK (public.es_staff(auth.uid()));
CREATE POLICY "pendientes_rgpd_delete_staff" ON public.asignaciones_pendientes_rgpd
  FOR DELETE TO authenticated USING (public.es_staff(auth.uid()));