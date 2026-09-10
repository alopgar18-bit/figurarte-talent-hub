CREATE POLICY "candidatos_insert_staff" ON public.candidatos FOR INSERT TO authenticated WITH CHECK (public.es_staff(auth.uid()));
GRANT INSERT ON public.candidatos TO authenticated;