import { useServerStatus } from '../components/ServerStatusProvider';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  async request<T = unknown>(
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const result: ApiResponse<T> = {
        status: response.status,
        ok: response.ok,
      };

      if (response.ok) {
        try {
          const data = await response.json();
          result.data = data;
        } catch (jsonError) {
          // If response is ok but not JSON, return the text
          const text = await response.text();
          result.data = text as T;
        }
      } else {
        try {
          const errorData = await response.json();
          result.error = errorData.message || errorData.error || `HTTP ${response.status}`;
        } catch {
          result.error = `HTTP ${response.status}: ${response.statusText}`;
        }
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }
      throw new ApiError('Unknown error occurred', 0);
    }
  },

  async get<T = unknown>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  },

  async post<T = unknown>(url: string, data?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put<T = unknown>(url: string, data?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete<T = unknown>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  },
};

// Hook for making API calls with server status awareness
export const useApiCall = () => {
  const serverStatus = useServerStatus();

  const callApi = async <T = unknown>(
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> => {
    if (!serverStatus.isOnline) {
      throw new ApiError(
        'Backend server is not available. Please start the server with: node server.js',
        503
      );
    }

    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Network error occurred. Please check your connection and try again.',
        0
      );
    }
  };

  return { callApi, serverStatus };
};

export default apiClient;
