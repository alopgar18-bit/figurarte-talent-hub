REVOKE ALL ON FUNCTION public.mi_cliente_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mi_cliente_id() TO authenticated, service_role;