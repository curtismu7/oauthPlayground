// OAuth 2.0 and OpenID Connect Type Definitions
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint?: string;
  logoutEndpoint?: string;
  scope: string;
  responseType: 'code' | 'token' | 'id_token' | 'code id_token' | 'code token' | 'id_token token' | 'code id_token token';
  grantType: 'authorization_code' | 'implicit' | 'client_credentials' | 'password' | 'refresh_token';
  codeChallengeMethod?: 'S256' | 'plain';
  issuer?: string;
  audience?: string;
}

export interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  nonce?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  prompt?: string;
  max_age?: number;
  id_token_hint?: string;
  login_hint?: string;
  acr_values?: string;
  claims?: string;
  request?: string;
  request_uri?: string;
}

export interface TokenRequest {
  grant_type: string;
  client_id: string;
  client_secret?: string;
  code?: string;
  redirect_uri?: string;
  code_verifier?: string;
  username?: string;
  password?: string;
  refresh_token?: string;
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer' | 'MAC' | 'POP';
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  issued_token_type?: string;
  authorization_details?: AuthorizationDetails[];
}

export interface AuthorizationDetails {
  type: string;
  locations?: string[];
  actions?: string[];
  datatypes?: string[];
  identifier?: string;
  privileges?: string[];
}

export interface IdTokenPayload {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  auth_time?: number;
  nonce?: string;
  acr?: string;
  amr?: string[];
  azp?: string;
  at_hash?: string;
  c_hash?: string;
  s_hash?: string;
  [key: string]: unknown;
}

export interface UserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: Address;
  updated_at?: number;
  [key: string]: unknown;
}

export interface Address {
  formatted?: string;
  street_address?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface JWKS {
  keys: JWK[];
}

export interface JWK {
  kty: string;
  use?: string;
  key_ops?: string[];
  alg?: string;
  kid?: string;
  x5u?: string;
  x5c?: string[];
  x5t?: string;
  'x5t#S256'?: string;
  n?: string;
  e?: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  oth?: Array<{
    r?: string;
    d?: string;
    t?: string;
  }>;
  k?: string;
  crv?: string;
  x?: string;
  y?: string;
}

export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

export type OAuthFlow = 'authorization_code' | 'implicit' | 'client_credentials' | 'device_code' | 'pkce';
export type SecurityLevel = 'high' | 'medium' | 'low';
export type TokenValidationResult = 'valid' | 'expired' | 'invalid' | 'malformed';
