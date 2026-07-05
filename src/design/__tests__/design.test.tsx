import { describe, expect, it } from 'vitest';
import { tokens as designTokens } from '../tokens';
import { tokens as frameworkTokens } from '../../flows2/framework/tokens';

describe('design/tokens', () => {
	it('exposes the navy + teal palette', () => {
		expect(designTokens.color.primary).toBe('#1e3a8a');
		expect(designTokens.color.accent).toBe('#14b8a6');
		expect(designTokens.color.accentHover).toBe('#0d9488');
	});

	it('is the exact same object the flows2 framework re-exports (back-compat)', () => {
		expect(frameworkTokens).toBe(designTokens);
	});
});
