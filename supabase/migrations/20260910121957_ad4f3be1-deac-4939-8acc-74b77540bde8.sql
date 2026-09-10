CREATE POLICY "candidatos_update_staff" ON public.candidatos
  FOR UPDATE TO authenticated
  USING (public.es_staff(auth.uid()))
  WITH CHECK (public.es_staff(auth.uid()));

CREATE POLICY "proyecto_candidatos_insert_staff" ON public.proyecto_candidatos
  FOR INSERT TO authenticated
  WITH CHECK (public.es_staff(auth.uid()));

CREATE POLICY "proyecto_candidatos_update_staff" ON public.proyecto_candidatos
  FOR UPDATE TO authenticated
  USING (public.es_staff(auth.uid()))
  WITH CHECK (public.es_staff(auth.uid()));

GRANT UPDATE ON public.candidatos TO authenticated;
GRANT INSERT, UPDATE ON public.proyecto_candidatos TO authenticated;