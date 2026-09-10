
REVOKE ALL ON FUNCTION public.tiene_rol(uuid, public.rol_usuario) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.obtener_rol(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.es_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.es_admin(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.tiene_rol(uuid, public.rol_usuario) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_rol(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tiene_rol(uuid, public.rol_usuario) TO service_role;
GRANT EXECUTE ON FUNCTION public.obtener_rol(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.es_staff(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.es_admin(uuid) TO service_role;
