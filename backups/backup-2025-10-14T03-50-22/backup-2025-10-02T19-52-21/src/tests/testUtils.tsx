import { RenderOptions, render } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from '../contexts/NewAuthContext';
import { PageStyleProvider } from '../contexts/PageStyleContext';

// Mock theme for testing
const mockTheme = {
	colors: {
		primary: '#3b82f6',
		primaryDark: '#1d4ed8',
		secondary: '#6b7280',
		success: '#10b981',
		warning: '#f59e0b',
		error: '#ef4444',
		danger: '#ef4444',
		info: '#3b82f6',
		background: '#ffffff',
		surface: '#f9fafb',
		border: '#e5e7eb',
		gray50: '#f9fafb',
		gray100: '#f3f4f6',
		gray200: '#e5e7eb',
		gray300: '#d1d5db',
		gray400: '#9ca3af',
		gray500: '#6b7280',
		gray600: '#4b5563',
		gray700: '#374151',
		gray800: '#1f2937',
		gray900: '#111827',
	},
	spacing: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem',
		xxl: '3rem',
	},
	borderRadius: {
		sm: '0.25rem',
		md: '0.5rem',
		lg: '0.75rem',
		xl: '1rem',
	},
	shadows: {
		sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
		md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
		lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
	},
};

// Mock auth context value
const mockAuthValue = {
	user: { email: 'test@example.com', name: 'Test User' },
	isAuthenticated: true,
	login: vi.fn(),
	logout: vi.fn(),
	loading: false,
};

// Mock page style context value
const mockPageStyleValue = {
	currentPage: 'test',
	setCurrentPage: vi.fn(),
	getPageStyle: vi.fn(() => ({
		backgroundColor: '#3b82f6',
		textColor: '#ffffff',
	})),
};

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<ThemeProvider theme={mockTheme}>
			<AuthProvider>
				<PageStyleProvider>{children}</PageStyleProvider>
			</AuthProvider>
		</ThemeProvider>
	);
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	render(ui, { wrapper: AllTheProviders, ...options });

// Mock config for testing
export const mockConfig = {
	pingone: {
		environmentId: 'test-env-id',
		apiUrl: 'https://test-api.com',
		clientId: 'test-client-id',
	},
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { mockTheme, mockAuthValue, mockPageStyleValue, mockConfig };
