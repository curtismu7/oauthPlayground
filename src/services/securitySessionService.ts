// src/services/securitySessionService.ts
// Security Session Service

export interface SecuritySession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  mfaCompleted: boolean;
  deviceTrusted: boolean;
}

class SecuritySessionService {
  private static currentSession: SecuritySession | null = null;

  static createSession(userId?: string): SecuritySession {
    const session: SecuritySession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      securityLevel: 'low',
      mfaCompleted: false,
      deviceTrusted: false
    };

    this.currentSession = session;
    console.log('[SecuritySessionService] Session created:', session.sessionId);
    return session;
  }

  static getCurrentSession(): SecuritySession | null {
    return this.currentSession;
  }

  static updateSession(updates: Partial<SecuritySession>): SecuritySession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession = {
      ...this.currentSession,
      ...updates,
      lastActivity: new Date()
    };

    console.log('[SecuritySessionService] Session updated:', this.currentSession.sessionId);
    return this.currentSession;
  }

  static endSession(): void {
    if (this.currentSession) {
      console.log('[SecuritySessionService] Session ended:', this.currentSession.sessionId);
      this.currentSession = null;
    }
  }

  static isSessionActive(): boolean {
    return this.currentSession?.isActive ?? false;
  }
}

export default SecuritySessionService;