import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
	it('should return an empty string when no arguments are passed', () => {
		expect(cn()).toBe('');
	});

	it('should return the same string when a single string is passed', () => {
		expect(cn('test')).toBe('test');
	});

	it('should combine multiple strings into a single string', () => {
		expect(cn('test', 'test2')).toBe('test test2');
	});

	it('should handle conditional classes', () => {
		expect(cn('test', { hidden: true })).toBe('test hidden');
		expect(cn('test', { hidden: false })).toBe('test');
	});

	it('should handle array of classes', () => {
		expect(cn(['test', 'test2'])).toBe('test test2');
	});

	it('should handle complex combinations of classes', () => {
		expect(cn('test', { hidden: true, block: false }, ['test2', 'test3'], 'test4')).toBe('test hidden test2 test3 test4');
	});

	it('should override classes correctly', () => {
		expect(cn('test', 'override', { notVisible: false, visible: true })).toBe('test override visible');
	});
});
