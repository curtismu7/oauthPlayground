import { OAuthTokenResponse, UserInfo } from './storage';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  tokens: OAuthTokenResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (redirectAfterLogin?: string) => Promise<LoginResult>;
  logout: () => void;
  handleCallback: (url: string) => Promise<LoginResult>;
  setAuthState: (updates: Partial<AuthState>) => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
