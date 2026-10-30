import { test, expect } from '../../src/fixtures/test';

/** QA05 · Modificación de información */
test.describe('QA05 · Modificación de información', () => {
  test('una entrada de inventario incrementa el stock y queda trazada @regression', async ({ products, movements, data }) => {
    // Precondición propia: producto creado por la prueba (no depende de otros casos)
    const p = data.product({ stock: 10, stockMinimo: 2 });
    const note = data.movementNote();
    await products.goto();
    await products.create(p);

    await products.navigateTo('movimientos');
    await movements.showAllRows();
    await movements.register({ tipo: 'Entrada', productoLabel: `${p.codigo} — ${p.nombre}`, cantidad: 15, responsable: 'QA Automation', observacion: note });

    await movements.reload();
    await movements.navigateTo('movimientos');
    await movements.showAllRows();
    const mov = await movements.readRowByObservation(note);
    expect(mov).toMatchObject({ tipo: 'Entrada', producto: p.nombre, cantidad: 15, antes: 10, despues: 25 });

    await movements.navigateTo('productos');
    await products.showAllRows();
    expect((await products.readRow(p.codigo)).stock).toBe(25);
  });

  test('editar un producto actualiza sus datos y el código no es editable @regression', async ({ products, data }) => {
    const p = data.product({ precio: 10000, estado: 'Activo' });
    await products.goto();
    await products.create(p);

    await products.openEdit(p.codigo);
    await expect(products.formTitle).toHaveText('Editar Producto');
    await expect(products.form.getByLabel('Código')).not.toBeEditable();
    await products.fillForm({ nombre: `${p.nombre} editado`, precio: 12500, estado: 'Inactivo' });
    await products.submitForm();
    await products.expectSuccess('La información ha sido actualizada exitosamente.');

    await products.reload();
    await products.navigateTo('productos');
    await products.showAllRows();
    expect(await products.readRow(p.codigo)).toMatchObject({ nombre: `${p.nombre} editado`, precio: '$12.500', estado: 'Inactivo' });
  });
});
