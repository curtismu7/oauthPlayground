import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { tokens as designTokens } from '../tokens';
import { tokens as frameworkTokens } from '../../flows2/framework/tokens';
import { Pill, Action, Card } from '../primitives';
import { Pill as FwPill } from '../../flows2/framework/primitives';
import { PageShell } from '../PageShell';
import { fonts } from '../typography';

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

describe('design/primitives', () => {
	it('re-exports the same Pill through the flows2 shim', () => {
		expect(FwPill).toBe(Pill);
	});

	it('renders Pill, Action, and Card without error', () => {
		const { getByText } = render(
			<>
				<Pill $active={false} type="button">chip</Pill>
				<Action type="button">go</Action>
				<Card>body</Card>
			</>,
		);
		expect(getByText('chip')).toBeInTheDocument();
		expect(getByText('go')).toBeInTheDocument();
		expect(getByText('body')).toBeInTheDocument();
	});
});

describe('design/typography', () => {
	it('documents a mono accent stack distinct from body', () => {
		expect(fonts.mono).toContain('IBM Plex Mono');
		expect(fonts.body).not.toBe(fonts.mono);
	});
});

describe('design/PageShell', () => {
	it('renders the title as an h1, the intro, and children', () => {
		const { getByRole, getByText } = render(
			<PageShell title="Dashboard" intro="Welcome back">
				<div>page body</div>
			</PageShell>,
		);
		expect(getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
		expect(getByText('Welcome back')).toBeInTheDocument();
		expect(getByText('page body')).toBeInTheDocument();
	});
});
