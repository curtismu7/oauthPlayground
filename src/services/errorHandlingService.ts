// src/services/errorHandlingService.ts
// Comprehensive error handling service for OAuth flows
// Provides standardized error classification, user-friendly messages, and recovery strategies

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface FlowError {
  type: ErrorType;
  severity: ErrorSeverity;
  originalError: Error | any;
  flowId: string;
  stepId?: string;
  userMessage: string;
  technicalMessage: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface ErrorContext {
  flowId: string;
  stepId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  type: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  recoveryOptions: RecoveryOption[];
  shouldRetry: boolean;
  contactSupport: boolean;
  errorCode?: string;
  correlationId: string;
}

export interface RecoveryOption {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface ErrorAnalytics {
  errorType: ErrorType;
  frequency: number;
  averageResolutionTime: number;
  userImpact: number;
  commonRecoveryActions: string[];
}

// Error classification patterns
const ERROR_PATTERNS = {
  [ErrorType.NETWORK]: [
    /network/i,
    /fetch/i,
    /connection/i,
    /timeout/i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i
  ],
  [ErrorType.AUTHENTICATION]: [
    /invalid_client/i,
    /unauthorized/i,
    /invalid_token/i,
    /authentication/i,
    /401/i
  ],
  [ErrorType.AUTHORIZATION]: [
    /access_denied/i,
    /insufficient_scope/i,
    /forbidden/i,
    /403/i
  ],
  [ErrorType.VALIDATION]: [
    /invalid_request/i,
    /invalid_grant/i,
    /missing/i,
    /required/i,
    /400/i
  ],
  [ErrorType.TIMEOUT]: [
    /timeout/i,
    /took too long/i,
    /408/i
  ],
  [ErrorType.RATE_LIMIT]: [
    /rate limit/i,
    /too many requests/i,
    /429/i
  ],
  [ErrorType.SERVER_ERROR]: [
    /internal server error/i,
    /500/i,
    /502/i,
    /503/i,
    /504/i
  ]
};

export class ErrorHandlingService {
  private static errorStore: Map<string, FlowError> = new Map();
  private static analyticsStore: Map<ErrorType, ErrorAnalytics> = new Map();

  /**
   * Main error handling method - processes any error and returns standardized response
   */
  static handleFlowError(error: Error | any, context: ErrorContext): ErrorResponse {
    const flowError = ErrorHandlingService.createFlowError(error, context);
    const errorResponse = ErrorHandlingService.generateErrorResponse(flowError);
    const recoveryOptions = ErrorHandlingService.generateRecoveryOptions(flowError);

    // Store error for analytics
    ErrorHandlingService.storeError(flowError);

    // Log error for monitoring
    ErrorHandlingService.logError(flowError);

    // Report to error tracking service
    ErrorHandlingService.reportError(flowError);

    return {
      ...errorResponse,
      recoveryOptions,
      correlationId: ErrorHandlingService.generateCorrelationId()
    };
  }

  /**
   * Classify error based on message, code, and other properties
   */
  static classifyError(error: Error | any): ErrorType {
    const errorMessage = ErrorHandlingService.extractErrorMessage(error).toLowerCase();

    // Check against known patterns
    for (const [errorType, patterns] of Object.entries(ERROR_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(errorMessage))) {
        return errorType as ErrorType;
      }
    }

    // Check error codes
    if (error.code || error.status || error.statusCode) {
      const code = error.code || error.status || error.statusCode;
      return ErrorHandlingService.classifyByCode(code);
    }

    // Check error name
    if (error.name) {
      return ErrorHandlingService.classifyByName(error.name);
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Classify error by HTTP status code
   */
  private static classifyByCode(code: number | string): ErrorType {
    const numCode = typeof code === 'string' ? parseInt(code, 10) : code;

    if (numCode >= 400 && numCode < 500) {
      switch (numCode) {
        case 400: return ErrorType.VALIDATION;
        case 401: return ErrorType.AUTHENTICATION;
        case 403: return ErrorType.AUTHORIZATION;
        case 408: return ErrorType.TIMEOUT;
        case 429: return ErrorType.RATE_LIMIT;
        default: return ErrorType.CLIENT_ERROR;
      }
    } else if (numCode >= 500) {
      return ErrorType.SERVER_ERROR;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Classify error by error name
   */
  private static classifyByName(name: string): ErrorType {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('network') || lowerName.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (lowerName.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    if (lowerName.includes('auth')) {
      return ErrorType.AUTHENTICATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Determine error severity based on type and context
   */
  static determineSeverity(errorType: ErrorType, context?: ErrorContext): ErrorSeverity {
    switch (errorType) {
      case ErrorType.SERVER_ERROR:
        return ErrorSeverity.CRITICAL;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
      case ErrorType.CONFIGURATION:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Generate user-friendly error messages
   */
  static getUserFriendlyMessage(errorType: ErrorType, context?: ErrorContext): string {
    const messages = {
      [ErrorType.NETWORK]: "Unable to connect to the authentication service. Please check your internet connection and try again.",
      [ErrorType.AUTHENTICATION]: "Authentication failed. Please verify your client credentials and try again.",
      [ErrorType.AUTHORIZATION]: "You don't have permission to perform this action. Please check your access rights or contact your administrator.",
      [ErrorType.VALIDATION]: "The information provided is not valid. Please check your input and try again.",
      [ErrorType.CONFIGURATION]: "There's a configuration issue. Please contact support if this persists.",
      [ErrorType.TIMEOUT]: "The request timed out. Please try again in a few moments.",
      [ErrorType.RATE_LIMIT]: "Too many requests. Please wait a moment before trying again.",
      [ErrorType.SERVER_ERROR]: "The authentication service is temporarily unavailable. Please try again later.",
      [ErrorType.CLIENT_ERROR]: "There was an issue with your request. Please try again or contact support.",
      [ErrorType.UNKNOWN]: "An unexpected error occurred. Please try again or contact support if this persists."
    };

    return messages[errorType] || messages[ErrorType.UNKNOWN];
  }

  /**
   * Generate recovery options based on error type
   */
  static generateRecoveryOptions(flowError: FlowError): RecoveryOption[] {
    const options: RecoveryOption[] = [];

    switch (flowError.type) {
      case ErrorType.NETWORK:
        options.push({
          id: 'retry',
          label: 'Try Again',
          action: () => window.location.reload(),
          primary: true
        });
        options.push({
          id: 'check-connection',
          label: 'Check Network',
          action: () => window.open('https://www.google.com', '_blank')
        });
        break;

      case ErrorType.AUTHENTICATION:
        options.push({
          id: 'check-credentials',
          label: 'Verify Credentials',
          action: () => {
            // Navigate to credentials configuration
            window.location.hash = '#/configuration';
          },
          primary: true
        });
        options.push({
          id: 'reset-flow',
          label: 'Start Over',
          action: () => window.location.reload()
        });
        break;

      case ErrorType.VALIDATION:
        options.push({
          id: 'fix-input',
          label: 'Review Input',
          action: () => {
            // Focus on the first invalid field
            const invalidField = document.querySelector('.error, .invalid');
            invalidField?.scrollIntoView({ behavior: 'smooth' });
          },
          primary: true
        });
        break;

      case ErrorType.TIMEOUT:
      case ErrorType.RATE_LIMIT:
        options.push({
          id: 'wait-retry',
          label: 'Wait & Retry',
          action: () => setTimeout(() => window.location.reload(), 5000),
          primary: true
        });
        break;

      default:
        options.push({
          id: 'retry',
          label: 'Try Again',
          action: () => window.location.reload(),
          primary: true
        });
        options.push({
          id: 'contact-support',
          label: 'Contact Support',
          action: () => window.open('mailto:support@example.com', '_blank')
        });
    }

    return options;
  }

  /**
   * Determine if error should trigger retry
   */
  static shouldRetry(errorType: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.TIMEOUT,
      ErrorType.SERVER_ERROR
    ].includes(errorType);
  }

  /**
   * Determine if user should contact support
   */
  static shouldContactSupport(errorType: ErrorType): boolean {
    return [
      ErrorType.SERVER_ERROR,
      ErrorType.CONFIGURATION,
      ErrorType.UNKNOWN
    ].includes(errorType);
  }

  /**
   * Create standardized FlowError object
   */
  private static createFlowError(error: Error | any, context: ErrorContext): FlowError {
    const errorType = ErrorHandlingService.classifyError(error);
    const severity = ErrorHandlingService.determineSeverity(errorType, context);

    return {
      type: errorType,
      severity,
      originalError: error,
      flowId: context.flowId,
      stepId: context.stepId,
      userMessage: ErrorHandlingService.getUserFriendlyMessage(errorType, context),
      technicalMessage: ErrorHandlingService.extractErrorMessage(error),
      timestamp: new Date(),
      context: context.metadata,
      userId: context.userId,
      sessionId: context.sessionId
    };
  }

  /**
   * Generate standardized error response
   */
  private static generateErrorResponse(flowError: FlowError): Omit<ErrorResponse, 'recoveryOptions' | 'correlationId'> {
    return {
      type: flowError.type,
      severity: flowError.severity,
      userMessage: flowError.userMessage,
      technicalMessage: flowError.technicalMessage,
      shouldRetry: ErrorHandlingService.shouldRetry(flowError.type),
      contactSupport: ErrorHandlingService.shouldContactSupport(flowError.type)
    };
  }

  /**
   * Extract error message from various error formats
   */
  private static extractErrorMessage(error: Error | any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    if (error?.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    return 'Unknown error occurred';
  }

  /**
   * Store error for analytics
   */
  private static storeError(flowError: FlowError): void {
    const key = `${flowError.flowId}-${flowError.type}-${Date.now()}`;
    ErrorHandlingService.errorStore.set(key, flowError);

    // Update analytics
    const analytics = ErrorHandlingService.analyticsStore.get(flowError.type) || {
      errorType: flowError.type,
      frequency: 0,
      averageResolutionTime: 0,
      userImpact: 0,
      commonRecoveryActions: []
    };

    analytics.frequency++;
    ErrorHandlingService.analyticsStore.set(flowError.type, analytics);
  }

  /**
   * Log error for monitoring
   */
  private static logError(flowError: FlowError): void {
    const logLevel = ErrorHandlingService.getLogLevel(flowError.severity);

    const logData = {
      timestamp: flowError.timestamp.toISOString(),
      level: logLevel,
      errorType: flowError.type,
      severity: flowError.severity,
      flowId: flowError.flowId,
      stepId: flowError.stepId,
      userId: flowError.userId,
      sessionId: flowError.sessionId,
      message: flowError.technicalMessage,
      context: flowError.context
    };

    console.error('[ErrorHandlingService]', logData);

    // Could also send to external logging service
    // this.sendToExternalLogger(logData);
  }

  /**
   * Report error to external error tracking service
   */
  private static reportError(flowError: FlowError): void {
    // Implementation for external error tracking (Sentry, Rollbar, etc.)
    // For now, just prepare the data structure
    const errorReport = {
      errorType: flowError.type,
      severity: flowError.severity,
      message: flowError.technicalMessage,
      stackTrace: flowError.originalError?.stack,
      context: {
        flowId: flowError.flowId,
        stepId: flowError.stepId,
        userId: flowError.userId,
        sessionId: flowError.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: flowError.timestamp.toISOString(),
        ...flowError.context
      }
    };

    // Send to error tracking service
    // this.errorTracker.captureException(flowError.originalError, { extra: errorReport });
    console.warn('[ErrorReporting]', 'Error reported:', errorReport);
  }

  /**
   * Generate correlation ID for error tracking
   */
  private static generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get log level based on severity
   */
  private static getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 'error';
      case ErrorSeverity.HIGH: return 'error';
      case ErrorSeverity.MEDIUM: return 'warn';
      case ErrorSeverity.LOW: return 'info';
      default: return 'info';
    }
  }

  /**
   * Get error analytics
   */
  static getErrorAnalytics(errorType?: ErrorType): ErrorAnalytics[] {
    if (errorType) {
      return ErrorHandlingService.analyticsStore.has(errorType) ? [ErrorHandlingService.analyticsStore.get(errorType)!] : [];
    }
    return Array.from(ErrorHandlingService.analyticsStore.values());
  }

  /**
   * Clear error store (for testing or cleanup)
   */
  static clearErrorStore(): void {
    ErrorHandlingService.errorStore.clear();
    ErrorHandlingService.analyticsStore.clear();
  }

  /**
   * Get recent errors for debugging
   */
  static getRecentErrors(limit: number = 10): FlowError[] {
    return Array.from(ErrorHandlingService.errorStore.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Export convenience functions for common use cases
export const handleFlowError = ErrorHandlingService.handleFlowError.bind(ErrorHandlingService);
export const classifyError = ErrorHandlingService.classifyError.bind(ErrorHandlingService);
export const getUserFriendlyMessage = ErrorHandlingService.getUserFriendlyMessage.bind(ErrorHandlingService);

// Default export for the service class
export default ErrorHandlingService;
