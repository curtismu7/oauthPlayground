import { useState, useCallback, useEffect } from 'react';
import { 
  tokenAnalyzer,
  analyzeToken,
  getTokenRefreshInfo,
  performSecurityAnalysis,
  TokenAnalysisResult,
  TokenRefreshInfo,
  TokenSecurityAnalysis
} from '../utils/tokenAnalysis';
import { logger } from '../utils/logger';

// Token analysis hook configuration
export interface UseTokenAnalysisConfig {
  enabled?: boolean;
  autoAnalyze?: boolean;
  debug?: boolean;
}

// Token analysis state
export interface TokenAnalysisState {
  isAnalyzing: boolean;
  currentAnalysis: TokenAnalysisResult | null;
  refreshInfo: TokenRefreshInfo | null;
  securityAnalysis: TokenSecurityAnalysis | null;
  analysisHistory: TokenAnalysisResult[];
  error: Error | null;
}

// useTokenAnalysis hook
export const useTokenAnalysis = (config: UseTokenAnalysisConfig = {}) => {
  const {
    enabled = true,
    autoAnalyze = false,
    debug = false
  } = config;

  const [state, setState] = useState<TokenAnalysisState>({
    isAnalyzing: false,
    currentAnalysis: null,
    refreshInfo: null,
    securityAnalysis: null,
    analysisHistory: [],
    error: null
  });

  // Analyze a token
  const analyzeTokenValue = useCallback(async (token: string, refreshToken?: string) => {
    if (!enabled || !token) return null;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const analysis = analyzeToken(token);
      const refreshInfo = getTokenRefreshInfo(token, refreshToken);
      const securityAnalysis = performSecurityAnalysis(token);

      setState(prev => ({
        ...prev,
        currentAnalysis: analysis,
        refreshInfo,
        securityAnalysis,
        analysisHistory: [analysis, ...prev.analysisHistory.slice(0, 9)], // Keep last 10
        isAnalyzing: false
      }));

      if (debug) {
        logger.info('[useTokenAnalysis] Token analysis completed', { 
          isValid: analysis.isValid, 
          riskScore: analysis.riskScore 
        });
      }

      return analysis;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        error: err,
        isAnalyzing: false
      }));

      if (debug) {
        logger.error('[useTokenAnalysis] Token analysis failed:', err);
      }

      throw err;
    }
  }, [enabled, debug]);

  // Get token expiration status
  const getTokenExpirationStatus = useCallback(() => {
    if (!state.currentAnalysis?.expiration) {
      return { status: 'unknown', timeRemaining: 0, isExpired: false };
    }

    const now = new Date();
    const expiration = state.currentAnalysis.expiration;
    const timeRemaining = expiration.getTime() - now.getTime();
    const isExpired = timeRemaining <= 0;

    let status: 'valid' | 'expiring' | 'expired' | 'unknown' = 'unknown';
    if (isExpired) {
      status = 'expired';
    } else if (timeRemaining < 5 * 60 * 1000) { // Less than 5 minutes
      status = 'expiring';
    } else {
      status = 'valid';
    }

    return {
      status,
      timeRemaining: Math.max(0, timeRemaining),
      isExpired,
      expiration
    };
  }, [state.currentAnalysis]);

  // Get token security score
  const getTokenSecurityScore = useCallback(() => {
    if (!state.securityAnalysis) {
      return { overall: 0, breakdown: {} };
    }

    return {
      overall: state.securityAnalysis.overallScore,
      breakdown: {
        algorithm: state.securityAnalysis.algorithmSecurity,
        key: state.securityAnalysis.keySecurity,
        claims: state.securityAnalysis.claimSecurity,
        transport: state.securityAnalysis.transportSecurity,
        lifecycle: state.securityAnalysis.lifecycleSecurity
      }
    };
  }, [state.securityAnalysis]);

  // Get token recommendations
  const getTokenRecommendations = useCallback(() => {
    if (!state.currentAnalysis) {
      return [];
    }

    const recommendations = [...state.currentAnalysis.recommendations];

    // Add expiration-specific recommendations
    const expirationStatus = getTokenExpirationStatus();
    if (expirationStatus.status === 'expired') {
      recommendations.unshift('Token has expired - refresh or obtain a new token');
    } else if (expirationStatus.status === 'expiring') {
      recommendations.unshift('Token is expiring soon - consider refreshing');
    }

    // Add security-specific recommendations
    if (state.securityAnalysis) {
      recommendations.push(...state.securityAnalysis.recommendations);
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }, [state.currentAnalysis, state.securityAnalysis, getTokenExpirationStatus]);

  // Get critical issues
  const getCriticalIssues = useCallback(() => {
    if (!state.currentAnalysis) {
      return [];
    }

    return state.currentAnalysis.securityIssues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    );
  }, [state.currentAnalysis]);

  // Get validation errors
  const getValidationErrors = useCallback(() => {
    if (!state.currentAnalysis) {
      return [];
    }

    return state.currentAnalysis.validationErrors.filter(error => 
      error.severity === 'critical' || error.severity === 'high'
    );
  }, [state.currentAnalysis]);

  // Check if token needs refresh
  const needsRefresh = useCallback(() => {
    const expirationStatus = getTokenExpirationStatus();
    return expirationStatus.status === 'expired' || expirationStatus.status === 'expiring';
  }, [getTokenExpirationStatus]);

  // Get token type information
  const getTokenTypeInfo = useCallback(() => {
    if (!state.currentAnalysis) {
      return { type: 'unknown', format: 'unknown' };
    }

    return {
      type: state.currentAnalysis.tokenType,
      format: state.currentAnalysis.format,
      issuer: state.currentAnalysis.issuer,
      audience: state.currentAnalysis.audience,
      subject: state.currentAnalysis.subject,
      scopes: state.currentAnalysis.scopes
    };
  }, [state.currentAnalysis]);

  // Get token claims
  const getTokenClaims = useCallback(() => {
    return state.currentAnalysis?.claims || {};
  }, [state.currentAnalysis]);

  // Clear analysis history
  const clearAnalysisHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysisHistory: []
    }));
  }, []);

  // Export analysis data
  const exportAnalysisData = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      currentAnalysis: state.currentAnalysis,
      refreshInfo: state.refreshInfo,
      securityAnalysis: state.securityAnalysis,
      analysisHistory: state.analysisHistory
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `token-analysis-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [state.currentAnalysis, state.refreshInfo, state.securityAnalysis, state.analysisHistory]);

  return {
    // State
    ...state,
    
    // Actions
    analyzeToken: analyzeTokenValue,
    clearAnalysisHistory,
    exportAnalysisData,
    
    // Getters
    getTokenExpirationStatus,
    getTokenSecurityScore,
    getTokenRecommendations,
    getCriticalIssues,
    getValidationErrors,
    needsRefresh,
    getTokenTypeInfo,
    getTokenClaims,
    
    // Computed values
    isValid: state.currentAnalysis?.isValid || false,
    riskScore: state.currentAnalysis?.riskScore || 0,
    hasIssues: (state.currentAnalysis?.securityIssues.length || 0) > 0,
    hasErrors: (state.currentAnalysis?.validationErrors.length || 0) > 0,
    canRefresh: state.refreshInfo?.canRefresh || false
  };
};

// Hook for token refresh monitoring
export const useTokenRefreshMonitoring = (enabled: boolean = true) => {
  const { refreshInfo, analyzeToken } = useTokenAnalysis({ enabled });

  const [refreshStatus, setRefreshStatus] = useState<{
    isRefreshing: boolean;
    lastRefresh: Date | null;
    refreshCount: number;
    refreshErrors: any[];
  }>({
    isRefreshing: false,
    lastRefresh: null,
    refreshCount: 0,
    refreshErrors: []
  });

  const refreshToken = useCallback(async (token: string, refreshTokenValue: string) => {
    if (!enabled || !refreshInfo?.canRefresh) {
      throw new Error('Token refresh not available');
    }

    setRefreshStatus(prev => ({ ...prev, isRefreshing: true }));

    try {
      // In a real implementation, this would call the refresh endpoint
      const response = await fetch(refreshInfo.refreshEndpoint || '/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshTokenValue,
          client_id: 'your-client-id' // This would come from config
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setRefreshStatus(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: new Date(),
        refreshCount: prev.refreshCount + 1
      }));

      // Re-analyze the new token
      if (data.access_token) {
        await analyzeToken(data.access_token, data.refresh_token);
      }

      return data;
    } catch (error) {
      setRefreshStatus(prev => ({
        ...prev,
        isRefreshing: false,
        refreshErrors: [...prev.refreshErrors, { timestamp: new Date(), error }]
      }));
      throw error;
    }
  }, [enabled, refreshInfo, analyzeToken]);

  return {
    ...refreshStatus,
    refreshToken,
    canRefresh: refreshInfo?.canRefresh || false,
    maxRefreshAttempts: refreshInfo?.maxRefreshAttempts || 3
  };
};

export default useTokenAnalysis;
