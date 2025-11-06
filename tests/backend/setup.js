// Jest setup file - ESM
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Use a different port for tests

// Create a mock fetch function that will be used by both the server and tests
// This must be a jest mock function so it has mockResolvedValueOnce, etc.
// We need to ensure this is set up before any modules are imported
const mockFetch = jest.fn(() => {
	// Default implementation that returns a rejected promise
	// This ensures tests fail if they don't properly mock the response
	return Promise.reject(new Error('Fetch was called but not mocked. Please mock the response in your test.'));
});

// Add mock methods to the function
mockFetch.mockResolvedValueOnce = jest.fn().mockImplementation((value) => {
	mockFetch.mockImplementationOnce(() => Promise.resolve(value));
	return mockFetch;
});

mockFetch.mockRejectedValueOnce = jest.fn().mockImplementation((value) => {
	mockFetch.mockImplementationOnce(() => Promise.reject(value));
	return mockFetch;
});

// Mock fetch globally (both global and globalThis)
// This must be set before server.js is imported, as server.js checks if fetch exists
// The server.js only sets globalThis.fetch if it's not already a function, so our mock will persist
global.fetch = mockFetch;
globalThis.fetch = mockFetch;

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
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
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
    return res;
  },
};
