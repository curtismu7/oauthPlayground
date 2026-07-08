/**
 * @file FlowTypeSelector.test.tsx
 * @module v8u/components/__tests__
 * @description Unit tests for FlowTypeSelector component
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlowTypeSelector } from '../FlowTypeSelector';

describe('FlowTypeSelector', () => {
	it('renders flow type dropdown with current selection', () => {
		render(<FlowTypeSelector specVersion="oidc" flowType="oauth-authz" onChange={() => {}} />);
		expect(screen.getByLabelText(/Flow Type \(Grant type\)/i)).toBeInTheDocument();
		expect(screen.getByDisplayValue('Authorization Code')).toBeInTheDocument();
	});

	it('shows available flows for OIDC spec version', () => {
		render(<FlowTypeSelector specVersion="oidc" flowType="oauth-authz" onChange={() => {}} />);
		const select = screen.getByRole('combobox', { name: /Flow Type/i });
		const options = Array.from(select.querySelectorAll('option'));
		const labels = options.map((o) => o.textContent);
		expect(labels).toContain('Authorization Code');
		expect(labels).toContain('Implicit');
		expect(labels).toContain('Hybrid');
		expect(labels).toContain('Device code grant type');
	});

	it('shows available flows for OAuth 2.1 (no implicit)', () => {
		render(<FlowTypeSelector specVersion="oauth2.1" flowType="oauth-authz" onChange={() => {}} />);
		const select = screen.getByRole('combobox', { name: /Flow Type/i });
		const options = Array.from(select.querySelectorAll('option'));
		const labels = options.map((o) => o.textContent);
		expect(labels).toContain('Authorization Code');
		expect(labels).not.toContain('Implicit');
		expect(labels).toContain('Device code grant type');
	});

	it('calls onChange when user selects different flow', () => {
		const handleChange = vi.fn();
		render(<FlowTypeSelector specVersion="oidc" flowType="oauth-authz" onChange={handleChange} />);
		const select = screen.getByRole('combobox', { name: /Flow Type/i });
		fireEvent.change(select, { target: { value: 'device-code' } });
		expect(handleChange).toHaveBeenCalledWith('device-code');
	});

	it('disables dropdown when disabled prop is true', () => {
		render(
			<FlowTypeSelector
				specVersion="oidc"
				flowType="oauth-authz"
				onChange={() => {}}
				disabled={true}
			/>
		);
		expect(screen.getByRole('combobox', { name: /Flow Type/i })).toBeDisabled();
	});

	it('displays client-credentials option for OAuth 2.1', () => {
		render(
			<FlowTypeSelector specVersion="oauth2.1" flowType="client-credentials" onChange={() => {}} />
		);
		expect(screen.getByDisplayValue('Client Credentials')).toBeInTheDocument();
	});
});
