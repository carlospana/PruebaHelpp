import { type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import type { ProductInput } from '../data/factories';

export interface ProductRow {
  codigo: string; nombre: string; categoria: string; stock: number;
  stockMinimo: number; precio: string; estado: string; critico: boolean;
}

export class ProductsPage extends BasePage {
  get table(): Locator { return this.page.getByTestId('table-tProds'); }
  get rows(): Locator { return this.page.getByTestId('prod-row'); }
  get searchBox(): Locator { return this.page.getByRole('searchbox', { name: 'Buscar producto' }); }
  get categoryFilter(): Locator { return this.page.getByRole('combobox', { name: 'Filtrar por categoría' }); }
  get form(): Locator { return this.page.getByTestId('ov-prod'); }
  get formTitle(): Locator { return this.form.locator('#mh-prod-title'); }

  async goto(): Promise<void> {
    await this.open('productos');
    await expect(this.moduleHeading('productos')).toBeVisible();
    await this.showAllRows();
  }

  row(code: string): Locator {
    return this.page.locator(`[data-testid="prod-row"][data-code="${code}"]`);
  }

  async readRow(code: string): Promise<ProductRow> {
    const cells = this.row(code).getByRole('cell');
    await expect(cells).toHaveCount(9);
    const t = async (i: number) => (await cells.nth(i).innerText()).trim();
    const stockCell = await t(4);
    return {
      codigo: await t(1), nombre: await t(2), categoria: await t(3),
      stock: Number(stockCell.split(/\s/)[0]), stockMinimo: Number(await t(5)),
      precio: await t(6), estado: await t(7), critico: stockCell.includes('Stock Crítico'),
    };
  }

  async search(text: string): Promise<void> {
    await this.searchBox.fill(text);
  }

  async filterByCategory(name: string): Promise<void> {
    await this.categoryFilter.selectOption({ label: name });
  }

  async openCreateForm(): Promise<void> {
    await this.page.getByRole('button', { name: /Agregar/ }).click();
    await expect(this.form).toBeVisible();
  }

  async fillForm(p: Partial<ProductInput>): Promise<void> {
    if (p.codigo !== undefined) await this.form.getByLabel('Código').fill(p.codigo);
    if (p.nombre !== undefined) await this.form.getByLabel('Nombre').fill(p.nombre);
    if (p.categoria !== undefined) await this.form.getByLabel('Categoría').selectOption({ label: p.categoria });
    if (p.precio !== undefined) await this.form.getByLabel('Precio Unitario').fill(String(p.precio));
    if (p.stock !== undefined) await this.form.getByLabel('Stock Actual').fill(String(p.stock));
    if (p.stockMinimo !== undefined) await this.form.getByLabel('Stock Mínimo').fill(String(p.stockMinimo));
    if (p.estado !== undefined) await this.form.getByLabel('Estado').selectOption(p.estado);
    if (p.descripcion !== undefined) await this.form.getByLabel('Descripción').fill(p.descripcion);
  }

  async submitForm(): Promise<void> {
    await this.form.getByRole('button', { name: 'ACEPTAR' }).click();
  }

  async create(p: ProductInput): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(p);
    await this.submitForm();
    await this.expectSuccess('La información ha sido almacenada exitosamente.');
  }

  async openEdit(code: string): Promise<void> {
    await this.row(code).getByRole('button', { name: `Editar ${code}` }).click();
    await expect(this.form).toBeVisible();
  }

  async requestDelete(code: string): Promise<void> {
    await this.row(code).getByRole('button', { name: `Eliminar ${code}` }).click();
    const confirm = this.page.getByTestId('ov-del');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'ACEPTAR' }).click();
  }

  fieldError(field: 'Código' | 'Nombre' | 'Categoría' | 'Precio' | 'Stock'): Locator {
    const ids = { 'Código': 'fe-p-cod', 'Nombre': 'fe-p-nom', 'Categoría': 'fe-p-cat', 'Precio': 'fe-p-precio', 'Stock': 'fe-p-stock' } as const;
    return this.form.locator(`#${ids[field]}`);
  }

  /** Cuenta, desde la tabla, los productos activos con stock ≤ stock mínimo (regla de negocio). */
  async countActiveCritical(): Promise<number> {
    const rows = await Promise.all((await this.visibleCodes()).map(c => this.readRow(c)));
    return rows.filter(r => r.estado === 'Activo' && r.stock <= r.stockMinimo).length;
  }

  /** Códigos visibles en la tabla (útil para aserciones de búsqueda y filtros). */
  async visibleCodes(): Promise<string[]> {
    return this.rows.evaluateAll(rs => rs.map(r => (r as HTMLElement).dataset.code ?? ''));
  }
}
