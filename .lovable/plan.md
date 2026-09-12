# Revisión responsive de navegación horizontal

## Hallazgos de la auditoría

Se localizaron **18 usos explícitos de `overflow-x-auto` en 16 archivos**.

### Menús de navegación que hay que corregir
- `CabeceraPublica.tsx`: fila móvil deslizante con los enlaces públicos.
- `PortalShell.tsx`: menú del portal de cliente en fila horizontal móvil.

### Pestañas que hay que adaptar
- `Comunicaciones.tsx`: las tres pestañas usan etiquetas sin salto de línea y no caben con seguridad a 390 px. No llevan `overflow-x-auto`, pero pueden desbordar; se sustituirán por un selector en móvil.

### Tablas de datos que deben conservar su desplazamiento horizontal
- `RegistroAccesos.tsx`: registro de accesos.
- `FichaCandidato.tsx`: historial de castings.
- `ListadoProyectos.tsx`: proyectos.
- `ListadoClientes.tsx`: clientes.
- `ListadoCandidatos.tsx`: candidatos.
- `ImportarCandidatos.tsx`: dos tablas de previsualización/importación.
- `BuscarCandidatos.tsx`: resultados del portal.
- `CaptacionRRSS.tsx`: convocatorias activas.
- `Administracion.tsx`: usuarios y campos personalizados.
- `AccesosInvitados.tsx`: accesos invitados.
- `Comunicaciones.tsx`: historial de comunicaciones.
- `Dashboard.tsx`: proyectos activos por cliente.
- `DetalleProyecto.tsx`: candidatos del proyecto.
- `SolicitarProyecto.tsx`: solicitudes del cliente.

### Otras fichas y perfiles revisados
- `PerfilCandidato.tsx` ya usa el patrón correcto: selector móvil y navegación lateral en escritorio.
- La ficha staff del candidato, el detalle de proyecto y la gestión de clientes no contienen otros menús internos horizontales.
- Los usos generales de `whitespace-nowrap` en botones, selectores y celdas no forman menús desplazables.

## Cambios

1. Reemplazar la fila móvil de la cabecera pública por un botón de menú y un panel lateral accesible con los siete destinos. El panel cerrará al pulsar fuera, Escape, el botón de cierre o cualquier enlace, y gestionará el foco automáticamente.
2. Mantener la navegación pública de escritorio sin cambios funcionales.
3. Sustituir el menú horizontal móvil del portal de cliente por un selector de sección, conservando el menú lateral de escritorio.
4. Convertir las pestañas de Comunicaciones en un selector a ancho completo en móvil, manteniendo las pestañas visibles desde pantallas medianas.
5. No modificar ninguna tabla ni su desplazamiento horizontal.

## Verificación

- Comprobar a 390 px la cabecera pública, el portal de cliente y Comunicaciones.
- Confirmar que los menús no producen ancho lateral de página y que todos sus destinos siguen accesibles.
- Probar apertura, cierre exterior, Escape, foco y cierre al navegar en la cabecera.
- Confirmar que las tablas conservan su desplazamiento horizontal intencionado.
- Ejecutar las comprobaciones automáticas del proyecto.
