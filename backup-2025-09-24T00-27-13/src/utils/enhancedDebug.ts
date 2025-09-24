// src/utils/enhancedDebug.ts - Enhanced debugging tools for OAuth/OIDC flows

export interface DebugSession {
  id: string;
  flowType: string;
  startTime: number;
  endTime?: number;
  steps: DebugStep[];
  errors: DebugError[];
  performance: PerformanceMetrics;
  networkRequests: NetworkRequest[];
}

export interface DebugStep {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errors?: string[];
}

export interface DebugError {
  timestamp: number;
  step: string;
  error: string;
  stack?: string;
  context: Record<string, unknown>;
  recoveryAttempts: number;
}

export interface PerformanceMetrics {
  totalDuration?: number;
  stepDurations: Record<string, number>;
  networkLatency: number[];
  memoryUsage: number[];
  renderCount: number;
}

export interface NetworkRequest {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  error?: string;
}

export class EnhancedDebugger {
  private sessions: Map<string, DebugSession> = new Map();
  private currentSession: DebugSession | null = null;
  private networkInterceptor: ((request: NetworkRequest) => void) | null = null;

  /**
   * Start a new debug session
   */
  startSession(flowType: string): string {
    const sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: DebugSession = {
      id: sessionId,
      flowType,
      startTime: Date.now(),
      steps: [],
      errors: [],
      performance: {
        stepDurations: {},
        networkLatency: [],
        memoryUsage: [],
        renderCount: 0
      },
      networkRequests: []
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;
    
    console.log('🔍 [EnhancedDebug] Debug session started:', sessionId);
    
    // Start network monitoring
    this.startNetworkMonitoring();
    
    return sessionId;
  }

  /**
   * End the current debug session
   */
  endSession(): DebugSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.performance.totalDuration = 
      this.currentSession.endTime - this.currentSession.startTime;

    console.log('✅ [EnhancedDebug] Debug session completed:', {
      sessionId: this.currentSession.id,
      duration: this.currentSession.performance.totalDuration,
      steps: this.currentSession.steps.length,
      errors: this.currentSession.errors.length,
      networkRequests: this.currentSession.networkRequests.length
    });

    const completedSession = this.currentSession;
    this.currentSession = null;
    
    // Stop network monitoring
    this.stopNetworkMonitoring();
    
    return completedSession;
  }

  /**
   * Log a debug step
   */
  logStep(
    stepId: string,
    stepName: string,
    status: DebugStep['status'],
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): void {
    if (!this.currentSession) return;

    const existingStep = this.currentSession.steps.find(s => s.id === stepId);
    
    if (existingStep) {
      // Update existing step
      existingStep.status = status;
      existingStep.endTime = Date.now();
      existingStep.duration = existingStep.endTime - existingStep.startTime;
      if (output) existingStep.output = output;
      
      this.currentSession.performance.stepDurations[stepId] = existingStep.duration;
    } else {
      // Create new step
      const step: DebugStep = {
        id: stepId,
        name: stepName,
        startTime: Date.now(),
        status,
        input,
        output
      };
      
      this.currentSession.steps.push(step);
    }

    console.log(`🔍 [EnhancedDebug] Step logged: ${stepName} (${status})`);
  }

  /**
   * Log an error with context
   */
  logError(
    step: string,
    error: Error | string,
    context: Record<string, unknown> = {},
    recoveryAttempts: number = 0
  ): void {
    if (!this.currentSession) return;

    const debugError: DebugError = {
      timestamp: Date.now(),
      step,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      recoveryAttempts
    };

    this.currentSession.errors.push(debugError);
    console.error('❌ [EnhancedDebug] Error logged:', debugError);
  }

  /**
   * Log network request
   */
  logNetworkRequest(request: Partial<NetworkRequest>): void {
    if (!this.currentSession) return;

    const networkRequest: NetworkRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      method: request.method || 'GET',
      url: request.url || '',
      headers: request.headers || {},
      body: request.body,
      responseStatus: request.responseStatus,
      responseHeaders: request.responseHeaders,
      responseBody: request.responseBody,
      duration: request.duration,
      error: request.error
    };

    this.currentSession.networkRequests.push(networkRequest);
    console.log('🌐 [EnhancedDebug] Network request logged:', {
      method: networkRequest.method,
      url: networkRequest.url,
      status: networkRequest.responseStatus,
      duration: networkRequest.duration
    });
  }

  /**
   * Start monitoring network requests
   */
  private startNetworkMonitoring(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const [url, options] = args;
      
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        this.logNetworkRequest({
          id: requestId,
          method: options?.method || 'GET',
          url: url.toString(),
          headers: options?.headers as Record<string, string> || {},
          body: options?.body?.toString(),
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          duration: endTime - startTime
        });
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        
        this.logNetworkRequest({
          id: requestId,
          method: options?.method || 'GET',
          url: url.toString(),
          headers: options?.headers as Record<string, string> || {},
          body: options?.body?.toString(),
          duration: endTime - startTime,
          error: error instanceof Error ? error.message : String(error)
        });
        
        throw error;
      }
    };
  }

  /**
   * Stop monitoring network requests
   */
  private stopNetworkMonitoring(): void {
    // Note: In a real implementation, we'd restore the original fetch
    // For now, we'll leave the interceptor in place
  }

  /**
   * Get current session
   */
  getCurrentSession(): DebugSession | null {
    return this.currentSession;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Export debug data for analysis
   */
  exportDebugData(): string {
    const debugData = {
      sessions: Array.from(this.sessions.values()),
      exportTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    return JSON.stringify(debugData, null, 2);
  }

  /**
   * Clear all debug data
   */
  clearDebugData(): void {
    this.sessions.clear();
    this.currentSession = null;
    console.log('🧹 [EnhancedDebug] All debug data cleared');
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageStepDuration: number;
    totalNetworkRequests: number;
    averageNetworkLatency: number;
    errorRate: number;
    sessionsCount: number;
  } {
    const allSessions = Array.from(this.sessions.values());
    
    let totalStepDuration = 0;
    let stepCount = 0;
    let totalNetworkRequests = 0;
    let totalNetworkLatency = 0;
    let totalErrors = 0;

    allSessions.forEach(session => {
      Object.values(session.performance.stepDurations).forEach(duration => {
        totalStepDuration += duration;
        stepCount++;
      });
      
      totalNetworkRequests += session.networkRequests.length;
      
      session.performance.networkLatency.forEach(latency => {
        totalNetworkLatency += latency;
      });
      
      totalErrors += session.errors.length;
    });

    return {
      averageStepDuration: stepCount > 0 ? totalStepDuration / stepCount : 0,
      totalNetworkRequests,
      averageNetworkLatency: totalNetworkRequests > 0 ? totalNetworkLatency / totalNetworkRequests : 0,
      errorRate: allSessions.length > 0 ? totalErrors / allSessions.length : 0,
      sessionsCount: allSessions.length
    };
  }
}

// Global debugger instance
export const enhancedDebugger = new EnhancedDebugger();

export default enhancedDebugger;
