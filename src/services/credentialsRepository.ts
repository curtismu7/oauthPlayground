/**
 * CredentialsRepository - Unified credentials storage for all flows
 * 
 * Consolidates:
 * - CredentialsServiceV8 (117 imports)
 * - SharedCredentialsServiceV8 (20+ imports)
 * - FlowCredentialService (30+ imports)
 * - credentialReloadServiceV8U (10+ imports)
 * 
 * Features:
 * - Flow-specific credentials (per flow type)
 * - Shared/global credentials (environment ID, default client)
 * - Migration from old storage keys
 * - Event listeners for credential changes
 * - Backward compatibility (1 release cycle)
 */

import { createStorageRepository } from './storageRepository';

export interface Credentials {
  clientId?: string;
  clientSecret?: string;
  environmentId?: string;
  issuerUrl?: string;
  redirectUri?: string;
  scopes?: string[];
  responseType?: string;
  grantType?: string;
  tokenEndpointAuthMethod?: string;
  pkceMethod?: string;
  maxAge?: string;
  loginHint?: string;
  acrValues?: string;
  prompt?: string;
  display?: string;
  uiLocales?: string;
  idTokenHint?: string;
  claims?: string;
  resource?: string;
  audience?: string;
  [key: string]: unknown;
}

export interface SharedCredentials {
  environmentId?: string;
  defaultClientId?: string;
  defaultIssuerUrl?: string;
  defaultRedirectUri?: string;
}

type CredentialsChangeListener = (credentials: Credentials) => void;
type EnvironmentIdChangeListener = (environmentId: string) => void;

class CredentialsRepositoryImpl {
  private storage = createStorageRepository({ prefix: 'credentials_repo_' });
  private credentialsListeners = new Map<string, Set<CredentialsChangeListener>>();
  private environmentIdListeners = new Set<EnvironmentIdChangeListener>();
  private migrated = false;

  constructor() {
    this.ensureMigration();
  }

  getFlowCredentials(flowKey: string): Credentials | null {
    return this.storage.get<Credentials>(`flow_${flowKey}`);
  }

  setFlowCredentials(flowKey: string, credentials: Credentials): void {
    this.storage.set(`flow_${flowKey}`, credentials);
    this.notifyCredentialsListeners(flowKey, credentials);
  }

  clearFlowCredentials(flowKey: string): void {
    this.storage.remove(`flow_${flowKey}`);
    this.notifyCredentialsListeners(flowKey, {});
  }

  getSharedCredentials(): SharedCredentials | null {
    return this.storage.get<SharedCredentials>('shared');
  }

  setSharedCredentials(credentials: SharedCredentials): void {
    this.storage.set('shared', credentials);
    
    if (credentials.environmentId) {
      this.notifyEnvironmentIdListeners(credentials.environmentId);
    }
  }

  getEnvironmentId(): string | null {
    const shared = this.getSharedCredentials();
    return shared?.environmentId ?? null;
  }

  setEnvironmentId(environmentId: string): void {
    const shared = this.getSharedCredentials() ?? {};
    this.setSharedCredentials({ ...shared, environmentId });
  }

  reloadFlowCredentials(flowKey: string): Credentials | null {
    const credentials = this.getFlowCredentials(flowKey);
    
    if (credentials) {
      this.notifyCredentialsListeners(flowKey, credentials);
    }
    
    return credentials;
  }

  onCredentialsChanged(flowKey: string, callback: CredentialsChangeListener): () => void {
    if (!this.credentialsListeners.has(flowKey)) {
      this.credentialsListeners.set(flowKey, new Set());
    }
    
    this.credentialsListeners.get(flowKey)!.add(callback);
    
    return () => {
      this.credentialsListeners.get(flowKey)?.delete(callback);
    };
  }

  onEnvironmentIdChanged(callback: EnvironmentIdChangeListener): () => void {
    this.environmentIdListeners.add(callback);
    
    return () => {
      this.environmentIdListeners.delete(callback);
    };
  }

  private notifyCredentialsListeners(flowKey: string, credentials: Credentials): void {
    const listeners = this.credentialsListeners.get(flowKey);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(credentials);
        } catch (error) {
          console.error(`[CredentialsRepository] Error in credentials listener for "${flowKey}":`, error);
        }
      });
    }
  }

  private notifyEnvironmentIdListeners(environmentId: string): void {
    this.environmentIdListeners.forEach(listener => {
      try {
        listener(environmentId);
      } catch (error) {
        console.error('[CredentialsRepository] Error in environment ID listener:', error);
      }
    });
  }

  private ensureMigration(): void {
    if (this.migrated) {
      return;
    }

    const migrationKey = 'credentials_repo_migrated';
    const alreadyMigrated = localStorage.getItem(migrationKey);
    
    if (alreadyMigrated === 'true') {
      this.migrated = true;
      return;
    }

    console.log('[CredentialsRepository] Running migration from old storage keys...');

    const oldToNewMap: Record<string, string> = {
      'credentials_v8_unified-oauth': 'credentials_repo_flow_unified-oauth',
      'credentials_v8_unified-oidc': 'credentials_repo_flow_unified-oidc',
      'credentials_v8_mfa-sms': 'credentials_repo_flow_mfa-sms',
      'credentials_v8_mfa-email': 'credentials_repo_flow_mfa-email',
      'credentials_v8_mfa-fido2': 'credentials_repo_flow_mfa-fido2',
      'credentials_v8_mfa-voice': 'credentials_repo_flow_mfa-voice',
      'credentials_v8_mfa-totp': 'credentials_repo_flow_mfa-totp',
      'shared_credentials_v8': 'credentials_repo_shared',
      'environment_id': 'credentials_repo_shared',
    };

    let migratedCount = 0;

    Object.entries(oldToNewMap).forEach(([oldKey, newKey]) => {
      try {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue !== null) {
          if (oldKey === 'environment_id') {
            const envId = JSON.parse(oldValue) as string;
            const shared = this.getSharedCredentials() ?? {};
            this.setSharedCredentials({ ...shared, environmentId: envId });
          } else {
            localStorage.setItem(newKey, oldValue);
          }
          migratedCount++;
        }
      } catch (error) {
        console.error(`[CredentialsRepository] Error migrating "${oldKey}":`, error);
      }
    });

    localStorage.setItem(migrationKey, 'true');
    this.migrated = true;

    if (migratedCount > 0) {
      console.log(`[CredentialsRepository] Migration complete. Migrated ${migratedCount} keys.`);
    }
  }

  migrate(): void {
    this.migrated = false;
    this.ensureMigration();
  }
}

export const CredentialsRepository = new CredentialsRepositoryImpl();

export function createCredentialsRepository(): CredentialsRepositoryImpl {
  return new CredentialsRepositoryImpl();
}
