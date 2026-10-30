# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/controlled-failure.spec.ts >> DEMO · fallo controlado: se espera un total de productos activos incorrecto @demo-failure
- Location: tests/demo/controlled-failure.spec.ts:9:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('kpi-prods')
Expected: "999"
Received: "11"
Timeout:  2000ms

Call log:
  - Expect "toHaveText" getByTestId('kpi-prods') with timeout 2000ms
  - waiting for getByTestId('kpi-prods')
    21 × locator resolved to <div id="kpi-prods" class="kpi-val" data-testid="kpi-prods">11</div>
       - unexpected value "11"

```

```yaml
- text: "11"
```

# Test source

```ts
  1  | import { test, expect } from '../../src/fixtures/test';
  2  | 
  3  | /**
  4  |  * DEMOSTRACIÓN DE FALLO CONTROLADO (no es un defecto del producto).
  5  |  * Solo se carga con DEMO_FAILURE=1 (ver playwright.config.ts → testIgnore).
  6  |  * Objetivo: evidenciar que un fallo real produce captura, video, traza,
  7  |  * reporte HTML y código de salida distinto de cero.
  8  |  */
  9  | test('DEMO · fallo controlado: se espera un total de productos activos incorrecto @demo-failure', async ({ dashboard }) => {
  10 |   test.info().annotations.push({ type: 'demo', description: 'Fallo intencional para evidencias. No representa un defecto.' });
  11 |   await dashboard.open();
  12 |   // Valor esperado deliberadamente incorrecto (el real son 10 productos activos).
> 13 |   await expect(dashboard.kpiActiveProducts).toHaveText('999', { timeout: 2_000 });
     |                                             ^ Error: expect(locator).toHaveText(expected) failed
  14 | });
  15 | 
```