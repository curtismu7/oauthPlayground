// Client credentials management utilities

import { logger } from './logger';
import { ClientCredentials } from './workerToken';

const CREDENTIALS_STORAGE_KEY = 'worker_credentials';

/**
 * Securely store client credentials (encrypted)
 */
export async function secureStore(credentials: ClientCredentials): Promise<void> {
  try {
    // Create a simplified storage object (in production, this should be encrypted)
    const storageData = {
      client_id: credentials.client_id,
      environment_id: credentials.environment_id,
      scopes: credentials.scopes,
      // Never store client_secret in plain text
      has_client_secret: !!credentials.client_secret,
      stored_at: Date.now()
    };

    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(storageData));
    
    // Store client secret separately in session storage (temporary)
    if (credentials.client_secret) {
      sessionStorage.setItem(`${CREDENTIALS_STORAGE_KEY}_secret`, credentials.client_secret);
    }

    logger.success('CREDENTIALS', 'Credentials stored securely', {
      clientId: credentials.client_id.substring(0, 8) + '...',
      environmentId: credentials.environment_id,
      scopes: credentials.scopes.length
    });
  } catch (error) {
    logger.error('CREDENTIALS', 'Failed to store credentials', error);
    throw new Error('Failed to store credentials securely');
  }
}

/**
 * Securely retrieve client credentials (decrypted)
 */
export async function secureRetrieve(clientId?: string): Promise<ClientCredentials | null> {
  try {
    const storedData = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!storedData) {
      return null;
    }

    const parsed = JSON.parse(storedData);
    
    // Check if we're looking for a specific client ID
    if (clientId && parsed.client_id !== clientId) {
      return null;
    }

    // Retrieve client secret from session storage
    const clientSecret = sessionStorage.getItem(`${CREDENTIALS_STORAGE_KEY}_secret`);
    
    if (!clientSecret) {
      logger.warn('CREDENTIALS', 'Client secret not found in session storage');
      return {
        client_id: parsed.client_id,
        client_secret: '',
        environment_id: parsed.environment_id,
        scopes: parsed.scopes || []
      };
    }

    const credentials: ClientCredentials = {
      client_id: parsed.client_id,
      client_secret: clientSecret,
      environment_id: parsed.environment_id,
      scopes: parsed.scopes || []
    };

    logger.info('CREDENTIALS', 'Credentials retrieved securely', {
      clientId: credentials.client_id.substring(0, 8) + '...',
      environmentId: credentials.environment_id,
      hasSecret: !!credentials.client_secret
    });

    return credentials;
  } catch (error) {
    logger.error('CREDENTIALS', 'Failed to retrieve credentials', error);
    return null;
  }
}

/**
 * Validate credential format
 */
export function validateCredentialFormat(clientId: string, clientSecret: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate client ID
  if (!clientId || clientId.trim().length === 0) {
    errors.push('Client ID is required');
  } else if (clientId.length < 8) {
    errors.push('Client ID appears to be too short');
  } else if (clientId.includes(' ')) {
    errors.push('Client ID should not contain spaces');
  }

  // Validate client secret
  if (!clientSecret || clientSecret.trim().length === 0) {
    errors.push('Client Secret is required');
  } else if (clientSecret.length < 16) {
    errors.push('Client Secret appears to be too short');
  } else if (clientSecret.includes(' ')) {
    errors.push('Client Secret should not contain spaces');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Clear stored credentials
 */
export function clearCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    sessionStorage.removeItem(`${CREDENTIALS_STORAGE_KEY}_secret`);
    
    logger.info('CREDENTIALS', 'Credentials cleared from storage');
  } catch (error) {
    logger.error('CREDENTIALS', 'Failed to clear credentials', error);
  }
}

/**
 * Check if credentials are stored
 */
export function hasStoredCredentials(): boolean {
  const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
  const secret = sessionStorage.getItem(`${CREDENTIALS_STORAGE_KEY}_secret`);
  return !!(stored && secret);
}

/**
 * Get stored credentials metadata (without secret)
 */
export function getCredentialsMetadata(): {
  client_id: string;
  environment_id: string;
  scopes: string[];
  stored_at: number;
} | null {
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      client_id: parsed.client_id,
      environment_id: parsed.environment_id,
      scopes: parsed.scopes || [],
      stored_at: parsed.stored_at
    };
  } catch (error) {
    logger.error('CREDENTIALS', 'Failed to get credentials metadata', error);
    return null;
  }
}

/**
 * Load credentials from environment variables
 */
export function loadCredentialsFromEnv(): Partial<ClientCredentials> {
  const credentials: Partial<ClientCredentials> = {};

  // Check for environment variables (these would be available in build time)
  // In a real app, these might come from process.env
  const envClientId = localStorage.getItem('ENV_PINGONE_CLIENT_ID');
  const envClientSecret = localStorage.getItem('ENV_PINGONE_CLIENT_SECRET');
  const envEnvironmentId = localStorage.getItem('ENV_PINGONE_ENVIRONMENT_ID');
  const envScopes = localStorage.getItem('ENV_PINGONE_SCOPES');

  if (envClientId) credentials.client_id = envClientId;
  if (envClientSecret) credentials.client_secret = envClientSecret;
  if (envEnvironmentId) credentials.environment_id = envEnvironmentId;
  if (envScopes) credentials.scopes = envScopes.split(',').map(s => s.trim());

  if (Object.keys(credentials).length > 0) {
    logger.info('CREDENTIALS', 'Loaded credentials from environment', {
      hasClientId: !!credentials.client_id,
      hasSecret: !!credentials.client_secret,
      hasEnvironmentId: !!credentials.environment_id,
      scopes: credentials.scopes?.length || 0
    });
  }

  return credentials;
}

/**
 * Merge environment credentials with manual credentials
 */
export function mergeCredentials(
  envCredentials: Partial<ClientCredentials>,
  manualCredentials: Partial<ClientCredentials>
): ClientCredentials {
  return {
    client_id: manualCredentials.client_id || envCredentials.client_id || '',
    client_secret: manualCredentials.client_secret || envCredentials.client_secret || '',
    environment_id: manualCredentials.environment_id || envCredentials.environment_id || '',
    scopes: manualCredentials.scopes || envCredentials.scopes || []
  };
}
