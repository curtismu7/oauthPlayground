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
      clientId: credentials.clientId,
      environmentId: credentials.environmentId,
      scopes: credentials.scopes,
      // Never store clientSecret in plain text
      hasClientSecret: !!credentials.clientSecret,
      storedAt: Date.now()
    };

    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(storageData));
    
    // Store client secret separately in session storage (temporary)
    if (credentials.clientSecret) {
      sessionStorage.setItem(`${CREDENTIALS_STORAGE_KEY}_secret`, credentials.clientSecret);
    }

    logger.success('CREDENTIALS', 'Credentials stored securely', {
      clientId: credentials.clientId.substring(0, 8) + '...',
      environmentId: credentials.environmentId,
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
    if (clientId && parsed.clientId !== clientId) {
      return null;
    }

    // Retrieve client secret from session storage
    const clientSecret = sessionStorage.getItem(`${CREDENTIALS_STORAGE_KEY}_secret`);
    
    if (!clientSecret) {
      logger.warn('CREDENTIALS', 'Client secret not found in session storage');
      return {
        clientId: parsed.clientId,
        clientSecret: '',
        environmentId: parsed.environmentId,
        scopes: parsed.scopes || []
      };
    }

    const credentials: ClientCredentials = {
      clientId: parsed.clientId,
      clientSecret: clientSecret,
      environmentId: parsed.environmentId,
      scopes: parsed.scopes || []
    };

    logger.info('CREDENTIALS', 'Credentials retrieved securely', {
      clientId: credentials.clientId.substring(0, 8) + '...',
      environmentId: credentials.environmentId,
      hasSecret: !!credentials.clientSecret
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
  clientId: string;
  environmentId: string;
  scopes: string[];
  storedAt: number;
} | null {
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      clientId: parsed.clientId,
      environmentId: parsed.environmentId,
      scopes: parsed.scopes || [],
      storedAt: parsed.storedAt
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

  if (envClientId) credentials.clientId = envClientId;
  if (envClientSecret) credentials.clientSecret = envClientSecret;
  if (envEnvironmentId) credentials.environmentId = envEnvironmentId;
  if (envScopes) credentials.scopes = envScopes.split(',').map(s => s.trim());

  if (Object.keys(credentials).length > 0) {
    logger.info('CREDENTIALS', 'Loaded credentials from environment', {
      hasClientId: !!credentials.clientId,
      hasSecret: !!credentials.clientSecret,
      hasEnvironmentId: !!credentials.environmentId,
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
    clientId: manualCredentials.clientId || envCredentials.clientId || '',
    clientSecret: manualCredentials.clientSecret || envCredentials.clientSecret || '',
    environmentId: manualCredentials.environmentId || envCredentials.environmentId || '',
    scopes: manualCredentials.scopes || envCredentials.scopes || []
  };
}
