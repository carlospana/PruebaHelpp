import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/**', 'reports/**', 'test-results*/**', 'docs/**', 'app/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',      // prohíbe esperas fijas
      'playwright/no-force-option': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expect*', '**.expect*'] }],
      'no-empty-pattern': 'off',
    },
  },
);
