// src/services/configComparisonService.ts
// PingOne Configuration Comparison Service for diffing form data against live applications

import { createPingOneClient, makeApiRequest } from '../utils/apiClient';

export interface ConfigDiffResult {
  hasDiffs: boolean;
  diffs: Array<{
    path: string;
    expected?: unknown;
    actual?: unknown;
    change: 'added' | 'removed' | 'mismatch';
  }>;
  normalizedRemote: Record<string, unknown>;
  normalizedDesired: Record<string, unknown>;
}

export class ConfigComparisonService {
  constructor(private token: string, private environmentId: string, private region: string) {}

  async compare(clientId: string, formData: Record<string, unknown>): Promise<ConfigDiffResult> {
    try {
      const client = createPingOneClient(this.token, this.environmentId, this.region);
      
      // Add timestamp to ensure fresh data is fetched every time
      const timestamp = Date.now();
      console.log(`[CONFIG-COMPARISON] Fetching fresh PingOne data at ${new Date(timestamp).toISOString()}`);
      const response = await makeApiRequest<any>(client, `/applications?t=${timestamp}&_=${Math.random()}`);
      const applications = response._embedded?.applications || [];
      console.log(`[CONFIG-COMPARISON] Fetched ${applications.length} applications from PingOne`);
      
      // Find the application with matching clientId
      const app = applications.find((app: any) => app.clientId === clientId);
      
      if (!app) {
        return {
          hasDiffs: true,
          diffs: [{ 
            path: 'application', 
            expected: 'Existing PingOne app', 
            actual: 'Not found', 
            change: 'removed' 
          }],
          normalizedRemote: {},
          normalizedDesired: this.normalize(formData),
        };
      }

      const normalizedRemote = this.normalize(app);
      const normalizedDesired = this.normalize(formData);
      
      return {
        hasDiffs: JSON.stringify(normalizedRemote) !== JSON.stringify(normalizedDesired),
        diffs: this.diff(normalizedRemote, normalizedDesired),
        normalizedRemote,
        normalizedDesired,
      };
    } catch (error) {
      console.error('[ConfigComparisonService] Error comparing configuration:', error);
      throw new Error(`Failed to compare configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private normalize(source: Record<string, unknown>): Record<string, unknown> {
    const pick = (key: string) => source[key];
    return {
      // Skip name and description - these are display-only and not functional
      grantTypes: this.normalizeArray(pick('grantTypes') as string[] | undefined || pick('grant_types') as string[] | undefined),
      responseTypes: this.normalizeArray(pick('responseTypes') as string[] | undefined || pick('response_types') as string[] | undefined),
      redirectUris: this.normalizeArray(pick('redirectUris') as string[] | undefined || pick('redirect_uris') as string[] | undefined),
      postLogoutRedirectUris: this.normalizeArray(pick('postLogoutRedirectUris') as string[] | undefined || pick('post_logout_redirect_uris') as string[] | undefined),
      scopes: this.normalizeArray(pick('scopes') as string[] | undefined),
      tokenEndpointAuthMethod: pick('tokenEndpointAuthMethod') ?? pick('token_endpoint_auth_method'),
      pkceEnforcement: pick('pkceEnforcement') ?? pick('pkce_enforcement'),
    };
  }

  private normalizeArray(values?: string[]): string[] | undefined {
    if (!values || values.length === 0) return undefined;
    return Array.from(new Set(values.map((value) => value.trim().toLowerCase()))).sort();
  }

  private diff(expected: Record<string, unknown>, actual: Record<string, unknown> = {}): ConfigDiffResult['diffs'] {
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    const diffs: ConfigDiffResult['diffs'] = [];
    
    keys.forEach((key) => {
      const e = expected[key];
      const a = actual[key];
      
      if (e === undefined && a === undefined) return;
      
      if (e !== undefined && a === undefined) {
        diffs.push({ path: key, expected: e, actual: undefined, change: 'added' });
      } else if (e === undefined && a !== undefined) {
        diffs.push({ path: key, expected: undefined, actual: a, change: 'removed' });
      } else if (!this.valuesEqual(e, a, key)) {
        diffs.push({ path: key, expected: e, actual: a, change: 'mismatch' });
      }
    });
    
    return diffs;
  }

  private valuesEqual(expected: unknown, actual: unknown, key: string): boolean {
    // For grantTypes and responseTypes, we already normalized to lowercase in normalizeArray
    // So they should be equal if they're the same after normalization
    if (key === 'grantTypes' || key === 'responseTypes') {
      return JSON.stringify(expected) === JSON.stringify(actual);
    }
    
    // For redirectUris, check if any of the expected URIs match any of the actual URIs
    if (key === 'redirectUris') {
      return this.redirectUrisMatch(expected, actual);
    }
    
    // For tokenEndpointAuthMethod, do case-insensitive comparison
    if (key === 'tokenEndpointAuthMethod') {
      const expectedStr = String(expected || '').toLowerCase().trim();
      const actualStr = String(actual || '').toLowerCase().trim();
      return expectedStr === actualStr;
    }
    
    // For other fields, use standard comparison
    return JSON.stringify(expected) === JSON.stringify(actual);
  }

  private redirectUrisMatch(expected: unknown, actual: unknown): boolean {
    const expectedUris = Array.isArray(expected) ? expected : [];
    const actualUris = Array.isArray(actual) ? actual : [];
    
    // If either is empty, they're not equal
    if (expectedUris.length === 0 || actualUris.length === 0) {
      return expectedUris.length === actualUris.length;
    }
    
    // Check if any expected URI matches any actual URI
    return expectedUris.some(expectedUri => 
      actualUris.some(actualUri => 
        String(expectedUri).trim() === String(actualUri).trim()
      )
    );
  }
}