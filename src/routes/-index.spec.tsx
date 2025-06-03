import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './index';

test('renders app', () => {
	render(<App />);

	// Use a custom function to handle text split across elements
	const editTextElement = screen.getByText((content) => {
		return content.includes('Edit') && content.includes('and save to reload');
	});
	expect(editTextElement).toBeDefined();

	// These selectors should work as-is
	expect(screen.getByAltText(/logo/i)).toBeDefined();
	expect(screen.getByText(/learn react/i)).toBeDefined();
	expect(screen.getByText(/learn tanstack/i)).toBeDefined();
});
