# Fotos privadas visibles y dossier protegido

## Qué se va a cambiar
- Añadir una función protegida para cargar la ficha del candidato y generar enlaces temporales de una hora para sus fotos privadas.
- Hacer que la ficha del panel consuma esa función, manteniendo intactas las referencias de prueba `placeholder://`.
- Crear en Supabase una función de lectura limitada que solo exponga los campos no identificativos permitidos para dossiers.
- Cambiar el dossier público para leer candidatos exclusivamente mediante esa función y firmar en servidor las fotos privadas en cada visita.
- Restringir el bucket `candidatos-fotos` a JPEG, PNG, WebP y HEIC, con un límite razonable por archivo.

## Seguridad
- La función de ficha exigirá una sesión staff válida; no confiará solo en la protección visual de `/panel`.
- La función SQL del dossier devolverá únicamente código, nombre, categoría, edad, provincia, altura, peso y fotos; no podrá devolver email, teléfono u otros datos aunque se amplíe accidentalmente una consulta del dossier.
- El bucket seguirá siendo privado y rechazará tipos no permitidos en el propio almacenamiento.

## Verificación
- Subir una imagen real a un candidato de prueba y confirmar que el enlace firmado responde y que la foto aparece en la ficha del panel y en un dossier que lo incluya.
- Intentar subir un archivo `.txt` y confirmar que Supabase Storage lo rechaza.
- Comprobar la vista del dossier y la ficha en escritorio y a unos 390 px.
- Ejecutar las comprobaciones de seguridad de Supabase relacionadas con el cambio.

## Supuestos técnicos
- Los enlaces `http(s)` existentes se conservan para los datos demo; las rutas internas del bucket se firman.
- Se usará una hora de validez y un límite de 10 MB por foto.
- La prueba usará un candidato demo existente y dejará su foto real disponible para validar el resultado.
