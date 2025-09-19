 
import { logger } from './logger';
import { errorHandler } from './errorHandler';

// Session interface
export interface Session {
  id: string;
  userId?: string;
  email?: string;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number;
  data: Record<string, unknown>;
  isActive: boolean;
}

// Session configuration
export interface SessionConfig {
  sessionLifetime: number; // in milliseconds
  maxSessions: number;
  cleanupInterval: number; // in milliseconds
  enableAutoRenewal: boolean;
  renewalThreshold: number; // percentage of lifetime remaining
}

// Default session configuration
const defaultConfig: SessionConfig = {
  sessionLifetime: 24 * 60 * 60 * 1000, // 24 hours
  maxSessions: 100,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  enableAutoRenewal: true,
  renewalThreshold: 0.2 // 20% of lifetime remaining
};

// Session Manager class
export class SessionManager {
  private config: SessionConfig;
  private sessions: Map<string, Session> = new Map();
  private cleanupIntervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initialize();
  }

  // Initialize session manager
  private initialize(): void {
    this.startCleanupInterval();
    this.loadSessionsFromStorage();
    logger.info('[SessionManager] Session manager initialized');
  }

  // Create a new session
  createSession(userId?: string, email?: string, data: Record<string, unknown> = {}): Session {
    const now = Date.now();
    const sessionId = this.generateSessionId();
    
    const session: Session = {
      id: sessionId,
      userId,
      email,
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + this.config.sessionLifetime,
      data: { ...data },
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.saveSessionsToStorage();
    
    logger.info(`[SessionManager] Session created: ${sessionId}`, { userId, email });
    return session;
  }

  // Get session by ID
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      this.saveSessionsToStorage();
      return null;
    }

    // Update last accessed time
    session.lastAccessed = Date.now();
    
    // Auto-renewal if enabled
    if (this.config.enableAutoRenewal && this.shouldRenewSession(session)) {
      this.renewSession(session);
    }

    return session;
  }

  // Update session data
  updateSession(sessionId: string, data: Record<string, unknown>): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    session.data = { ...session.data, ...data };
    this.saveSessionsToStorage();
    
    logger.info(`[SessionManager] Session updated: ${sessionId}`);
    return true;
  }

  // Renew session
  renewSession(session: Session): void {
    const now = Date.now();
    session.expiresAt = now + this.config.sessionLifetime;
    session.lastAccessed = now;
    
    this.saveSessionsToStorage();
    logger.info(`[SessionManager] Session renewed: ${session.id}`);
  }

  // Check if session should be renewed
  private shouldRenewSession(session: Session): boolean {
    const now = Date.now();
    const timeRemaining = session.expiresAt - now;
    const lifetimePercentage = timeRemaining / this.config.sessionLifetime;
    
    return lifetimePercentage <= this.config.renewalThreshold;
  }

  // Destroy session
  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    this.sessions.delete(sessionId);
    this.saveSessionsToStorage();
    
    logger.info(`[SessionManager] Session destroyed: ${sessionId}`);
    return true;
  }

  // Destroy all sessions for a user
  destroyUserSessions(userId: string): number {
    let destroyedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        destroyedCount++;
      }
    }
    
    if (destroyedCount > 0) {
      this.saveSessionsToStorage();
      logger.info(`[SessionManager] Destroyed ${destroyedCount} sessions for user: ${userId}`);
    }
    
    return destroyedCount;
  }

  // Get all active sessions
  getActiveSessions(): Session[] {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(session => 
      session.isActive && session.expiresAt > now
    );
  }

  // Get sessions for a user
  getUserSessions(userId: string): Session[] {
    return Array.from(this.sessions.values()).filter(session => 
      session.userId === userId && session.isActive
    );
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveSessionsToStorage();
      logger.info(`[SessionManager] Cleaned up ${cleanedCount} expired sessions`);
    }
    
    return cleanedCount;
  }

  // Enforce session limit
  enforceSessionLimit(): number {
    if (this.sessions.size <= this.config.maxSessions) {
      return 0;
    }
    
    // Sort sessions by last accessed time (oldest first)
    const sortedSessions = Array.from(this.sessions.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    const sessionsToRemove = this.sessions.size - this.config.maxSessions;
    let removedCount = 0;
    
    for (let i = 0; i < sessionsToRemove && i < sortedSessions.length; i++) {
      const [sessionId] = sortedSessions[i];
      this.sessions.delete(sessionId);
      removedCount++;
    }
    
    if (removedCount > 0) {
      this.saveSessionsToStorage();
      logger.info(`[SessionManager] Removed ${removedCount} sessions to enforce limit`);
    }
    
    return removedCount;
  }

  // Start cleanup interval
  private startCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpiredSessions();
      this.enforceSessionLimit();
    }, this.config.cleanupInterval);
  }

  // Stop cleanup interval
  stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Save sessions to storage
  private saveSessionsToStorage(): void {
    try {
      const sessionsData = Array.from(this.sessions.entries());
      sessionStorage.setItem('oauth_playground_sessions', JSON.stringify(sessionsData));
    } catch (_error) {
      errorHandler.handleError(_error, 'Session storage save');
    }
  }

  // Load sessions from storage
  private loadSessionsFromStorage(): void {
    try {
      const sessionsData = sessionStorage.getItem('oauth_playground_sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        this.sessions = new Map(sessions);
        logger.info(`[SessionManager] Loaded ${this.sessions.size} sessions from storage`);
      }
    } catch (_error) {
      errorHandler.handleError(_error, 'Session storage load');
    }
  }

  // Get session statistics
  getSessionStats(): {
    total: number;
    active: number;
    expired: number;
    byUser: Record<string, number>;
  } {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    const byUser: Record<string, number> = {};
    
    for (const session of this.sessions.values()) {
      if (session.expiresAt > now) {
        active++;
        if (session.userId) {
          byUser[session.userId] = (byUser[session.userId] || 0) + 1;
        }
      } else {
        expired++;
      }
    }
    
    return {
      total: this.sessions.size,
      active,
      expired,
      byUser
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup interval if interval changed
    if (newConfig.cleanupInterval) {
      this.startCleanupInterval();
    }
    
    logger.info('[SessionManager] Configuration updated');
  }

  // Get current configuration
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  // Clear all sessions
  clearAllSessions(): void {
    this.sessions.clear();
    this.saveSessionsToStorage();
    logger.info('[SessionManager] All sessions cleared');
  }

  // Destroy session manager
  destroy(): void {
    this.stopCleanupInterval();
    this.clearAllSessions();
    logger.info('[SessionManager] Session manager destroyed');
  }
}

// Create global session manager instance
export const sessionManager = new SessionManager();

// Utility functions
export const createSession = (userId?: string, email?: string, data?: Record<string, unknown>): Session => {
  return sessionManager.createSession(userId, email, data);
};

export const getSession = (sessionId: string): Session | null => {
  return sessionManager.getSession(sessionId);
};

export const updateSession = (sessionId: string, data: Record<string, unknown>): boolean => {
  return sessionManager.updateSession(sessionId, data);
};

export const destroySession = (sessionId: string): boolean => {
  return sessionManager.destroySession(sessionId);
};

export const destroyUserSessions = (userId: string): number => {
  return sessionManager.destroyUserSessions(userId);
};

export const getActiveSessions = (): Session[] => {
  return sessionManager.getActiveSessions();
};

export const getUserSessions = (userId: string): Session[] => {
  return sessionManager.getUserSessions(userId);
};

export const getSessionStats = () => {
  return sessionManager.getSessionStats();
};

export default sessionManager;
