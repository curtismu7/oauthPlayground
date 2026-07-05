import { AuthCodeConfig, FlowState } from '../types';
import { HttpRequest, HttpResponse } from '../../OAuthAuthzV2/utils/exportUtils';

export interface FlowListener {
  onStepChange?: (step: number) => void;
  onStatusChange?: (status: FlowState['status']) => void;
  onRequestSent?: (request: HttpRequest) => void;
  onResponseReceived?: (response: HttpResponse) => void;
  onTokensReceived?: (tokens: FlowState['tokens']) => void;
  onPKCEGenerated?: (verifier: string, challenge: string) => void;
  onError?: (error: string) => void;
}

export class AuthCodeFlowExecutionService {
  private listeners: FlowListener[] = [];
  private requests: HttpRequest[] = [];
  private responses: HttpResponse[] = [];

  subscribe(listener: FlowListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  startFlow(config: AuthCodeConfig): void {
    this.requests = [];
    this.responses = [];

    this.emitStatusChange('configuring');
    this.emitStepChange(1);

    // Step 2: Generate PKCE
    setTimeout(() => {
      this.emitStepChange(2);
      if (config.advancedOptions.pkce || config.spec === '2.1') {
        const verifier = this.generateRandomString(128);
        const challenge = this.generateRandomString(43);
        this.emitPKCEGenerated(verifier, challenge);
      }
    }, 1000);

    // Step 3: Authorization Request
    setTimeout(() => {
      this.emitStepChange(3);
      this.emitStatusChange('authorizing');

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: config.responseType,
        scope: config.scopes.join(' '),
      });

      const authRequest: HttpRequest = {
        method: 'GET',
        url: `https://api.pingone.com/${config.environmentId}/as/authorization?${params}`,
        headers: {
          'User-Agent': 'OAuth-AuthCode-V2/1.0',
        },
        timestamp: Date.now(),
      };

      this.requests.push(authRequest);
      this.emitRequestSent(authRequest);
    }, 2000);

    // Step 4: Authorization Code Received
    setTimeout(() => {
      this.emitStepChange(4);

      const codeResponse: HttpResponse = {
        status: 302,
        statusText: 'Found',
        headers: {
          Location: `${config.redirectUri}?code=AUTH_CODE_${this.generateRandomString(16)}&state=xyz789`,
        },
        body: '',
        timestamp: Date.now(),
      };

      this.responses.push(codeResponse);
      this.emitResponseReceived(codeResponse);
    }, 3500);

    // Step 5: Exchange Code for Tokens
    setTimeout(() => {
      this.emitStepChange(5);
      this.emitStatusChange('exchanging');

      const tokenRequest: HttpRequest = {
        method: 'POST',
        url: `https://api.pingone.com/${config.environmentId}/as/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          grant_type: 'authorization_code',
          code: 'AUTH_CODE_ABC123',
          client_id: config.clientId,
          client_secret: config.clientSecret || '(public-client)',
          redirect_uri: config.redirectUri,
        },
        timestamp: Date.now(),
      };

      this.requests.push(tokenRequest);
      this.emitRequestSent(tokenRequest);
    }, 5000);

    // Step 6: Tokens Received
    setTimeout(() => {
      this.emitStepChange(6);
      this.emitStatusChange('complete');

      const tokenResponse: HttpResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWF1dGhjb2RlIiwiYXVkIjoiY2xpZW50LWlkIn0.signature',
          token_type: 'Bearer',
          expires_in: 3600,
          ...(config.oidc && {
            id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWF1dGhjb2RlIiwibm9uY2UiOiJub25jZS12YWx1ZSJ9.signature',
          }),
          refresh_token: 'rt_authcode_xyz789',
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
    }, 6500);
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private emitStepChange(step: number): void {
    this.listeners.forEach((l) => l.onStepChange?.(step));
  }

  private emitStatusChange(status: FlowState['status']): void {
    this.listeners.forEach((l) => l.onStatusChange?.(status));
  }

  private emitRequestSent(request: HttpRequest): void {
    this.listeners.forEach((l) => l.onRequestSent?.(request));
  }

  private emitResponseReceived(response: HttpResponse): void {
    this.listeners.forEach((l) => l.onResponseReceived?.(response));
  }

  private emitTokensReceived(tokens: FlowState['tokens']): void {
    this.listeners.forEach((l) => l.onTokensReceived?.(tokens));
  }

  private emitPKCEGenerated(verifier: string, challenge: string): void {
    this.listeners.forEach((l) => l.onPKCEGenerated?.(verifier, challenge));
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

export const authCodeFlowExecutionService = new AuthCodeFlowExecutionService();
