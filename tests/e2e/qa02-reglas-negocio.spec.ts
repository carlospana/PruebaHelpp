import { test, expect } from '../../src/fixtures/test';

/** QA02 · Rechazo por regla de negocio */
test.describe('QA02 · Rechazo por regla de negocio', () => {
  test('rechaza una salida mayor al stock disponible e informa el motivo @smoke @regression', async ({ products, movements, data, catalog }) => {
    test.info().annotations.push({ type: 'regla', description: 'Una Salida no puede dejar el stock en negativo' });
    test.info().annotations.push({ type: 'issue', description: 'DEF-07 (build rc)' });
    const { codigo, nombre, stock } = catalog.products.lowStock;
    const note = data.movementNote();

    await movements.goto();
    const before = await movements.rows.count();

    await movements.openForm();
    await movements.fill({ tipo: 'Salida', productoLabel: `${codigo} — ${nombre}`, cantidad: stock + 1, responsable: 'QA Automation', observacion: note });
    await expect(movements.availableStock).toHaveValue(`${stock} unidades disponibles`);
    await movements.submit();

    await expect(movements.formAlert).toBeVisible();
    await expect(movements.formAlert).toHaveText(`Stock insuficiente. Disponible: ${stock} unidades.`);
    await expect(movements.form, 'el formulario permanece abierto para corregir').toBeVisible();

    // Persistencia: tras recargar no existe el movimiento y el stock no cambió.
    await movements.reload();
    await expect(movements.rows).toHaveCount(before);
    await expect(movements.rows.filter({ hasText: note })).toHaveCount(0);
    await products.goto();
    expect((await products.readRow(codigo)).stock).toBe(stock);
  });

  test('impide eliminar un producto con movimientos registrados @regression', async ({ products, catalog }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-03 (build rc)' });
    const { codigo } = catalog.products.withMovements;

    await products.goto();
    await products.requestDelete(codigo);
    await products.expectBusinessError('No se puede eliminar un producto con movimientos registrados.');

    await products.reload();
    await products.navigateTo('productos');
    await products.showAllRows();
    await expect(products.row(codigo)).toHaveCount(1);
  });
});
