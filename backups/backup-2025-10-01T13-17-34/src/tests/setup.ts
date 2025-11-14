import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock window.crypto for CSRF tests
Object.defineProperty(global, 'crypto', {
	value: {
		getRandomValues: vi.fn((array) => {
			for (let i = 0; i < array.length; i++) {
				array[i] = Math.floor(Math.random() * 256);
			}
			return array;
		}),
	},
});

// Mock document.cookie for CSRF tests
const mockCookies: { [key: string]: string } = {};
Object.defineProperty(document, 'cookie', {
	get: () => {
		return Object.entries(mockCookies)
			.map(([key, value]) => `${key}=${value}`)
			.join('; ');
	},
	set: (cookieString: string) => {
		const [keyValue] = cookieString.split(';');
		const [key, value] = keyValue.split('=');
		if (key && value) {
			mockCookies[key.trim()] = value.trim();
		}
	},
});

// Mock document.head for CSRF tests
const mockMetaTags: { [key: string]: HTMLMetaElement } = {};
Object.defineProperty(document, 'head', {
	value: {
		appendChild: vi.fn(),
		querySelector: vi.fn((selector: string) => {
			if (selector === 'meta[name="csrf-token"]') {
				return mockMetaTags['csrf-token'] || null;
			}
			return null;
		}),
	},
});

// Mock document.createElement for CSRF tests
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
	if (tagName === 'meta') {
		const meta = originalCreateElement.call(document, tagName) as HTMLMetaElement;
		meta.name = '';
		meta.content = '';
		return meta;
	}
	return originalCreateElement.call(document, tagName);
});
