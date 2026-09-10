CREATE POLICY "usuarios_select_staff" ON public.usuarios
  FOR SELECT TO authenticated
  USING (public.es_staff(auth.uid()));

CREATE POLICY "usuarios_insert_admin" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (public.es_admin(auth.uid()) AND rol <> 'superadmin'::rol_usuario);

CREATE POLICY "usuarios_update_admin" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (
    public.es_admin(auth.uid())
    AND (user_id IS NULL OR user_id <> auth.uid())
    AND rol <> 'superadmin'::rol_usuario
  )
  WITH CHECK (
    public.es_admin(auth.uid())
    AND (user_id IS NULL OR user_id <> auth.uid())
    AND rol <> 'superadmin'::rol_usuario
  );

GRANT INSERT, UPDATE ON public.usuarios TO authenticated;