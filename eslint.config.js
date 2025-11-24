import tsplugin from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

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
		},
		rules: {
			...tsplugin.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': 'warn',
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
			'require-atomic-updates': 'error',
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
		ignores: ['dist/', 'node_modules/', '*.config.js'],
	},
];
