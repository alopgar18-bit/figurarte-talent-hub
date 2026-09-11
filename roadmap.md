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
- [x] Limpiar la foto de prueba huérfana en `candidatos-fotos`.

## Bloque RGPD (hecho)
- Derecho al olvido (candidato y equipo), descarga de datos en JSON.
- Tabla registro_accesos + apartado en Administracion; logs de ver ficha, generar dossier y exportar Excel.
- Columna "En la base desde" en el listado (solo visibilidad, sin borrado automatico).
- /aviso-legal y /privacidad con placeholders para Javi, enlazadas desde Home y formulario publico.

## Pendientes de Alejandro/Javi
- Activar "Prevent use of leaked passwords" en Supabase.
- Rellenar los placeholders legales.

## Rediseño del área de candidato
- [x] Navegación por diez apartados con menú lateral y selector móvil.
- [x] Cabecera fija con identidad y progreso real de los ocho apartados editables.
- [x] Consentimiento RGPD destacado y apertura inicial cuando esté pendiente.
- [x] Vista privada de procesos de casting sin datos de clientes ni información interna.
- [x] Verificación de compilación, estructura responsive y datos reales del candidato demo.

## Revisión de experiencia de usuario (hecho)
- Cabecera pública común (CabeceraPublica + PieLegal) en Home, /auth, /registro, /casting/$slug, /aviso-legal y /privacidad; nav visible también en móvil.
- "Salir" de panel, portal y área de candidato navega a "/".
- Fotos: el firmado ya funcionaba; faltaban fotos reales. Subidas fotos demo a candidatos del dossier. Logo de cliente ahora sobre fondo blanco (SVG negro).
- Clientes: edición completa (razón social, sector, contactos múltiples, condiciones, logo del dossier). Proyectos del cliente enlazan a /panel/proyectos/$id.
- Proyecto: tarjetas de preseleccionados enlazan a la ficha del candidato.
- Candidatos: panel de filtros avanzados (provincia, género, idiomas, rangos de edad/altura/peso).
- Dossier reconstruido al formato real (portada con lockup, banner rojo, fotos en fila, medidas de vestuario, pie con www.figurarte.es y número de página); fn_datos_publicos_candidato amplía las 5 medidas.
- Tipografía de panel/portal alineada con la marca pública.
