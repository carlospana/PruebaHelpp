import { test, expect } from '../../src/fixtures/test';

/** QA03 · Flujo principal exitoso: alta de producto con persistencia */
test.describe('QA03 · Flujo principal exitoso', () => {
  test('crea un producto y persiste al volver a consultarlo @smoke @regression', async ({ products, data }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-01 (build rc)' });
    const p = data.product({ categoria: 'Tecnología', precio: 25990, stock: 40, stockMinimo: 5 });

    await products.goto();
    await products.openCreateForm();
    // Soft: un defecto cosmético no debe ocultar la verificación de persistencia (lo crítico del caso).
    await expect.soft(products.formTitle, 'título del formulario de alta').toHaveText('Agregar Producto');
    await products.fillForm(p);
    await products.submitForm();
    await products.expectSuccess('La información ha sido almacenada exitosamente.');

    // No basta con el mensaje: se verifica el registro después de recargar.
    await products.reload();
    await products.navigateTo('productos');
    await products.showAllRows();
    expect(await products.readRow(p.codigo)).toEqual({
      codigo: p.codigo, nombre: p.nombre, categoria: 'Tecnología', stock: 40, stockMinimo: 5,
      precio: '$25.990', estado: 'Activo', critico: false,
    });
  });

  test('un producto creado con stock ≤ mínimo queda marcado como crítico y se advierte @regression', async ({ products, data }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-02 (build rc)' });
    const p = data.product({ stock: 2, stockMinimo: 10 });

    await products.goto();
    await products.openCreateForm();
    await products.fillForm(p);
    await products.submitForm();
    await products.expectSuccess('La información ha sido almacenada exitosamente.');
    await expect(products.toast).toContainText('Stock Crítico');

    await products.reload();
    await products.navigateTo('productos');
    await products.showAllRows();
    expect((await products.readRow(p.codigo)).critico).toBe(true);
  });
});
