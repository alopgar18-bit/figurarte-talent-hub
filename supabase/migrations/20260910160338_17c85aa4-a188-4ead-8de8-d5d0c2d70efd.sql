CREATE POLICY "videos_candidato_insert_propio" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'candidatos-videos-temp' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "videos_candidato_select_propio_o_staff" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'candidatos-videos-temp' AND (public.es_staff(auth.uid()) OR (storage.foldername(name))[1] = auth.uid()::text));

CREATE POLICY "videos_candidato_delete_propio_o_staff" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidatos-videos-temp' AND (public.es_staff(auth.uid()) OR (storage.foldername(name))[1] = auth.uid()::text));