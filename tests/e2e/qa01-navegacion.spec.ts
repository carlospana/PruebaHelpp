import { test, expect } from '../../src/fixtures/test';
import type { ModuleName } from '../../src/pages/BasePage';

/**
 * QA01 · Acceso y navegación inicial
 * La app no tiene autenticación (ver README §Alcance), por eso QA01 cubre
 * el acceso al sistema y la navegación a cada módulo funcional.
 */
test.describe('QA01 · Acceso y navegación inicial', () => {
  test('carga el dashboard y permite navegar a todos los módulos @smoke @regression', async ({ dashboard }) => {
    // Precondición: app desplegada en el ambiente seleccionado
    await dashboard.open();

    await expect(dashboard.moduleHeading('dashboard')).toBeVisible();
    await expect(dashboard.kpiActiveProducts).toHaveText(/^\d+$/);
    await expect(dashboard.latestMovements.getByRole('row')).not.toHaveCount(0);

    const modules: ModuleName[] = ['productos', 'categorias', 'movimientos', 'proveedores', 'ordenes', 'dashboard'];
    for (const m of modules) {
      await test.step(`navegar a ${m}`, async () => {
        await dashboard.navigateTo(m);
        await expect(dashboard.page.locator('#bcText')).not.toBeEmpty();
      });
    }
  });

  test('el KPI de stock crítico coincide con los productos activos en estado crítico @regression', async ({ dashboard, products }) => {
    test.info().annotations.push({ type: 'regla', description: 'Producto crítico: estado Activo y stock ≤ stock mínimo' });
    test.info().annotations.push({ type: 'issue', description: 'DEF-12 (build rc)' });

    await products.goto();
    const expected = await products.countActiveCritical();
    expect(expected, 'los datos semilla deben incluir productos críticos').toBeGreaterThan(0);

    await products.navigateTo('dashboard');
    await expect(dashboard.kpiCriticalStock).toHaveText(String(expected));
  });
});
