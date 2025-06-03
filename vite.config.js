import MillionLint from '@million/lint';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

// https://vitejs.dev/config/
// Check if we're in test mode
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

export default defineConfig({
	plugins: [
		// Only enable Million Lint when not testing
		!isTest &&
			MillionLint.vite({
				enabled: true,
				filter: {
					include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
					exclude: ['src/electron/**'],
				},
			}),
		!isTest && TanStackRouterVite({ autoCodeSplitting: true }),
		viteReact(),
		tailwindcss(),
	],
	base: './',
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: './setupTests.ts',
		reporters: process.env.GITHUB_ACTIONS
			? ['dot', 'github-actions', ['html', { outputFile: './report/index.html' }]]
			: ['verbose', ['html', { outputFile: './report/index.html' }]],
		pool: 'forks',
		poolOptions: { threads: { singleThread: true } },
		singleThread: true,
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{js,ts,jsx,tsx}'],
			exclude: [
				'src/**/*.test.{js,ts,jsx,tsx}',
				'src/electron/**',
				'src/**/*.stories.{js,ts,jsx,tsx}',
				'src/**/*.d.ts',
				'src/reportWebVitals.ts',
				'src/routeTree.gen.ts',
				'src/routes/__root.tsx',
				'src/main.tsx',
			],
			reporter: ['text', 'json', 'html'],
			all: true,
			check: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	build: {
		outDir: 'dist-react',
	},
	server: {
		port: 5123,
		strictPort: true,
	},
	optimizeDeps: {
		exclude: ['@tanstack/react-router-devtools'],
	},
});
