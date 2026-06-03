/**
 * OIDC Discovery endpoint fetcher
 */

import axios, { AxiosError } from 'axios';
import { DiscoveryError } from './mcpErrors.js';
import { logger } from './logger.js';

export interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
  response_modes_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  [key: string]: unknown;
}

export async function fetchOIDCDiscovery(issuerUrl: string): Promise<OIDCDiscoveryDocument> {
  try {
    // Normalize the issuer URL
    let normalizedUrl = issuerUrl.trim();
    if (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    const discoveryUrl = `${normalizedUrl}/.well-known/openid-configuration`;
    logger.debug('Fetching OIDC discovery document', { discoveryUrl });

    const response = await axios.get<OIDCDiscoveryDocument>(discoveryUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    });

    logger.info('Successfully fetched OIDC discovery document', { issuer: response.data.issuer });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch OIDC discovery document', { error: String(error) });

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED') {
        throw new DiscoveryError(`Request timeout while fetching OIDC discovery: ${issuerUrl}`);
      }
      if (axiosError.response?.status === 404) {
        throw new DiscoveryError(`OIDC discovery endpoint not found at ${issuerUrl}`);
      }
      throw new DiscoveryError(`Failed to fetch OIDC discovery: ${axiosError.message}`);
    }

    throw new DiscoveryError(`Failed to fetch OIDC discovery from ${issuerUrl}: ${String(error)}`);
  }
}
