
CREATE OR REPLACE FUNCTION public.tiene_rol(_user_id uuid, _rol public.rol_usuario)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.user_id = _user_id AND u.rol = _rol
  )
$$;

CREATE OR REPLACE FUNCTION public.obtener_rol(_user_id uuid)
RETURNS public.rol_usuario LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.rol FROM public.usuarios u
  WHERE u.user_id = _user_id AND _user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.es_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.user_id = _user_id
      AND u.rol IN ('superadmin','admin_figurarte','coordinador','validador')
  )
$$;

CREATE OR REPLACE FUNCTION public.es_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.user_id = _user_id
      AND u.rol IN ('superadmin','admin_figurarte')
  )
$$;
