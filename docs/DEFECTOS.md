# Reporte de defectos — ContaStock Pro, build `rc` (v2.0.0 · rc)

**Contexto:** la app tiene dos builds. `stable` es el comportamiento correcto. `rc` es un *release candidate* que reintroduce 13 regresiones conocidas: los defectos que documenté en mi análisis manual previo de ContaStock (41 casos, 13 hallazgos). La suite de regresión se ejecuta contra `rc` para demostrar que **detecta fallos reales del producto**. No se encontraron defectos en el build `stable`: 14/14 aprobados y 70/70 en la prueba de estabilidad (`--repeat-each=5`).

> **Hallazgos reales vs. fallo controlado:** todo lo que está aquí son defectos del producto (build `rc`). El fallo controlado de `docs/evidencias/fallo-controlado/` es una aserción incorrecta *a propósito* para demostrar las evidencias y **no** es un defecto.

**Reproducir:** `npm run app`, abrir `http://127.0.0.1:4173/?build=rc`, o ejecutar `npm run test:rc`.

## Resumen

| ID | Módulo | Defecto | Severidad | Prioridad | Detectado por | Evidencia |
|---|---|---|---|---|---|---|
| DEF-07 | Movimientos | Una Salida mayor al stock se registra y deja el stock negativo | **Crítica** | Alta | QA02 (auto) | `evidencias/defectos/DEF-07_*.png` |
| DEF-03 | Productos | Se elimina un producto con movimientos (pérdida de trazabilidad) | **Crítica** | Alta | QA02 (auto) | `DEF-03_*.png` |
| DEF-13 | Productos | El nombre se muestra como HTML sin escapar (XSS almacenado) | **Crítica** | Alta | Manual / seguridad | — |
| DEF-12 | Dashboard | El KPI "Stock crítico" siempre muestra 0 | Mayor | Alta | QA01 (auto) | `DEF-12_*.png` |
| DEF-02 | Productos | Un producto con stock ≤ mínimo no se marca como crítico ni se advierte | Mayor | Media | QA03 (auto) | `DEF-02_*.png` |
| DEF-04 | Productos | La búsqueda no encuentra por código | Mayor | Media | QA06 (auto) | `DEF-04_*.png` |
| DEF-09 | Proveedores | El filtro de estado no filtra | Mayor | Media | QA06 (auto) | `DEF-09_*.png` |
| DEF-08 | Movimientos | Se aceptan movimientos con fecha futura | Mayor | Media | Manual (backlog auto) | — |
| DEF-11 | Órdenes | La edición con varios registros seleccionados abre el último sin advertir | Menor | Media | Manual (backlog auto) | — |
| DEF-05 | Categorías | El código de la categoría es editable en edición | Menor | Media | Manual | — |
| DEF-10 | Proveedores | No se valida el formato del correo | Menor | Baja | QA04 (auto) | `DEF-10_*.png` |
| DEF-01 | Productos | El modal de alta dice "Agregar Categoría" | Trivial | Baja | QA03 (auto, soft) | `DEF-01_*.png` |
| DEF-06 | Productos | El mensaje de eliminación empieza en minúscula | Trivial | Baja | Manual | — |

**8 de 13 se detectan automáticamente** (la regresión en `rc` termina con 8 fallidos, 6 aprobados y código de salida 1). Los 5 restantes están confirmados de forma manual y explico su tratamiento en la estrategia.

---

## Reportes detallados (los de severidad crítica y mayor)

### DEF-07 · La salida de inventario no valida el stock disponible
- **Ambiente:** build `rc` · Chromium · `http://127.0.0.1:4173/?build=rc`
- **Precondición:** el producto PRD003 "Detergente industrial 5L" tiene stock 3.
- **Pasos:** 1) Movimientos → Registrar Movimiento. 2) Tipo = Salida, Producto = PRD003, Cantidad = 4, Responsable = "QA". 3) REGISTRAR.
- **Resultado esperado:** error "Stock insuficiente. Disponible: 3 unidades."; no se registra el movimiento.
- **Resultado observado:** "El movimiento ha sido registrado exitosamente."; el movimiento queda con Stock Antes = 3 y Stock Después = **−1**.
- **Impacto:** se corrompe el inventario, que es la integridad del dato central del negocio. Bloquea la liberación.
- **Evidencia:** `docs/evidencias/defectos/DEF-07_salida-sin-validar-stock.png` y su traza en el reporte `reporte-rc-defectos`.

### DEF-03 · Se puede eliminar un producto con movimientos
- **Precondición:** PRD001 "Resma de papel A4" tiene movimientos.
- **Pasos:** Productos → 🗑️ en PRD001 → ACEPTAR.
- **Esperado:** "No se puede eliminar un producto con movimientos registrados." y el producto se conserva.
- **Observado:** el producto se elimina y sus movimientos quedan huérfanos (se muestran con producto "—").
- **Impacto:** se pierde la trazabilidad y la auditoría. Bloquea la liberación.

### DEF-13 · XSS almacenado en el nombre del producto
- **Pasos:** crear un producto con nombre `<b id="inj">INYECTADO</b>` y ver el listado.
- **Esperado:** el texto se muestra literalmente.
- **Observado:** el HTML se interpreta (aparece en negrilla y el elemento `#inj` existe en el DOM). Con `<img src=x onerror=...>` se ejecutaría JavaScript.
- **Impacto:** seguridad; un usuario puede inyectar scripts que ejecutan otros usuarios. Bloquea la liberación.
- **Nota:** lo confirmé de forma manual. Lo recomiendo como prueba de seguridad dedicada (payloads OWASP) y no como parte de la regresión funcional.

### DEF-12 · El KPI "Stock crítico" del dashboard siempre es 0
- **Pasos:** abrir el Dashboard.
- **Esperado:** 2 (los productos activos con stock ≤ mínimo: PRD003 y PRD007).
- **Observado:** 0.
- **Impacto:** la gerencia no ve los faltantes y no se generan compras a tiempo.

### DEF-02 · No se marca ni se advierte el stock crítico
- **Pasos:** crear un producto con Stock Actual = 2 y Stock Mínimo = 10.
- **Esperado:** advertencia al guardar y badge "Stock Crítico" en el listado.
- **Observado:** se guarda sin advertencia y sin badge.

### DEF-04 · La búsqueda de productos ignora el código
- **Pasos:** Productos → buscar `PRD002`.
- **Esperado:** 1 resultado (Tóner impresora HP). **Observado:** "No se encontraron registros."

### DEF-09 · El filtro de estado de proveedores no funciona
- **Pasos:** Proveedores → filtro = Inactivo.
- **Esperado:** 1 proveedor (Muebles & Diseño SAS). **Observado:** se siguen mostrando los 6.

### DEF-08 · Se aceptan fechas futuras en los movimientos
- **Pasos:** registrar una Entrada con fecha 2099-01-01.
- **Esperado:** el sistema rechaza o advierte que la fecha es posterior a hoy. **Observado:** se registra sin advertencia.
- **Impacto:** distorsiona los reportes por período y el KPI "Movimientos del mes".

Los defectos menores y triviales (DEF-01, 05, 06, 10, 11) siguen el mismo formato en la tabla de resumen. DEF-01 y DEF-10 tienen captura automática.
