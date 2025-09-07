// Enhanced Token Lifecycle Management
import { OAuthTokens } from './tokenStorage';

export interface TokenLifecycleInfo {
  tokenId: string;
  flowType: string;
  flowName: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date;
  usageCount: number;
  isExpired: boolean;
  expiresIn: number; // seconds until expiration
  isRefreshable: boolean;
  refreshToken?: string;
}

export interface TokenSecurityAnalysis {
  tokenId: string;
  securityScore: number; // 0-100
  recommendations: string[];
  warnings: string[];
  strengths: string[];
  vulnerabilities: string[];
}

export interface TokenUsageAnalytics {
  totalTokens: number;
  activeTokens: number;
  expiredTokens: number;
  mostUsedFlow: string;
  averageTokenLifetime: number; // in minutes
  tokenUsageByFlow: Record<string, number>;
  recentActivity: Array<{
    timestamp: Date;
    action: string;
    flowType: string;
    tokenId: string;
  }>;
}

class TokenLifecycleManager {
  private readonly LIFECYCLE_KEY = 'pingone_playground_token_lifecycle';
  private readonly ANALYTICS_KEY = 'pingone_playground_token_analytics';

  /**
   * Register a new token in the lifecycle system
   */
  registerToken(tokens: OAuthTokens, flowType: string, flowName: string): string {
    const tokenId = this.generateTokenId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (tokens.expires_in * 1000));

    const lifecycleInfo: TokenLifecycleInfo = {
      tokenId,
      flowType,
      flowName,
      createdAt: now,
      expiresAt,
      lastUsed: now,
      usageCount: 1,
      isExpired: false,
      expiresIn: tokens.expires_in,
      isRefreshable: !!tokens.refresh_token,
      refreshToken: tokens.refresh_token
    };

    this.updateLifecycleData(lifecycleInfo);
    this.updateAnalytics('token_created', flowType, tokenId);
    
    return tokenId;
  }

  /**
   * Update token usage when accessed
   */
  updateTokenUsage(tokenId: string): void {
    const lifecycleData = this.getLifecycleData();
    const tokenInfo = lifecycleData.find(t => t.tokenId === tokenId);
    
    if (tokenInfo) {
      tokenInfo.lastUsed = new Date();
      tokenInfo.usageCount++;
      tokenInfo.isExpired = new Date() > tokenInfo.expiresAt;
      
      this.updateLifecycleData(tokenInfo);
      this.updateAnalytics('token_accessed', tokenInfo.flowType, tokenId);
    }
  }

  /**
   * Get token lifecycle information
   */
  getTokenLifecycleInfo(tokenId: string): TokenLifecycleInfo | null {
    const lifecycleData = this.getLifecycleData();
    return lifecycleData.find(t => t.tokenId === tokenId) || null;
  }

  /**
   * Get all token lifecycle information
   */
  getAllTokenLifecycleInfo(): TokenLifecycleInfo[] {
    return this.getLifecycleData();
  }

  /**
   * Analyze token security
   */
  analyzeTokenSecurity(tokenId: string): TokenSecurityAnalysis {
    const tokenInfo = this.getTokenLifecycleInfo(tokenId);
    if (!tokenInfo) {
      throw new Error('Token not found');
    }

    const analysis: TokenSecurityAnalysis = {
      tokenId,
      securityScore: 0,
      recommendations: [],
      warnings: [],
      strengths: [],
      vulnerabilities: []
    };

    // Calculate security score based on various factors
    let score = 100;

    // Check expiration
    if (tokenInfo.isExpired) {
      score -= 50;
      analysis.warnings.push('Token has expired');
    } else if (tokenInfo.expiresIn < 300) { // Less than 5 minutes
      score -= 20;
      analysis.warnings.push('Token expires soon');
    }

    // Check usage patterns
    if (tokenInfo.usageCount > 100) {
      score -= 10;
      analysis.warnings.push('High usage count may indicate security risk');
    }

    // Check token age
    const ageInHours = (Date.now() - tokenInfo.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      score -= 15;
      analysis.warnings.push('Token is older than 24 hours');
    }

    // Check refresh capability
    if (tokenInfo.isRefreshable) {
      score += 10;
      analysis.strengths.push('Token has refresh capability');
    } else {
      analysis.warnings.push('Token cannot be refreshed');
    }

    // Check flow type security
    if (tokenInfo.flowType === 'authorization_code') {
      score += 5;
      analysis.strengths.push('Uses secure authorization code flow');
    } else if (tokenInfo.flowType === 'implicit') {
      score -= 10;
      analysis.vulnerabilities.push('Uses less secure implicit flow');
    }

    analysis.securityScore = Math.max(0, Math.min(100, score));

    // Generate recommendations
    if (analysis.securityScore < 70) {
      analysis.recommendations.push('Consider refreshing or regenerating this token');
    }
    if (tokenInfo.isExpired) {
      analysis.recommendations.push('Token has expired - obtain a new one');
    }
    if (!tokenInfo.isRefreshable) {
      analysis.recommendations.push('Consider using flows that support token refresh');
    }

    return analysis;
  }

  /**
   * Get token usage analytics
   */
  getTokenUsageAnalytics(): TokenUsageAnalytics {
    const lifecycleData = this.getLifecycleData();
    const analyticsData = this.getAnalyticsData();

    const totalTokens = lifecycleData.length;
    const activeTokens = lifecycleData.filter(t => !t.isExpired).length;
    const expiredTokens = lifecycleData.filter(t => t.isExpired).length;

    // Calculate most used flow
    const flowUsage: Record<string, number> = {};
    lifecycleData.forEach(token => {
      flowUsage[token.flowType] = (flowUsage[token.flowType] || 0) + token.usageCount;
    });
    const mostUsedFlow = Object.entries(flowUsage).reduce((a, b) => 
      flowUsage[a[0]] > flowUsage[b[0]] ? a : b
    )[0] || 'None';

    // Calculate average token lifetime
    const totalLifetime = lifecycleData.reduce((sum, token) => {
      const lifetime = token.expiresAt.getTime() - token.createdAt.getTime();
      return sum + lifetime;
    }, 0);
    const averageTokenLifetime = totalLifetime / (totalTokens || 1) / (1000 * 60); // in minutes

    return {
      totalTokens,
      activeTokens,
      expiredTokens,
      mostUsedFlow,
      averageTokenLifetime,
      tokenUsageByFlow: flowUsage,
      recentActivity: analyticsData.slice(-10) // Last 10 activities
    };
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): number {
    const lifecycleData = this.getLifecycleData();
    const now = new Date();
    const activeTokens = lifecycleData.filter(token => token.expiresAt > now);
    const expiredCount = lifecycleData.length - activeTokens.length;

    if (expiredCount > 0) {
      localStorage.setItem(this.LIFECYCLE_KEY, JSON.stringify(activeTokens));
      this.updateAnalytics('cleanup_expired', 'system', 'system');
    }

    return expiredCount;
  }

  /**
   * Export token data for sharing
   */
  exportTokenData(tokenId: string): string {
    const tokenInfo = this.getTokenLifecycleInfo(tokenId);
    if (!tokenInfo) {
      throw new Error('Token not found');
    }

    const exportData = {
      tokenId: tokenInfo.tokenId,
      flowType: tokenInfo.flowType,
      flowName: tokenInfo.flowName,
      createdAt: tokenInfo.createdAt.toISOString(),
      expiresAt: tokenInfo.expiresAt.toISOString(),
      usageCount: tokenInfo.usageCount,
      isExpired: tokenInfo.isExpired,
      securityAnalysis: this.analyzeTokenSecurity(tokenId)
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate unique token ID
   */
  private generateTokenId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get lifecycle data from storage
   */
  private getLifecycleData(): TokenLifecycleInfo[] {
    try {
      const stored = localStorage.getItem(this.LIFECYCLE_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return data.map((item: Record<string, unknown>) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: new Date(item.expiresAt),
        lastUsed: new Date(item.lastUsed)
      }));
    } catch (error) {
      console.error('Failed to get lifecycle data:', error);
      return [];
    }
  }

  /**
   * Update lifecycle data in storage
   */
  private updateLifecycleData(tokenInfo: TokenLifecycleInfo): void {
    try {
      const lifecycleData = this.getLifecycleData();
      const existingIndex = lifecycleData.findIndex(t => t.tokenId === tokenInfo.tokenId);
      
      if (existingIndex >= 0) {
        lifecycleData[existingIndex] = tokenInfo;
      } else {
        lifecycleData.push(tokenInfo);
      }

      localStorage.setItem(this.LIFECYCLE_KEY, JSON.stringify(lifecycleData));
    } catch (error) {
      console.error('Failed to update lifecycle data:', error);
    }
  }

  /**
   * Get analytics data from storage
   */
  private getAnalyticsData(): Array<{
    timestamp: Date;
    action: string;
    flowType: string;
    tokenId: string;
  }> {
    try {
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return data.map((item: Record<string, unknown>) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return [];
    }
  }

  /**
   * Update analytics data
   */
  private updateAnalytics(action: string, flowType: string, tokenId: string): void {
    try {
      const analyticsData = this.getAnalyticsData();
      analyticsData.push({
        timestamp: new Date(),
        action,
        flowType,
        tokenId
      });

      // Keep only last 1000 entries
      if (analyticsData.length > 1000) {
        analyticsData.splice(0, analyticsData.length - 1000);
      }

      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analyticsData));
    } catch (error) {
      console.error('Failed to update analytics data:', error);
    }
  }
}

export const tokenLifecycleManager = new TokenLifecycleManager();
export default tokenLifecycleManager;
