// Genera un resumen JSON + tabla en consola a partir del reporte JSON de Playwright.
// Uso: node scripts/summary.mjs [reports/results-local.json]
// Clasifica cada fallo (triage preliminar, debe confirmarlo un QA):
//   PRODUCTO      -> una aserción de negocio no se cumplió (posible defecto)
//   AUTOMATIZACION -> error en el código de prueba (locator ambiguo, TypeError, timeout de acción)
//   AMBIENTE      -> la app/servidor no está disponible o el build no es el esperado
//   DEMO_CONTROLADO -> fallo intencional de la ejecución de demostración (no es defecto)
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const file = process.argv[2] ?? (process.env.TEST_ENV ? `reports/results-${process.env.TEST_ENV}.json` : null)
  ?? readdirSync('reports').filter(f => f.startsWith('results-') && f.endsWith('.json')).map(f => `reports/${f}`)[0];
if (!file || !existsSync(file)) { console.error(`No existe el reporte ${file}. Ejecute primero las pruebas.`); process.exit(2); }

const strip = s => (s ?? '').replace(/\u001b\[[0-9;]*m/g, '');
const report = JSON.parse(readFileSync(file, 'utf-8'));

function classify(msg) {
  if (/\[AMBIENTE\]|ERR_CONNECTION|net::ERR|ECONNREFUSED|webServer|Target page, context or browser has been closed/i.test(msg)) return 'AMBIENTE';
  if (/strict mode violation|TypeError|ReferenceError|is not a function|locator\.(click|fill|selectOption).*Timeout|waiting for .* to be (visible|enabled)/i.test(msg)) return 'AUTOMATIZACION';
  if (/expect\(|toHave|toBe|toEqual|toContain|toMatch/i.test(msg)) return 'PRODUCTO';
  return 'POR_CLASIFICAR';
}

const rows = [];
const walk = (suite, parents = []) => {
  for (const s of suite.suites ?? []) walk(s, [...parents, s.title]);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const last = t.results.at(-1) ?? {};
      const msg = strip(last.error?.message ?? last.errors?.[0]?.message ?? '');
      const outcome = t.status === 'flaky' ? 'flaky' : last.status === 'passed' ? 'passed' : last.status === 'skipped' ? 'skipped' : 'failed';
      rows.push({
        id: (spec.title.match(/QA0\d/) ?? parents.join(' ').match(/QA0\d/) ?? ['—'])[0],
        caso: spec.title.replace(/\s*@\S+/g, ''),
        tags: (spec.title.match(/@\S+/g) ?? []).join(' '),
        resultado: outcome,
        intentos: t.results.length,
        clasificacion: outcome === 'failed' ? ((t.annotations ?? []).some(a => a.type === 'demo') ? 'DEMO_CONTROLADO' : classify(msg)) : outcome === 'flaky' ? 'INTERMITENTE' : '',
        issue: (t.annotations ?? []).filter(a => a.type === 'issue').map(a => a.description).join(', '),
        error: outcome === 'failed' ? msg.split('\n').slice(0, 4).join(' | ') : '',
        duracionMs: t.results.reduce((a, r) => a + (r.duration ?? 0), 0),
      });
    }
  }
};
walk(report);

const count = k => rows.filter(r => r.resultado === k).length;
const summary = {
  ambiente: report.config?.metadata?.ambiente ?? process.env.TEST_ENV ?? 'local',
  build: report.config?.metadata?.build,
  generado: new Date().toISOString(),
  totales: { total: rows.length, passed: count('passed'), failed: count('failed'), flaky: count('flaky'), skipped: count('skipped') },
  fallosPorClasificacion: rows.filter(r => r.clasificacion && r.resultado === 'failed')
    .reduce((a, r) => ({ ...a, [r.clasificacion]: (a[r.clasificacion] ?? 0) + 1 }), {}),
  casos: rows,
};
const out = file.replace(/results-/, 'summary-');
writeFileSync(out, JSON.stringify(summary, null, 2));

// --md: tabla Markdown (para GITHUB_STEP_SUMMARY). Sin flag: tabla de consola.
if (process.argv.includes('--md')) {
  const icon = { passed: '✅', failed: '❌', flaky: '⚠️', skipped: '⏭️' };
  const t = summary.totales;
  const isRc = /rc/.test(String(summary.ambiente));
  const lines = [
    `## Resultado E2E · ambiente \`${summary.ambiente}\``,
    '',
    isRc
      ? '> **Build `rc` (release candidate con regresiones conocidas).** Aquí se ESPERA que la regresión falle: cada ❌ es un defecto real del producto detectado por la suite (ver `docs/DEFECTOS.md`). Este job no bloquea el pipeline.'
      : '> **Build `stable`.** Este job es el gate de liberación: cualquier ❌ bloquea.',
    '',
    `| Total | ✅ Aprobados | ❌ Fallidos | ⚠️ Flaky | ⏭️ Omitidos |`,
    `|---|---|---|---|---|`,
    `| ${t.total} | ${t.passed} | ${t.failed} | ${t.flaky} | ${t.skipped} |`,
    '',
    `| ID | Caso | Resultado | Clasificación | Defecto |`,
    `|---|---|---|---|---|`,
    ...rows.map(r => `| ${r.id} | ${r.caso.replace(/\|/g, '\\|')} | ${icon[r.resultado] ?? ''} ${r.resultado} | ${r.clasificacion || '—'} | ${r.resultado === 'failed' ? (r.issue || '—') : '—'} |`),
    '',
    'Clasificación: `PRODUCTO` = defecto del producto · `AUTOMATIZACION` = error del código de prueba · `AMBIENTE` = bloqueo de ambiente · `INTERMITENTE` = pasó tras reintento.',
  ];
  console.log(lines.join('\n'));
} else {
  console.table(rows.map(({ id, caso, resultado, clasificacion, issue }) => ({ id, caso: caso.slice(0, 70), resultado, clasificacion, issue })));
  console.log(`\nAmbiente: ${summary.ambiente} · Totales: ${JSON.stringify(summary.totales)} · Fallos: ${JSON.stringify(summary.fallosPorClasificacion)}`);
  console.log(`Resumen guardado en ${out}`);
}
