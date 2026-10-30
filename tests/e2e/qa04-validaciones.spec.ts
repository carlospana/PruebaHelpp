import { test, expect } from '../../src/fixtures/test';

/** QA04 · Validación de entradas */
test.describe('QA04 · Validación de entradas', () => {
  test('no guarda un producto con campos obligatorios vacíos y señala cada campo @regression', async ({ products }) => {
    await products.goto();
    const before = await products.rows.count();

    await products.openCreateForm();
    await products.submitForm();

    for (const f of ['Código', 'Nombre', 'Categoría', 'Precio', 'Stock'] as const) {
      await expect(products.fieldError(f), `error visible para ${f}`).toBeVisible();
    }
    await expect(products.form).toBeVisible();
    await expect(products.successDialog).toBeHidden();

    await products.form.getByRole('button', { name: 'CANCELAR' }).click();
    await products.reload();
    await products.navigateTo('productos');
    await products.showAllRows();
    await expect(products.rows).toHaveCount(before);
  });

  test('rechaza un código de producto duplicado @regression', async ({ products, data, catalog }) => {
    const p = data.product({ codigo: catalog.products.mouse.codigo });

    await products.goto();
    await products.openCreateForm();
    await products.fillForm(p);
    await products.submitForm();

    await expect(products.fieldError('Código')).toHaveText('Ya existe un producto con este código');
    await products.form.getByRole('button', { name: 'CANCELAR' }).click();
    await expect(products.rows.filter({ hasText: p.nombre })).toHaveCount(0);
  });

  test('rechaza un proveedor con correo electrónico inválido @regression', async ({ providers, data }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-10 (build rc)' });
    const prov = data.provider({ email: 'correo-invalido' });

    await providers.goto();
    await providers.openCreateForm();
    await providers.fillForm(prov);
    await providers.submitForm();

    await expect(providers.emailError).toBeVisible();
    await expect(providers.form).toBeVisible();
    await expect(providers.successDialog).toBeHidden();
    await providers.form.getByRole('button', { name: 'CANCELAR' }).click();
    await expect(providers.rows.filter({ hasText: prov.nombre })).toHaveCount(0);
  });
});
