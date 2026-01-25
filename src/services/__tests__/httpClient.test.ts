/**
 * HttpClient Tests
 * 
 * Test coverage:
 * - Basic HTTP methods (GET, POST, PUT, DELETE)
 * - Timeout handling
 * - Retry logic with exponential backoff
 * - Error mapping
 * - AbortController support
 */

import { HttpClient } from '../httpClient';

describe('HttpClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      const response = await HttpClient.get('https://api.example.com/data');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include custom headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      await HttpClient.get('https://api.example.com/data', {
        headers: { Authorization: 'Bearer token123' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with body', async () => {
      const mockData = { success: true };
      const requestBody = { name: 'test', value: 123 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => mockData,
      });

      const response = await HttpClient.post('https://api.example.com/data', requestBody);

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(201);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' }),
      });

      await expect(HttpClient.get('https://api.example.com/missing')).rejects.toMatchObject({
        message: 'HTTP 404: Not Found',
        status: 404,
        code: 'CLIENT_ERROR',
      });
    });

    it('should handle 500 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      await expect(HttpClient.get('https://api.example.com/data')).rejects.toMatchObject({
        message: 'HTTP 500: Internal Server Error',
        status: 500,
        code: 'SERVER_ERROR',
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(HttpClient.get('https://api.example.com/data', { retries: 0 })).rejects.toMatchObject({
        message: 'Network error',
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle timeout', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(resolve, 100))
      );

      await expect(
        HttpClient.get('https://api.example.com/data', { timeout: 50, retries: 0 })
      ).rejects.toMatchObject({
        message: 'Request timeout',
        code: 'TIMEOUT',
      });
    });
  });

  describe('Retry logic', () => {
    it('should retry on 500 errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true }),
        });

      const response = await HttpClient.get('https://api.example.com/data', { retries: 2 });

      expect(response.data).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on 429 rate limit', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true }),
        });

      const response = await HttpClient.get('https://api.example.com/data', { retries: 1 });

      expect(response.data).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid request' }),
      });

      await expect(HttpClient.get('https://api.example.com/data', { retries: 2 })).rejects.toMatchObject({
        status: 400,
        code: 'CLIENT_ERROR',
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(HttpClient.get('https://api.example.com/data', { retries: 2 })).rejects.toMatchObject({
        status: 500,
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('AbortController support', () => {
    it('should support external AbortController', async () => {
      const controller = new AbortController();
      
      (global.fetch as jest.Mock).mockImplementationOnce((_url, options) => {
        expect(options.signal).toBe(controller.signal);
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        });
      });

      await HttpClient.get('https://api.example.com/data', { signal: controller.signal });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('PUT and DELETE requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { updated: true };
      const requestBody = { name: 'updated' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      const response = await HttpClient.put('https://api.example.com/data/1', requestBody);

      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should make successful DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => ({}),
      });

      const response = await HttpClient.delete('https://api.example.com/data/1');

      expect(response.status).toBe(204);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
