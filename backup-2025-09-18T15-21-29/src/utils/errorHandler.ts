/* eslint-disable @typescript-eslint/no-unused-vars */
import { logger } from './logger';

// Error types and interfaces
export interface AppError {
  code: string;
  message: string;
  description?: string;
  context?: string;
  timestamp: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableUserNotification: boolean;
  maxRetries: number;
  retryDelay: number;
}

// Default error handler configuration
const defaultConfig: ErrorHandlerConfig = {
  enableLogging: true,
  enableReporting: true,
  enableUserNotification: true,
  maxRetries: 3,
  retryDelay: 1000
};

// Error codes and their user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection and try again.',
  'TIMEOUT_ERROR': 'The request timed out. Please try again.',
  'CONNECTION_REFUSED': 'Unable to connect to the server. The server may be down or unreachable.',
  
  // OAuth errors
  'OAUTH_INVALID_CLIENT': 'Invalid client credentials. Please check your configuration.',
  'OAUTH_INVALID_GRANT': 'Invalid authorization grant. Please try the flow again.',
  'OAUTH_INVALID_SCOPE': 'Invalid scope requested. Please check your scope configuration.',
  'OAUTH_INVALID_REQUEST': 'Invalid request parameters. Please check your configuration.',
  'OAUTH_UNAUTHORIZED_CLIENT': 'Client is not authorized to use this flow.',
  'OAUTH_UNSUPPORTED_GRANT_TYPE': 'The grant type is not supported.',
  'OAUTH_UNSUPPORTED_RESPONSE_TYPE': 'The response type is not supported.',
  'OAUTH_ACCESS_DENIED': 'Access was denied by the user or authorization server.',
  'OAUTH_SERVER_ERROR': 'The authorization server encountered an error.',
  'OAUTH_TEMPORARILY_UNAVAILABLE': 'The authorization server is temporarily unavailable.',
  
  // Token errors
  'TOKEN_INVALID': 'The token is invalid or expired. Please re-authenticate.',
  'TOKEN_EXPIRED': 'The token has expired. Please refresh or re-authenticate.',
  'TOKEN_MISSING': 'Required token is missing. Please authenticate first.',
  'TOKEN_STORAGE_ERROR': 'Unable to store or retrieve tokens. Please try again.',
  
  // Configuration errors
  'CONFIG_MISSING': 'Required configuration is missing. Please check your settings.',
  'CONFIG_INVALID': 'Configuration is invalid. Please check your settings.',
  'CONFIG_ENVIRONMENT_ERROR': 'Environment configuration error. Please check your environment variables.',
  
  // Validation errors
  'VALIDATION_ERROR': 'Input validation failed. Please check your input and try again.',
  'REQUIRED_FIELD_MISSING': 'Required field is missing. Please fill in all required fields.',
  'INVALID_FORMAT': 'Invalid format. Please check your input format.',
  
  // Security errors
  'SECURITY_ERROR': 'A security error occurred. Please try again.',
  'CSRF_ERROR': 'Security token mismatch. Please refresh the page and try again.',
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
  
  // Generic errors
  'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
  'INTERNAL_ERROR': 'An internal error occurred. Please contact support if this persists.',
  'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.'
};

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  OAUTH = 'oauth',
  TOKEN = 'token',
  CONFIG = 'config',
  VALIDATION = 'validation',
  SECURITY = 'security',
  INTERNAL = 'internal'
}

// Main error handler class
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Handle any error and convert it to AppError
  handleError = (error: unknown, context?: string, userId?: string, sessionId?: string): AppError => {
    const appError = this.convertToAppError(_error, context, userId, sessionId);
    
    // Add to history
    this.addToHistory(appError);
    
    // Log error
    if (this.config.enableLogging) {
      this.logError(appError);
    }
    
    // Report error
    if (this.config.enableReporting) {
      this.reportError(appError);
    }
    
    return appError;
  };

  // Convert any error to AppError
  private convertToAppError = (error: unknown, context?: string, userId?: string, sessionId?: string): AppError => {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let description = '';
    let stack = '';

    if (error && typeof error === 'object' && 'response' in error) {
      // HTTP error response
      const httpError = error as { response: { status: number; data?: { error?: string; error_description?: string; message?: string } }; stack?: string };
      const status = httpError.response.status;

      code = `HTTP_${status}`;
      message = data?.error || `HTTP ${status} Error`;
      description = data?.error_description || data?.message || 'An HTTP error occurred';
      stack = httpError.stack;
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Network error
      const networkError = error as { request: unknown; stack?: string };
      code = 'NETWORK_ERROR';
      message = 'Network Error';
      description = 'Unable to connect to the server. Please check your internet connection.';
      stack = networkError.stack;
    } else if (error && typeof error === 'object' && 'message' in error) {
      // Generic error
      const genericError = error as { message: string; code?: string; stack?: string };
      code = genericError.code || 'GENERIC_ERROR';
      message = genericError.message;
      description = (genericError as { description?: string }).description || 'An unexpected error occurred';
      stack = genericError.stack;
    } else if (typeof error === 'string') {
      // String error
      message = error;
      description = 'An error occurred';
    }

    return {
      code,
      message,
      description,
      context,
      timestamp: new Date().toISOString(),
      stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId,
      sessionId
    };
  };

  // Get user-friendly error message
  getUserFriendlyMessage = (error: AppError): string => {
    return ERROR_MESSAGES[error.code] || error.message || 'An unexpected error occurred';
  };

  // Get error severity
  getErrorSeverity = (error: AppError): ErrorSeverity => {
    const severityMap: Record<string, ErrorSeverity> = {
      'NETWORK_ERROR': ErrorSeverity.MEDIUM,
      'TIMEOUT_ERROR': ErrorSeverity.MEDIUM,
      'CONNECTION_REFUSED': ErrorSeverity.HIGH,
      'OAUTH_INVALID_CLIENT': ErrorSeverity.HIGH,
      'OAUTH_INVALID_GRANT': ErrorSeverity.HIGH,
      'OAUTH_ACCESS_DENIED': ErrorSeverity.MEDIUM,
      'OAUTH_SERVER_ERROR': ErrorSeverity.HIGH,
      'TOKEN_INVALID': ErrorSeverity.HIGH,
      'TOKEN_EXPIRED': ErrorSeverity.MEDIUM,
      'TOKEN_MISSING': ErrorSeverity.MEDIUM,
      'CONFIG_MISSING': ErrorSeverity.HIGH,
      'CONFIG_INVALID': ErrorSeverity.HIGH,
      'VALIDATION_ERROR': ErrorSeverity.LOW,
      'REQUIRED_FIELD_MISSING': ErrorSeverity.LOW,
      'SECURITY_ERROR': ErrorSeverity.CRITICAL,
      'CSRF_ERROR': ErrorSeverity.HIGH,
      'RATE_LIMIT_EXCEEDED': ErrorSeverity.MEDIUM,
      'INTERNAL_ERROR': ErrorSeverity.CRITICAL,
      'SERVICE_UNAVAILABLE': ErrorSeverity.HIGH
    };

    return severityMap[error.code] || ErrorSeverity.MEDIUM;
  };

  // Get error category
  getErrorCategory = (error: AppError): ErrorCategory => {
    if (error.code.startsWith('NETWORK_') || error.code.startsWith('TIMEOUT_') || error.code.startsWith('CONNECTION_')) {
      return ErrorCategory.NETWORK;
    }
    if (error.code.startsWith('OAUTH_')) {
      return ErrorCategory.OAUTH;
    }
    if (error.code.startsWith('TOKEN_')) {
      return ErrorCategory.TOKEN;
    }
    if (error.code.startsWith('CONFIG_')) {
      return ErrorCategory.CONFIG;
    }
    if (error.code.startsWith('VALIDATION_') || error.code.startsWith('REQUIRED_') || error.code.startsWith('INVALID_')) {
      return ErrorCategory.VALIDATION;
    }
    if (error.code.startsWith('SECURITY_') || error.code.startsWith('CSRF_') || error.code.startsWith('RATE_LIMIT_')) {
      return ErrorCategory.SECURITY;
    }
    return ErrorCategory.INTERNAL;
  };

  // Log error
  private logError = (error: AppError): void => {
    const severity = this.getErrorSeverity(_error);
    const category = this.getErrorCategory(_error);
    
    const logData = {
      code: error.code,
      message: error.message,
      description: error.description,
      context: error.context,
      severity,
      category,
      timestamp: error.timestamp,
      userId: error.userId,
      sessionId: error.sessionId
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`[${category.toUpperCase()}] ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`[${category.toUpperCase()}] ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`[${category.toUpperCase()}] ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info(`[${category.toUpperCase()}] ${error.message}`, logData);
        break;
    }
  };

  // Report error to external service
  private reportError = (error: AppError): void => {
    // TODO: Implement external error reporting (e.g., Sentry, Bugsnag)
    // For now, just log the error report
    logger.error('[ErrorReporting] Error report generated:', {
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...error
    });
  };

  // Add error to history
  private addToHistory = (error: AppError): void => {
    this.errorHistory.unshift(_error);
    
    // Keep only the most recent errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  };

  // Get error history
  getErrorHistory = (): AppError[] => {
    return [...this.errorHistory];
  };

  // Clear error history
  clearErrorHistory = (): void => {
    this.errorHistory = [];
  };

  // Get error statistics
  getErrorStatistics = (): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: number;
  } => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recent = this.errorHistory.filter(error => 
      new Date(error.timestamp) > oneHourAgo
    ).length;

    const byCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = this.errorHistory.filter(error => 
        this.getErrorCategory(_error) === category
      ).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorHistory.filter(error => 
        this.getErrorSeverity(_error) === severity
      ).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    return {
      total: this.errorHistory.length,
      byCategory,
      bySeverity,
      recent
    };
  };

  // Retry function with exponential backoff
  retry = async <T>(
    fn: () => Promise<T>,
    context: string,
    maxRetries: number = this.config.maxRetries,
    delay: number = this.config.retryDelay
  ): Promise<T> => {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (_error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          this.handleError(_error, `${context} (final attempt ${attempt})`);
          throw error;
        }
        
        this.handleError(_error, `${context} (attempt ${attempt})`);
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  };

  // Update configuration
  updateConfig = (newConfig: Partial<ErrorHandlerConfig>): void => {
    this.config = { ...this.config, ...newConfig };
  };

  // Get current configuration
  getConfig = (): ErrorHandlerConfig => {
    return { ...this.config };
  };
}

// Create global error handler instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error handling patterns
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: string,
  userId?: string,
  sessionId?: string
): Promise<T> => {
  try {
    return await asyncFn();
  } catch (_error) {
    throw errorHandler.handleError(_error, context, userId, sessionId);
  }
};

export const handleSyncError = <T>(
  syncFn: () => T,
  context: string,
  userId?: string,
  sessionId?: string
): T => {
  try {
    return syncFn();
  } catch (_error) {
    throw errorHandler.handleError(_error, context, userId, sessionId);
  }
};

export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => R,
  context: string,
  userId?: string,
  sessionId?: string
) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (_error) {
      throw errorHandler.handleError(_error, context, userId, sessionId);
    }
  };
};

export const withAsyncErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: string,
  userId?: string,
  sessionId?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (_error) {
      throw errorHandler.handleError(_error, context, userId, sessionId);
    }
  };
};

export default errorHandler;
