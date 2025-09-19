/* eslint-disable @typescript-eslint/no-unused-vars */
import { oauthStorage } from './storage';

interface PingOneSessionConfig {
  envId: string;
  domain: string;
  clientId: string;
  redirectUri: string;
  sessionLifetime?: number; // in minutes
  idleTimeout?: number; // in minutes
}

class PingOneSessionManager {
  private config: Required<PingOneSessionConfig>;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();

  constructor(config: PingOneSessionConfig) {
    this.config = {
      sessionLifetime: 60, // 1 hour default
      idleTimeout: 15, // 15 minutes default
      ...config,
    };
    this.setupActivityListeners();
  }

  // Initialize session tracking
  public async init(): Promise<boolean> {
    const hasSession = await this.checkActiveSession();
    if (hasSession) {
      this.startSessionMonitoring();
    }
    return hasSession;
  }

  // Check if there's an active PingOne session
  public async checkActiveSession(): Promise<boolean> {
    try {

      if (!response.ok) {
        this.clearSession();
        return false;
      }

      return data?.active === true;
    } catch (_error) {
      console.error('Session check failed:', _error);
      return false;
    }
  }

  // Configure session lifetime (requires admin API access)
  public async configureSessionLifetime(
    accessToken: string,
    lifetimeMinutes: number,
    idleTimeoutMinutes?: number
  ): Promise<boolean> {
    try {

      if (response.ok) {
        this.config.sessionLifetime = lifetimeMinutes;
        if (idleTimeoutMinutes) {
          this.config.idleTimeout = idleTimeoutMinutes;
        }
        return true;
      }
      return false;
    } catch (_error) {
      console.error('Failed to configure session lifetime:', _error);
      return false;
    }
  }

  // Get session information
  public async getSessionInfo(accessToken: string): Promise<Record<string, unknown>> {
    try {

      if (!response.ok) {
        throw new Error('Failed to get session info');
      }
      
      return await response.json();
    } catch (_error) {
      console.error('Failed to get session info:', _error);
      throw error;
    }
  }

  // Start monitoring session state
  private startSessionMonitoring(): void {
    // Check session every 30 seconds
    this.sessionCheckInterval = setInterval(async () => {
      const isActive = await this.checkActiveSession();
      if (!isActive) {
        this.clearSession();
      }
    }, 30000);
  }

  // Clear session data
  public clearSession(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    // Clear any stored tokens
    oauthStorage.clearTokens();
  }

  // Handle user activity
  private setupActivityListeners(): void {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateLastActivity = () => {
      this.lastActivity = Date.now();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, updateLastActivity, { passive: true });
    });
  }

  // Check if session is idle
  public isIdle(): boolean {
    const idleTime = (Date.now() - this.lastActivity) / (1000 * 60); // in minutes
    return idleTime > this.config.idleTimeout;
  }

  // Get remaining session time in minutes
  public getRemainingSessionTime(): number {
    const sessionStart = oauthStorage.getSessionStartTime();
    if (!sessionStart) return 0;
    
    const elapsed = (Date.now() - sessionStart) / (1000 * 60); // in minutes
    return Math.max(0, this.config.sessionLifetime - elapsed);
  }
}

export default PingOneSessionManager;
