import { logger } from './logger';
import { analyticsManager } from './analytics';

// User behavior tracking types
export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: PageView[];
  userActions: UserAction[];
  flowInteractions: FlowInteraction[];
  engagementScore: number;
  deviceInfo: DeviceInfo;
  locationInfo?: LocationInfo;
}

export interface PageView {
  id: string;
  page: string;
  timestamp: number;
  duration?: number;
  referrer?: string;
  scrollDepth: number;
  timeOnPage?: number;
  properties?: Record<string, any>;
}

export interface UserAction {
  id: string;
  action: string;
  element?: string;
  timestamp: number;
  page: string;
  coordinates?: { x: number; y: number };
  properties?: Record<string, any>;
}

export interface FlowInteraction {
  id: string;
  flowType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: FlowStep[];
  success: boolean;
  errorMessage?: string;
  dropOffStep?: string;
  completionRate: number;
  properties?: Record<string, any>;
}

export interface FlowStep {
  id: string;
  stepName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  userActions: UserAction[];
  properties?: Record<string, any>;
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  viewportSize: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  language: string;
  timezone: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  ip?: string;
  isp?: string;
}

export interface UserJourney {
  userId: string;
  sessions: UserSession[];
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;
  mostVisitedPages: Array<{ page: string; count: number }>;
  favoriteFlows: Array<{ flowType: string; count: number }>;
  engagementTrend: Array<{ date: string; score: number }>;
  conversionFunnel: ConversionFunnel;
}

export interface ConversionFunnel {
  steps: FunnelStep[];
  conversionRate: number;
  dropOffPoints: Array<{ step: string; dropOffRate: number }>;
}

export interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  averageTime: number;
}

export interface EngagementMetrics {
  sessionDuration: number;
  pageViews: number;
  userActions: number;
  flowCompletions: number;
  scrollDepth: number;
  timeOnSite: number;
  bounceRate: number;
  returnVisitor: boolean;
}

// User behavior tracking manager
export class UserBehaviorTracker {
  private currentSession: UserSession | null = null;
  private userJourneys: Map<string, UserJourney> = new Map();
  private isTracking: boolean = false;
  private trackingConfig: {
    trackClicks: boolean;
    trackScrolls: boolean;
    trackForms: boolean;
    trackFlows: boolean;
    trackPageViews: boolean;
    trackEngagement: boolean;
  };

  constructor(config: Partial<UserBehaviorTracker['trackingConfig']> = {}) {
    this.trackingConfig = {
      trackClicks: true,
      trackScrolls: true,
      trackForms: true,
      trackFlows: true,
      trackPageViews: true,
      trackEngagement: true,
      ...config
    };

    this.initialize();
  }

  // Initialize user behavior tracking
  private initialize(): void {
    if (typeof window === 'undefined') return;

    try {
      this.startNewSession();
      this.setupEventListeners();
      this.setupPageVisibilityTracking();
      this.setupScrollTracking();
      this.setupEngagementTracking();
      
      this.isTracking = true;
      logger.info('[UserBehaviorTracker] User behavior tracking initialized');
    } catch (error) {
      logger.error('[UserBehaviorTracker] Failed to initialize user behavior tracking:', error);
    }
  }

  // Start a new user session
  public startNewSession(userId?: string): UserSession {
    const sessionId = this.generateSessionId();
    const deviceInfo = this.getDeviceInfo();

    this.currentSession = {
      id: sessionId,
      userId,
      startTime: Date.now(),
      pageViews: [],
      userActions: [],
      flowInteractions: [],
      engagementScore: 0,
      deviceInfo
    };

    // Track session start
    analyticsManager.track('custom_event', {
      eventName: 'session_start',
      sessionId,
      userId,
      deviceInfo
    });

    logger.info('[UserBehaviorTracker] New session started:', sessionId);
    return this.currentSession;
  }

  // End current session
  public endCurrentSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.engagementScore = this.calculateEngagementScore(this.currentSession);

    // Track session end
    analyticsManager.track('custom_event', {
      eventName: 'session_end',
      sessionId: this.currentSession.id,
      duration: this.currentSession.duration,
      engagementScore: this.currentSession.engagementScore,
      pageViews: this.currentSession.pageViews.length,
      userActions: this.currentSession.userActions.length,
      flowInteractions: this.currentSession.flowInteractions.length
    });

    // Update user journey
    if (this.currentSession.userId) {
      this.updateUserJourney(this.currentSession);
    }

    logger.info('[UserBehaviorTracker] Session ended:', this.currentSession.id);
    this.currentSession = null;
  }

  // Track page view
  public trackPageView(page: string, referrer?: string): void {
    if (!this.currentSession || !this.trackingConfig.trackPageViews) return;

    const pageView: PageView = {
      id: this.generateId(),
      page,
      timestamp: Date.now(),
      referrer,
      scrollDepth: 0,
      properties: {
        url: window.location.href,
        title: document.title
      }
    };

    this.currentSession.pageViews.push(pageView);

    // Track with analytics
    analyticsManager.trackPageView(page, {
      sessionId: this.currentSession.id,
      referrer,
      timestamp: pageView.timestamp
    });

    logger.info('[UserBehaviorTracker] Page view tracked:', page);
  }

  // Track user action
  public trackUserAction(action: string, element?: string, properties?: Record<string, any>): void {
    if (!this.currentSession || !this.trackingConfig.trackClicks) return;

    const userAction: UserAction = {
      id: this.generateId(),
      action,
      element,
      timestamp: Date.now(),
      page: window.location.pathname,
      coordinates: this.getMouseCoordinates(),
      properties
    };

    this.currentSession.userActions.push(userAction);

    // Track with analytics
    analyticsManager.trackUserAction(action, element, {
      sessionId: this.currentSession.id,
      page: userAction.page,
      coordinates: userAction.coordinates,
      ...properties
    });

    logger.info('[UserBehaviorTracker] User action tracked:', { action, element });
  }

  // Track flow interaction
  public trackFlowStart(flowType: string, properties?: Record<string, any>): string {
    if (!this.currentSession || !this.trackingConfig.trackFlows) return '';

    const flowId = this.generateId();
    const flowInteraction: FlowInteraction = {
      id: flowId,
      flowType,
      startTime: Date.now(),
      steps: [],
      success: false,
      completionRate: 0,
      properties
    };

    this.currentSession.flowInteractions.push(flowInteraction);

    // Track with analytics
    analyticsManager.trackFlowStart(flowType, {
      sessionId: this.currentSession.id,
      flowId,
      ...properties
    });

    logger.info('[UserBehaviorTracker] Flow started:', { flowType, flowId });
    return flowId;
  }

  // Track flow step
  public trackFlowStep(flowId: string, stepName: string, properties?: Record<string, any>): string {
    if (!this.currentSession) return '';

    const flow = this.currentSession.flowInteractions.find(f => f.id === flowId);
    if (!flow) return '';

    const stepId = this.generateId();
    const step: FlowStep = {
      id: stepId,
      stepName,
      startTime: Date.now(),
      success: false,
      userActions: [],
      properties
    };

    flow.steps.push(step);

    logger.info('[UserBehaviorTracker] Flow step tracked:', { flowId, stepName, stepId });
    return stepId;
  }

  // Complete flow step
  public completeFlowStep(stepId: string, success: boolean, errorMessage?: string): void {
    if (!this.currentSession) return;

    for (const flow of this.currentSession.flowInteractions) {
      const step = flow.steps.find(s => s.id === stepId);
      if (step) {
        step.endTime = Date.now();
        step.duration = step.endTime - step.startTime;
        step.success = success;
        step.errorMessage = errorMessage;
        break;
      }
    }

    logger.info('[UserBehaviorTracker] Flow step completed:', { stepId, success });
  }

  // Complete flow
  public completeFlow(flowId: string, success: boolean, errorMessage?: string): void {
    if (!this.currentSession) return;

    const flow = this.currentSession.flowInteractions.find(f => f.id === flowId);
    if (!flow) return;

    flow.endTime = Date.now();
    flow.duration = flow.endTime - flow.startTime;
    flow.success = success;
    flow.errorMessage = errorMessage;
    flow.completionRate = this.calculateFlowCompletionRate(flow);

    // Find drop-off point if not successful
    if (!success) {
      flow.dropOffStep = this.findDropOffStep(flow);
    }

    // Track with analytics
    if (success) {
      analyticsManager.trackFlowComplete(flow.flowType, true, {
        sessionId: this.currentSession.id,
        flowId,
        duration: flow.duration,
        completionRate: flow.completionRate
      });
    } else {
      analyticsManager.trackFlowError(flow.flowType, errorMessage || 'Unknown error', {
        sessionId: this.currentSession.id,
        flowId,
        dropOffStep: flow.dropOffStep
      });
    }

    logger.info('[UserBehaviorTracker] Flow completed:', { flowId, success, completionRate: flow.completionRate });
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackUserAction('click', target.tagName, {
        id: target.id,
        className: target.className,
        text: target.textContent?.slice(0, 100),
        href: target.getAttribute('href')
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackUserAction('form_submit', form.tagName, {
        formId: form.id,
        formAction: form.action,
        formMethod: form.method
      });
    });

    // Track form field changes
    document.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'text' || target.type === 'email' || target.type === 'password') {
        this.trackUserAction('form_field_change', target.tagName, {
          fieldName: target.name,
          fieldType: target.type,
          fieldId: target.id
        });
      }
    });

    // Track focus events
    document.addEventListener('focus', (event) => {
      const target = event.target as HTMLElement;
      this.trackUserAction('focus', target.tagName, {
        elementId: target.id,
        elementType: target.tagName
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackUserAction('page_hidden', 'document');
      } else {
        this.trackUserAction('page_visible', 'document');
      }
    });
  }

  // Setup page visibility tracking
  private setupPageVisibilityTracking(): void {
    if (typeof window === 'undefined') return;

    // Track when user leaves page
    window.addEventListener('beforeunload', () => {
      this.endCurrentSession();
    });

    // Track page focus/blur
    window.addEventListener('focus', () => {
      this.trackUserAction('window_focus', 'window');
    });

    window.addEventListener('blur', () => {
      this.trackUserAction('window_blur', 'window');
    });
  }

  // Setup scroll tracking
  private setupScrollTracking(): void {
    if (typeof window === 'undefined' || !this.trackingConfig.trackScrolls) return;

    let maxScrollDepth = 0;
    let scrollTimeout: NodeJS.Timeout;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;
          
          // Update current page view scroll depth
          if (this.currentSession && this.currentSession.pageViews.length > 0) {
            const currentPageView = this.currentSession.pageViews[this.currentSession.pageViews.length - 1];
            currentPageView.scrollDepth = maxScrollDepth;
          }

          this.trackUserAction('scroll', 'window', {
            scrollDepth: maxScrollDepth,
            scrollY: window.scrollY,
            documentHeight: document.body.scrollHeight
          });
        }
      }, 100);
    });
  }

  // Setup engagement tracking
  private setupEngagementTracking(): void {
    if (typeof window === 'undefined' || !this.trackingConfig.trackEngagement) return;

    let engagementTimer: NodeJS.Timeout;
    let isEngaged = false;

    const resetEngagementTimer = () => {
      clearTimeout(engagementTimer);
      isEngaged = true;
      
      engagementTimer = setTimeout(() => {
        isEngaged = false;
        this.trackUserAction('engagement_lost', 'session');
      }, 30000); // 30 seconds of inactivity
    };

    // Track engagement on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetEngagementTimer, true);
    });

    // Initial engagement
    resetEngagementTimer();
  }

  // Calculate engagement score
  private calculateEngagementScore(session: UserSession): number {
    const weights = {
      duration: 0.3,
      pageViews: 0.2,
      userActions: 0.2,
      flowCompletions: 0.2,
      scrollDepth: 0.1
    };

    const duration = session.duration || 0;
    const pageViews = session.pageViews.length;
    const userActions = session.userActions.length;
    const flowCompletions = session.flowInteractions.filter(f => f.success).length;
    const avgScrollDepth = session.pageViews.reduce((sum, pv) => sum + pv.scrollDepth, 0) / Math.max(pageViews, 1);

    // Normalize values (these would be based on your specific metrics)
    const normalizedDuration = Math.min(duration / 300000, 1); // 5 minutes max
    const normalizedPageViews = Math.min(pageViews / 10, 1); // 10 pages max
    const normalizedUserActions = Math.min(userActions / 50, 1); // 50 actions max
    const normalizedFlowCompletions = Math.min(flowCompletions / 5, 1); // 5 flows max
    const normalizedScrollDepth = avgScrollDepth / 100; // percentage

    const score = (
      normalizedDuration * weights.duration +
      normalizedPageViews * weights.pageViews +
      normalizedUserActions * weights.userActions +
      normalizedFlowCompletions * weights.flowCompletions +
      normalizedScrollDepth * weights.scrollDepth
    ) * 100;

    return Math.round(score);
  }

  // Calculate flow completion rate
  private calculateFlowCompletionRate(flow: FlowInteraction): number {
    if (flow.steps.length === 0) return 0;
    
    const completedSteps = flow.steps.filter(step => step.success).length;
    return (completedSteps / flow.steps.length) * 100;
  }

  // Find drop-off step
  private findDropOffStep(flow: FlowInteraction): string | undefined {
    const failedStep = flow.steps.find(step => !step.success);
    return failedStep?.stepName;
  }

  // Update user journey
  private updateUserJourney(session: UserSession): void {
    if (!session.userId) return;

    let journey = this.userJourneys.get(session.userId);
    if (!journey) {
      journey = {
        userId: session.userId,
        sessions: [],
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        mostVisitedPages: [],
        favoriteFlows: [],
        engagementTrend: [],
        conversionFunnel: {
          steps: [],
          conversionRate: 0,
          dropOffPoints: []
        }
      };
    }

    journey.sessions.push(session);
    journey.totalSessions = journey.sessions.length;
    journey.totalDuration = journey.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    journey.averageSessionDuration = journey.totalDuration / journey.totalSessions;

    // Update most visited pages
    const pageCounts = new Map<string, number>();
    journey.sessions.forEach(s => {
      s.pageViews.forEach(pv => {
        pageCounts.set(pv.page, (pageCounts.get(pv.page) || 0) + 1);
      });
    });
    journey.mostVisitedPages = Array.from(pageCounts.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Update favorite flows
    const flowCounts = new Map<string, number>();
    journey.sessions.forEach(s => {
      s.flowInteractions.forEach(fi => {
        flowCounts.set(fi.flowType, (flowCounts.get(fi.flowType) || 0) + 1);
      });
    });
    journey.favoriteFlows = Array.from(flowCounts.entries())
      .map(([flowType, count]) => ({ flowType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.userJourneys.set(session.userId, journey);
  }

  // Get device info
  private getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'unknown',
        screenResolution: 'unknown',
        viewportSize: 'unknown',
        deviceType: 'desktop',
        browser: 'unknown',
        os: 'unknown',
        language: 'unknown',
        timezone: 'unknown'
      };
    }

    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    
    // Simple device type detection
    let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';
    if (window.innerWidth < 768) {
      deviceType = 'mobile';
    } else if (window.innerWidth < 1024) {
      deviceType = 'tablet';
    }

    // Simple browser detection
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Simple OS detection
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      userAgent,
      screenResolution,
      viewportSize,
      deviceType,
      browser,
      os,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Get mouse coordinates
  private getMouseCoordinates(): { x: number; y: number } | undefined {
    if (typeof window === 'undefined') return undefined;
    
    // This would need to be tracked with mouse events
    return { x: 0, y: 0 };
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate ID
  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current session
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  // Get user journey
  public getUserJourney(userId: string): UserJourney | undefined {
    return this.userJourneys.get(userId);
  }

  // Get all user journeys
  public getAllUserJourneys(): UserJourney[] {
    return Array.from(this.userJourneys.values());
  }

  // Get engagement metrics
  public getEngagementMetrics(): EngagementMetrics {
    if (!this.currentSession) {
      return {
        sessionDuration: 0,
        pageViews: 0,
        userActions: 0,
        flowCompletions: 0,
        scrollDepth: 0,
        timeOnSite: 0,
        bounceRate: 0,
        returnVisitor: false
      };
    }

    const session = this.currentSession;
    const duration = session.duration || (Date.now() - session.startTime);
    const pageViews = session.pageViews.length;
    const userActions = session.userActions.length;
    const flowCompletions = session.flowInteractions.filter(f => f.success).length;
    const avgScrollDepth = session.pageViews.reduce((sum, pv) => sum + pv.scrollDepth, 0) / Math.max(pageViews, 1);
    const timeOnSite = duration;
    const bounceRate = pageViews === 1 ? 100 : 0; // Simple bounce rate calculation
    const returnVisitor = this.userJourneys.has(session.userId || '');

    return {
      sessionDuration: duration,
      pageViews,
      userActions,
      flowCompletions,
      scrollDepth: avgScrollDepth,
      timeOnSite,
      bounceRate,
      returnVisitor
    };
  }

  // Update tracking configuration
  public updateConfig(newConfig: Partial<UserBehaviorTracker['trackingConfig']>): void {
    this.trackingConfig = { ...this.trackingConfig, ...newConfig };
    logger.info('[UserBehaviorTracker] Configuration updated');
  }

  // Enable/disable tracking
  public setTrackingEnabled(enabled: boolean): void {
    this.isTracking = enabled;
    if (enabled && !this.currentSession) {
      this.startNewSession();
    } else if (!enabled && this.currentSession) {
      this.endCurrentSession();
    }
  }

  // Destroy tracker
  public destroy(): void {
    this.endCurrentSession();
    this.isTracking = false;
    logger.info('[UserBehaviorTracker] User behavior tracker destroyed');
  }
}

// Create global user behavior tracker instance
export const userBehaviorTracker = new UserBehaviorTracker();

// Utility functions
export const trackPageView = (page: string, referrer?: string) => {
  userBehaviorTracker.trackPageView(page, referrer);
};

export const trackUserAction = (action: string, element?: string, properties?: Record<string, any>) => {
  userBehaviorTracker.trackUserAction(action, element, properties);
};

export const trackFlowStart = (flowType: string, properties?: Record<string, any>) => {
  return userBehaviorTracker.trackFlowStart(flowType, properties);
};

export const trackFlowStep = (flowId: string, stepName: string, properties?: Record<string, any>) => {
  return userBehaviorTracker.trackFlowStep(flowId, stepName, properties);
};

export const completeFlowStep = (stepId: string, success: boolean, errorMessage?: string) => {
  userBehaviorTracker.completeFlowStep(stepId, success, errorMessage);
};

export const completeFlow = (flowId: string, success: boolean, errorMessage?: string) => {
  userBehaviorTracker.completeFlow(flowId, success, errorMessage);
};

export const getCurrentSession = () => {
  return userBehaviorTracker.getCurrentSession();
};

export const getUserJourney = (userId: string) => {
  return userBehaviorTracker.getUserJourney(userId);
};

export const getEngagementMetrics = () => {
  return userBehaviorTracker.getEngagementMetrics();
};

export default userBehaviorTracker;
