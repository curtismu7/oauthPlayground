export interface AuthCodeConfig {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  responseType: 'code' | 'token' | 'id_token';
  advancedOptions: {
    pkce: boolean;
    state?: string;
    nonce?: string;
    customParams?: Record<string, string>;
  };
  mode: 'real' | 'mock';
  spec: '2.0' | '2.1';
  oidc: boolean;
  region: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface FlowState {
  currentStep: number;
  status: 'idle' | 'configuring' | 'authorizing' | 'exchanging' | 'complete' | 'error';
  config: AuthCodeConfig;
  error?: string;
  codeVerifier?: string;
  codeChallenge?: string;
  authorizationCode?: string;
  tokens?: {
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn: number;
  };
}
