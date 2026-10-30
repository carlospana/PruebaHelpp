import { type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  get kpiActiveProducts(): Locator { return this.page.getByTestId('kpi-prods'); }
  get kpiCriticalStock(): Locator { return this.page.getByTestId('kpi-criticos'); }
  get kpiMovements(): Locator { return this.page.getByTestId('kpi-movs'); }
  get kpiActiveProviders(): Locator { return this.page.getByTestId('kpi-provs'); }
  get latestMovements(): Locator { return this.page.getByRole('table', { name: 'Últimos movimientos' }); }

  async readKpi(kpi: Locator): Promise<number> {
    return Number((await kpi.innerText()).trim());
  }
}
