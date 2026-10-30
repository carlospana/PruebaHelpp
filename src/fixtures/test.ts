import { test as base, expect } from '@playwright/test';
import { env, type EnvProfile } from '../../config/env';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductsPage } from '../pages/ProductsPage';
import { MovementsPage } from '../pages/MovementsPage';
import { ProvidersPage } from '../pages/ProvidersPage';
import { DataFactory } from '../data/factories';
import catalog from '../../test-data/catalog.json';

interface Fixtures {
  env: EnvProfile;
  data: DataFactory;
  catalog: typeof catalog;
  dashboard: DashboardPage;
  products: ProductsPage;
  movements: MovementsPage;
  providers: ProvidersPage;
  guardPageErrors: void;
}

export const test = base.extend<Fixtures>({
  env: async ({}, use) => { await use(env); },
  catalog: async ({}, use) => { await use(catalog); },

  // Fábrica de datos aislada por prueba (identificadores únicos por run/worker).
  data: async ({}, use, testInfo) => { await use(new DataFactory(testInfo.workerIndex, testInfo.title)); },

  dashboard: async ({ page, env }, use) => { await use(new DashboardPage(page, env)); },
  products: async ({ page, env }, use) => { await use(new ProductsPage(page, env)); },
  movements: async ({ page, env }, use) => { await use(new MovementsPage(page, env)); },
  providers: async ({ page, env }, use) => { await use(new ProvidersPage(page, env)); },

  /**
   * Fixture automático:
   * 1. Cada prueba corre en un BrowserContext nuevo => localStorage vacío =>
   *    la app arranca con los datos semilla. No hay dependencia entre casos.
   * 2. Errores JS no controlados de la app se adjuntan y hacen fallar la prueba
   *    (un error de consola es un defecto, aunque la UI "parezca" funcionar).
   */
  guardPageErrors: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await use();
    if (errors.length) {
      await testInfo.attach('page-errors', { body: errors.join('\n'), contentType: 'text/plain' });
      expect(errors, 'La aplicación lanzó errores JavaScript no controlados').toEqual([]);
    }
  }, { auto: true }],
});

export { expect };
