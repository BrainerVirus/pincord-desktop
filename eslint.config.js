// eslint.config.js
// @ts-check

import js from '@eslint/js';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import * as pluginImportX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
	// 1. Global ignores - This should be the very first configuration object.
	{
		ignores: [
			'**/node_modules/**',
			'dist/**',
			'dist-electron/**',
			'dist-react/**',
			'eslint.config.js', // Prevent ESLint from linting itself with TS project settings
			'prettier.config.js',
			'vite.config.js', // Usually plain JS, adjust if it's TS and in a tsconfig
			'.DS_Store',
			'coverage/**',
			'*.log',
		],
	},

	// 2. Base JavaScript recommended rules
	js.configs.recommended,

	// 3. TanStack config
	// Assuming tanstackConfig is an array of config objects. If it's a single object, don't spread.
	// ...(Array.isArray(tanstackConfig) ? tanstackConfig : [tanstackConfig]),

	// 4. Import-X configurations (applied broadly, resolver configured for TS)
	{
		// Applies to all files by default unless overridden by more specific configs
		plugins: {
			'import-x': pluginImportX,
		},
		settings: {
			'import-x/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: ['./tsconfig.json', './src/electron/tsconfig.json'],
				},
				node: true,
			},
			// Ensure import-x uses @typescript-eslint/parser for .ts/.tsx files
			'import-x/parsers': {
				'@typescript-eslint/parser': ['.ts', '.tsx'],
			},
		},
		rules: {
			// Base import-x rules from recommended, can be overridden later
			...pluginImportX.configs.recommended.rules,
			// Add/override specific import-x rules if needed globally
			'import-x/no-unresolved': ['error', { commonjs: true, amd: true }],
		},
	},
	// Import-X specific configurations for TypeScript (if any beyond resolver)
	// pluginImportX.flatConfigs.typescript, // This might be too broad or conflict, manual setup above is safer

	// 5. Configuration for TypeScript files (React, Electron main/preload)
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: ['./tsconfig.json', './src/electron/tsconfig.json'],
				// tsconfigRootDir: import.meta.dirname, // Usually not needed if paths are relative to eslint.config.js
			},
			globals: {
				...globals.browser, // Default for .tsx files
			},
		},
		plugins: {
			'@typescript-eslint': tsEslintPlugin,
			'jsx-a11y': jsxA11y,
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			'import-x': pluginImportX, // Ensure it's available here
		},
		settings: {
			react: {
				version: 'detect', // Addresses the React version warning
			},
		},
		rules: {
			...tsEslintPlugin.configs.recommended.rules,
			// Consider adding type-aware rules:
			// ...tsEslintPlugin.configs['recommended-requiring-type-checking'].rules,
			'no-unused-vars': 'off', // Disable base ESLint rule
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

			'react/react-in-jsx-scope': 'off', // For new JSX transform
			'react/jsx-uses-react': 'off', // For new JSX transform
			'react/prop-types': 'off', // If using TypeScript for prop types

			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			'import-x/no-dynamic-require': 'warn',
			// Override import-x rules for TS if needed
			'import-x/default': 'error', // From your log, this was an issue
			'import-x/no-named-as-default-member': 'warn', // From your log
		},
	},

	// 6. Configuration for Electron main process files (specific globals and rules)
	{
		files: ['src/electron/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.node, // Defines `process`, `__dirname`, etc.
			},
		},
		rules: {
			'import-x/no-nodejs-modules': 'off', // Allow Node.js built-in modules
		},
	},

	// 7. Configuration for JavaScript files (e.g., config files if not ignored)
	// This configuration should NOT have `parserOptions.project`.
	{
		files: ['**/*.{js,mjs,cjs,jsx,mjsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module', // Default, adjust if you have CommonJS files
			globals: {
				...globals.node, // For config files like vite.config.js
				// ...globals.browser, // If you have client-side plain JS files
			},
		},
		plugins: {
			'import-x': pluginImportX,
		},
		rules: {
			'no-unused-vars': 'warn',
			'import-x/no-dynamic-require': 'warn',
			// 'import-x/no-nodejs-modules': 'warn', // Keep for general JS files if they shouldn't use Node modules
		},
	},

	// 8. JSX-A11y recommended rules (applied specifically to JSX/TSX files)
	{
		files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
		plugins: {
			'jsx-a11y': jsxA11y,
		},
		rules: {
			...jsxA11y.configs.recommended.rules,
		},
	},

	// 9. React plugin recommended rules (applied specifically to JSX/TSX files)
	{
		files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...reactPlugin.configs.flat.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules, // Ensure react-hooks rules are included
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-react': 'off',
			'react/prop-types': 'off',
		},
	},

	// 10. Prettier - This MUST be the last configuration in the array.
	eslintPluginPrettierRecommended,
];
