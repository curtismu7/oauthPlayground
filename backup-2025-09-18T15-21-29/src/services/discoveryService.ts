/* eslint-disable @typescript-eslint/no-unused-vars */
import { logger } from '../utils/logger';

export interface OpenIDConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
  code_challenge_methods_supported: string[];
  request_parameter_supported: boolean;
  request_uri_parameter_supported: boolean;
  require_request_uri_registration: boolean;
  end_session_endpoint: string;
  revocation_endpoint: string;
  introspection_endpoint: string;
  device_authorization_endpoint: string;
  pushed_authorization_request_endpoint?: string;
}

export interface DiscoveryResult {
  success: boolean;
  configuration?: OpenIDConfiguration;
  error?: string;
  environmentId?: string;
}

class DiscoveryService {
  private cache = new Map<string, { config: OpenIDConfiguration; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Discover OpenID configuration for a PingOne environment
   */
  async discoverConfiguration(environmentId: string, region: string = 'us'): Promise<DiscoveryResult> {
    try {
      logger.discovery('DiscoveryService', 'Starting OpenID configuration discovery', { environmentId, region });

      // Check cache first
      const cacheKey = `${environmentId}-${region}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        logger.discovery('DiscoveryService', 'Using cached configuration', { environmentId });
        return {
          success: true,
          configuration: cached.config,
          environmentId
        };
      }

      // Use backend proxy to avoid CORS issues
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://oauth-playground.vercel.app' 
        : 'http://localhost:3001';
      
      const discoveryUrl = `${backendUrl}/api/discovery?environment_id=${environmentId}&region=${region}`;

      logger.discovery('DiscoveryService', 'Fetching configuration via backend proxy', { discoveryUrl });

      if (!response.ok) {
        const errorData = await response.json();
        logger.warn('DiscoveryService', 'Backend discovery failed', {
          status: response.status,
          error: errorData
        });
        
        // Return a fallback configuration based on known PingOne patterns
        const fallbackConfig: OpenIDConfiguration = {
          issuer: `https://auth.pingone.com/${environmentId}`,
          authorization_endpoint: `https://auth.pingone.com/${environmentId}/as/authorize`,
          token_endpoint: `https://auth.pingone.com/${environmentId}/as/token`,
          userinfo_endpoint: `https://auth.pingone.com/${environmentId}/as/userinfo`,
          jwks_uri: `https://auth.pingone.com/${environmentId}/as/jwks`,
          scopes_supported: ['openid', 'profile', 'email', 'address', 'phone'],
          response_types_supported: ['code', 'id_token', 'token', 'id_token token', 'code id_token', 'code token', 'code id_token token'],
          grant_types_supported: ['authorization_code', 'implicit', 'client_credentials', 'refresh_token', 'urn:ietf:params:oauth:grant-type:device_code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256', 'RS384', 'RS512'],
          token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'private_key_jwt', 'client_secret_jwt'],
          claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'auth_time', 'nonce', 'acr', 'amr', 'azp', 'at_hash', 'c_hash'],
          code_challenge_methods_supported: ['S256', 'plain'],
          request_parameter_supported: true,
          request_uri_parameter_supported: true,
          require_request_uri_registration: false,
          end_session_endpoint: `https://auth.pingone.com/${environmentId}/as/signoff`,
          revocation_endpoint: `https://auth.pingone.com/${environmentId}/as/revoke`,
          introspection_endpoint: `https://auth.pingone.com/${environmentId}/as/introspect`,
          device_authorization_endpoint: `https://auth.pingone.com/${environmentId}/as/device`,
          pushed_authorization_request_endpoint: `https://auth.pingone.com/${environmentId}/as/par`
        };

        logger.info('DiscoveryService', 'Using fallback configuration', {
          environmentId,
          issuer: fallbackConfig.issuer
        });

        return {
          success: true,
          configuration: fallbackConfig,
          environmentId
        };
      }

      if (!result.success) {
        throw new Error(result.error || 'Discovery failed');
      }

      const configuration: OpenIDConfiguration = result.configuration;

      // Validate required fields
      if (!configuration.issuer || !configuration.authorization_endpoint || !configuration.token_endpoint) {
        throw new Error('Invalid OpenID configuration: missing required fields');
      }

      // Cache the configuration
      this.cache.set(cacheKey, {
        config: configuration,
        timestamp: Date.now()
      });

      logger.success('DiscoveryService', 'OpenID configuration discovered successfully', {
        environmentId,
        issuer: configuration.issuer,
        endpoints: {
          authorization: configuration.authorization_endpoint,
          token: configuration.token_endpoint,
          userinfo: configuration.userinfo_endpoint,
          jwks: configuration.jwks_uri
        },
        fallback: result.fallback || false
      });

      return {
        success: true,
        configuration,
        environmentId
      };

    } catch (_error) {
      logger.error('DiscoveryService', 'Failed to discover OpenID configuration', {
        environmentId,
        region,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Discovery failed',
        environmentId
      };
    }
  }

  /**
   * Get base URL for PingOne based on region
   */
  private getBaseUrl(region: string): string {
    const regionMap: Record<string, string> = {
      'us': 'https://auth.pingone.com',
      'eu': 'https://auth.pingone.eu',
      'ca': 'https://auth.pingone.ca',
      'ap': 'https://auth.pingone.asia'
    };

    return regionMap[region.toLowerCase()] || regionMap['us'];
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.discovery('DiscoveryService', 'Discovery cache cleared');
  }

  /**
   * Get cached configuration if available
   */
  getCachedConfiguration(environmentId: string, region: string = 'us'): OpenIDConfiguration | null {
    const cacheKey = `${environmentId}-${region}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.config;
    }
    
    return null;
  }

  /**
   * Validate environment ID format
   */
  validateEnvironmentId(environmentId: string): boolean {
    // PingOne environment IDs are typically UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(environmentId);
  }

  /**
   * Extract environment ID from PingOne URL
   */
  extractEnvironmentIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Look for environment ID in common PingOne URL patterns
      for (let i = 0; i < pathParts.length; i++) {
        if (this.validateEnvironmentId(pathParts[i])) {
          return pathParts[i];
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

export const discoveryService = new DiscoveryService();
export default discoveryService;


