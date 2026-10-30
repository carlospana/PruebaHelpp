import { test, expect } from '../../src/fixtures/test';

/** QA06 · Consulta, búsqueda y filtros */
test.describe('QA06 · Consulta y búsqueda', () => {
  test('busca productos por código y por nombre parcial @regression', async ({ products, catalog }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-04 (build rc)' });
    const { codigo, nombre } = catalog.products.toner;
    await products.goto();

    await test.step('por código', async () => {
      await products.search(codigo);
      await expect(products.rows).toHaveCount(1);
      expect(await products.readRow(codigo)).toMatchObject({ codigo, nombre });
    });

    await test.step('por nombre parcial, sin distinguir mayúsculas', async () => {
      await products.search('TÓNER');
      await expect(products.rows).toHaveCount(1);
      await expect(products.row(codigo)).toBeVisible();
    });

    await test.step('sin coincidencias', async () => {
      await products.search('zz-no-existe');
      await expect(products.table).toContainText('No se encontraron registros.');
    });
  });

  test('filtra productos por categoría @regression', async ({ products, catalog }) => {
    const cat = catalog.categories.tecnologia;
    await products.goto();
    await products.filterByCategory(cat.nombre);

    expect((await products.visibleCodes()).sort()).toEqual([...cat.productCodes].sort());
    for (const code of cat.productCodes) {
      expect((await products.readRow(code)).categoria).toBe(cat.nombre);
    }
  });

  test('filtra proveedores por estado @regression', async ({ providers, catalog }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-09 (build rc)' });
    await providers.goto();
    await expect(providers.rows).toHaveCount(catalog.providers.total);

    await providers.stateFilter.selectOption('Inactivo');
    await expect(providers.rows).toHaveCount(catalog.providers.inactiveCount);
    expect(new Set(await providers.visibleStates())).toEqual(new Set(['Inactivo']));

    await providers.stateFilter.selectOption('Activo');
    await expect(providers.rows).toHaveCount(catalog.providers.total - catalog.providers.inactiveCount);
  });
});
