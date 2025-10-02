// src/services/flowAnalyticsService.ts
// FlowAnalyticsService - Flow analytics and user behavior tracking

export interface FlowAnalytics {
  flowType: string;
  flowKey: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: StepAnalytics[];
  errors: ErrorAnalytics[];
  success: boolean;
  userId?: string;
  sessionId: string;
}

export interface StepAnalytics {
  stepIndex: number;
  stepName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  completed: boolean;
  errorCount: number;
  interactions: InteractionAnalytics[];
}

export interface InteractionAnalytics {
  type: 'click' | 'input' | 'navigation' | 'validation' | 'error';
  element: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface ErrorAnalytics {
  stepIndex: number;
  errorType: string;
  errorMessage: string;
  timestamp: number;
  context?: Record<string, any>;
}

export interface FlowMetrics {
  totalFlows: number;
  successfulFlows: number;
  failedFlows: number;
  averageDuration: number;
  mostUsedFlows: Array<{ flowType: string; count: number }>;
  commonErrors: Array<{ errorType: string; count: number }>;
  stepCompletionRates: Array<{ stepIndex: number; completionRate: number }>;
}

export class FlowAnalyticsService {
  private static analytics: FlowAnalytics[] = [];
  private static currentFlow: FlowAnalytics | null = null;
  private static sessionId: string = this.generateSessionId();

  /**
   * Track flow start
   */
  static trackFlowStart(
    flowType: string,
    flowKey: string,
    userId?: string
  ): FlowAnalytics {
    const flowAnalytics: FlowAnalytics = {
      flowType,
      flowKey,
      startTime: Date.now(),
      steps: [],
      errors: [],
      success: false,
      userId,
      sessionId: this.sessionId,
    };

    this.currentFlow = flowAnalytics;
    this.analytics.push(flowAnalytics);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [FlowAnalytics] Flow started:', {
        flowType,
        flowKey,
        userId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });
    }

    return flowAnalytics;
  }

  /**
   * Track step start
   */
  static trackStepStart(stepIndex: number, stepName: string): void {
    if (!this.currentFlow) return;

    const stepAnalytics: StepAnalytics = {
      stepIndex,
      stepName,
      startTime: Date.now(),
      completed: false,
      errorCount: 0,
      interactions: [],
    };

    this.currentFlow.steps[stepIndex] = stepAnalytics;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [FlowAnalytics] Step started:', {
        flowType: this.currentFlow.flowType,
        stepIndex,
        stepName,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track step completion
   */
  static trackStepComplete(stepIndex: number, duration?: number): void {
    if (!this.currentFlow || !this.currentFlow.steps[stepIndex]) return;

    const step = this.currentFlow.steps[stepIndex];
    step.endTime = Date.now();
    step.duration = duration || (step.endTime - step.startTime);
    step.completed = true;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [FlowAnalytics] Step completed:', {
        flowType: this.currentFlow.flowType,
        stepIndex,
        stepName: step.stepName,
        duration: step.duration,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track step interaction
   */
  static trackStepInteraction(
    stepIndex: number,
    type: InteractionAnalytics['type'],
    element: string,
    data?: Record<string, any>
  ): void {
    if (!this.currentFlow || !this.currentFlow.steps[stepIndex]) return;

    const interaction: InteractionAnalytics = {
      type,
      element,
      timestamp: Date.now(),
      data,
    };

    this.currentFlow.steps[stepIndex].interactions.push(interaction);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🖱️ [FlowAnalytics] Interaction tracked:', {
        flowType: this.currentFlow.flowType,
        stepIndex,
        type,
        element,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track step error
   */
  static trackStepError(
    stepIndex: number,
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>
  ): void {
    if (!this.currentFlow) return;

    const error: ErrorAnalytics = {
      stepIndex,
      errorType,
      errorMessage,
      timestamp: Date.now(),
      context,
    };

    this.currentFlow.errors.push(error);

    // Increment error count for the step
    if (this.currentFlow.steps[stepIndex]) {
      this.currentFlow.steps[stepIndex].errorCount++;
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [FlowAnalytics] Error tracked:', {
        flowType: this.currentFlow.flowType,
        stepIndex,
        errorType,
        errorMessage,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track flow completion
   */
  static trackFlowComplete(success: boolean, duration?: number): void {
    if (!this.currentFlow) return;

    this.currentFlow.endTime = Date.now();
    this.currentFlow.duration = duration || (this.currentFlow.endTime - this.currentFlow.startTime);
    this.currentFlow.success = success;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(success ? '🎉 [FlowAnalytics] Flow completed successfully:' : '💥 [FlowAnalytics] Flow failed:', {
        flowType: this.currentFlow.flowType,
        flowKey: this.currentFlow.flowKey,
        duration: this.currentFlow.duration,
        success,
        errorCount: this.currentFlow.errors.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Reset current flow
    this.currentFlow = null;
  }

  /**
   * Track flow reset
   */
  static trackFlowReset(): void {
    if (!this.currentFlow) return;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [FlowAnalytics] Flow reset:', {
        flowType: this.currentFlow.flowType,
        flowKey: this.currentFlow.flowKey,
        timestamp: new Date().toISOString(),
      });
    }

    // Reset current flow
    this.currentFlow = null;
  }

  /**
   * Get flow analytics for a specific flow type
   */
  static getFlowAnalytics(flowType: string): FlowAnalytics[] {
    return this.analytics.filter(flow => flow.flowType === flowType);
  }

  /**
   * Get flow metrics
   */
  static getFlowMetrics(): FlowMetrics {
    const totalFlows = this.analytics.length;
    const successfulFlows = this.analytics.filter(flow => flow.success).length;
    const failedFlows = totalFlows - successfulFlows;
    const averageDuration = this.analytics.reduce((sum, flow) => sum + (flow.duration || 0), 0) / totalFlows;

    // Most used flows
    const flowCounts = this.analytics.reduce((counts, flow) => {
      counts[flow.flowType] = (counts[flow.flowType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostUsedFlows = Object.entries(flowCounts)
      .map(([flowType, count]) => ({ flowType, count }))
      .sort((a, b) => b.count - a.count);

    // Common errors
    const errorCounts = this.analytics.reduce((counts, flow) => {
      flow.errors.forEach(error => {
        counts[error.errorType] = (counts[error.errorType] || 0) + 1;
      });
      return counts;
    }, {} as Record<string, number>);

    const commonErrors = Object.entries(errorCounts)
      .map(([errorType, count]) => ({ errorType, count }))
      .sort((a, b) => b.count - a.count);

    // Step completion rates
    const stepCompletionRates = this.analytics.reduce((rates, flow) => {
      flow.steps.forEach(step => {
        if (!rates[step.stepIndex]) {
          rates[step.stepIndex] = { completed: 0, total: 0 };
        }
        rates[step.stepIndex].total++;
        if (step.completed) {
          rates[step.stepIndex].completed++;
        }
      });
      return rates;
    }, {} as Record<number, { completed: number; total: number }>);

    const stepCompletionRatesArray = Object.entries(stepCompletionRates)
      .map(([stepIndex, data]) => ({
        stepIndex: parseInt(stepIndex),
        completionRate: data.completed / data.total,
      }))
      .sort((a, b) => a.stepIndex - b.stepIndex);

    return {
      totalFlows,
      successfulFlows,
      failedFlows,
      averageDuration,
      mostUsedFlows,
      commonErrors,
      stepCompletionRates: stepCompletionRatesArray,
    };
  }

  /**
   * Get analytics for a specific time range
   */
  static getAnalyticsInRange(startTime: number, endTime: number): FlowAnalytics[] {
    return this.analytics.filter(flow => 
      flow.startTime >= startTime && flow.startTime <= endTime
    );
  }

  /**
   * Get analytics for a specific user
   */
  static getUserAnalytics(userId: string): FlowAnalytics[] {
    return this.analytics.filter(flow => flow.userId === userId);
  }

  /**
   * Get analytics for a specific session
   */
  static getSessionAnalytics(sessionId: string): FlowAnalytics[] {
    return this.analytics.filter(flow => flow.sessionId === sessionId);
  }

  /**
   * Clear all analytics data
   */
  static clearAnalytics(): void {
    this.analytics = [];
    this.currentFlow = null;
    this.sessionId = this.generateSessionId();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 [FlowAnalytics] Analytics cleared');
    }
  }

  /**
   * Export analytics data
   */
  static exportAnalytics(): string {
    return JSON.stringify({
      analytics: this.analytics,
      metrics: this.getFlowMetrics(),
      exportTime: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Import analytics data
   */
  static importAnalytics(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.analytics && Array.isArray(parsed.analytics)) {
        this.analytics = parsed.analytics;
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('📥 [FlowAnalytics] Analytics imported:', {
            count: this.analytics.length,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('❌ [FlowAnalytics] Failed to import analytics:', error);
    }
  }

  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current flow analytics
   */
  static getCurrentFlow(): FlowAnalytics | null {
    return this.currentFlow;
  }

  /**
   * Check if a flow is currently active
   */
  static isFlowActive(): boolean {
    return this.currentFlow !== null;
  }

  /**
   * Get analytics summary
   */
  static getAnalyticsSummary(): {
    totalFlows: number;
    activeFlows: number;
    currentFlow: string | null;
    sessionId: string;
  } {
    return {
      totalFlows: this.analytics.length,
      activeFlows: this.analytics.filter(flow => !flow.endTime).length,
      currentFlow: this.currentFlow?.flowType || null,
      sessionId: this.sessionId,
    };
  }
}

export default FlowAnalyticsService;
