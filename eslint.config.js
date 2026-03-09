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
			// --- Severity overrides (warn vs error) ---
			// no-explicit-any: 848 occurrences - too noisy as error; address incrementally
			'@typescript-eslint/no-explicit-any': 'warn',
			// no-require-imports: 39 occurrences - legacy require() calls, address incrementally
			'@typescript-eslint/no-require-imports': 'warn',
			// require-atomic-updates: 52 occurrences - real but non-blocking async patterns
			'require-atomic-updates': 'warn',
			// --- Unused vars ---
			'@typescript-eslint/no-unused-vars': ['warn', {
				varsIgnorePattern: '^_',
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
				destructuredArrayIgnorePattern: '^_',
			}],
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
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
		},
		rules: {
			'no-unused-vars': 'warn',
			'no-console': 'off',
			'no-alert': 'error',
		},
	},
	{
		ignores: [
			'dist/',
			'node_modules/',
			'*.config.js',
			'src/locked/**',
			'src/v8/lockdown/**',
			'src/v8u/lockdown/**',
			'src/tests/**',
			'src/**/*.test.ts',
			'src/**/*.test.tsx',
			'src/**/*.spec.ts',
			'src/**/*.spec.tsx',
			'src/contexts/__tests__/**',
		],
	},
];
