//  @ts-check

/** @type {import('prettier').Config} */
const config = {
	printWidth: 150, // Allow wider lines
	useTabs: true, // Use tabs instead of spaces
	tabWidth: 2, // Set tab width to 2 spaces when rendered
	semi: true, // Use semicolons at the end of statements
	singleQuote: true, // Use single quotes for strings
	trailingComma: 'all', // Add trailing commas where valid
	bracketSpacing: true, // Add spaces inside curly braces
	arrowParens: 'always', // Always include parentheses around arrow function parameters
	endOfLine: 'lf', // Ensure consistent Unix-style line endings
	plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
	overrides: [
		{
			files: ['*.json', '*.md', '*.toml', '*.yml'],
			options: {
				useTabs: false, // Use spaces instead of tabs for these file types
			},
		},
	],
};

export default config;
