
-- 1. Vínculo con cuentas de acceso
ALTER TABLE public.candidatos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX candidatos_user_id_key ON public.candidatos(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.usuarios ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX usuarios_user_id_key ON public.usuarios(user_id) WHERE user_id IS NOT NULL;

-- 2. Funciones security definer (evitan recursión en RLS)
CREATE OR REPLACE FUNCTION public.tiene_rol(_user_id uuid, _rol public.rol_usuario)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.user_id = _user_id AND u.rol = _rol
  )
$$;

CREATE OR REPLACE FUNCTION public.obtener_rol(_user_id uuid)
RETURNS public.rol_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.rol FROM public.usuarios u WHERE u.user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.es_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.user_id = _user_id
      AND u.rol IN ('superadmin','admin_figurarte','coordinador','validador')
  )
$$;

CREATE OR REPLACE FUNCTION public.es_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.user_id = _user_id
      AND u.rol IN ('superadmin','admin_figurarte')
  )
$$;

GRANT EXECUTE ON FUNCTION public.tiene_rol(uuid, public.rol_usuario) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_rol(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_admin(uuid) TO authenticated;

-- 3. CANDIDATOS
DROP POLICY IF EXISTS "candidatos_select_autenticados" ON public.candidatos;
CREATE POLICY "candidatos_select_propio" ON public.candidatos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "candidatos_select_staff" ON public.candidatos
  FOR SELECT TO authenticated
  USING (public.es_staff(auth.uid()));
CREATE POLICY "candidatos_update_propio" ON public.candidatos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
GRANT UPDATE ON public.candidatos TO authenticated;

-- 4. USUARIOS
DROP POLICY IF EXISTS "usuarios_select_autenticados" ON public.usuarios;
CREATE POLICY "usuarios_select_propio" ON public.usuarios
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "usuarios_select_admin" ON public.usuarios
  FOR SELECT TO authenticated
  USING (public.es_admin(auth.uid()));

-- 5. PROYECTO_CANDIDATOS
DROP POLICY IF EXISTS "proyecto_candidatos_select_autenticados" ON public.proyecto_candidatos;
CREATE POLICY "proyecto_candidatos_select_staff" ON public.proyecto_candidatos
  FOR SELECT TO authenticated
  USING (public.es_staff(auth.uid()));
CREATE POLICY "proyecto_candidatos_select_propio" ON public.proyecto_candidatos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.candidatos c
    WHERE c.id = proyecto_candidatos.candidato_id
      AND c.user_id = auth.uid()
  ));

-- 6. PROYECTOS_CASTING
DROP POLICY IF EXISTS "proyectos_select_autenticados" ON public.proyectos_casting;
CREATE POLICY "proyectos_select_staff" ON public.proyectos_casting
  FOR SELECT TO authenticated
  USING (public.es_staff(auth.uid()));
CREATE POLICY "proyectos_publicados_visibles_auth" ON public.proyectos_casting
  FOR SELECT TO authenticated
  USING (publicado = true);
