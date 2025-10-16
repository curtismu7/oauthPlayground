// src/services/totpActivationService.ts
// TOTP Device Activation and Backup Code Management Service

import { logger } from '../utils/logger';
import QRCodeService from './qrCodeService';

export interface TOTPActivationConfig {
  deviceId: string;
  userId: string;
  secret: string;
  issuer: string;
  accountName: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
}

export interface BackupCode {
  code: string;
  id: string;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface BackupCodeSet {
  deviceId: string;
  userId: string;
  codes: BackupCode[];
  createdAt: Date;
  lastUsed?: Date;
  regenerationCount: number;
}

export interface TOTPActivationResult {
  success: boolean;
  deviceId: string;
  activatedAt?: Date;
  backupCodes?: BackupCode[];
  error?: string;
  timeWindow?: number;
}

export interface BackupCodeValidationResult {
  valid: boolean;
  codeId?: string;
  remainingCodes?: number;
  error?: string;
  shouldRegenerate?: boolean;
}

export interface TOTPValidationAttempt {
  deviceId: string;
  userId: string;
  code: string;
  timestamp: Date;
  success: boolean;
  timeWindow?: number;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}

class TOTPActivationService {
  private static backupCodeSets = new Map<string, BackupCodeSet>();
  private static validationAttempts = new Map<string, TOTPValidationAttempt[]>();
  
  private static readonly BACKUP_CODE_LENGTH = 8;
  private static readonly BACKUP_CODE_COUNT = 10;
  private static readonly MAX_VALIDATION_ATTEMPTS = 5;
  private static readonly VALIDATION_WINDOW_MINUTES = 5;

  /**
   * Activate TOTP device with code validation
   */
  static async activateTOTPDevice(
    config: TOTPActivationConfig,
    activationCode: string,
    options?: {
      generateBackupCodes?: boolean;
      validateTimeWindow?: boolean;
      allowedTimeSkew?: number;
    }
  ): Promise<TOTPActivationResult> {
    try {
      logger.info('TOTPActivationService', 'Activating TOTP device', {
        deviceId: config.deviceId,
        userId: config.userId,
        issuer: config.issuer
      });

      // Validate the activation code
      const validation = await this.validateTOTPCode(
        config.secret,
        activationCode,
        {
          allowedTimeSkew: options?.allowedTimeSkew || 1,
          validateTimeWindow: options?.validateTimeWindow !== false
        }
      );

      if (!validation.valid) {
        this.recordValidationAttempt(config.deviceId, config.userId, activationCode, false, validation.error);
        
        return {
          success: false,
          deviceId: config.deviceId,
          error: validation.error || 'Invalid TOTP code'
        };
      }

      // Record successful validation
      this.recordValidationAttempt(config.deviceId, config.userId, activationCode, true, undefined, validation.timeWindow);

      // Generate backup codes if requested
      let backupCodes: BackupCode[] | undefined;
      if (options?.generateBackupCodes !== false) {
        backupCodes = await this.generateBackupCodes(config.deviceId, config.userId);
      }

      const activatedAt = new Date();

      logger.info('TOTPActivationService', 'TOTP device activated successfully', {
        deviceId: config.deviceId,
        userId: config.userId,
        timeWindow: validation.timeWindow,
        backupCodesGenerated: !!backupCodes
      });

      return {
        success: true,
        deviceId: config.deviceId,
        activatedAt,
        backupCodes,
        timeWindow: validation.timeWindow
      };
    } catch (error) {
      logger.error('TOTPActivationService', 'TOTP activation failed', {
        deviceId: config.deviceId,
        userId: config.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        deviceId: config.deviceId,
        error: `Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate TOTP code with time window tolerance
   */
  static async validateTOTPCode(
    secret: string,
    code: string,
    options?: {
      allowedTimeSkew?: number;
      validateTimeWindow?: boolean;
    }
  ): Promise<{ valid: boolean; timeWindow?: number; error?: string }> {
    try {
      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        return { valid: false, error: 'Invalid code format. Please enter a 6-digit number.' };
      }

      // Use QRCodeService for validation with time window tolerance
      const result = QRCodeService.validateTOTPCode(secret, code);
      
      if (result.valid) {
        return {
          valid: true,
          timeWindow: result.timeWindow
        };
      }

      // If basic validation fails, try with time skew tolerance
      const allowedSkew = options?.allowedTimeSkew || 1;
      const now = Math.floor(Date.now() / 1000);
      const period = 30; // Standard TOTP period

      for (let skew = -allowedSkew; skew <= allowedSkew; skew++) {
        if (skew === 0) continue; // Already checked above
        
        const timeStep = Math.floor((now + (skew * period)) / period);
        const expectedCode = this.generateTOTPCode(secret, timeStep);
        
        if (expectedCode === code) {
          return {
            valid: true,
            timeWindow: skew
          };
        }
      }

      return { 
        valid: false, 
        error: 'Invalid TOTP code. Please check your authenticator app and try again.' 
      };
    } catch (error) {
      logger.error('TOTPActivationService', 'TOTP validation error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return { 
        valid: false, 
        error: 'Validation failed due to technical error' 
      };
    }
  }

  /**
   * Generate backup codes for a device
   */
  static async generateBackupCodes(
    deviceId: string,
    userId: string,
    count: number = this.BACKUP_CODE_COUNT
  ): Promise<BackupCode[]> {
    try {
      const codes: BackupCode[] = [];
      const createdAt = new Date();

      for (let i = 0; i < count; i++) {
        const code = this.generateSecureBackupCode();
        codes.push({
          code,
          id: `backup_${deviceId}_${i + 1}_${Date.now()}`,
          used: false,
          createdAt
        });
      }

      // Store backup code set
      const existingSet = this.backupCodeSets.get(deviceId);
      const backupCodeSet: BackupCodeSet = {
        deviceId,
        userId,
        codes,
        createdAt,
        regenerationCount: existingSet ? existingSet.regenerationCount + 1 : 0
      };

      this.backupCodeSets.set(deviceId, backupCodeSet);

      logger.info('TOTPActivationService', 'Generated backup codes', {
        deviceId,
        userId,
        codeCount: codes.length,
        regenerationCount: backupCodeSet.regenerationCount
      });

      return codes;
    } catch (error) {
      logger.error('TOTPActivationService', 'Failed to generate backup codes', {
        deviceId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to generate backup codes');
    }
  }

  /**
   * Validate backup code
   */
  static validateBackupCode(
    deviceId: string,
    userId: string,
    code: string
  ): BackupCodeValidationResult {
    try {
      const backupCodeSet = this.backupCodeSets.get(deviceId);
      
      if (!backupCodeSet || backupCodeSet.userId !== userId) {
        return {
          valid: false,
          error: 'No backup codes found for this device'
        };
      }

      // Find matching unused code
      const matchingCode = backupCodeSet.codes.find(
        c => c.code === code && !c.used
      );

      if (!matchingCode) {
        // Check if code was already used
        const usedCode = backupCodeSet.codes.find(c => c.code === code && c.used);
        if (usedCode) {
          return {
            valid: false,
            error: 'This backup code has already been used'
          };
        }
        
        return {
          valid: false,
          error: 'Invalid backup code'
        };
      }

      // Mark code as used
      matchingCode.used = true;
      matchingCode.usedAt = new Date();
      backupCodeSet.lastUsed = new Date();

      // Count remaining codes
      const remainingCodes = backupCodeSet.codes.filter(c => !c.used).length;
      const shouldRegenerate = remainingCodes <= Math.floor(this.BACKUP_CODE_COUNT / 2);

      logger.info('TOTPActivationService', 'Backup code validated', {
        deviceId,
        userId,
        codeId: matchingCode.id,
        remainingCodes,
        shouldRegenerate
      });

      return {
        valid: true,
        codeId: matchingCode.id,
        remainingCodes,
        shouldRegenerate
      };
    } catch (error) {
      logger.error('TOTPActivationService', 'Backup code validation failed', {
        deviceId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        valid: false,
        error: 'Backup code validation failed'
      };
    }
  }

  /**
   * Get backup codes for a device
   */
  static getBackupCodes(deviceId: string, userId: string): BackupCode[] | null {
    const backupCodeSet = this.backupCodeSets.get(deviceId);
    
    if (!backupCodeSet || backupCodeSet.userId !== userId) {
      return null;
    }

    return backupCodeSet.codes;
  }

  /**
   * Get backup code statistics
   */
  static getBackupCodeStats(deviceId: string, userId: string): {
    total: number;
    used: number;
    remaining: number;
    lastUsed?: Date;
    shouldRegenerate: boolean;
  } | null {
    const backupCodeSet = this.backupCodeSets.get(deviceId);
    
    if (!backupCodeSet || backupCodeSet.userId !== userId) {
      return null;
    }

    const total = backupCodeSet.codes.length;
    const used = backupCodeSet.codes.filter(c => c.used).length;
    const remaining = total - used;
    const shouldRegenerate = remaining <= Math.floor(this.BACKUP_CODE_COUNT / 2);

    return {
      total,
      used,
      remaining,
      lastUsed: backupCodeSet.lastUsed,
      shouldRegenerate
    };
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(
    deviceId: string,
    userId: string
  ): Promise<BackupCode[]> {
    logger.info('TOTPActivationService', 'Regenerating backup codes', {
      deviceId,
      userId
    });

    return this.generateBackupCodes(deviceId, userId);
  }

  /**
   * Get validation attempts for a device
   */
  static getValidationAttempts(deviceId: string): TOTPValidationAttempt[] {
    return this.validationAttempts.get(deviceId) || [];
  }

  /**
   * Check if device is locked due to too many failed attempts
   */
  static isDeviceLocked(deviceId: string): {
    locked: boolean;
    attemptsRemaining?: number;
    lockoutTime?: Date;
  } {
    const attempts = this.validationAttempts.get(deviceId) || [];
    const recentAttempts = attempts.filter(
      attempt => {
        const cutoff = new Date(Date.now() - this.VALIDATION_WINDOW_MINUTES * 60 * 1000);
        return attempt.timestamp > cutoff;
      }
    );

    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= this.MAX_VALIDATION_ATTEMPTS) {
      const oldestFailedAttempt = failedAttempts[0];
      const lockoutTime = new Date(
        oldestFailedAttempt.timestamp.getTime() + this.VALIDATION_WINDOW_MINUTES * 60 * 1000
      );
      
      return {
        locked: true,
        lockoutTime
      };
    }

    return {
      locked: false,
      attemptsRemaining: this.MAX_VALIDATION_ATTEMPTS - failedAttempts.length
    };
  }

  /**
   * Clear validation attempts (for testing or admin purposes)
   */
  static clearValidationAttempts(deviceId: string): void {
    this.validationAttempts.delete(deviceId);
    logger.info('TOTPActivationService', 'Cleared validation attempts', { deviceId });
  }

  /**
   * Export backup codes to text format
   */
  static exportBackupCodes(
    deviceId: string,
    userId: string,
    deviceNickname?: string
  ): string | null {
    const backupCodeSet = this.backupCodeSets.get(deviceId);
    
    if (!backupCodeSet || backupCodeSet.userId !== userId) {
      return null;
    }

    const lines = [
      `TOTP Backup Codes${deviceNickname ? ` for ${deviceNickname}` : ''}`,
      `Generated: ${backupCodeSet.createdAt.toLocaleString()}`,
      `Device ID: ${deviceId}`,
      `User ID: ${userId}`,
      '',
      'Backup Codes:',
      ...backupCodeSet.codes.map((code, index) => 
        `${(index + 1).toString().padStart(2, '0')}. ${code.code}${code.used ? ' (USED)' : ''}`
      ),
      '',
      'Important Instructions:',
      '- Each code can only be used once',
      '- Store these codes in a secure location',
      '- Generate new codes when you have used more than half',
      '- Do not share these codes with anyone',
      '',
      `Regeneration Count: ${backupCodeSet.regenerationCount}`,
      `Export Date: ${new Date().toLocaleString()}`
    ];

    return lines.join('\n');
  }

  // Private helper methods

  private static generateSecureBackupCode(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    
    // Use crypto.getRandomValues for secure random generation
    const array = new Uint8Array(this.BACKUP_CODE_LENGTH);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < this.BACKUP_CODE_LENGTH; i++) {
      result += chars[array[i] % chars.length];
    }
    
    // Format as XXXX-XXXX for readability
    return result.slice(0, 4) + '-' + result.slice(4);
  }

  private static generateTOTPCode(secret: string, timeStep: number): string {
    // This is a simplified implementation
    // In production, use a proper HMAC-SHA1 implementation
    const hash = this.hmacSha1(secret, timeStep.toString());
    const offset = hash.charCodeAt(hash.length - 1) & 0x0f;
    const code = (
      ((hash.charCodeAt(offset) & 0x7f) << 24) |
      ((hash.charCodeAt(offset + 1) & 0xff) << 16) |
      ((hash.charCodeAt(offset + 2) & 0xff) << 8) |
      (hash.charCodeAt(offset + 3) & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  private static hmacSha1(key: string, data: string): string {
    // Simplified HMAC-SHA1 implementation for demo purposes
    // In production, use a proper crypto library
    return btoa(key + data).slice(0, 20);
  }

  private static recordValidationAttempt(
    deviceId: string,
    userId: string,
    code: string,
    success: boolean,
    error?: string,
    timeWindow?: number
  ): void {
    const attempt: TOTPValidationAttempt = {
      deviceId,
      userId,
      code: code.slice(0, 2) + '****', // Mask the code for security
      timestamp: new Date(),
      success,
      timeWindow,
      error,
      ipAddress: this.getCurrentIP(),
      userAgent: this.getCurrentUserAgent()
    };

    const attempts = this.validationAttempts.get(deviceId) || [];
    attempts.push(attempt);
    
    // Keep only recent attempts (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttempts = attempts.filter(a => a.timestamp > cutoff);
    
    this.validationAttempts.set(deviceId, recentAttempts);
  }

  private static getCurrentIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  private static getCurrentUserAgent(): string {
    return typeof window !== 'undefined' ? navigator.userAgent : 'Unknown';
  }
}

export default TOTPActivationService;