export interface OAuthConfig {
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
}

export interface FormErrors {
  [key: string]: string;
}

export interface FlowState {
  currentStep: number;
  status: 'idle' | 'authorizing' | 'exchanging' | 'complete' | 'error';
  config: OAuthConfig;
  error?: string;
  authorizationCode?: string;
  tokens?: {
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn: number;
  };
}
