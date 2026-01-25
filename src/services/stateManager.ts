/**
 * StateManager - CSRF protection for OAuth/OIDC flows
 * 
 * Security Requirements:
 * - Cryptographically random state (32 bytes)
 * - Storage in sessionStorage (not localStorage for security)
 * - Automatic cleanup after validation
 * - Reject mismatched state (throw error)
 * 
 * OAuth 2.0 RFC 6749 Section 10.12:
 * "The client MUST implement CSRF protection for its redirection URI.
 * This is typically accomplished by requiring any request sent to the
 * redirection URI endpoint to include a value that binds the request to
 * the user-agent's authenticated state."
 */

class StateManagerImpl {
  private storagePrefix = 'oauth_state_';

  generate(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  store(state: string, flowKey: string): void {
    const key = this.getStorageKey(flowKey);
    
    try {
      sessionStorage.setItem(key, state);
      console.log(`[StateManager] Stored state for flow "${flowKey}"`);
    } catch (error) {
      console.error(`[StateManager] Error storing state for flow "${flowKey}":`, error);
      throw new Error('Failed to store state parameter');
    }
  }

  retrieve(flowKey: string): string | null {
    const key = this.getStorageKey(flowKey);
    
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error(`[StateManager] Error retrieving state for flow "${flowKey}":`, error);
      return null;
    }
  }

  validate(received: string, flowKey: string): boolean {
    const expected = this.retrieve(flowKey);
    
    if (!expected) {
      console.error(`[StateManager] No state found for flow "${flowKey}"`);
      return false;
    }

    if (received !== expected) {
      console.error(`[StateManager] State mismatch for flow "${flowKey}"`);
      return false;
    }

    this.clear(flowKey);
    console.log(`[StateManager] State validated successfully for flow "${flowKey}"`);
    return true;
  }

  clear(flowKey: string): void {
    const key = this.getStorageKey(flowKey);
    
    try {
      sessionStorage.removeItem(key);
      console.log(`[StateManager] Cleared state for flow "${flowKey}"`);
    } catch (error) {
      console.error(`[StateManager] Error clearing state for flow "${flowKey}":`, error);
    }
  }

  private getStorageKey(flowKey: string): string {
    return `${this.storagePrefix}${flowKey}`;
  }
}

export const StateManager = new StateManagerImpl();

export function createStateManager(): StateManagerImpl {
  return new StateManagerImpl();
}
