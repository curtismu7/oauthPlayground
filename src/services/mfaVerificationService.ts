// src/services/mfaVerificationService.ts
// MFA Verification and Completion Logic Service

import { logger } from '../utils/logger';
import PingOneAuthService from './pingOneAuthService';

export interface MFAVerificationResult {
  success: boolean;
  deviceId: string;
  deviceType: string;
  verificationMethod: string;
  timestamp: Date;
  sessionUpdated: boolean;
  completionData?: MFACompletionData;
  error?: string;
  requiresAdditionalVerification?: boolean;
  nextSteps?: string[];
}

export interface MFACompletionData {
  userId: string;
  deviceId: string;
  deviceNickname: string;
  deviceType: string;
  verificationTimestamp: Date;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  riskScore?: number;
  authenticationLevel: 'single' | 'multi' | 'strong';
  complianceFlags: string[];
  auditTrail: MFAVerificationEvent[];
}

export interface MFAVerificationEvent {
  eventId: string;
  eventType: 'CHALLENGE_INITIATED' | 'CHALLENGE_SENT' | 'VERIFICATION_ATTEMPTED' | 'VERIFICATION_SUCCESS' | 'VERIFICATION_FAILED' | 'SESSION_UPDATED';
  timestamp: Date;
  deviceId: string;
  deviceType: string;
  success: boolean;
  details?: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
}

export interface MFASessionUpdate {
  sessionId: string;
  mfaCompleted: boolean;
  mfaDeviceUsed: string;
  mfaTimestamp: Date;
  authenticationLevel: 'single' | 'multi' | 'strong';
  riskScore?: number;
  complianceFlags: string[];
}

export interface VerificationAttempt {
  attemptId: string;
  deviceId: string;
  userId: string;
  challengeId?: string;
  verificationMethod: string;
  timestamp: Date;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  responseTime?: number;
}

class MFAVerificationService {
  private static verificationEvents = new Map<string, MFAVerificationEvent[]>();
  private static verificationAttempts = new Map<string, VerificationAttempt[]>();
  private static completionData = new Map<string, MFACompletionData>();

  /**
   * Complete MFA verification process
   */
  static async completeMFAVerification(
    userId: string,
    deviceId: string,
    deviceType: string,
    deviceNickname: string,
    verificationMethod: string,
    challengeId?: string,
    additionalData?: Record<string, any>
  ): Promise<MFAVerificationResult> {
    try {
      logger.info('MFAVerificationService', 'Completing MFA verification', {
        userId,
        deviceId,
        deviceType,
        verificationMethod
      });

      const timestamp = new Date();
      const sessionId = this.getCurrentSessionId(userId);

      // Record verification event
      const verificationEvent: MFAVerificationEvent = {
        eventId: `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'VERIFICATION_SUCCESS',
        timestamp,
        deviceId,
        deviceType,
        success: true,
        details: {
          verificationMethod,
          challengeId,
          ...additionalData
        }
      };

      this.recordVerificationEvent(userId, verificationEvent);

      // Calculate authentication level and risk score
      const authLevel = this.calculateAuthenticationLevel(deviceType, verificationMethod);
      const riskScore = await this.calculateRiskScore(userId, deviceId, deviceType);
      const complianceFlags = this.generateComplianceFlags(deviceType, verificationMethod, riskScore);

      // Create completion data
      const completionData: MFACompletionData = {
        userId,
        deviceId,
        deviceNickname,
        deviceType,
        verificationTimestamp: timestamp,
        sessionId,
        ipAddress: this.getCurrentIP(),
        userAgent: this.getCurrentUserAgent(),
        riskScore,
        authenticationLevel: authLevel,
        complianceFlags,
        auditTrail: this.getVerificationEvents(userId)
      };

      this.completionData.set(userId, completionData);

      // Update session with MFA completion
      const sessionUpdated = await this.updateSessionWithMFA(userId, {
        sessionId,
        mfaCompleted: true,
        mfaDeviceUsed: deviceId,
        mfaTimestamp: timestamp,
        authenticationLevel: authLevel,
        riskScore,
        complianceFlags
      });

      // Record session update event
      if (sessionUpdated) {
        const sessionEvent: MFAVerificationEvent = {
          eventId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'SESSION_UPDATED',
          timestamp: new Date(),
          deviceId,
          deviceType,
          success: true,
          details: {
            sessionId,
            authenticationLevel: authLevel,
            riskScore
          }
        };

        this.recordVerificationEvent(userId, sessionEvent);
      }

      logger.info('MFAVerificationService', 'MFA verification completed successfully', {
        userId,
        deviceId,
        authenticationLevel: authLevel,
        riskScore,
        sessionUpdated
      });

      return {
        success: true,
        deviceId,
        deviceType,
        verificationMethod,
        timestamp,
        sessionUpdated,
        completionData
      };
    } catch (error) {
      logger.error('MFAVerificationService', 'MFA verification completion failed', {
        userId,
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Record failure event
      const failureEvent: MFAVerificationEvent = {
        eventId: `verification_fail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'VERIFICATION_FAILED',
        timestamp: new Date(),
        deviceId,
        deviceType,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      this.recordVerificationEvent(userId, failureEvent);

      return {
        success: false,
        deviceId,
        deviceType,
        verificationMethod,
        timestamp: new Date(),
        sessionUpdated: false,
        error: error instanceof Error ? error.message : 'Verification completion failed'
      };
    }
  }

  /**
   * Record verification attempt
   */
  static recordVerificationAttempt(
    userId: string,
    deviceId: string,
    verificationMethod: string,
    success: boolean,
    challengeId?: string,
    errorCode?: string,
    errorMessage?: string,
    responseTime?: number
  ): VerificationAttempt {
    const attempt: VerificationAttempt = {
      attemptId: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      userId,
      challengeId,
      verificationMethod,
      timestamp: new Date(),
      success,
      errorCode,
      errorMessage,
      ipAddress: this.getCurrentIP(),
      userAgent: this.getCurrentUserAgent(),
      responseTime
    };

    const attempts = this.verificationAttempts.get(userId) || [];
    attempts.push(attempt);
    
    // Keep only recent attempts (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttempts = attempts.filter(a => a.timestamp > cutoff);
    
    this.verificationAttempts.set(userId, recentAttempts);

    logger.info('MFAVerificationService', 'Recorded verification attempt', {
      userId,
      deviceId,
      success,
      verificationMethod
    });

    return attempt;
  }

  /**
   * Get MFA completion data for a user
   */
  static getMFACompletionData(userId: string): MFACompletionData | null {
    return this.completionData.get(userId) || null;
  }

  /**
   * Get verification events for a user
   */
  static getVerificationEvents(userId: string): MFAVerificationEvent[] {
    return this.verificationEvents.get(userId) || [];
  }

  /**
   * Get verification attempts for a user
   */
  static getVerificationAttempts(userId: string): VerificationAttempt[] {
    return this.verificationAttempts.get(userId) || [];
  }

  /**
   * Check if user has completed MFA recently
   */
  static hasRecentMFACompletion(userId: string, withinMinutes: number = 30): boolean {
    const completionData = this.completionData.get(userId);
    if (!completionData) return false;

    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    return completionData.verificationTimestamp > cutoff;
  }

  /**
   * Get MFA verification statistics
   */
  static getVerificationStats(userId: string): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    successRate: number;
    lastSuccessfulVerification?: Date;
    mostUsedDevice?: string;
    averageResponseTime?: number;
  } {
    const attempts = this.verificationAttempts.get(userId) || [];
    const events = this.verificationEvents.get(userId) || [];

    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

    const lastSuccessful = events
      .filter(e => e.eventType === 'VERIFICATION_SUCCESS')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const deviceUsage = attempts.reduce((acc, attempt) => {
      acc[attempt.deviceId] = (acc[attempt.deviceId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedDevice = Object.keys(deviceUsage).reduce((a, b) => 
      deviceUsage[a] > deviceUsage[b] ? a : b, Object.keys(deviceUsage)[0]
    );

    const responseTimes = attempts
      .filter(a => a.responseTime && a.success)
      .map(a => a.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : undefined;

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate,
      lastSuccessfulVerification: lastSuccessful?.timestamp,
      mostUsedDevice,
      averageResponseTime
    };
  }

  /**
   * Clear verification data for a user
   */
  static clearVerificationData(userId: string): void {
    this.verificationEvents.delete(userId);
    this.verificationAttempts.delete(userId);
    this.completionData.delete(userId);
    
    logger.info('MFAVerificationService', 'Cleared verification data', { userId });
  }

  // Private helper methods

  private static recordVerificationEvent(userId: string, event: MFAVerificationEvent): void {
    const events = this.verificationEvents.get(userId) || [];
    events.push(event);
    
    // Keep only recent events (last 7 days)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => e.timestamp > cutoff);
    
    this.verificationEvents.set(userId, recentEvents);
  }

  private static calculateAuthenticationLevel(
    deviceType: string, 
    verificationMethod: string
  ): 'single' | 'multi' | 'strong' {
    // FIDO2 is considered strong authentication
    if (deviceType === 'FIDO2') {
      return 'strong';
    }

    // TOTP with proper verification is multi-factor
    if (deviceType === 'TOTP') {
      return 'multi';
    }

    // SMS/Email/Voice are single factor (something you have)
    if (['SMS', 'EMAIL', 'VOICE'].includes(deviceType)) {
      return 'single';
    }

    return 'single';
  }

  private static async calculateRiskScore(
    userId: string, 
    deviceId: string, 
    deviceType: string
  ): Promise<number> {
    // Simple risk scoring algorithm
    let riskScore = 0;

    // Base score by device type (lower is better)
    switch (deviceType) {
      case 'FIDO2':
        riskScore += 10; // Lowest risk
        break;
      case 'TOTP':
        riskScore += 20;
        break;
      case 'SMS':
        riskScore += 40;
        break;
      case 'EMAIL':
        riskScore += 35;
        break;
      case 'VOICE':
        riskScore += 45;
        break;
      default:
        riskScore += 50;
    }

    // Check recent failed attempts
    const attempts = this.verificationAttempts.get(userId) || [];
    const recentFailures = attempts.filter(a => 
      !a.success && 
      a.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ).length;

    riskScore += recentFailures * 10;

    // Check if this is a new device
    const deviceAttempts = attempts.filter(a => a.deviceId === deviceId);
    if (deviceAttempts.length === 0) {
      riskScore += 15; // New device adds risk
    }

    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, riskScore));
  }

  private static generateComplianceFlags(
    deviceType: string, 
    verificationMethod: string, 
    riskScore: number
  ): string[] {
    const flags: string[] = [];

    // NIST compliance flags
    if (deviceType === 'FIDO2') {
      flags.push('NIST_AAL3_COMPLIANT');
      flags.push('PHISHING_RESISTANT');
    } else if (deviceType === 'TOTP') {
      flags.push('NIST_AAL2_COMPLIANT');
    } else {
      flags.push('NIST_AAL1_COMPLIANT');
    }

    // Risk-based flags
    if (riskScore <= 20) {
      flags.push('LOW_RISK');
    } else if (riskScore <= 50) {
      flags.push('MEDIUM_RISK');
    } else {
      flags.push('HIGH_RISK');
    }

    // Device-specific flags
    if (['SMS', 'VOICE'].includes(deviceType)) {
      flags.push('SIM_SWAP_RISK');
    }

    if (deviceType === 'EMAIL') {
      flags.push('EMAIL_COMPROMISE_RISK');
    }

    return flags;
  }

  private static async updateSessionWithMFA(
    userId: string, 
    sessionUpdate: MFASessionUpdate
  ): Promise<boolean> {
    try {
      // Mark MFA as completed in the authentication service
      PingOneAuthService.markMFACompleted(sessionUpdate.mfaDeviceUsed);
      
      logger.info('MFAVerificationService', 'Session updated with MFA completion', {
        userId,
        sessionId: sessionUpdate.sessionId,
        deviceUsed: sessionUpdate.mfaDeviceUsed
      });

      return true;
    } catch (error) {
      logger.error('MFAVerificationService', 'Failed to update session with MFA', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private static getCurrentSessionId(userId: string): string {
    const session = PingOneAuthService.getCurrentSession();
    return session?.sessionId || `session_${userId}_${Date.now()}`;
  }

  private static getCurrentIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  private static getCurrentUserAgent(): string {
    return typeof window !== 'undefined' ? navigator.userAgent : 'Unknown';
  }
}

export default MFAVerificationService;