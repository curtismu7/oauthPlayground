// src/tests/unit/ScopeImpactPlayground.test.ts
/**
 * Unit tests for ScopeImpactPlayground component
 * Tests provider selection, scope selection, risk calculation, and API filtering
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import ScopeImpactPlayground from '../../components/ScopeImpactPlayground';

// Wrapper for components requiring Router context
const renderWithRouter = (component: React.ReactElement) => {
	return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ScopeImpactPlayground', () => {
	beforeEach(() => {
		// Clear any mocks between tests
	});

	it('should render the playground with default PingOne provider', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		expect(screen.getByText(/Scope Impact Playground/i)).toBeInTheDocument();
		expect(screen.getByText(/PingOne/i)).toBeInTheDocument();
	});

	it('should allow selecting multiple scopes', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		const scopeChip = screen.getByText(/p1:read:user/i);
		fireEvent.click(scopeChip);

		// Verify scope is selected (check for active styling or checkmark)
		expect(scopeChip.closest('button')).toHaveAttribute('aria-pressed', 'true');
	});

	it('should calculate risk level when scopes are selected', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		const highRiskScope = screen.getByText(/p1:update:user/i);
		fireEvent.click(highRiskScope);

		expect(screen.getByText(/Risk Summary/i)).toBeInTheDocument();
		expect(screen.getByText(/High – enforce approvals/i)).toBeInTheDocument();
	});

	it('should display API examples for selected scopes', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		const scopeWithApis = screen.getByText(/p1:read:user/i);
		fireEvent.click(scopeWithApis);

		expect(screen.getByText(/GET \/environments\/\{envId\}\/users/i)).toBeInTheDocument();
	});

	it('should show best practices for selected scopes', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		const scope = screen.getByText(/p1:read:user/i);
		fireEvent.click(scope);

		expect(screen.getByText(/Pair with population filters/i)).toBeInTheDocument();
	});

	it('should handle scope dependencies correctly', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		const dependentScope = screen.getByText(/p1:update:device/i);
		fireEvent.click(dependentScope);

		const dependency = screen.getByText(/p1:read:user/i);
		expect(dependency.closest('button')).toHaveAttribute('aria-pressed', 'true');
	});

	it('should surface recommended bundle when scopes match', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		const offline = screen.getByText(/offline_access/i);
		fireEvent.click(offline);
		const profile = screen.getByText(/p1:read:device/i);
		fireEvent.click(profile);
		const email = screen.getByText(/p1:update:device/i);
		fireEvent.click(email);
		const readUser = screen.getByText(/p1:read:user/i);
		fireEvent.click(readUser);

		expect(screen.getByText(/Bundle Match: Remember Me Session/i)).toBeInTheDocument();
	});

	it('should show least-privilege recommendations', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		const scope1 = screen.getByText(/p1:read:user/i);
		const scope2 = screen.getByText(/offline_access/i);
		fireEvent.click(scope1);
		fireEvent.click(scope2);

		expect(screen.getByText(/validate least privilege/i)).toBeInTheDocument();
	});

	it('should handle empty scope selection gracefully', () => {
		renderWithRouter(<ScopeImpactPlayground />);

		expect(screen.getByText(/No scopes selected yet/i)).toBeInTheDocument();
	});
});
