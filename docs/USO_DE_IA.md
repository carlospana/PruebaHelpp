# Declaración de uso de herramientas de IA

El enunciado permite usar IA siempre que se declare. Lo declaro con detalle porque el rol que busco es el de un QA senior que use la IA con criterio, no como un sustituto.

## Herramientas
- **Claude (Anthropic)**, como asistente de ingeniería dentro de mi entorno de trabajo.
- **Playwright** (traza, codegen e inspector) para validar los localizadores.

## En qué me apoyé
| Parte | Apoyo de la IA | Mi decisión o validación |
|---|---|---|
| Análisis del enunciado | Resumen de requisitos y lista de verificación de entregables | Prioricé y definí el alcance; elegí ContaStock por el dominio y porque ya la conocía a fondo |
| App ContaStock v2 | Refactor para tener persistencia (`localStorage`), el interruptor `stable`/`rc`, escape de HTML y atributos accesibles (`label for`, `role`, `data-testid`) | Las reglas de negocio y los 13 defectos vienen de mi análisis manual previo (41 casos, 13 hallazgos). Verifiqué cada defecto en `rc` y su ausencia en `stable` |
| Framework de pruebas | Borradores de Page Objects, fixtures, la fábrica de datos y la configuración por ambiente | Revisé la estructura, los nombres y las aserciones; exigí verificar persistencia, sin esperas fijas y con aserciones *soft* donde corresponde |
| Casos QA01–QA06 | Primer borrador del código | Diseñé qué valida cada caso y su resultado esperado; corregí localizadores ambiguos que detectó la propia ejecución |
| Clasificación de fallos | Heurística del script `summary.mjs` | La llamo explícitamente "triage preliminar": la clasificación final la confirma un QA |
| Estrategia y caso práctico | Ayuda de redacción y para ajustar el texto a 2 páginas | Los criterios de riesgo, la recomendación de no liberar, los responsables y los indicadores son mi posición profesional y los sustento en la entrevista |

## Cómo verifiqué lo generado
1. **Ejecución real:** todo el código se ejecutó. `stable` da 14/14, la estabilidad da 70/70 con `--repeat-each=5`, `rc` falla en 8/14 por defectos reales y la demo termina con código de salida 1.
2. **Prueba de la prueba:** confirmé que cada caso falla cuando el defecto está presente (build `rc`) y pasa cuando no lo está (`stable`). Una prueba que nunca falla no prueba nada.
3. **Revisión de código:** TypeScript estricto y ESLint con `eslint-plugin-playwright` (prohíbe `waitForTimeout`, `force` y `test.only`).
4. **Errores que la IA cometió y corregí durante el trabajo:**
   - Una regex del parche de la app fusionó dos tablas (la ejecución lo detectó).
   - Algunos localizadores eran ambiguos (`REGISTRAR` contra `Registrar Movimiento`).
   - Faltaba la paginación al buscar un registro creado en la página 2.

## Lo que no delegué
- La elección de la aplicación y el alcance.
- La priorización por riesgo y los criterios de bloqueo de liberación.
- La severidad de los defectos.
- La recomendación del caso práctico.
- La revisión final de que no haya credenciales ni datos personales en el repositorio.

## Cómo propondría usar IA en el proceso de QA de la empresa
- **Diseño:** borradores de criterios de aceptación y casos a partir de historias de usuario. Siempre revisados en la sesión de "3 amigos".
- **Automatización:** asistentes para generar Page Objects y casos, con revisión obligatoria en PR, y exploración guiada del navegador (p. ej. Playwright MCP) para descubrir flujos.
- **Triage:** resumen automático de fallos del pipeline a partir de trazas y logs, con una clasificación sugerida que el QA confirma.
- **Datos:** generación de datos sintéticos (nunca datos reales de clientes).
- **Guardas:** no subir código ni datos sensibles a herramientas sin acuerdo corporativo, registrar qué se generó con IA y medir si reduce el tiempo de ciclo sin aumentar los defectos escapados.
