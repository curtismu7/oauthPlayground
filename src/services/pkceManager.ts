/**
 * PkceManager - PKCE generation and storage for OAuth 2.0 flows
 * 
 * Consolidates:
 * - pkceService (40+ imports)
 * - pkceStorageServiceV8U (20+ imports)
 * 
 * Features:
 * - SHA-256 challenge generation
 * - Storage in sessionStorage
 * - Automatic cleanup after token exchange
 * 
 * OAuth 2.0 RFC 7636 (PKCE):
 * "PKCE (RFC 7636) is a technique to secure public clients against
 * authorization code interception attacks."
 */

class PkceManagerImpl {
  private storagePrefix = 'pkce_';

  generate(): { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' } {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
    };
  }

  store(codes: { codeVerifier: string; codeChallenge: string; codeChallengeMethod: string }, flowKey: string): void {
    const key = this.getStorageKey(flowKey);

    try {
      sessionStorage.setItem(key, JSON.stringify(codes));
      console.log(`[PkceManager] Stored PKCE codes for flow "${flowKey}"`);
    } catch (error) {
      console.error(`[PkceManager] Error storing PKCE codes for flow "${flowKey}":`, error);
      throw new Error('Failed to store PKCE codes');
    }
  }

  retrieve(flowKey: string): { codeVerifier: string; codeChallenge: string; codeChallengeMethod: string } | null {
    const key = this.getStorageKey(flowKey);

    try {
      const value = sessionStorage.getItem(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`[PkceManager] Error retrieving PKCE codes for flow "${flowKey}":`, error);
      return null;
    }
  }

  clear(flowKey: string): void {
    const key = this.getStorageKey(flowKey);

    try {
      sessionStorage.removeItem(key);
      console.log(`[PkceManager] Cleared PKCE codes for flow "${flowKey}"`);
    } catch (error) {
      console.error(`[PkceManager] Error clearing PKCE codes for flow "${flowKey}":`, error);
    }
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private generateCodeChallenge(codeVerifier: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      return this.base64UrlEncode(new Uint8Array(hash));
    }).then(challenge => challenge) as unknown as string;
  }

  async generateAsync(): Promise<{ codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' }> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallengeAsync(codeVerifier);

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
    };
  }

  private async generateCodeChallengeAsync(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }

  private base64UrlEncode(array: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...array));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private getStorageKey(flowKey: string): string {
    return `${this.storagePrefix}${flowKey}`;
  }
}

export const PkceManager = new PkceManagerImpl();

export function createPkceManager(): PkceManagerImpl {
  return new PkceManagerImpl();
}
