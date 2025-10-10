// Jest setup file - CommonJS

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Use a different port for tests

// Mock fetch globally
global.fetch = jest.fn();

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
