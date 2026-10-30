import { type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import type { ProviderInput } from '../data/factories';

export class ProvidersPage extends BasePage {
  get rows(): Locator { return this.page.getByTestId('prov-row'); }
  get form(): Locator { return this.page.getByTestId('ov-prov'); }
  get stateFilter(): Locator { return this.page.getByRole('combobox', { name: 'Filtrar por estado' }); }
  get emailError(): Locator { return this.form.locator('#fe-pr-email'); }

  async goto(): Promise<void> { await this.open('proveedores'); }

  async openCreateForm(): Promise<void> {
    await this.page.getByRole('button', { name: /Agregar/ }).click();
    await expect(this.form).toBeVisible();
  }

  async fillForm(p: ProviderInput): Promise<void> {
    await this.form.getByLabel('NIT').fill(p.nit);
    await this.form.getByLabel('Nombre').fill(p.nombre);
    await this.form.getByLabel('Contacto').fill(p.contacto);
    await this.form.getByLabel('Email').fill(p.email);
    await this.form.getByLabel('Teléfono').fill(p.telefono);
  }

  async submitForm(): Promise<void> {
    await this.form.getByRole('button', { name: 'ACEPTAR' }).click();
  }

  /** Estados de las filas visibles (columna "Estado"). */
  async visibleStates(): Promise<string[]> {
    return this.rows.evaluateAll(rs => rs.map(r => (r.querySelector('td:nth-child(7)')?.textContent ?? '').trim()));
  }
}
