// Token interface definition
export interface TokenInfo {
  id: string;
  type: 'access_token' | 'refresh_token' | 'id_token';
  value: string;
  expiresAt: number | null;
  issuedAt: number | null;
  scope: string[];
  status: 'active' | 'expiring' | 'expired' | 'error';
  introspectionData: Record<string, unknown> | null;
  isVisible: boolean;
}

export interface TokenMonitoringServiceConfig {
  refreshThreshold?: number; // milliseconds before expiry to trigger refresh
  pollingInterval?: number; // milliseconds between status checks
  enableNotifications?: boolean;
}

export class TokenMonitoringService {
  private static instance: TokenMonitoringService;
  private tokens: Map<string, TokenInfo> = new Map();
  private listeners: Set<(tokens: TokenInfo[]) => void> = new Set();
  private config: TokenMonitoringServiceConfig;
  private pollingTimer: NodeJS.Timeout | null = null;
  private notificationPermission: NotificationPermission = 'default';

  private constructor(config: TokenMonitoringServiceConfig = {}) {
    this.config = {
      refreshThreshold: 5 * 60 * 1000, // 5 minutes
      pollingInterval: 1000, // 1 second
      enableNotifications: true,
      ...config,
    };

    this.initializeNotifications();
    this.startPolling();
  }

  static getInstance(config?: TokenMonitoringServiceConfig): TokenMonitoringService {
    if (!TokenMonitoringService.instance) {
      TokenMonitoringService.instance = new TokenMonitoringService(config);
    }
    return TokenMonitoringService.instance;
  }

  private async initializeNotifications(): Promise<void> {
    if ('Notification' in window && this.config.enableNotifications) {
      this.notificationPermission = await Notification.requestPermission();
    }
  }

  private startPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }

    this.pollingTimer = setInterval(() => {
      this.updateTokenStates();
      this.checkExpiryNotifications();
    }, this.config.pollingInterval);
  }

  private updateTokenStates(): void {
    const currentTime = Date.now();
    let hasChanges = false;

    this.tokens.forEach((token, id) => {
      if (!token.expiresAt) return;

      const timeUntilExpiry = token.expiresAt - currentTime;
      const fiveMinutes = 5 * 60 * 1000;
      
      let newStatus: TokenInfo['status'] = 'active';
      if (timeUntilExpiry <= 0) {
        newStatus = 'expired';
      } else if (timeUntilExpiry <= fiveMinutes) {
        newStatus = 'expiring';
      }

      if (token.status !== newStatus) {
        this.tokens.set(id, { ...token, status: newStatus });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.notifyListeners();
    }
  }

  private checkExpiryNotifications(): void {
    if (!this.config.enableNotifications || this.notificationPermission !== 'granted') {
      return;
    }

    const currentTime = Date.now();
    const threshold = this.config.refreshThreshold || 5 * 60 * 1000;

    this.tokens.forEach((token) => {
      if (!token.expiresAt) return;

      const timeUntilExpiry = token.expiresAt - currentTime;
      
      // Notify when token is about to expire
      if (timeUntilExpiry > 0 && timeUntilExpiry <= threshold && timeUntilExpiry > threshold - 1000) {
        this.showNotification(
          'Token Expiring Soon',
          `${token.type.replace('_', ' ').toUpperCase()} will expire in ${Math.floor(timeUntilExpiry / 60000)} minutes`
        );
      }
      
      // Notify when token has expired
      if (timeUntilExpiry <= 0 && timeUntilExpiry > -1000) {
        this.showNotification(
          'Token Expired',
          `${token.type.replace('_', ' ').toUpperCase()} has expired and needs refresh`
        );
      }
    });
  }

  private showNotification(title: string, body: string): void {
    if (this.notificationPermission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'token-monitoring',
      });
    }
  }

  private notifyListeners(): void {
    const tokens = Array.from(this.tokens.values());
    this.listeners.forEach(listener => listener(tokens));
  }

  // Public API methods
  public addToken(token: Omit<TokenInfo, 'id' | 'status' | 'isVisible' | 'introspectionData'>): string {
    const id = this.generateTokenId();
    const currentTime = Date.now();
    
    let status: TokenInfo['status'] = 'active';
    if (token.expiresAt) {
      const timeUntilExpiry = token.expiresAt - currentTime;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeUntilExpiry <= 0) {
        status = 'expired';
      } else if (timeUntilExpiry <= fiveMinutes) {
        status = 'expiring';
      }
    }

    const fullToken: TokenInfo = {
      ...token,
      id,
      status,
      isVisible: false,
      introspectionData: null,
    };

    this.tokens.set(id, fullToken);
    this.notifyListeners();
    
    return id;
  }

  public removeToken(tokenId: string): boolean {
    const removed = this.tokens.delete(tokenId);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  public updateToken(tokenId: string, updates: Partial<TokenInfo>): boolean {
    const token = this.tokens.get(tokenId);
    if (!token) return false;

    const updatedToken = { ...token, ...updates };
    this.tokens.set(tokenId, updatedToken);
    this.notifyListeners();
    
    return true;
  }

  public getToken(tokenId: string): TokenInfo | undefined {
    return this.tokens.get(tokenId);
  }

  public getAllTokens(): TokenInfo[] {
    return Array.from(this.tokens.values());
  }

  public getTokensByType(type: TokenInfo['type']): TokenInfo[] {
    return this.getAllTokens().filter(token => token.type === type);
  }

  public getActiveTokens(): TokenInfo[] {
    return this.getAllTokens().filter(token => token.status === 'active');
  }

  public getExpiringTokens(): TokenInfo[] {
    return this.getAllTokens().filter(token => token.status === 'expiring');
  }

  public getExpiredTokens(): TokenInfo[] {
    return this.getAllTokens().filter(token => token.status === 'expired');
  }

  public subscribe(listener: (tokens: TokenInfo[]) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call listener with current state
    listener(this.getAllTokens());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async introspectToken(tokenId: string): Promise<any> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    try {
      // Mock introspection - in real implementation, this would call the introspection endpoint
      const introspectionData = {
        active: token.status === 'active',
        scope: token.scope.join(' '),
        client_id: 'mock-client-id',
        username: 'mock-user',
        token_type: token.type,
        exp: token.expiresAt ? Math.floor(token.expiresAt / 1000) : null,
        iat: token.issuedAt ? Math.floor(token.issuedAt / 1000) : null,
        nbf: token.issuedAt ? Math.floor(token.issuedAt / 1000) : null,
        sub: 'mock-subject',
        aud: 'mock-audience',
        iss: 'mock-issuer',
        jti: tokenId,
      };

      this.updateToken(tokenId, { introspectionData });
      return introspectionData;
    } catch (error) {
      console.error('Token introspection failed:', error);
      throw error;
    }
  }

  public async refreshToken(tokenId: string): Promise<string> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    if (token.type !== 'refresh_token') {
      throw new Error('Only refresh tokens can be refreshed');
    }

    try {
      // Mock token refresh - in real implementation, this would call the token endpoint
      const newAccessToken = this.generateMockToken();
      const newExpiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

      // Add new access token
      const newTokenId = this.addToken({
        type: 'access_token',
        value: newAccessToken,
        expiresAt: newExpiresAt,
        issuedAt: Date.now(),
        scope: token.scope,
      });

      // Update refresh token issued time
      this.updateToken(tokenId, { issuedAt: Date.now() });

      return newTokenId;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  public async revokeToken(tokenId: string): Promise<void> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    try {
      // Mock token revocation - in real implementation, this would call the revocation endpoint
      console.log(`Revoking token ${tokenId}`);
      
      // Remove token from monitoring
      this.removeToken(tokenId);
    } catch (error) {
      console.error('Token revocation failed:', error);
      throw error;
    }
  }

  public clearAllTokens(): void {
    this.tokens.clear();
    this.notifyListeners();
  }

  public exportTokenData(): string {
    const exportData = this.getAllTokens().map(token => ({
      type: token.type,
      status: token.status,
      expiresAt: token.expiresAt ? new Date(token.expiresAt).toISOString() : null,
      issuedAt: token.issuedAt ? new Date(token.issuedAt).toISOString() : null,
      scope: token.scope,
      introspectionData: token.introspectionData,
    }));

    return JSON.stringify(exportData, null, 2);
  }

  public importTokenData(data: string): void {
    try {
      const importData = JSON.parse(data);
      
      importData.forEach((tokenData: any) => {
        this.addToken({
          type: tokenData.type,
          value: 'imported-token-placeholder',
          expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).getTime() : null,
          issuedAt: tokenData.issuedAt ? new Date(tokenData.issuedAt).getTime() : null,
          scope: tokenData.scope || [],
        });
      });
    } catch (error) {
      console.error('Failed to import token data:', error);
      throw error;
    }
  }

  public updateConfig(config: Partial<TokenMonitoringServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart polling if interval changed
    if (config.pollingInterval) {
      this.startPolling();
    }
  }

  public destroy(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    
    this.listeners.clear();
    this.tokens.clear();
  }

  // Helper methods
  private generateTokenId(): string {
    return `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMockToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Utility methods for token management
  public getTokenStatistics(): {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    byType: Record<string, number>;
  } {
    const tokens = this.getAllTokens();
    
    return {
      total: tokens.length,
      active: this.getActiveTokens().length,
      expiring: this.getExpiringTokens().length,
      expired: this.getExpiredTokens().length,
      byType: tokens.reduce((acc, token) => {
        acc[token.type] = (acc[token.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  public getTokensExpiringWithin(milliseconds: number): TokenInfo[] {
    const currentTime = Date.now();
    return this.getAllTokens().filter(token => 
      token.expiresAt && 
      token.expiresAt > currentTime && 
      token.expiresAt - currentTime <= milliseconds
    );
  }
}

// Export singleton instance
export const tokenMonitoringService = TokenMonitoringService.getInstance();
