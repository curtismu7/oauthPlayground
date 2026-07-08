export interface HttpRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, string>;
  timestamp: number;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
  timestamp: number;
}

export const formatAsCurl = (request: HttpRequest): string => {
  let curl = `curl -X ${request.method}`;

  if (request.headers) {
    Object.entries(request.headers).forEach(([key, value]) => {
      curl += ` -H '${key}: ${value}'`;
    });
  }

  if (request.body) {
    const bodyStr = typeof request.body === 'string' ? request.body : new URLSearchParams(request.body).toString();
    curl += ` -d '${bodyStr}'`;
  }

  curl += ` '${request.url}'`;
  return curl;
};

export const formatAsPostman = (request: HttpRequest): string => {
  const postmanRequest = {
    method: request.method,
    url: request.url,
    header: request.headers
      ? Object.entries(request.headers).map(([key, value]) => ({
          key,
          value,
        }))
      : [],
    body: request.body
      ? {
          mode: 'urlencoded',
          urlencoded: Object.entries(request.body).map(([key, value]) => ({
            key,
            value,
          })),
        }
      : undefined,
  };

  return JSON.stringify(postmanRequest, null, 2);
};

export const formatResponseBody = (body: unknown): string => {
  if (typeof body === 'string') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

export const truncateToken = (token: string, length = 50): string => {
  if (token.length <= length) return token;
  return token.substring(0, length) + '...';
};
