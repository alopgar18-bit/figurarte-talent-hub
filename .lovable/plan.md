# Rediseño del área de candidato por secciones

## Qué se va a construir
- Sustituir el formulario largo por una navegación de diez apartados, mostrando solo el apartado activo.
- Mantener todos los campos y botones de guardado actuales, reagrupándolos sin cambiar su lógica.
- Añadir indicadores de completado basados en datos reales para los ocho apartados editables.
- Destacar Consentimiento RGPD mientras esté pendiente y abrirlo inicialmente en ese caso.
- Añadir “Mis procesos de casting” en modo lectura, con proyecto, categoría, estado, origen explicado y fecha, sin datos del cliente.
- Mostrar siempre código, nombre y progreso de los ocho apartados editables.
- En escritorio usar navegación lateral; en móvil, un selector desplegable superior.

## Agrupación
1. Datos básicos: datos personales de contacto y ubicación.
2. Identidad: identidad, tutor legal para menores y datos fiscales.
3. Físico: físico general, ampliado y vestuario.
4. Habilidades y perfil: habilidades actuales, especialidades y tipos de perfil.
5. Idiomas y formación: estudios, idiomas y acentos.
6. Carnés y documentación: carnés y documentación personal.
7. Redes y enlaces: redes, enlaces adicionales y otras residencias.
8. Vídeo de presentación.
9. Consentimiento RGPD y derechos sobre los datos.
10. Mis procesos de casting.

## Seguridad y datos
- La consulta de procesos será una función protegida por sesión y limitará la respuesta a los campos solicitados.
- No devolverá cliente, brief, condiciones ni otros datos internos del proyecto.
- Se conservarán las políticas actuales y no se crearán tablas ni se cambiará el esquema.

## Verificación
- Comprobar TypeScript y el funcionamiento visual a escritorio y unos 390 px.
- Probar navegación entre apartados, estado inicial de RGPD y progreso calculado con el candidato demo.
- Verificar con datos reales que “Mis procesos” muestra inscripciones y que la respuesta no contiene información del cliente.
- Confirmar que los guardados existentes siguen disponibles dentro de su apartado correspondiente.
