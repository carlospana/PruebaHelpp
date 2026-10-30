import { test, expect } from '../../src/fixtures/test';

/**
 * DEMOSTRACIÓN DE FALLO CONTROLADO (no es un defecto del producto).
 * Solo se carga con DEMO_FAILURE=1 (ver playwright.config.ts → testIgnore).
 * Objetivo: evidenciar que un fallo real produce captura, video, traza,
 * reporte HTML y código de salida distinto de cero.
 */
test('DEMO · fallo controlado: se espera un total de productos activos incorrecto @demo-failure', async ({ dashboard }) => {
  test.info().annotations.push({ type: 'demo', description: 'Fallo intencional para evidencias. No representa un defecto.' });
  await dashboard.open();
  // Valor esperado deliberadamente incorrecto (el real son 10 productos activos).
  await expect(dashboard.kpiActiveProducts).toHaveText('999', { timeout: 2_000 });
});
