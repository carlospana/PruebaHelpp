import { type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import type { MovementInput } from '../data/factories';

export interface MovementRow { id: number; fecha: string; tipo: string; producto: string; cantidad: number; antes: number; despues: number; responsable: string; observacion: string }

export class MovementsPage extends BasePage {
  get rows(): Locator { return this.page.getByTestId('mov-row'); }
  get form(): Locator { return this.page.getByTestId('ov-mov'); }
  get formAlert(): Locator { return this.page.getByTestId('mov-alert'); }
  get availableStock(): Locator { return this.form.getByLabel('Stock disponible'); }

  async goto(): Promise<void> {
    await this.open('movimientos');
    await this.showAllRows();
  }

  async openForm(): Promise<void> {
    await this.page.getByRole('button', { name: /Registrar Movimiento/ }).click();
    await expect(this.form).toBeVisible();
  }

  async fill(m: MovementInput): Promise<void> {
    await this.form.getByLabel('Tipo').selectOption(m.tipo);
    if (m.fecha) await this.form.getByLabel('Fecha').fill(m.fecha);
    await this.form.getByLabel('Producto').selectOption({ label: m.productoLabel });
    await this.form.getByLabel('Cantidad').fill(String(m.cantidad));
    await this.form.getByLabel('Responsable').fill(m.responsable);
    if (m.observacion) await this.form.getByLabel('Observación').fill(m.observacion);
  }

  async submit(): Promise<void> {
    await this.form.getByRole('button', { name: 'REGISTRAR' }).click();
  }

  async register(m: MovementInput): Promise<void> {
    await this.openForm();
    await this.fill(m);
    await this.submit();
    await this.expectSuccess('El movimiento ha sido registrado exitosamente.');
  }

  /** Busca el movimiento por su observación única (identificador del registro de la prueba). */
  async readRowByObservation(obs: string): Promise<MovementRow> {
    const row = this.rows.filter({ hasText: obs });
    await expect(row).toHaveCount(1);
    const c = (await row.getByRole('cell').allInnerTexts()).map(x => x.trim());
    return { id: Number(c[0]), fecha: c[1] ?? '', tipo: c[2] ?? '', producto: c[3] ?? '', cantidad: Number(c[4]), antes: Number(c[5]), despues: Number(c[6]), responsable: c[7] ?? '', observacion: c[8] ?? '' };
  }
}
