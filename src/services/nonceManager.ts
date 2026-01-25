/**
 * NonceManager - Replay protection for OIDC ID tokens
 * 
 * Security Requirements:
 * - Cryptographically random nonce (32 bytes)
 * - Storage in sessionStorage (not localStorage for security)
 * - One-time use (clear after validation)
 * - Reject reused nonce (throw error)
 * 
 * OIDC Core 1.0 Section 3.1.2.1:
 * "String value used to associate a Client session with an ID Token,
 * and to mitigate replay attacks. The value is passed through unmodified
 * from the Authentication Request to the ID Token."
 */

class NonceManagerImpl {
  private storagePrefix = 'oidc_nonce_';

  generate(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  store(nonce: string, flowKey: string): void {
    const key = this.getStorageKey(flowKey);
    
    try {
      sessionStorage.setItem(key, nonce);
      console.log(`[NonceManager] Stored nonce for flow "${flowKey}"`);
    } catch (error) {
      console.error(`[NonceManager] Error storing nonce for flow "${flowKey}":`, error);
      throw new Error('Failed to store nonce parameter');
    }
  }

  retrieve(flowKey: string): string | null {
    const key = this.getStorageKey(flowKey);
    
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error(`[NonceManager] Error retrieving nonce for flow "${flowKey}":`, error);
      return null;
    }
  }

  validate(received: string, flowKey: string): boolean {
    const expected = this.retrieve(flowKey);
    
    if (!expected) {
      console.error(`[NonceManager] No nonce found for flow "${flowKey}"`);
      return false;
    }

    if (received !== expected) {
      console.error(`[NonceManager] Nonce mismatch for flow "${flowKey}"`);
      return false;
    }

    this.clear(flowKey);
    console.log(`[NonceManager] Nonce validated successfully for flow "${flowKey}"`);
    return true;
  }

  clear(flowKey: string): void {
    const key = this.getStorageKey(flowKey);
    
    try {
      sessionStorage.removeItem(key);
      console.log(`[NonceManager] Cleared nonce for flow "${flowKey}"`);
    } catch (error) {
      console.error(`[NonceManager] Error clearing nonce for flow "${flowKey}":`, error);
    }
  }

  private getStorageKey(flowKey: string): string {
    return `${this.storagePrefix}${flowKey}`;
  }
}

export const NonceManager = new NonceManagerImpl();

export function createNonceManager(): NonceManagerImpl {
  return new NonceManagerImpl();
}
