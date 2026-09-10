CREATE POLICY "proyectos_insert_staff" ON public.proyectos_casting
  FOR INSERT TO authenticated
  WITH CHECK (public.es_staff(auth.uid()));

CREATE POLICY "proyectos_update_staff" ON public.proyectos_casting
  FOR UPDATE TO authenticated
  USING (public.es_staff(auth.uid()))
  WITH CHECK (public.es_staff(auth.uid()));

GRANT INSERT, UPDATE ON public.proyectos_casting TO authenticated;