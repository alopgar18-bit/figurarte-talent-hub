CREATE POLICY "fotos_candidatos_subida_publica"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'candidatos-fotos');

CREATE POLICY "fotos_candidatos_lectura_propia_o_staff"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidatos-fotos'
  AND (
    public.es_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.candidatos c
      WHERE c.user_id = auth.uid()
        AND storage.objects.name = ANY (c.fotos)
    )
  )
);