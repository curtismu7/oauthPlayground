/**
 * Token History Storage Utility
 * Tracks all tokens received from different OAuth flows
 */

export interface TokenHistoryEntry {
  id: string;
  flowType: string;
  flowName: string;
  tokens: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
  };
  timestamp: number;
  timestampFormatted: string;
  tokenCount: number;
  hasAccessToken: boolean;
  hasIdToken: boolean;
  hasRefreshToken: boolean;
}

export interface TokenHistory {
  entries: TokenHistoryEntry[];
  totalTokens: number;
  lastUpdated: number;
}

const HISTORY_STORAGE_KEY = 'pingone_playground_token_history';
const MAX_HISTORY_ENTRIES = 50; // Limit history to prevent storage bloat

/**
 * Get token history from localStorage
 */
export const getTokenHistory = (): TokenHistory => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      const history = JSON.parse(stored);
      console.log(' [TokenHistory] Retrieved token history:', history);
      return history;
    }
  } catch (error) {
    console.error(' [TokenHistory] Error retrieving token history:', error);
  }
  
  return {
    entries: [],
    totalTokens: 0,
    lastUpdated: Date.now()
  };
};

/**
 * Add a new token entry to history
 */
export const addTokenToHistory = (
  flowType: string,
  flowName: string,
  tokens: Record<string, unknown>
): boolean => {
  try {
    console.log(' [TokenHistory] addTokenToHistory called with:', { flowType, flowName, hasAccessToken: !!tokens.access_token });
    
    const history = getTokenHistory();
    const now = Date.now();
    
    // Create new entry
    const newEntry: TokenHistoryEntry = {
      id: `token_${now}_${Math.random().toString(36).substr(2, 9)}`,
      flowType,
      flowName,
      tokens: {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        scope: tokens.scope
      },
      timestamp: now,
      timestampFormatted: new Date(now).toLocaleString(),
      tokenCount: Object.keys(tokens).filter(key => 
        key.includes('token') && tokens[key]
      ).length,
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      hasRefreshToken: !!tokens.refresh_token
    };
    
    console.log(' [TokenHistory] Created history entry:', newEntry);
    
    // Add to beginning of array (most recent first)
    history.entries.unshift(newEntry);
    
    // Limit history size
    if (history.entries.length > MAX_HISTORY_ENTRIES) {
      history.entries = history.entries.slice(0, MAX_HISTORY_ENTRIES);
    }
    
    // Update totals
    history.totalTokens = history.entries.reduce((sum, entry) => sum + entry.tokenCount, 0);
    history.lastUpdated = now;
    
    // Save to localStorage
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    
    console.log(' [TokenHistory] Added token to history:', {
      flowType,
      flowName,
      tokenCount: newEntry.tokenCount,
      totalEntries: history.entries.length,
      storageKey: HISTORY_STORAGE_KEY
    });
    
    return true;
  } catch (error) {
    console.error(' [TokenHistory] Error adding token to history:', error);
    return false;
  }
};

/**
 * Clear all token history
 */
export const clearTokenHistory = (): boolean => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    console.log(' [TokenHistory] Cleared all token history');
    return true;
  } catch (error) {
    console.error(' [TokenHistory] Error clearing token history:', error);
    return false;
  }
};

/**
 * Remove a specific token entry from history
 */
export const removeTokenFromHistory = (entryId: string): boolean => {
  try {
    const history = getTokenHistory();
    const initialLength = history.entries.length;
    
    history.entries = history.entries.filter(entry => entry.id !== entryId);
    
    if (history.entries.length < initialLength) {
      // Update totals
      history.totalTokens = history.entries.reduce((sum, entry) => sum + entry.tokenCount, 0);
      history.lastUpdated = Date.now();
      
      // Save updated history
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      
      console.log(' [TokenHistory] Removed token entry:', entryId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(' [TokenHistory] Error removing token from history:', error);
    return false;
  }
};

/**
 * Get flow display name from flow type
 */
export const getFlowDisplayName = (flowType: string): string => {
  const flowNames: Record<string, string> = {
    'authorization_code': 'Authorization Code Flow',
    'implicit': 'Implicit Grant Flow',
    'implicit_oidc': 'Implicit OIDC Flow',
    'pkce': 'PKCE Flow',
    'client_credentials': 'Client Credentials Flow',
    'device_code': 'Device Code Flow',
    'hybrid': 'Hybrid Flow',
    'userinfo': 'UserInfo Endpoint',
    'id_tokens': 'ID Tokens Flow',
    'session_management': 'OIDC Session Management'
  };
  
  return flowNames[flowType] || flowType;
};

/**
 * Get flow icon from flow type
 */
export const getFlowIcon = (flowType: string): string => {
  const flowIcons: Record<string, string> = {
    'authorization_code': '',
    'implicit': '',
    'implicit_oidc': '',
    'pkce': '',
    'client_credentials': '',
    'device_code': '',
    'hybrid': '',
    'userinfo': '',
    'id_tokens': '',
    'session_management': ''
  };
  
  return flowIcons[flowType] || '';
};
