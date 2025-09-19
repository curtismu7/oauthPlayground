/* eslint-disable @typescript-eslint/no-unused-vars */
import { logger } from './logger';

// Error diagnosis types
export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'token' | 'network' | 'configuration' | 'validation' | 'security';
  suggestedFixes: SuggestedFix[];
  relatedErrors: string[];
  frequency: number;
  lastSeen: Date;
}

export interface SuggestedFix {
  id: string;
  title: string;
  description: string;
  steps: string[];
  codeExample?: string;
  documentation?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  successRate: number;
}

export interface ErrorDiagnosis {
  errorId: string;
  timestamp: Date;
  errorMessage: string;
  errorCode?: string;
  context: Record<string, unknown>;
  matchedPatterns: ErrorPattern[];
  suggestedFixes: SuggestedFix[];
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  resolved: boolean;
  resolution?: ErrorResolution;
}

export interface ErrorResolution {
  appliedFix: SuggestedFix;
  timestamp: Date;
  success: boolean;
  notes?: string;
  followUpActions?: string[];
}

export interface ErrorHistory {
  errors: ErrorDiagnosis[];
  patterns: ErrorPattern[];
  statistics: ErrorStatistics;
  trends: ErrorTrend[];
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  mostCommonErrors: Array<{ pattern: string; count: number }>;
  averageResolutionTime: number;
  successRate: number;
  recentTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface ErrorTrend {
  date: string;
  errorCount: number;
  category: string;
  severity: string;
}

// Error diagnosis manager
export class ErrorDiagnosisManager {
  private static instance: ErrorDiagnosisManager;
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private errorHistory: ErrorDiagnosis[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeErrorPatterns();
  }

  public static getInstance(): ErrorDiagnosisManager {
    if (!ErrorDiagnosisManager.instance) {
      ErrorDiagnosisManager.instance = new ErrorDiagnosisManager();
    }
    return ErrorDiagnosisManager.instance;
  }

  // Initialize common error patterns
  private initializeErrorPatterns(): void {
    const patterns: ErrorPattern[] = [
      // Authentication errors
      {
        id: 'auth_invalid_credentials',
        name: 'Invalid Credentials',
        description: 'Authentication failed due to invalid username or password',
        pattern: /invalid.*credential|unauthorized|authentication.*failed/i,
        severity: 'high',
        category: 'authentication',
        suggestedFixes: [
          {
            id: 'fix_credentials',
            title: 'Verify Credentials',
            description: 'Check username and password are correct',
            steps: [
              'Verify the username is correct',
              'Check if the password is correct',
              'Ensure the account is not locked',
              'Try resetting the password if needed'
            ],
            priority: 'high',
            estimatedTime: '5 minutes',
            successRate: 85
          }
        ],
        relatedErrors: ['auth_account_locked', 'auth_password_expired'],
        frequency: 0,
        lastSeen: new Date()
      },
      {
        id: 'auth_token_expired',
        name: 'Token Expired',
        description: 'Access token has expired and needs to be refreshed',
        pattern: /token.*expired|expired.*token|invalid.*token/i,
        severity: 'medium',
        category: 'token',
        suggestedFixes: [
          {
            id: 'refresh_token',
            title: 'Refresh Access Token',
            description: 'Use refresh token to obtain new access token',
            steps: [
              'Check if refresh token is available',
              'Call the token refresh endpoint',
              'Update the stored access token',
              'Retry the original request'
            ],
            codeExample: `// Refresh token example
const response = await fetch('/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId
  })
});`,
            priority: 'high',
            estimatedTime: '2 minutes',
            successRate: 95
          }
        ],
        relatedErrors: ['auth_invalid_token', 'auth_refresh_failed'],
        frequency: 0,
        lastSeen: new Date()
      },
      // Authorization errors
      {
        id: 'authz_insufficient_scope',
        name: 'Insufficient Scope',
        description: 'Token does not have required permissions for the requested resource',
        pattern: /insufficient.*scope|scope.*required|permission.*denied/i,
        severity: 'medium',
        category: 'authorization',
        suggestedFixes: [
          {
            id: 'request_scope',
            title: 'Request Additional Scope',
            description: 'Request the required scope during authentication',
            steps: [
              'Identify the required scope for the resource',
              'Update the authorization request to include the scope',
              'Re-authenticate with the new scope',
              'Retry the original request'
            ],
            priority: 'medium',
            estimatedTime: '10 minutes',
            successRate: 90
          }
        ],
        relatedErrors: ['authz_invalid_scope', 'authz_scope_mismatch'],
        frequency: 0,
        lastSeen: new Date()
      },
      // Network errors
      {
        id: 'network_timeout',
        name: 'Network Timeout',
        description: 'Request timed out due to network issues',
        pattern: /timeout|timed.*out|network.*error/i,
        severity: 'medium',
        category: 'network',
        suggestedFixes: [
          {
            id: 'retry_request',
            title: 'Retry Request',
            description: 'Retry the request with exponential backoff',
            steps: [
              'Wait for a short period (1-2 seconds)',
              'Retry the request',
              'If it fails again, wait longer (4-8 seconds)',
              'Continue with exponential backoff up to 3 attempts'
            ],
            codeExample: `// Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (_error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}`,
            priority: 'medium',
            estimatedTime: '5 minutes',
            successRate: 80
          }
        ],
        relatedErrors: ['network_connection_failed', 'network_dns_error'],
        frequency: 0,
        lastSeen: new Date()
      },
      // Configuration errors
      {
        id: 'config_invalid_redirect_uri',
        name: 'Invalid Redirect URI',
        description: 'The redirect URI does not match the registered URI',
        pattern: /invalid.*redirect|redirect.*uri.*mismatch|redirect.*not.*allowed/i,
        severity: 'high',
        category: 'configuration',
        suggestedFixes: [
          {
            id: 'fix_redirect_uri',
            title: 'Fix Redirect URI',
            description: 'Update the redirect URI to match the registered URI',
            steps: [
              'Check the registered redirect URI in the OAuth provider',
              'Ensure the redirect URI in the request matches exactly',
              'Update the redirect URI if needed',
              'Re-test the OAuth flow'
            ],
            priority: 'high',
            estimatedTime: '15 minutes',
            successRate: 95
          }
        ],
        relatedErrors: ['config_invalid_client', 'config_missing_redirect'],
        frequency: 0,
        lastSeen: new Date()
      },
      // Validation errors
      {
        id: 'validation_missing_parameter',
        name: 'Missing Required Parameter',
        description: 'A required parameter is missing from the request',
        pattern: /missing.*parameter|required.*parameter|parameter.*required/i,
        severity: 'medium',
        category: 'validation',
        suggestedFixes: [
          {
            id: 'add_parameter',
            title: 'Add Missing Parameter',
            description: 'Add the missing parameter to the request',
            steps: [
              'Identify which parameter is missing',
              'Check the API documentation for required parameters',
              'Add the parameter to the request',
              'Re-test the request'
            ],
            priority: 'medium',
            estimatedTime: '5 minutes',
            successRate: 95
          }
        ],
        relatedErrors: ['validation_invalid_parameter', 'validation_parameter_format'],
        frequency: 0,
        lastSeen: new Date()
      },
      // Security errors
      {
        id: 'security_csrf_token_missing',
        name: 'CSRF Token Missing',
        description: 'CSRF token is missing or invalid',
        pattern: /csrf.*token|csrf.*missing|security.*token/i,
        severity: 'high',
        category: 'security',
        suggestedFixes: [
          {
            id: 'add_csrf_token',
            title: 'Add CSRF Token',
            description: 'Include a valid CSRF token in the request',
            steps: [
              'Obtain a CSRF token from the server',
              'Include the token in the request headers or body',
              'Ensure the token is not expired',
              'Re-test the request'
            ],
            priority: 'high',
            estimatedTime: '10 minutes',
            successRate: 90
          }
        ],
        relatedErrors: ['security_invalid_csrf', 'security_token_expired'],
        frequency: 0,
        lastSeen: new Date()
      }
    ];

    patterns.forEach(pattern => {
      this.errorPatterns.set(pattern.id, pattern);
    });

    this.isInitialized = true;
    logger.info('[ErrorDiagnosisManager] Error patterns initialized');
  }

  // Diagnose an error
  public diagnoseError(
    errorMessage: string,
    errorCode?: string,
    context: Record<string, unknown> = {}
  ): ErrorDiagnosis {
    const errorId = this.generateErrorId();
    const timestamp = new Date();
    
    const diagnosis: ErrorDiagnosis = {
      errorId,
      timestamp,
      errorMessage,
      errorCode,
      context,
      matchedPatterns: [],
      suggestedFixes: [],
      confidence: 0,
      severity: 'medium',
      category: 'unknown',
      resolved: false
    };

    // Find matching patterns
    this.findMatchingPatterns(errorMessage, errorCode, diagnosis);
    
    // Calculate confidence and severity
    this.calculateConfidenceAndSeverity(diagnosis);
    
    // Add to history
    this.errorHistory.push(diagnosis);
    
    // Update pattern frequencies
    this.updatePatternFrequencies(diagnosis.matchedPatterns);

    logger.info('[ErrorDiagnosisManager] Error diagnosed', { 
      errorId, 
      matchedPatterns: diagnosis.matchedPatterns.length,
      confidence: diagnosis.confidence 
    });

    return diagnosis;
  }

  // Find matching patterns
  private findMatchingPatterns(
    errorMessage: string,
    errorCode: string | undefined,
    diagnosis: ErrorDiagnosis
  ): void {
    for (const pattern of this.errorPatterns.values()) {
      let matches = false;

      // Check pattern match
      if (typeof pattern.pattern === 'string') {
        matches = errorMessage.toLowerCase().includes(pattern.pattern.toLowerCase());
      } else {
        matches = pattern.pattern.test(errorMessage);
      }

      // Check error code match
      if (errorCode && pattern.pattern instanceof RegExp) {
        matches = matches || pattern.pattern.test(errorCode);
      }

      if (matches) {
        diagnosis.matchedPatterns.push(pattern);
        diagnosis.suggestedFixes.push(...pattern.suggestedFixes);
      }
    }

    // Sort fixes by priority and success rate
    diagnosis.suggestedFixes.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.successRate - a.successRate;
    });
  }

  // Calculate confidence and severity
  private calculateConfidenceAndSeverity(diagnosis: ErrorDiagnosis): void {
    if (diagnosis.matchedPatterns.length === 0) {
      diagnosis.confidence = 0;
      diagnosis.severity = 'medium';
      diagnosis.category = 'unknown';
      return;
    }

    // Calculate confidence based on pattern matches
    diagnosis.confidence = Math.min(100, diagnosis.matchedPatterns.length * 30);

    // Determine severity (highest severity among matched patterns)
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    let maxSeverity = 0;
    let dominantCategory = '';

    for (const pattern of diagnosis.matchedPatterns) {
      const severity = severityOrder[pattern.severity];
      if (severity > maxSeverity) {
        maxSeverity = severity;
        dominantCategory = pattern.category;
      }
    }

    diagnosis.severity = Object.keys(severityOrder)[maxSeverity - 1] as unknown;
    diagnosis.category = dominantCategory;
  }

  // Update pattern frequencies
  private updatePatternFrequencies(patterns: ErrorPattern[]): void {
    patterns.forEach(pattern => {
      pattern.frequency++;
      pattern.lastSeen = new Date();
    });
  }

  // Resolve an error
  public resolveError(
    errorId: string,
    appliedFix: SuggestedFix,
    success: boolean,
    notes?: string
  ): void {

    if (!error) {
      logger.warn('[ErrorDiagnosisManager] Error not found for resolution:', errorId);
      return;
    }

    error.resolved = true;
    error.resolution = {
      appliedFix,
      timestamp: new Date(),
      success,
      notes
    };

    // Update fix success rate
    if (success) {
      appliedFix.successRate = Math.min(100, appliedFix.successRate + 1);
    } else {
      appliedFix.successRate = Math.max(0, appliedFix.successRate - 1);
    }

    logger.info('[ErrorDiagnosisManager] Error resolved', { errorId, success });
  }

  // Get error history
  public getErrorHistory(): ErrorHistory {
    const statistics = this.calculateStatistics();
    const trends = this.calculateTrends();

    return {
      errors: [...this.errorHistory],
      patterns: Array.from(this.errorPatterns.values()),
      statistics,
      trends
    };
  }

  // Calculate error statistics
  private calculateStatistics(): ErrorStatistics {
    const totalErrors = this.errorHistory.length;
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      // Count by category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      // Count by pattern
      error.matchedPatterns.forEach(pattern => {
        errorCounts[pattern.name] = (errorCounts[pattern.name] || 0) + 1;
      });
    });

    const mostCommonErrors = Object.entries(errorCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const resolvedErrors = this.errorHistory.filter(e => e.resolved);
    const successfulResolutions = resolvedErrors.filter(e => e.resolution?.success);
    
    const averageResolutionTime = resolvedErrors.length > 0 
      ? resolvedErrors.reduce((sum, _error) => {
          if (error.resolution) {
            return sum + (error.resolution.timestamp.getTime() - error.timestamp.getTime());
          }
          return sum;
        }, 0) / resolvedErrors.length / 1000 / 60 // Convert to minutes
      : 0;

    const successRate = resolvedErrors.length > 0 
      ? (successfulResolutions.length / resolvedErrors.length) * 100 
      : 0;

    // Calculate recent trend (last 7 days vs previous 7 days)
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errorHistory.filter(e => e.timestamp >= lastWeek).length;
    const previousErrors = this.errorHistory.filter(e => 
      e.timestamp >= twoWeeksAgo && e.timestamp < lastWeek
    ).length;

    let recentTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentErrors > previousErrors * 1.1) {
      recentTrend = 'increasing';
    } else if (recentErrors < previousErrors * 0.9) {
      recentTrend = 'decreasing';
    }

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      mostCommonErrors,
      averageResolutionTime,
      successRate,
      recentTrend
    };
  }

  // Calculate error trends
  private calculateTrends(): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const now = new Date();
    
    // Get trends for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayErrors = this.errorHistory.filter(e => 
        e.timestamp >= dayStart && e.timestamp < dayEnd
      );

      if (dayErrors.length > 0) {
        const category = dayErrors[0].category;
        const severity = dayErrors[0].severity;
        
        trends.push({
          date: dayStart.toISOString().split('T')[0],
          errorCount: dayErrors.length,
          category,
          severity
        });
      }
    }

    return trends;
  }

  // Get error patterns
  public getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  // Add custom error pattern
  public addErrorPattern(pattern: ErrorPattern): void {
    this.errorPatterns.set(pattern.id, pattern);
    logger.info('[ErrorDiagnosisManager] Custom error pattern added:', pattern.id);
  }

  // Generate error ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear error history
  public clearErrorHistory(): void {
    this.errorHistory = [];
    logger.info('[ErrorDiagnosisManager] Error history cleared');
  }

  // Export error data
  public exportErrorData(): string {

    return JSON.stringify(data, null, 2);
  }
}

// Create global error diagnosis manager instance
export const errorDiagnosisManager = ErrorDiagnosisManager.getInstance();

// Utility functions
export const diagnoseError = (
  errorMessage: string,
  errorCode?: string,
  context?: Record<string, unknown>
): ErrorDiagnosis => {
  return errorDiagnosisManager.diagnoseError(errorMessage, errorCode, context);
};

export const resolveError = (
  errorId: string,
  appliedFix: SuggestedFix,
  success: boolean,
  notes?: string
): void => {
  errorDiagnosisManager.resolveError(errorId, appliedFix, success, notes);
};

export const getErrorHistory = (): ErrorHistory => {
  return errorDiagnosisManager.getErrorHistory();
};

export const getErrorPatterns = (): ErrorPattern[] => {
  return errorDiagnosisManager.getErrorPatterns();
};

export default errorDiagnosisManager;
