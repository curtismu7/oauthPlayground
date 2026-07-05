import { OAuthConfig, FlowState } from '../types';
import { HttpRequest, HttpResponse } from '../utils/exportUtils';

export interface FlowListener {
  onStepChange?: (step: number) => void;
  onStatusChange?: (status: FlowState['status']) => void;
  onRequestSent?: (request: HttpRequest) => void;
  onResponseReceived?: (response: HttpResponse) => void;
  onTokensReceived?: (tokens: FlowState['tokens']) => void;
  onError?: (error: string) => void;
}

export class FlowExecutionService {
  private listeners: FlowListener[] = [];
  private requests: HttpRequest[] = [];
  private responses: HttpResponse[] = [];

  subscribe(listener: FlowListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  startFlow(config: OAuthConfig): void {
    this.requests = [];
    this.responses = [];

    this.emitStatusChange('authorizing');
    this.emitStepChange(1);

    // Simulate building authorization request
    setTimeout(() => {
      const authRequest: HttpRequest = {
        method: 'GET',
        url: `https://api.pingone.com/as/authorization`,
        headers: {
          'User-Agent': 'OAuth-Authz-V2/1.0',
        },
        timestamp: Date.now(),
      };

      this.requests.push(authRequest);
      this.emitRequestSent(authRequest);
    }, 300);

    // Simulate user authorization (step 2)
    setTimeout(() => {
      this.emitStepChange(2);
    }, 1500);

    // Simulate authorization code received (step 3)
    setTimeout(() => {
      this.emitStepChange(3);

      const codeResponse: HttpResponse = {
        status: 302,
        statusText: 'Found',
        headers: {
          Location: `${config.redirectUri}?code=ABC123DEF456&state=xyz789`,
        },
        body: '',
        timestamp: Date.now(),
      };

      this.responses.push(codeResponse);
      this.emitResponseReceived(codeResponse);
    }, 3000);

    // Simulate token exchange (step 4)
    setTimeout(() => {
      this.emitStepChange(4);
      this.emitStatusChange('exchanging');

      const tokenRequest: HttpRequest = {
        method: 'POST',
        url: 'https://api.pingone.com/as/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          grant_type: 'authorization_code',
          code: 'ABC123DEF456',
          client_id: config.clientId,
          client_secret: config.clientSecret || '(public-client)',
          redirect_uri: config.redirectUri,
        },
        timestamp: Date.now(),
      };

      this.requests.push(tokenRequest);
      this.emitRequestSent(tokenRequest);
    }, 4500);

    // Simulate token response (step 5)
    setTimeout(() => {
      this.emitStepChange(5);

      const tokenResponse: HttpResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMzQ1IiwiYXVkIjoiY2xpZW50LWlkIn0.signature',
          token_type: 'Bearer',
          expires_in: 3600,
          id_token: config.responseType === 'code' ? 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMzQ1In0.signature' : undefined,
          refresh_token: 'rt_abc123xyz789',
        },
        timestamp: Date.now(),
      };

      this.responses.push(tokenResponse);
      this.emitResponseReceived(tokenResponse);

      const tokens = {
        accessToken: (tokenResponse.body as Record<string, string>).access_token,
        idToken: (tokenResponse.body as Record<string, unknown>).id_token as string | undefined,
        refreshToken: (tokenResponse.body as Record<string, string>).refresh_token,
        expiresIn: (tokenResponse.body as Record<string, number>).expires_in,
      };

      this.emitTokensReceived(tokens);
    }, 6000);

    // Simulate token validation (step 6)
    setTimeout(() => {
      this.emitStepChange(6);
      this.emitStatusChange('complete');
    }, 7000);
  }

  private emitStepChange(step: number): void {
    this.listeners.forEach((l) => {
      l.onStepChange?.(step);
    });
  }

  private emitStatusChange(status: FlowState['status']): void {
    this.listeners.forEach((l) => {
      l.onStatusChange?.(status);
    });
  }

  private emitRequestSent(request: HttpRequest): void {
    this.listeners.forEach((l) => {
      l.onRequestSent?.(request);
    });
  }

  private emitResponseReceived(response: HttpResponse): void {
    this.listeners.forEach((l) => {
      l.onResponseReceived?.(response);
    });
  }

  private emitTokensReceived(tokens: FlowState['tokens']): void {
    this.listeners.forEach((l) => {
      l.onTokensReceived?.(tokens);
    });
  }

  getRequests(): HttpRequest[] {
    return this.requests;
  }

  getResponses(): HttpResponse[] {
    return this.responses;
  }

  getLatestRequest(): HttpRequest | undefined {
    return this.requests[this.requests.length - 1];
  }

  getLatestResponse(): HttpResponse | undefined {
    return this.responses[this.responses.length - 1];
  }
}

export const flowExecutionService = new FlowExecutionService();
