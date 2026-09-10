# Roadmap

- [x] Servir fotos privadas mediante enlaces firmados en ficha staff y dossier público.
- [x] Limitar la lectura pública del dossier a la función SQL de campos permitidos.
- [x] Restringir `candidatos-fotos` a imágenes y 10 MB.
- [x] Probar imagen real en dossier, rechazo de `.txt`, la función compartida de firma y vista móvil.
- [x] Quitar la lectura pública de `dossiers` y servirlos solo por `fn_dossier_publico(slug)`.
- [x] Enlaces de dossier con sufijo aleatorio de 8 caracteres (dossier existente regenerado).
- [x] Subida de fotos solo con URL firmada de un solo uso (`obtenerUrlSubidaFoto`, límite por IP) y policy pública de INSERT eliminada.
- [x] Claves foráneas `proyectos_casting.cliente_id` y `usuarios.cliente_id` con desvinculación al borrar cliente.
- [ ] Confirmar visualmente la ficha del panel con una sesión staff (bloqueado: Supabase externo no permite inyectar sesión de prueba).
- [ ] Limpiar una foto de prueba huérfana en `candidatos-fotos` (requiere API de Storage con clave de servicio).

## Bloque RGPD (hecho)
- Derecho al olvido (candidato y equipo), descarga de datos en JSON.
- Tabla registro_accesos + apartado en Administracion; logs de ver ficha, generar dossier y exportar Excel.
- Columna "En la base desde" en el listado (solo visibilidad, sin borrado automatico).
- /aviso-legal y /privacidad con placeholders para Javi, enlazadas desde Home y formulario publico.

## Pendientes de Alejandro/Javi
- Activar "Prevent use of leaked passwords" en Supabase.
- Rellenar los placeholders legales.
- Limpiar la foto de prueba huerfana en el bucket.
