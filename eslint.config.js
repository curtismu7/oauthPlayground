import tsplugin from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
				// Note: project-based rules disabled to avoid memory issues
				// Enable when needed for specific checks
				// project: './tsconfig.json',
			},
		},
		plugins: {
			'@typescript-eslint': tsplugin,
			'react-hooks': reactHooksPlugin,
		},
		rules: {
			...tsplugin.configs.recommended.rules,
			// --- Legacy-debt rules disabled (pervasive, opinionated, and the CI gate
			// runs with --max-warnings 0). These mirror the Biome config's disabled
			// rules; re-enable and address incrementally in a dedicated cleanup. ---
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'require-atomic-updates': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'no-console': 'off',
			'no-alert': 'error',
			// Async/Promise rules to prevent syntax errors
			// Note: Type-aware rules require project config and cause memory issues
			// They are disabled for now but can be enabled for targeted checks
			// '@typescript-eslint/no-floating-promises': 'error',
			// '@typescript-eslint/require-await': 'warn',
			// '@typescript-eslint/no-misused-promises': 'error',
			// '@typescript-eslint/promise-function-async': 'warn',
			'no-async-promise-executor': 'error',
			'react-hooks/exhaustive-deps': 'off',
		},
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
		},
		rules: {
			'no-unused-vars': 'off',
			'no-console': 'off',
			'no-alert': 'error',
		},
	},
	{
		ignores: [
			'dist/',
			'node_modules/',
			'public/**',
			'*.config.js',
			'src/tests/**',
			'src/**/*.test.ts',
			'src/**/*.test.tsx',
			'src/**/*.spec.ts',
			'src/**/*.spec.tsx',
			'src/contexts/__tests__/**',
			// Node/shell maintenance scripts — not ES modules, and not app code.
			'scripts/**',
			// Backend/manual/e2e test scripts (CommonJS, shebangs) — not app code and
			// not parseable as ES modules. Unit tests under tests/unit still lint.
			'tests/backend/**',
			'tests/manual/**',
			'tests/puppeteer/**',
			'tests/e2e/**',
			// Embedded sub-projects & generated/worktree copies — each has its own
			// tooling and must not be linted by the root app config.
			'.claire/**',
			'.claude/**',
			'AIAssistant/**',
			'AI Ping/**',
			'fetch-mcp-server/**',
			'jwt-verifier-mcp-server/**',
			'memory-mcp-server/**',
			'pingone-mcp-server/**',
			'oauth-simulator-mcp-server/**',
			'security-compliance-mcp-server/**',
			'se-ai-demo-banking-digital-assistant-main/**',
			'lib/**',
		],
	},
];
