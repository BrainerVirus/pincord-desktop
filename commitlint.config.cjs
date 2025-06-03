module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		// Keep your custom type-enum rule
		'type-enum': [2, 'always', ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']],
		// Add this rule to override the default max line length for the body
		'body-max-line-length': [2, 'always', 500],
		// Add this rule to override the default max line length for the header
		'header-max-length': [2, 'always', 300],
	},
};
