CREATE OR REPLACE FUNCTION public.fn_guardia_disponible_publico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.disponible_publico IS DISTINCT FROM OLD.disponible_publico THEN
    IF NEW.disponible_publico = true AND NEW.disponible = false THEN
      RAISE EXCEPTION 'Solo se pueden publicar en la web candidatos activos (disponible)';
    END IF;
    IF auth.uid() IS NOT NULL
       AND NOT public.es_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Solo un administrador puede publicar o despublicar un candidato';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;