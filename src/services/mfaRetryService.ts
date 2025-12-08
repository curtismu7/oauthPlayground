// src/services/mfaRetryService.ts
// MFA Retry Logic and Rate Limiting Service

import { logger } from '../utils/logger';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  resetWindow: number; // Minutes after which retry count resets
}

export interface RateLimitConfig {
  windowSize: number; // Time window in minutes
  maxRequests: number; // Max requests per window
  blockDuration: number; // Block duration in minutes after limit exceeded
  progressiveBlocking: boolean; // Increase block duration with repeated violations
}

export interface RetryAttempt {
  attemptId: string;
  userId: string;
  deviceId: string;
  operation: 'CHALLENGE' | 'VERIFICATION' | 'ACTIVATION' | 'RESEND';
  timestamp: Date;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  retryNumber: number;
  nextRetryAt?: Date;
}

export interface RateLimitStatus {
  limited: boolean;
  requestsInWindow: number;
  maxRequests: number;
  windowResetAt: Date;
  blockUntil?: Date;
  violationCount: number;
}

export interface RetryStatus {
  canRetry: boolean;
  attemptsRemaining: number;
  nextRetryAt?: Date;
  totalAttempts: number;
  lastAttemptAt?: Date;
  resetAt?: Date;
}

export interface MFAOperationContext {
  userId: string;
  deviceId: string;
  operation: 'CHALLENGE' | 'VERIFICATION' | 'ACTIVATION' | 'RESEND';
  sessionId?: string;
  ipAddress?: string;
}

class MFARetryService {
  private static retryAttempts = new Map<string, RetryAttempt[]>();
  private static rateLimitData = new Map<string, { requests: Date[]; violations: number; lastViolation?: Date }>();
  
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 2000, // 2 seconds
    maxDelay: 60000, // 1 minute
    backoffMultiplier: 2,
    jitter: true,
    resetWindow: 15 // 15 minutes
  };

  private static readonly DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    windowSize: 5, // 5 minutes
    maxRequests: 10,
    blockDuration: 15, // 15 minutes
    progressiveBlocking: true
  };

  /**
   * Check if operation can be retried
   */
  static canRetry(
    context: MFAOperationContext,
    config?: Partial<RetryConfig>
  ): RetryStatus {
    const retryConfig = { ...MFARetryService.DEFAULT_RETRY_CONFIG, ...config };
    const key = MFARetryService.getRetryKey(context);
    const attempts = MFARetryService.retryAttempts.get(key) || [];
    
    // Filter recent attempts within reset window
    const cutoff = new Date(Date.now() - retryConfig.resetWindow * 60 * 1000);
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
    
    const totalAttempts = recentAttempts.length;
    const attemptsRemaining = Math.max(0, retryConfig.maxAttempts - totalAttempts);
    const canRetry = attemptsRemaining > 0;
    
    const lastAttempt = recentAttempts[recentAttempts.length - 1];
    const nextRetryAt = lastAttempt?.nextRetryAt;
    const resetAt = new Date(Date.now() + retryConfig.resetWindow * 60 * 1000);

    const result: RetryStatus = {
      canRetry: canRetry && (!nextRetryAt || new Date() >= nextRetryAt),
      attemptsRemaining,
      totalAttempts,
    };

    if (lastAttempt?.timestamp) {
      result.lastAttemptAt = lastAttempt.timestamp;
    }
    if (resetAt) {
      result.resetAt = resetAt;
    }
    if (nextRetryAt) {
      result.nextRetryAt = nextRetryAt;
    }

    return result;
  }

  /**
   * Check rate limit status
   */
  static checkRateLimit(
    context: MFAOperationContext,
    config?: Partial<RateLimitConfig>
  ): RateLimitStatus {
    const rateLimitConfig = { ...MFARetryService.DEFAULT_RATE_LIMIT_CONFIG, ...config };
    const key = MFARetryService.getRateLimitKey(context);
    const data = MFARetryService.rateLimitData.get(key) || { requests: [], violations: 0 };
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - rateLimitConfig.windowSize * 60 * 1000);
    
    // Filter requests within current window
    const requestsInWindow = data.requests.filter(req => req > windowStart);
    const windowResetAt = new Date(windowStart.getTime() + rateLimitConfig.windowSize * 60 * 1000);
    
    // Check if currently blocked
    let blockUntil: Date | undefined;
    if (data.lastViolation) {
      const blockDuration = rateLimitConfig.progressiveBlocking
        ? rateLimitConfig.blockDuration * 2 ** Math.min(data.violations - 1, 5) // Cap at 2^5
        : rateLimitConfig.blockDuration;
      
      blockUntil = new Date(data.lastViolation.getTime() + blockDuration * 60 * 1000);
      
      if (now < blockUntil) {
        return {
          limited: true,
          requestsInWindow: requestsInWindow.length,
          maxRequests: rateLimitConfig.maxRequests,
          windowResetAt,
          blockUntil,
          violationCount: data.violations
        };
      }
    }
    
    // Check if limit would be exceeded
    const limited = requestsInWindow.length >= rateLimitConfig.maxRequests;
    
    const status: RateLimitStatus = {
      limited,
      requestsInWindow: requestsInWindow.length,
      maxRequests: rateLimitConfig.maxRequests,
      windowResetAt,
      violationCount: data.violations
    };

    if (blockUntil) {
      status.blockUntil = blockUntil;
    }

    return status;
  }

  /**
   * Record a retry attempt
   */
  static recordRetryAttempt(
    context: MFAOperationContext,
    success: boolean,
    errorCode?: string,
    errorMessage?: string,
    _responseTime?: number,
    config?: Partial<RetryConfig>
  ): RetryAttempt {
    const retryConfig = { ...MFARetryService.DEFAULT_RETRY_CONFIG, ...config };
    const key = MFARetryService.getRetryKey(context);
    const attempts = MFARetryService.retryAttempts.get(key) || [];
    
    // Calculate retry number
    const cutoff = new Date(Date.now() - retryConfig.resetWindow * 60 * 1000);
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
    const retryNumber = recentAttempts.length + 1;
    
    // Calculate next retry time with exponential backoff
    let nextRetryAt: Date | undefined;
    if (!success && retryNumber < retryConfig.maxAttempts) {
      const delay = Math.min(
        retryConfig.baseDelay * retryConfig.backoffMultiplier ** (retryNumber - 1),
        retryConfig.maxDelay
      );
      
      const jitterDelay = retryConfig.jitter 
        ? delay + Math.random() * 1000 
        : delay;
      
      nextRetryAt = new Date(Date.now() + jitterDelay);
    }

    const attempt: RetryAttempt = {
      attemptId: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: context.userId,
      deviceId: context.deviceId,
      operation: context.operation,
      timestamp: new Date(),
      success,
      retryNumber
    };

    if (errorCode) {
      attempt.errorCode = errorCode;
    }
    if (errorMessage) {
      attempt.errorMessage = errorMessage;
    }
    if (nextRetryAt) {
      attempt.nextRetryAt = nextRetryAt;
    }

    attempts.push(attempt);
    MFARetryService.retryAttempts.set(key, attempts);

    logger.info('MFARetryService', 'Recorded retry attempt', {
      userId: context.userId,
      deviceId: context.deviceId,
      operation: context.operation,
      success,
      retryNumber,
      nextRetryAt
    });

    return attempt;
  }

  /**
   * Record a rate limit request
   */
  static recordRateLimitRequest(
    context: MFAOperationContext,
    config?: Partial<RateLimitConfig>
  ): RateLimitStatus {
    const rateLimitConfig = { ...MFARetryService.DEFAULT_RATE_LIMIT_CONFIG, ...config };
    const key = MFARetryService.getRateLimitKey(context);
    const data = MFARetryService.rateLimitData.get(key) || { requests: [], violations: 0 };
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - rateLimitConfig.windowSize * 60 * 1000);
    
    // Clean old requests
    data.requests = data.requests.filter(req => req > windowStart);
    
    // Check if adding this request would exceed limit
    if (data.requests.length >= rateLimitConfig.maxRequests) {
      // Rate limit violation
      data.violations += 1;
      data.lastViolation = now;
      
      logger.warn('MFARetryService', 'Rate limit violation', {
        userId: context.userId,
        operation: context.operation,
        requestsInWindow: data.requests.length,
        maxRequests: rateLimitConfig.maxRequests,
        violations: data.violations
      });
    } else {
      // Add request to window
      data.requests.push(now);
    }
    
    MFARetryService.rateLimitData.set(key, data);
    
    return MFARetryService.checkRateLimit(context, config);
  }

  /**
   * Reset retry attempts for successful operation
   */
  static resetRetryAttempts(context: MFAOperationContext): void {
    const key = MFARetryService.getRetryKey(context);
    MFARetryService.retryAttempts.delete(key);
    
    logger.info('MFARetryService', 'Reset retry attempts', {
      userId: context.userId,
      deviceId: context.deviceId,
      operation: context.operation
    });
  }

  /**
   * Get retry delay for next attempt
   */
  static getRetryDelay(
    context: MFAOperationContext,
    config?: Partial<RetryConfig>
  ): number | null {
    const retryStatus = MFARetryService.canRetry(context, config);
    
    if (!retryStatus.nextRetryAt) {
      return null;
    }
    
    const delay = Math.max(0, retryStatus.nextRetryAt.getTime() - Date.now());
    return delay;
  }

  /**
   * Get rate limit reset time
   */
  static getRateLimitResetTime(
    context: MFAOperationContext,
    config?: Partial<RateLimitConfig>
  ): Date | null {
    const rateLimitStatus = MFARetryService.checkRateLimit(context, config);
    
    if (rateLimitStatus.blockUntil) {
      return rateLimitStatus.blockUntil;
    }
    
    return rateLimitStatus.windowResetAt;
  }

  /**
   * Clean up old retry attempts and rate limit data
   */
  static cleanup(olderThanHours: number = 24): number {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    // Clean retry attempts
    for (const [key, attempts] of MFARetryService.retryAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
      if (recentAttempts.length === 0) {
        MFARetryService.retryAttempts.delete(key);
        cleanedCount++;
      } else if (recentAttempts.length < attempts.length) {
        MFARetryService.retryAttempts.set(key, recentAttempts);
      }
    }

    // Clean rate limit data
    for (const [key, data] of MFARetryService.rateLimitData.entries()) {
      const recentRequests = data.requests.filter(req => req > cutoff);
      if (recentRequests.length === 0 && (!data.lastViolation || data.lastViolation < cutoff)) {
        MFARetryService.rateLimitData.delete(key);
        cleanedCount++;
      } else {
        data.requests = recentRequests;
        MFARetryService.rateLimitData.set(key, data);
      }
    }

    if (cleanedCount > 0) {
      logger.info('MFARetryService', 'Cleaned up old data', {
        cleanedCount,
        olderThanHours
      });
    }

    return cleanedCount;
  }

  /**
   * Get retry statistics for monitoring
   */
  static getRetryStatistics(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageRetryCount: number;
    operationStats: Record<string, { attempts: number; successRate: number }>;
    rateLimitViolations: number;
  } {
    const allAttempts = Array.from(MFARetryService.retryAttempts.values()).flat();
    const totalAttempts = allAttempts.length;
    const successfulAttempts = allAttempts.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    
    const retryGroups = new Map<string, RetryAttempt[]>();
    allAttempts.forEach(attempt => {
      const key = `${attempt.userId}_${attempt.deviceId}_${attempt.operation}`;
      const group = retryGroups.get(key) || [];
      group.push(attempt);
      retryGroups.set(key, group);
    });
    
    const retryCountsPerGroup = Array.from(retryGroups.values()).map(group => group.length);
    const averageRetryCount = retryCountsPerGroup.length > 0
      ? retryCountsPerGroup.reduce((sum, count) => sum + count, 0) / retryCountsPerGroup.length
      : 0;

    const operationStats: Record<string, { attempts: number; successRate: number }> = {};
    ['CHALLENGE', 'VERIFICATION', 'ACTIVATION', 'RESEND'].forEach(operation => {
      const operationAttempts = allAttempts.filter(a => a.operation === operation);
      const successful = operationAttempts.filter(a => a.success).length;
      
      operationStats[operation] = {
        attempts: operationAttempts.length,
        successRate: operationAttempts.length > 0 ? (successful / operationAttempts.length) * 100 : 0
      };
    });

    const rateLimitViolations = Array.from(MFARetryService.rateLimitData.values())
      .reduce((sum, data) => sum + data.violations, 0);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      averageRetryCount,
      operationStats,
      rateLimitViolations
    };
  }

  // Private helper methods

  private static getRetryKey(context: MFAOperationContext): string {
    return `${context.userId}_${context.deviceId}_${context.operation}`;
  }

  private static getRateLimitKey(context: MFAOperationContext): string {
    // Rate limiting by user and operation type (not device-specific)
    return `${context.userId}_${context.operation}`;
  }
}
