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
      const response = await fetch(
        `https://auth.pingone.com/${this.config.envId}/as/session/check`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-Skip-Intercept': 'true', // Custom header to skip request interception
          },
        }
      );
      
      if (!response.ok) {
        this.clearSession();
        return false;
      }
      
      const data = await response.json();
      return data?.active === true;
    } catch (error) {
      console.error('Session check failed:', error);
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
      const response = await fetch(
        `https://api.pingone.com/v1/environments/${this.config.envId}/sessionSettings`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.pingidentity.sessionSettings+json',
          },
          body: JSON.stringify({
            session: {
              maxInactiveUnit: 'MINUTES',
              maxInactive: lifetimeMinutes,
              ...(idleTimeoutMinutes && {
                idleTimeout: {
                  unit: 'MINUTES',
                  value: idleTimeoutMinutes,
                },
              }),
            },
          }),
        }
      );

      if (response.ok) {
        this.config.sessionLifetime = lifetimeMinutes;
        if (idleTimeoutMinutes) {
          this.config.idleTimeout = idleTimeoutMinutes;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to configure session lifetime:', error);
      return false;
    }
  }

  // Get session information
  public async getSessionInfo(accessToken: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `https://api.pingone.com/v1/environments/${this.config.envId}/sessions/me`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get session info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get session info:', error);
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
