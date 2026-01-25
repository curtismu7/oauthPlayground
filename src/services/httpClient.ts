/**
 * HttpClient - Centralized HTTP wrapper with retry, error mapping, and timeout handling
 * 
 * Features:
 * - Exponential backoff retry (3 attempts by default)
 * - Timeout handling (30s default)
 * - Standardized error mapping
 * - Request/response logging (dev mode)
 * - AbortController support
 */

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface HttpClientResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface HttpClientError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

class HttpClientImpl {
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 3;
  private isDev = process.env.NODE_ENV === 'development';

  async get<T>(url: string, options?: HttpClientOptions): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { method: 'GET', ...options });
  }

  async post<T>(url: string, body: unknown, options?: HttpClientOptions): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, ...options });
  }

  async put<T>(url: string, body: unknown, options?: HttpClientOptions): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body, ...options });
  }

  async delete<T>(url: string, options?: HttpClientOptions): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', ...options });
  }

  private async request<T>(
    url: string,
    options: HttpClientOptions & { method: string; body?: unknown }
  ): Promise<HttpClientResponse<T>> {
    const timeout = options.timeout ?? this.defaultTimeout;
    const retries = options.retries ?? this.defaultRetries;

    return this.retry(
      async () => {
        const controller = new AbortController();
        const signal = options.signal ?? controller.signal;

        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          if (this.isDev) {
            console.log(`[HttpClient] ${options.method} ${url}`);
          }

          const fetchOptions: RequestInit = {
            method: options.method,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
            signal,
          };

          if (options.body !== undefined) {
            fetchOptions.body = JSON.stringify(options.body);
          }

          const response = await fetch(url, fetchOptions);

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw await this.createErrorFromResponse(response);
          }

          const data = await response.json();

          if (this.isDev) {
            console.log(`[HttpClient] ${options.method} ${url} - ${response.status}`);
          }

          return {
            data: data as T,
            status: response.status,
            headers: response.headers,
          };
        } catch (error) {
          clearTimeout(timeoutId);
          throw this.mapError(error);
        }
      },
      retries
    );
  }

  private async retry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
    let lastError: HttpClientError | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as HttpClientError;

        if (attempt < retries) {
          const isRetryable = this.isRetryableError(lastError);
          
          if (isRetryable) {
            const delay = this.calculateBackoff(attempt);
            
            if (this.isDev) {
              console.log(`[HttpClient] Retry attempt ${attempt + 1}/${retries} after ${delay}ms`);
            }
            
            await this.sleep(delay);
            continue;
          }
        }

        throw lastError;
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: HttpClientError): boolean {
    if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
      return true;
    }

    if (error.status && error.status >= 500) {
      return true;
    }

    if (error.status === 429) {
      return true;
    }

    return false;
  }

  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async createErrorFromResponse(response: Response): Promise<HttpClientError> {
    let details: unknown;
    
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    return {
      message: `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      code: this.getErrorCode(response.status),
      details,
    };
  }

  private mapError(error: unknown): HttpClientError {
    if (this.isHttpClientError(error)) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          message: 'Request timeout',
          code: 'TIMEOUT',
        };
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          message: 'Network error',
          code: 'NETWORK_ERROR',
          details: error.message,
        };
      }

      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        details: error,
      };
    }

    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }

  private isHttpClientError(error: unknown): error is HttpClientError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as HttpClientError).message === 'string'
    );
  }

  private getErrorCode(status: number): string {
    if (status >= 400 && status < 500) {
      return 'CLIENT_ERROR';
    }
    if (status >= 500) {
      return 'SERVER_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }
}

export const HttpClient = new HttpClientImpl();
