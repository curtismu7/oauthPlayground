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
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    const key = this.getRetryKey(context);
    const attempts = this.retryAttempts.get(key) || [];
    
    // Filter recent attempts within reset window
    const cutoff = new Date(Date.now() - retryConfig.resetWindow * 60 * 1000);
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
    
    const totalAttempts = recentAttempts.length;
    const attemptsRemaining = Math.max(0, retryConfig.maxAttempts - totalAttempts);
    const canRetry = attemptsRemaining > 0;
    
    const lastAttempt = recentAttempts[recentAttempts.length - 1];
    const nextRetryAt = lastAttempt?.nextRetryAt;
    const resetAt = new Date(Date.now() + retryConfig.resetWindow * 60 * 1000);

    return {
      canRetry: canRetry && (!nextRetryAt || new Date() >= nextRetryAt),
      attemptsRemaining,
      nextRetryAt,
      totalAttempts,
      lastAttemptAt: lastAttempt?.timestamp,
      resetAt
    };
  }

  /**
   * Check rate limit status
   */
  static checkRateLimit(
    context: MFAOperationContext,
    config?: Partial<RateLimitConfig>
  ): RateLimitStatus {
    const rateLimitConfig = { ...this.DEFAULT_RATE_LIMIT_CONFIG, ...config };
    const key = this.getRateLimitKey(context);
    const data = this.rateLimitData.get(key) || { requests: [], violations: 0 };
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - rateLimitConfig.windowSize * 60 * 1000);
    
    // Filter requests within current window
    const requestsInWindow = data.requests.filter(req => req > windowStart);
    const windowResetAt = new Date(windowStart.getTime() + rateLimitConfig.windowSize * 60 * 1000);
    
    // Check if currently blocked
    let blockUntil: Date | undefined;
    if (data.lastViolation) {
      const blockDuration = rateLimitConfig.progressiveBlocking
        ? rateLimitConfig.blockDuration * Math.pow(2, Math.min(data.violations - 1, 5)) // Cap at 2^5
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
    
    return {
      limited,
      requestsInWindow: requestsInWindow.length,
      maxRequests: rateLimitConfig.maxRequests,
      windowResetAt,
      blockUntil,
      violationCount: data.violations
    };
  }

  /**
   * Record a retry attempt
   */
  static recordRetryAttempt(
    context: MFAOperationContext,
    success: boolean,
    errorCode?: string,
    errorMessage?: string,
    responseTime?: number,
    config?: Partial<RetryConfig>
  ): RetryAttempt {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    const key = this.getRetryKey(context);
    const attempts = this.retryAttempts.get(key) || [];
    
    // Calculate retry number
    const cutoff = new Date(Date.now() - retryConfig.resetWindow * 60 * 1000);
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
    const retryNumber = recentAttempts.length + 1;
    
    // Calculate next retry time with exponential backoff
    let nextRetryAt: Date | undefined;
    if (!success && retryNumber < retryConfig.maxAttempts) {
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, retryNumber - 1),
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
      errorCode,
      errorMessage,
      retryNumber,
      nextRetryAt
    };

    attempts.push(attempt);
    this.retryAttempts.set(key, attempts);

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
    const rateLimitConfig = { ...this.DEFAULT_RATE_LIMIT_CONFIG, ...config };
    const key = this.getRateLimitKey(context);
    const data = this.rateLimitData.get(key) || { requests: [], violations: 0 };
    
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
    
    this.rateLimitData.set(key, data);
    
    return this.checkRateLimit(context, config);
  }

  /**
   * Reset retry attempts for successful operation
   */
  static resetRetryAttempts(context: MFAOperationContext): void {
    const key = this.getRetryKey(context);
    this.retryAttempts.delete(key);
    
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
    const retryStatus = this.canRetry(context, config);
    
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
    const rateLimitStatus = this.checkRateLimit(context, config);
    
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
    for (const [key, attempts] of this.retryAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
      if (recentAttempts.length === 0) {
        this.retryAttempts.delete(key);
        cleanedCount++;
      } else if (recentAttempts.length < attempts.length) {
        this.retryAttempts.set(key, recentAttempts);
      }
    }

    // Clean rate limit data
    for (const [key, data] of this.rateLimitData.entries()) {
      const recentRequests = data.requests.filter(req => req > cutoff);
      if (recentRequests.length === 0 && (!data.lastViolation || data.lastViolation < cutoff)) {
        this.rateLimitData.delete(key);
        cleanedCount++;
      } else {
        data.requests = recentRequests;
        this.rateLimitData.set(key, data);
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
    const allAttempts = Array.from(this.retryAttempts.values()).flat();
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

    const rateLimitViolations = Array.from(this.rateLimitData.values())
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

export default MFARetryService;At?:
 Date;
    resetAt?: Date;
  } {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    const key = this.getRetryKey(userId, deviceId, operationType);
    
    const attempts = this.getRetryCount(key, retryConfig.resetWindow);
    const canRetry = attempts < retryConfig.maxAttempts;
    const attemptsRemaining = Math.max(0, retryConfig.maxAttempts - attempts);
    
    let nextRetryAt: Date | undefined;
    let resetAt: Date | undefined;
    
    if (!canRetry) {
      const lastAttempt = this.getLastAttempt(key);
      if (lastAttempt) {
        resetAt = new Date(lastAttempt.timestamp.getTime() + retryConfig.resetWindow);
      }
    } else if (attempts > 0) {
      const lastAttempt = this.getLastAttempt(key);
      if (lastAttempt && !lastAttempt.success) {
        const delay = this.calculateRetryDelay(attempts, retryConfig);
        nextRetryAt = new Date(lastAttempt.timestamp.getTime() + delay);
      }
    }
    
    return {
      canRetry,
      attemptsRemaining,
      nextRetryAt,
      resetAt
    };
  }

  /**
   * Check rate limit status
   */
  static checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): RateLimitStatus {
    const now = new Date();
    const tracking = this.rateLimitTracking.get(key);
    
    if (!tracking) {
      return {
        limited: false,
        remainingRequests: config.maxRequests,
        resetTime: new Date(now.getTime() + config.windowSize)
      };
    }
    
    // Check if currently blocked
    if (tracking.blockedUntil && now < tracking.blockedUntil) {
      return {
        limited: true,
        remainingRequests: 0,
        resetTime: tracking.blockedUntil,
        blockUntil: tracking.blockedUntil
      };
    }
    
    // Clean old requests outside the window
    const windowStart = new Date(now.getTime() - config.windowSize);
    tracking.requests = tracking.requests.filter(req => req > windowStart);
    
    const requestCount = tracking.requests.length;
    const remainingRequests = Math.max(0, config.maxRequests - requestCount);
    
    if (requestCount >= config.maxRequests) {
      // Block the user
      tracking.blockedUntil = new Date(now.getTime() + config.blockDuration);
      this.rateLimitTracking.set(key, tracking);
      
      return {
        limited: true,
        remainingRequests: 0,
        resetTime: tracking.blockedUntil,
        blockUntil: tracking.blockedUntil
      };
    }
    
    return {
      limited: false,
      remainingRequests,
      resetTime: new Date(now.getTime() + config.windowSize)
    };
  }

  /**
   * Reset retry attempts for a user/operation
   */
  static resetRetryAttempts(
    userId: string,
    deviceId: string | undefined,
    operationType: string
  ): void {
    const key = this.getRetryKey(userId, deviceId, operationType);
    this.retryAttempts.delete(key);
    
    logger.info('MFARetryService', 'Retry attempts reset', {
      userId,
      deviceId,
      operationType
    });
  }

  /**
   * Reset rate limit for a user/operation
   */
  static resetRateLimit(
    userId: string,
    deviceId: string | undefined,
    operationType: string
  ): void {
    const key = this.getRetryKey(userId, deviceId, operationType);
    this.rateLimitTracking.delete(key);
    
    logger.info('MFARetryService', 'Rate limit reset', {
      userId,
      deviceId,
      operationType
    });
  }

  /**
   * Get retry statistics
   */
  static getRetryStatistics(timeRange?: { start: Date; end: Date }): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageRetryCount: number;
    operationBreakdown: Record<string, number>;
    errorBreakdown: Record<string, number>;
  } {
    const allAttempts = Array.from(this.retryAttempts.values()).flat();
    
    let filteredAttempts = allAttempts;
    if (timeRange) {
      filteredAttempts = allAttempts.filter(attempt => 
        attempt.timestamp >= timeRange.start && attempt.timestamp <= timeRange.end
      );
    }

    const totalAttempts = filteredAttempts.length;
    const successfulAttempts = filteredAttempts.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    
    const retryCountSum = filteredAttempts.reduce((sum, attempt) => sum + attempt.retryCount, 0);
    const averageRetryCount = totalAttempts > 0 ? retryCountSum / totalAttempts : 0;

    const operationBreakdown: Record<string, number> = {};
    const errorBreakdown: Record<string, number> = {};

    filteredAttempts.forEach(attempt => {
      operationBreakdown[attempt.operation] = (operationBreakdown[attempt.operation] || 0) + 1;
      
      if (!attempt.success && attempt.error) {
        errorBreakdown[attempt.error] = (errorBreakdown[attempt.error] || 0) + 1;
      }
    });

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      averageRetryCount,
      operationBreakdown,
      errorBreakdown
    };
  }

  /**
   * Clean up old retry attempts and rate limit data
   */
  static cleanup(): void {
    const now = new Date();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up old retry attempts
    for (const [key, attempts] of this.retryAttempts.entries()) {
      const recentAttempts = attempts.filter(
        attempt => now.getTime() - attempt.timestamp.getTime() < cleanupThreshold
      );
      
      if (recentAttempts.length === 0) {
        this.retryAttempts.delete(key);
      } else if (recentAttempts.length < attempts.length) {
        this.retryAttempts.set(key, recentAttempts);
      }
    }
    
    // Clean up old rate limit data
    for (const [key, tracking] of this.rateLimitTracking.entries()) {
      const recentRequests = tracking.requests.filter(
        req => now.getTime() - req.getTime() < cleanupThreshold
      );
      
      if (recentRequests.length === 0 && (!tracking.blockedUntil || now > tracking.blockedUntil)) {
        this.rateLimitTracking.delete(key);
      } else if (recentRequests.length < tracking.requests.length) {
        tracking.requests = recentRequests;
        this.rateLimitTracking.set(key, tracking);
      }
    }
    
    logger.info('MFARetryService', 'Cleanup completed', {
      retryKeys: this.retryAttempts.size,
      rateLimitKeys: this.rateLimitTracking.size
    });
  }

  // Private helper methods

  private static getRetryKey(
    userId: string,
    deviceId: string | undefined,
    operationType: string
  ): string {
    return `${userId}:${deviceId || 'no-device'}:${operationType}`;
  }

  private static getRetryCount(key: string, resetWindow: number): number {
    const attempts = this.retryAttempts.get(key) || [];
    const now = new Date();
    const windowStart = new Date(now.getTime() - resetWindow);
    
    return attempts.filter(attempt => attempt.timestamp > windowStart).length;
  }

  private static getLastAttempt(key: string): RetryAttempt | null {
    const attempts = this.retryAttempts.get(key) || [];
    return attempts.length > 0 ? attempts[attempts.length - 1] : null;
  }

  private static recordAttempt(
    key: string,
    context: { userId: string; deviceId?: string; operationType: string },
    retryCount: number,
    success: boolean,
    error?: string
  ): void {
    const attempt: RetryAttempt = {
      attemptId: `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: context.userId,
      deviceId: context.deviceId,
      operation: context.operationType,
      timestamp: new Date(),
      success,
      error,
      retryCount
    };

    const attempts = this.retryAttempts.get(key) || [];
    attempts.push(attempt);
    this.retryAttempts.set(key, attempts);
  }

  private static recordRateLimitRequest(key: string): void {
    const now = new Date();
    const tracking = this.rateLimitTracking.get(key) || { requests: [] };
    
    tracking.requests.push(now);
    this.rateLimitTracking.set(key, tracking);
  }

  private static calculateRetryDelay(
    attemptNumber: number,
    config: RetryConfig
  ): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default MFARetryService;