# Recomendaciones completas y tarjetas con foto

## Cambios
- Mantener intacto `cumpleCriterios` y calcular primero la lista completa de candidatos coincidentes que aún no están en el proyecto.
- Usar el tamaño de esa lista como total real en el texto; mostrar hasta 300 tarjetas y añadir “mostrando los primeros 300 de N” cuando corresponda.
- Firmar las fotos privadas únicamente de los candidatos recomendados visibles mediante el mecanismo existente `conFotosFirmadas`.
- Renderizar cada recomendado con el mismo `CandidatoCard` de “Candidatos preseleccionados”, conservando el botón `+` que llama a `anadirCandidato`.

## Verificación
- Comprobar tipos y ausencia de límites antiguos de 60.
- Verificar en un proyecto con más de 60 coincidencias que el total mostrado sea real, que el máximo visual sea 300 y que las tarjetas incluyan foto, nombre, código, medidas y botón de añadir.

## Detalles técnicos
- Se separarán los estados derivados: coincidencias completas, total, recorte visual y candidatos visibles con URLs firmadas.
- No se modificará la sección de preseleccionados ni otras pantallas.
