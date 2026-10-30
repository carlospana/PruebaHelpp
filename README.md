# ContaStock QA · Automatización E2E con Playwright + TypeScript

Prueba técnica QA (HelpPeople). Proyecto de automatización mantenible sobre **ContaStock Pro**, un sistema web de inventarios, con estrategia de calidad basada en riesgo.

| | |
|---|---|
| **Stack** | Node.js 20+ (probado en 22) · TypeScript · Playwright Test 1.63 · Chromium |
| **Suites** | `smoke` (3 tests) · `regression` (14 tests, cubre QA01–QA06) |
| **Ambientes** | `local` (build estable) · `rc` (release candidate con regresiones) · `example` (despliegue remoto) |
| **Resultado** | `stable`: **14/14 ✅** · estabilidad 70/70 (`--repeat-each=5`) · `rc`: **8 defectos detectados** (exit 1) |
| **Documentos** | [Casos](docs/CASOS_DE_PRUEBA.md) · [Estrategia QA (PDF, 2 págs.)](docs/ESTRATEGIA_QA.pdf) · [Defectos](docs/DEFECTOS.md) · [Uso de IA](docs/USO_DE_IA.md) |

---

## 1. Aplicación elegida y motivo
**ContaStock Pro** (`app/index.html`) es una SPA de inventarios con Dashboard, Productos, Categorías, Movimientos, Proveedores y Órdenes de compra. Se ejecuta en local, sin backend ni credenciales, y no depende de HelpPeople.

- **Origen:** la app proviene de una prueba técnica de QA anterior en la que participé, en la que diseñé 41 casos y reporté 13 hallazgos. La reutilizo con autorización.
- **Por qué esta app:**
  1. El dominio de inventario tiene reglas de negocio reales y verificables: stock, trazabilidad y stock crítico.
  2. Ya conocía sus riesgos a fondo.
  3. Permite cubrir los 6 escenarios obligatorios sin forzarlos.

**Cambios que hice a la app (v2.0.0)** para que sea comprobable y profesional:
- **Persistencia** en `localStorage`, para que "volver a consultar" signifique recargar la página. `?reset=1` restaura los datos semilla.
- **Dos builds** en el mismo artefacto:
  - `stable` (por defecto): comportamiento correcto.
  - `?build=rc`: reintroduce las 13 regresiones de mi análisis previo. Sirve para demostrar que la suite **detecta defectos reales**.
- **Accesibilidad y testabilidad:** `label for`, `role="dialog"`, `aria-label` y `data-testid`, que permiten localizadores estables.
- **Seguridad:** escape de HTML en todo lo que se renderiza (corrige el XSS DEF-13 en `stable`).
- Se eliminó la guía interna del evaluador que traía el HTML original.

### Alcance y reglas de negocio
| # | Regla | Caso |
|---|---|---|
| R1 | Una **Salida** no puede superar el stock disponible: "Stock insuficiente. Disponible: X unidades." | QA02 |
| R2 | No se elimina un producto **con movimientos registrados** | QA02 |
| R3 | Producto obligatorio: código (único, máx. 10), nombre, categoría activa, precio ≥ 0 y stock ≥ 0 | QA03, QA04 |
| R4 | Producto **crítico** = activo y stock ≤ stock mínimo: badge, advertencia y KPI del dashboard | QA01, QA03 |
| R5 | Entrada suma, Salida resta y Ajuste fija el stock; cada movimiento registra antes/después | QA05 |
| R6 | El código de un producto no se edita después de creado | QA05 |
| R7 | La búsqueda de productos funciona por nombre **o** código, sin distinguir mayúsculas; hay filtros por categoría y por estado | QA06 |
| R8 | El correo de proveedor debe tener el formato `nombre@dominio.ext` | QA04 |
| R9 | No se aceptan movimientos con fecha futura | backlog (DEF-08) |

**Fuera de alcance de la automatización:** CRUD de categorías y órdenes, textos y ortografía, rendimiento y seguridad profunda (ver la [estrategia](docs/ESTRATEGIA_QA.md) §3).

## 2. Requisitos e instalación
```bash
node -v                                # >= 20
npm ci                                 # instala dependencias exactas (package-lock.json)
npx playwright install chromium        # navegador
cp .env.example .env                   # Windows PowerShell: Copy-Item .env.example .env
```

**Datos de prueba:** no requieren preparación. Cada prueba abre un contexto de navegador nuevo y la app arranca con los datos semilla (12 productos, 5 categorías, 8 movimientos, 6 proveedores, 6 órdenes). Los datos semilla de referencia están en [`test-data/catalog.json`](test-data/catalog.json). **No hay usuarios ni contraseñas**: la app no tiene autenticación.

**Ver la app manualmente:** `npm run app` y abrir http://127.0.0.1:4173 (estable) o http://127.0.0.1:4173/?build=rc.

## 3. Ejecución
Playwright levanta el servidor local automáticamente (`webServer`).

| Objetivo | Comando |
|---|---|
| Regresión completa (estable) | `npm test` |
| Smoke | `npm run test:smoke` |
| Regresión | `npm run test:regression` |
| Regresión contra el **RC** (se espera que falle) | `npm run test:rc` |
| Modo visible (con interfaz) | `npm run test:headed` o `HEADLESS=false` en `.env` |
| Sin interfaz (por defecto) | `npm test` |
| Otro ambiente | `TEST_ENV=example BASE_URL=https://... npx playwright test` · PowerShell: `$env:TEST_ENV="rc"; npx playwright test --grep @smoke` |
| Fallo controlado (demo de evidencias) | `npm run test:demo-failure` |
| Ver reporte HTML | `npx playwright show-report reports/html-local` |
| Resumen JSON / clasificación | `npm run summary -- reports/results-local.json` |
| Calidad del código | `npm run typecheck` · `npm run lint` |

### Variables (`.env`)
| Variable | Uso | Valor por defecto |
|---|---|---|
| `TEST_ENV` | Perfil de `config/environments/*.json` | `local` |
| `BASE_URL` | Sobrescribe la URL del perfil (obligatoria en `example`) | — |
| `APP_PORT` | Puerto del servidor local | `4173` |
| `HEADLESS`, `WORKERS`, `RETRIES` | Opciones de ejecución | `true`, auto, `0` |
| `DEMO_FAILURE` | `1` solo para la demo de fallo controlado | `0` |
| `RUN_ID` | Prefijo de los datos generados (en CI = `github.run_id`) | aleatorio |

## 4. Diseño del proyecto
```
app/index.html              ContaStock v2 (aplicación bajo prueba)
config/env.ts               carga y valida el ambiente (TEST_ENV, BASE_URL)
config/environments/*.json  URLs y opciones por ambiente, separadas del código
test-data/catalog.json      datos semilla de referencia (solo lectura)
src/pages/                  Page Objects: BasePage, Dashboard, Products, Movements, Providers
src/fixtures/test.ts        fixtures: páginas, fábrica de datos, guarda de errores JS
src/data/factories.ts       datos únicos por ejecución/worker (prefijo QA+RUN_ID)
tests/e2e/qa0X-*.spec.ts    un archivo por escenario obligatorio
tests/demo/                 fallo controlado (solo con DEMO_FAILURE=1)
scripts/serve.mjs           servidor estático sin dependencias
scripts/summary.mjs         resumen JSON + clasificación de fallos
.github/workflows/e2e.yml   CI: typecheck + lint → E2E stable (gate) y rc (informativo)
```

**Decisiones:**
- **Page Objects + fixtures.** Los tests leen como casos de negocio; los selectores viven en un solo lugar. Para agregar un caso basta un `test()` que use los fixtures existentes.
- **Localizadores por rol, etiqueta y `data-testid`.** No dependen de clases CSS ni de posición.
- **Sin esperas fijas.** Solo aserciones web-first con auto-espera. ESLint lo bloquea con `playwright/no-wait-for-timeout`.
- **Aserciones de valor y persistencia.** Se recarga la página y se compara el registro completo (`toEqual`). En QA03 el título del modal es una aserción `expect.soft`, para que un defecto cosmético no oculte la verificación de persistencia.
- **Verificación del ambiente antes de probar.** Si el build no coincide con el perfil, el error dice `[AMBIENTE]`: es un bloqueo, no un defecto.
- **Guarda de errores JS.** Un `pageerror` no controlado hace fallar la prueba y se adjunta al reporte.

## 5. Datos de prueba: aislamiento y limpieza
- Cada test corre en un `BrowserContext` nuevo, con `localStorage` vacío. **No hay estado compartido** y no hace falta limpieza entre tests; se puede correr en paralelo y en cualquier orden.
- Los registros creados llevan un identificador único `QA{RUN_ID}{worker}{seq}` (p. ej. `QAE2E1001`), así que no chocan entre workers ni entre ejecuciones y se distinguen de los datos de negocio.
- Los datos semilla se usan solo como precondición de lectura. Cuando un caso modifica algo (QA05), primero crea su propio producto.
- En un ambiente compartido con backend, el prefijo `QA` permitiría un *teardown* por API (borrar `QA{RUN_ID}*` al final) y un job nocturno de purga.

## 6. Resultados, evidencias y clasificación
- **Reportes:** HTML (`reports/html-<ambiente>`), JSON, JUnit y un resumen propio (`reports/summary-*.json`).
- **Ante un fallo:** captura, video y **traza** de Playwright (`trace: retain-on-failure`). El código de salida es distinto de 0.
- **Clasificación de fallos** en `summary.mjs` (triage preliminar que confirma un QA):
  - `PRODUCTO`: falló una aserción de negocio.
  - `AUTOMATIZACION`: localizador ambiguo, `TypeError` o espera de acción.
  - `AMBIENTE`: servidor caído o build inesperado.
  - `DEMO_CONTROLADO`: el fallo intencional de la demo.
- **Reintentos:** 0 en local, para no ocultar fallos. 1 en CI, **solo para detectar intermitencia**: Playwright marca el caso como `flaky`, no como aprobado, y el resumen lo cuenta aparte. Una prueba flaky va a cuarentena con ticket (ver la estrategia §4).

**Evidencias entregadas** (`docs/evidencias/`):
| Evidencia | Ruta |
|---|---|
| Reporte HTML de una ejecución completa (stable, 14/14) | `reporte-stable-completo/index.html` |
| Reporte HTML de la regresión contra RC (8 defectos) | `reporte-rc-defectos/index.html` |
| Capturas por defecto | `defectos/DEF-XX_*.png` |
| **Fallo controlado** (ejecución separada): reporte, captura y traza | `fallo-controlado/` |
| Resúmenes JSON | `summary-local.json`, `summary-rc.json`, `summary-demo-failure.json` |

Para abrir una traza: `npx playwright show-trace docs/evidencias/fallo-controlado/trace.zip`. Para abrir un reporte: `npx playwright show-report docs/evidencias/reporte-stable-completo`.

**Reproducir el fallo controlado:** `npm run test:demo-failure`. El test `tests/demo/controlled-failure.spec.ts` espera 999 productos activos (el valor real es 11), así que falla con captura y traza y termina con exit 1. **No forma parte de la suite normal:** `playwright.config.ts` lo ignora salvo que `DEMO_FAILURE=1`.

## 7. CI (opcional implementado)
`.github/workflows/e2e.yml`:
1. Typecheck + lint como *quality gate* del código de pruebas.
2. Matriz `local` (bloqueante) y `rc` (informativo, `continue-on-error`).
3. Resumen en `GITHUB_STEP_SUMMARY` y reportes, trazas y JUnit publicados como artefactos.
4. Ejecución manual que permite elegir la suite `smoke` o `regression`.

## 8. Limitaciones conocidas
- La app es un frontend sin backend: no hay pruebas de API reales (en la estrategia indico qué iría por API) y la persistencia es por navegador (`localStorage`).
- Sin autenticación: QA01 cubre navegación y QA02 una regla de negocio, como indica el enunciado. El `.env.example` deja documentado dónde irían las credenciales.
- Solo Chromium, como pide el enunciado.
- La clasificación automática de fallos es heurística; la confirma un QA.
- DEF-05, 06, 08, 11 y 13 se verificaron manualmente y están en el backlog de automatización o de seguridad.

## 9. Balance de entrega
| Ítem | Estado |
|---|---|
| Runner Playwright + TS, selección de ambiente y suites | ✅ Completo |
| 6 escenarios obligatorios (14 tests) | ✅ 14/14 aprobados en `stable` · 0 bloqueados |
| Estabilidad | ✅ 70/70 con `--repeat-each=5`, 0 flaky |
| Detección de defectos reales | ✅ 8 fallidos en `rc` (todos clasificados `PRODUCTO`) · [reporte](docs/DEFECTOS.md) |
| Evidencias (HTML completo + fallo controlado con captura y traza) | ✅ |
| Estrategia QA (≤ 2 págs.) + caso práctico | ✅ [PDF](docs/ESTRATEGIA_QA.pdf) |
| CI, resumen JSON, lint | ✅ Mejoras opcionales |
| **Pendientes** | Automatizar DEF-08 y DEF-11 (siguiente iteración: el riesgo es medio y el tiempo se priorizó en los P1) · Pruebas de API (requieren backend) · Accesibilidad con axe-core |

**Defectos encontrados:** 13 en el build `rc` (3 críticos), detallados en [`docs/DEFECTOS.md`](docs/DEFECTOS.md). Ninguno en `stable`. Los hallazgos reales están separados del fallo controlado.

**Herramientas de IA:** declaradas en [`docs/USO_DE_IA.md`](docs/USO_DE_IA.md). Puedo explicar, ejecutar y modificar todo el código entregado.

## 10. Entrega
- Repositorio: https://github.com/carlospana/PruebaHelpp
- Rama: `main` · Commit de entrega: el último commit de `main` al momento del envío (ver el mensaje de entrega)
