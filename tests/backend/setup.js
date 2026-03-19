// Vitest setup file for backend tests
import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Use a different port for tests

// Create a single vi mock that will be used for BOTH global.fetch and node-fetch.
// The server imports `fetch from 'node-fetch'`, so we must mock that module too —
// otherwise the server makes real PingOne API calls with test tokens and gets 401/403.
const mockFetch = vi.fn(() =>
	Promise.reject(
		new Error('Fetch was called but not mocked. Please mock the response in your test.')
	)
);

// Mock node-fetch so server.js's `import fetch from 'node-fetch'` uses our mock.
vi.mock('node-fetch', () => ({ default: mockFetch }));

// Also expose on global so tests can call global.fetch.mockResolvedValueOnce etc.
global.fetch = mockFetch;
globalThis.fetch = mockFetch;

// Mock console methods to reduce noise during testing
global.console = {
	...console,
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	info: vi.fn(),
};

// Set up global test utilities
global.testUtils = {
	mockFetchResponse: (data, status = 200) => {
		global.fetch.mockResolvedValueOnce({
			ok: status >= 200 && status < 300,
			status,
			statusText: status === 200 ? 'OK' : 'Error',
			json: () => Promise.resolve(data),
			text: () => Promise.resolve(JSON.stringify(data)),
			headers: new Map([['content-type', 'application/json']]),
		});
	},

	mockFetchError: (error) => {
		global.fetch.mockRejectedValueOnce(error);
	},

	createMockRequest: (body = {}, params = {}, query = {}) => ({
		body,
		params,
		query,
		headers: {},
		method: 'POST',
		url: '/test',
	}),

	createMockResponse: () => {
		const res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
			send: vi.fn().mockReturnThis(),
			setHeader: vi.fn().mockReturnThis(),
			end: vi.fn().mockReturnThis(),
		};
		return res;
	},
};
