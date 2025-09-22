import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/NewAuthContext';
import { 
  tokenRefreshService, 
  initializeTokenRefresh, 
  refreshTokens, 
  stopTokenRefresh, 
  getTokenRefreshStatus,
  type TokenRefreshConfig,
  type TokenRefreshResult 
} from '../services/tokenRefreshService';
import { logger } from '../utils/logger';

export interface UseTokenRefreshOptions {
  autoRefresh?: boolean;
  refreshThreshold?: number; // seconds before expiry
  onRefreshSuccess?: (tokens: any) => void;
  onRefreshError?: (error: string) => void;
}

export interface UseTokenRefreshReturn {
  isRefreshing: boolean;
  lastRefreshAt: Date | null;
  nextRefreshAt: Date | null;
  refreshError: string | null;
  refreshTokens: () => Promise<TokenRefreshResult>;
  stopAutoRefresh: () => void;
  startAutoRefresh: () => void;
  status: {
    isInitialized: boolean;
    isRefreshing: boolean;
    autoRefreshEnabled: boolean;
  };
}

/**
 * React hook for token refresh functionality
 * Only for Dashboard login - does NOT interfere with OAuth flows
 */
export const useTokenRefresh = (options: UseTokenRefreshOptions = {}): UseTokenRefreshReturn => {
  const { config } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const {
    autoRefresh = true,
    refreshThreshold = 300,
    onRefreshSuccess,
    onRefreshError
  } = options;

  // Initialize token refresh service when config is available
  useEffect(() => {
    if (!config?.tokenEndpoint || !config?.clientId || !config?.clientSecret) {
      return;
    }

    const initializeService = async () => {
      try {
        const refreshConfig: TokenRefreshConfig = {
          tokenEndpoint: config.tokenEndpoint,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          refreshToken: '', // Will be set from stored tokens
          scope: config.scopes
        };

        // Get refresh token from storage
        const tokens = await import('../utils/storage').then(m => m.oauthStorage.getTokens());
        if (tokens?.refresh_token) {
          // Validate refresh token before using it
          const isValidToken = tokens.refresh_token.length >= 10 && 
                              tokens.refresh_token.length <= 1000 && 
                              tokens.refresh_token.trim() !== '';
          
          if (isValidToken) {
            refreshConfig.refreshToken = tokens.refresh_token;
            logger.info('useTokenRefresh', 'Found valid refresh token, initializing service');
          } else {
            logger.warn('useTokenRefresh', 'Found invalid refresh token, clearing and skipping initialization', {
              tokenLength: tokens.refresh_token.length,
              tokenPreview: tokens.refresh_token.substring(0, 10) + '...'
            });
            // Clear invalid token from storage
            try {
              await import('../utils/storage').then(m => m.oauthStorage.clearTokens());
              logger.info('useTokenRefresh', 'Cleared invalid refresh token from storage');
            } catch (error) {
              logger.error('useTokenRefresh', 'Failed to clear invalid token from storage', error);
            }
            return; // Don't initialize with invalid token
          }
        } else {
          logger.info('useTokenRefresh', 'No refresh token found, skipping auto-refresh initialization');
          return; // Don't initialize if no refresh token
        }

        await initializeTokenRefresh(refreshConfig);
        
        // Update status
        const status = getTokenRefreshStatus();
        setNextRefreshAt(status.nextRefreshAt || null);
        
        logger.info('useTokenRefresh', 'Token refresh service initialized');
      } catch (error) {
        logger.error('useTokenRefresh', 'Failed to initialize token refresh service', error);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      stopTokenRefresh();
    };
  }, [config, autoRefresh, refreshThreshold]);

  // Monitor refresh status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getTokenRefreshStatus();
      setNextRefreshAt(status.nextRefreshAt || null);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Manual token refresh
  const handleRefreshTokens = useCallback(async (): Promise<TokenRefreshResult> => {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const result = await refreshTokens();
      
      if (result.success) {
        setLastRefreshAt(new Date());
        onRefreshSuccess?.(result.tokens);
        logger.info('useTokenRefresh', 'Manual token refresh successful');
      } else {
        setRefreshError(result.error || 'Token refresh failed');
        onRefreshError?.(result.error || 'Token refresh failed');
        logger.error('useTokenRefresh', 'Manual token refresh failed', { error: result.error });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRefreshError(errorMessage);
      onRefreshError?.(errorMessage);
      logger.error('useTokenRefresh', 'Token refresh error', error);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshSuccess, onRefreshError]);

  // Stop auto refresh
  const handleStopAutoRefresh = useCallback(() => {
    stopTokenRefresh();
    setNextRefreshAt(null);
    logger.info('useTokenRefresh', 'Auto refresh stopped');
  }, []);

  // Start auto refresh
  const handleStartAutoRefresh = useCallback(async () => {
    if (!config?.tokenEndpoint || !config?.clientId || !config?.clientSecret) {
      logger.warn('useTokenRefresh', 'Cannot start auto refresh: missing configuration');
      return;
    }

    try {
      const refreshConfig: TokenRefreshConfig = {
        tokenEndpoint: config.tokenEndpoint,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: '', // Will be set from stored tokens
        scope: config.scopes
      };

      // Get refresh token from storage
      const tokens = await import('../utils/storage').then(m => m.oauthStorage.getTokens());
      if (tokens?.refresh_token) {
        // Validate refresh token before using it
        const isValidToken = tokens.refresh_token.length >= 10 && 
                            tokens.refresh_token.length <= 1000 && 
                            tokens.refresh_token.trim() !== '';
        
        if (isValidToken) {
          refreshConfig.refreshToken = tokens.refresh_token;
          logger.info('useTokenRefresh', 'Found valid refresh token, starting auto refresh');
        } else {
          logger.warn('useTokenRefresh', 'Found invalid refresh token, clearing and aborting auto refresh start', {
            tokenLength: tokens.refresh_token.length,
            tokenPreview: tokens.refresh_token.substring(0, 10) + '...'
          });
          // Clear invalid token from storage
          try {
            await import('../utils/storage').then(m => m.oauthStorage.clearTokens());
            logger.info('useTokenRefresh', 'Cleared invalid refresh token from storage');
          } catch (error) {
            logger.error('useTokenRefresh', 'Failed to clear invalid token from storage', error);
          }
          return; // Don't start auto refresh with invalid token
        }
      } else {
        logger.warn('useTokenRefresh', 'No refresh token available, cannot start auto refresh');
        return;
      }

      await initializeTokenRefresh(refreshConfig);
      
      // Update status
      const status = getTokenRefreshStatus();
      setNextRefreshAt(status.nextRefreshAt || null);
      
      logger.info('useTokenRefresh', 'Auto refresh started');
    } catch (error) {
      logger.error('useTokenRefresh', 'Failed to start auto refresh', error);
    }
  }, [config]);

  // Get current status
  const status = getTokenRefreshStatus();

  return {
    isRefreshing,
    lastRefreshAt,
    nextRefreshAt,
    refreshError,
    refreshTokens: handleRefreshTokens,
    stopAutoRefresh: handleStopAutoRefresh,
    startAutoRefresh: handleStartAutoRefresh,
    status: {
      isInitialized: status.isInitialized,
      isRefreshing: status.isRefreshing,
      autoRefreshEnabled: status.autoRefreshEnabled
    }
  };
};

export default useTokenRefresh;
