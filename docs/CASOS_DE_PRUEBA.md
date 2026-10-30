# Casos de prueba automatizados — ContaStock Pro

Cada caso prepara sus propios datos y corre en un `BrowserContext` nuevo (con `localStorage` vacío), así que la app arranca siempre desde los datos semilla. Ningún caso depende del resultado de otro y todos pueden correr en paralelo y en cualquier orden.

**Convenciones**
- Los registros creados por la automatización llevan el prefijo `QA` + `RUN_ID` + worker + secuencia (p. ej. `QAE2E1001`). El código respeta el `maxlength=10` del formulario.
- Persistencia: tras crear o modificar algo, la prueba **recarga la página** y vuelve a consultar el registro. El mensaje de éxito solo no basta.
- Tags: `@smoke` (subconjunto crítico, menos de 10 s) y `@regression` (todos los casos).

## Composición de las suites

| Suite | Casos | Criterio |
|---|---|---|
| `smoke` | QA01 navegación · QA02 salida > stock · QA03 alta con persistencia | Lo mínimo para declarar el build "probable": la app carga, el flujo principal (alta) funciona y la regla de negocio de mayor impacto (integridad del inventario) se respeta. Corre en cada commit/PR. |
| `regression` | Los 14 tests (QA01–QA06) | Cobertura completa de los escenarios obligatorios y de las reglas de negocio de riesgo alto y medio. Gate antes de liberar. |

## Detalle

### QA01 · Acceso y navegación inicial
La app no tiene autenticación, así que, como indica el enunciado, QA01 cubre el acceso y la navegación.

| Test | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|
| Carga el dashboard y navega a todos los módulos `@smoke` | App desplegada en el ambiente; build esperado | 1. Abrir la app. 2. Verificar el build del ambiente. 3. Navegar a Productos, Categorías, Movimientos, Proveedores, Órdenes y volver al Dashboard | El dashboard muestra KPIs numéricos y los últimos movimientos; cada módulo muestra su título (h1) y la miga de pan se actualiza |
| KPI de stock crítico coincide con los productos críticos | Datos semilla con productos críticos | 1. En Productos, contar los productos activos con stock ≤ mínimo. 2. Ir al Dashboard | El KPI "Stock crítico" es igual al conteo calculado desde la tabla (consistencia entre módulos) |

### QA02 · Rechazo por regla de negocio
| Test | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|
| Rechaza una salida mayor al stock `@smoke` | PRD003 con stock 3 | 1. Registrar una Salida de 4 unidades de PRD003 con una observación única. 2. Recargar | Mensaje "Stock insuficiente. Disponible: 3 unidades."; el formulario sigue abierto; tras recargar no existe el movimiento y el stock sigue en 3 |
| Impide eliminar un producto con movimientos | PRD001 tiene movimientos | 1. Eliminar PRD001 y confirmar. 2. Recargar | Diálogo "No se puede eliminar un producto con movimientos registrados."; el producto sigue existiendo |

### QA03 · Flujo principal exitoso
| Test | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|
| Crea un producto y persiste `@smoke` | Ninguna (datos generados) | 1. Abrir "Agregar" (el título debe ser "Agregar Producto"). 2. Diligenciar un producto válido y aceptar. 3. Recargar y consultar | Mensaje de éxito; tras recargar, la fila tiene exactamente el código, nombre, categoría, stock, mínimo, precio formateado y estado ingresados |
| Producto con stock ≤ mínimo queda crítico | Ninguna | 1. Crear un producto con stock 2 y mínimo 10. 2. Recargar | Advertencia de "Stock Crítico" al guardar y badge "Stock Crítico" en el listado |

### QA04 · Validación de entradas
| Test | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|
| Campos obligatorios vacíos | Ninguna | 1. Abrir "Agregar" y aceptar sin datos. 2. Cancelar y recargar | Error visible en Código, Nombre, Categoría, Precio y Stock; no aparece mensaje de éxito; el número de productos no cambia |
| Código duplicado | PRD005 existe | Crear un producto con código PRD005 | Error "Ya existe un producto con este código"; no se crea el registro |
| Correo de proveedor inválido | Ninguna | Crear un proveedor con email `correo-invalido` | Error de formato de correo; el proveedor no se crea |

### QA05 · Modificación de información
| Test | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|
| Entrada incrementa el stock y queda trazada | Producto propio con stock 10 (lo crea la prueba) | 1. Registrar una Entrada de 15. 2. Recargar | El movimiento muestra antes = 10 y después = 25; el producto queda con stock 25 |
| Editar un producto | Producto propio | 1. Editar nombre, precio y estado. 2. Recargar | Título "Editar Producto"; el código no es editable; los cambios persisten |

### QA06 · Consulta y búsqueda
| Test | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|
| Búsqueda por código y por nombre | PRD002 "Tóner impresora HP" | Buscar `PRD002`, luego `TÓNER`, luego un texto inexistente | Un único resultado con los datos correctos; la búsqueda no distingue mayúsculas; "No se encontraron registros." |
| Filtro por categoría | Tecnología = PRD002, PRD005, PRD009 | Filtrar por Tecnología | Se muestran exactamente esos 3 códigos, todos de esa categoría |
| Filtro de proveedores por estado | 6 proveedores, 1 inactivo | Filtrar por Inactivo y luego por Activo | 1 y 5 filas respectivamente, con el estado correcto |

## Fuera del alcance automatizado (y por qué)
Ver la estrategia (§3). En resumen: categorías y órdenes de compra tienen menor riesgo y se cubren con revisión manual y exploratoria; el XSS (DEF-13) se valida en una revisión de seguridad; la fecha futura (DEF-08) y la edición múltiple de órdenes (DEF-11) son los primeros candidatos del backlog de automatización.
