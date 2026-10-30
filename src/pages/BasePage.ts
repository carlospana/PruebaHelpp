import { type Locator, type Page, expect } from '@playwright/test';
import type { EnvProfile } from '../../config/env';

export type ModuleName = 'dashboard' | 'productos' | 'categorias' | 'movimientos' | 'proveedores' | 'ordenes';

const MODULE_TITLES: Record<ModuleName, string> = {
  dashboard: 'Dashboard General',
  productos: 'Productos',
  categorias: 'Categorías',
  movimientos: 'Movimientos de Inventario',
  proveedores: 'Proveedores',
  ordenes: 'Órdenes de Compra',
};

/** Funcionalidad común a todas las pantallas: navegación, diálogos y notificaciones. */
export class BasePage {
  readonly successDialog: Locator;
  readonly errorDialog: Locator;
  readonly toast: Locator;
  readonly buildTag: Locator;

  constructor(readonly page: Page, protected readonly env: EnvProfile) {
    this.successDialog = page.getByTestId('ov-ok');
    this.errorDialog = page.getByTestId('ov-err');
    this.toast = page.getByTestId('toast');
    this.buildTag = page.getByTestId('build-tag');
  }

  /** Abre la app respetando el build del ambiente y espera a que esté lista. */
  async open(module?: ModuleName): Promise<void> {
    const params = new URLSearchParams(this.env.appQuery);
    if (module) params.set('page', module);
    const qs = params.toString();
    await this.page.goto(qs ? `./?${qs}` : './');
    await expect(this.page.locator('body')).toHaveAttribute('data-ready', 'true');
    // Verificación de ambiente: si el build no es el esperado es un BLOQUEO DE AMBIENTE, no un defecto.
    await expect(this.buildTag, `[AMBIENTE] Se esperaba build "${this.env.expectedBuild}"`).toContainText(this.env.expectedBuild);
  }

  /** Recarga la página: valida que la información persiste y no depende del estado en memoria. */
  async reload(): Promise<void> {
    await this.page.reload();
    await expect(this.page.locator('body')).toHaveAttribute('data-ready', 'true');
  }

  async navigateTo(module: ModuleName): Promise<void> {
    await this.page.getByTestId(`nav-${module}`).click();
    await expect(this.moduleHeading(module)).toBeVisible();
  }

  /** Muestra 25 filas en la tabla visible para que la paginación no oculte registros. */
  async showAllRows(): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Filas:' }).filter({ visible: true }).selectOption('25');
  }

  moduleHeading(module: ModuleName): Locator {
    return this.page.getByRole('heading', { level: 1, name: MODULE_TITLES[module], exact: true });
  }

  async expectSuccess(message: string | RegExp): Promise<void> {
    await expect(this.successDialog).toBeVisible();
    await expect(this.successDialog).toContainText(message);
    await this.successDialog.getByRole('button', { name: 'ACEPTAR' }).click();
    await expect(this.successDialog).toBeHidden();
  }

  async expectBusinessError(message: string | RegExp): Promise<void> {
    await expect(this.errorDialog).toBeVisible();
    await expect(this.errorDialog).toContainText(message);
    await this.errorDialog.getByRole('button', { name: 'ACEPTAR' }).click();
    await expect(this.errorDialog).toBeHidden();
  }
}

export { MODULE_TITLES };
