import { z } from 'zod';
import { logger } from '../services/logger.js';

export const UrlBuilderRequestSchema = z.object({
  baseUrl: z.string().url(),
  clientId: z.string().min(1),
  redirectUri: z.string().url().optional(),
  scope: z.string().optional(),
  responseType: z.enum(['code', 'token', 'id_token', 'code id_token', 'token id_token', 'code token id_token']),
  state: z.string().optional(),
  nonce: z.string().optional(),
  codeChallenge: z.string().optional(),
  extraParams: z.record(z.string()).optional(),
});

export type UrlBuilderRequest = z.infer<typeof UrlBuilderRequestSchema>;

export interface UrlBuilderResponse {
  url: string;
  params: Record<string, string>;
  paramCount: number;
  description: string;
}

export async function buildAuthorizationUrl(request: UrlBuilderRequest): Promise<UrlBuilderResponse> {
  const {
    baseUrl,
    clientId,
    redirectUri,
    scope = 'openid profile email',
    responseType,
    state,
    nonce,
    codeChallenge,
    extraParams = {},
  } = request;

  logger.info('Building authorization URL', { 
    baseUrl, 
    clientId, 
    responseType 
  });

  const params: Record<string, string> = {
    response_type: responseType,
    client_id: clientId,
    scope,
  };

  if (redirectUri) {
    params.redirect_uri = redirectUri;
  }

  if (state) {
    params.state = state;
  }

  if (nonce) {
    params.nonce = nonce;
  }

  if (codeChallenge) {
    params.code_challenge = codeChallenge;
    params.code_challenge_method = 'S256';
  }

  Object.assign(params, extraParams);

  const baseUrlObj = new URL(baseUrl);
  if (!baseUrlObj.pathname.endsWith('/')) {
    baseUrlObj.pathname += '/';
  }
  baseUrlObj.pathname += 'authorize';

  const urlParams = new URLSearchParams(params);
  const url = `${baseUrlObj.toString()}?${urlParams.toString()}`;

  logger.debug('Authorization URL built', { paramCount: Object.keys(params).length });

  return {
    url,
    params,
    paramCount: Object.keys(params).length,
    description: 'Authorization URL for redirecting user to OAuth provider. Use state and nonce for security.',
  };
}
