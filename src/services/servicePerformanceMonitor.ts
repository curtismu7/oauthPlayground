// src/services/servicePerformanceMonitor.ts
/**
 * Service Performance Monitoring
 * 
 * Provides comprehensive performance monitoring, metrics collection,
 * and health monitoring for all registered services.
 * 
 * Features:
 * - Real-time performance metrics
 * - Service health monitoring
 * - Performance alerts
 * - Metrics export
 * - Performance dashboards
 */

import { serviceRegistry, ServiceInstance, ServicePerformanceMetrics } from './serviceRegistry';

// Browser-compatible EventEmitter implementation
class EventEmitter {
  private listeners = new Map<string, Function[]>();

  on(event: string, listener: Function): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) {
      return false;
    }
    
    eventListeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
    
    return true;
  }

  removeListener(event: string, listener: Function): this {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

// Performance alert levels
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Performance alert interface
export interface PerformanceAlert {
  id: string;
  serviceName: string;
  level: AlertLevel;
  message: string;
  timestamp: Date;
  metrics: Partial<ServicePerformanceMetrics>;
  resolved: boolean;
}

// Performance threshold configuration
export interface PerformanceThresholds {
  maxResponseTime: number; // ms
  maxErrorRate: number; // percentage
  maxMemoryUsage: number; // MB
  minThroughput: number; // requests per second
}

// Performance monitor configuration
export interface MonitorConfig {
  enabled: boolean;
  samplingRate: number; // 0-1, percentage of requests to monitor
  alertThresholds: PerformanceThresholds;
  metricsRetentionDays: number;
  enableRealTimeAlerts: boolean;
}

// Performance metrics collector
export class ServicePerformanceMonitor extends EventEmitter {
  private config: MonitorConfig;
  private alerts: Map<string, PerformanceAlert> = new Map();
  private metricsHistory: Map<string, ServicePerformanceMetrics[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(config: Partial<MonitorConfig> = {}) {
    super();
    
    this.config = {
      enabled: true,
      samplingRate: 1.0, // Monitor all requests by default
      alertThresholds: {
        maxResponseTime: 1000, // 1 second
        maxErrorRate: 5, // 5%
        maxMemoryUsage: 100, // 100MB
        minThroughput: 1 // 1 request per second
      },
      metricsRetentionDays: 7,
      enableRealTimeAlerts: true,
      ...config
    };

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('[ServicePerformanceMonitor] Performance monitoring already running, skipping...');
      return;
    }

    this.isMonitoring = true;
    console.log('[ServicePerformanceMonitor] Starting performance monitoring...');

    // Monitor services every 30 seconds (less aggressive for production)
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, 30000);

    // Listen to service registry events
    serviceRegistry.on('serviceCreated', this.onServiceCreated.bind(this));
    serviceRegistry.on('serviceError', this.onServiceError.bind(this));
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[ServicePerformanceMonitor] Performance monitoring stopped');
  }

  /**
   * Collect performance metrics from all services
   */
  private collectMetrics(): void {
    const services = serviceRegistry.getAllServices();
    
    // Skip if no services are registered to avoid unnecessary work
    if (services.size === 0) {
      return;
    }
    
    for (const [name, service] of services) {
      this.updateServiceMetrics(name, service);
    }
  }

  /**
   * Update metrics for a specific service
   * @param name Service name
   * @param service Service instance
   */
  private updateServiceMetrics(name: string, service: ServiceInstance): void {
    const metrics = service.performanceMetrics;
    
    // Calculate throughput (requests per second)
    const timeSinceCreation = Date.now() - service.createdAt.getTime();
    const throughput = (metrics.totalRequests / timeSinceCreation) * 1000;
    
    // Update metrics
    metrics.memoryUsage = this.getMemoryUsage();
    
    // Store metrics history
    if (!this.metricsHistory.has(name)) {
      this.metricsHistory.set(name, []);
    }
    
    const history = this.metricsHistory.get(name)!;
    history.push({ ...metrics });
    
    // Keep only recent metrics (based on retention policy)
    const maxHistoryLength = this.config.metricsRetentionDays * 24 * 60 * 12; // 5-minute intervals
    if (history.length > maxHistoryLength) {
      history.splice(0, history.length - maxHistoryLength);
    }

    this.emit('metricsUpdated', { serviceName: name, metrics });
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(): void {
    const services = serviceRegistry.getAllServices();
    const thresholds = this.config.alertThresholds;
    
    for (const [name, service] of services) {
      const metrics = service.performanceMetrics;
      
      // Check response time threshold
      if (metrics.averageResponseTime > thresholds.maxResponseTime) {
        this.createAlert(name, AlertLevel.WARNING, 
          `High response time: ${metrics.averageResponseTime.toFixed(2)}ms`, metrics);
      }
      
      // Check error rate threshold
      if (metrics.errorRate > thresholds.maxErrorRate) {
        this.createAlert(name, AlertLevel.ERROR, 
          `High error rate: ${metrics.errorRate.toFixed(2)}%`, metrics);
      }
      
      // Check memory usage threshold
      if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
        this.createAlert(name, AlertLevel.WARNING, 
          `High memory usage: ${metrics.memoryUsage.toFixed(2)}MB`, metrics);
      }
    }
  }

  /**
   * Create a performance alert
   * @param serviceName Service name
   * @param level Alert level
   * @param message Alert message
   * @param metrics Related metrics
   */
  private createAlert(
    serviceName: string, 
    level: AlertLevel, 
    message: string, 
    metrics: Partial<ServicePerformanceMetrics>
  ): void {
    const alertId = `${serviceName}-${level}-${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = Array.from(this.alerts.values()).find(
      alert => alert.serviceName === serviceName && 
               alert.level === level && 
               !alert.resolved
    );
    
    if (existingAlert) return; // Don't create duplicate alerts
    
    const alert: PerformanceAlert = {
      id: alertId,
      serviceName,
      level,
      message,
      timestamp: new Date(),
      metrics,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    
    console.warn(`[ServicePerformanceMonitor] ${level.toUpperCase()} Alert: ${serviceName} - ${message}`);
    
    if (this.config.enableRealTimeAlerts) {
      this.emit('alert', alert);
    }
  }

  /**
   * Handle service creation event
   * @param event Service creation event
   */
  private onServiceCreated(event: { name: string; serviceInstance: ServiceInstance }): void {
    console.log(`[ServicePerformanceMonitor] Monitoring service: ${event.name}`);
  }

  /**
   * Handle service error event
   * @param event Service error event
   */
  private onServiceError(event: { name: string; error: Error; serviceInstance: ServiceInstance }): void {
    const service = event.serviceInstance;
    service.errorCount++;
    service.performanceMetrics.errorRate = 
      (service.errorCount / service.accessCount) * 100;
    
    this.createAlert(
      event.name, 
      AlertLevel.ERROR, 
      `Service error: ${event.error.message}`, 
      service.performanceMetrics
    );
  }

  /**
   * Get current memory usage
   * @returns Memory usage in MB
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Get performance metrics for a service
   * @param serviceName Service name
   * @returns Performance metrics
   */
  getServiceMetrics(serviceName: string): ServicePerformanceMetrics | null {
    const service = serviceRegistry.getAllServices().get(serviceName);
    return service ? service.performanceMetrics : null;
  }

  /**
   * Get metrics history for a service
   * @param serviceName Service name
   * @param hours Number of hours to retrieve
   * @returns Metrics history
   */
  getMetricsHistory(serviceName: string, hours: number = 24): ServicePerformanceMetrics[] {
    const history = this.metricsHistory.get(serviceName) || [];
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    return history.filter(metrics => {
      // Assuming metrics have a timestamp property
      return (metrics as any).timestamp > cutoffTime;
    });
  }

  /**
   * Get all active alerts
   * @returns Array of active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   * @param alertId Alert ID
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
    }
  }

  /**
   * Get performance summary
   * @returns Performance summary
   */
  getPerformanceSummary(): {
    totalServices: number;
    averageResponseTime: number;
    totalErrors: number;
    activeAlerts: number;
    healthScore: number;
  } {
    const services = Array.from(serviceRegistry.getAllServices().values());
    const totalServices = services.length;
    
    if (totalServices === 0) {
      return {
        totalServices: 0,
        averageResponseTime: 0,
        totalErrors: 0,
        activeAlerts: 0,
        healthScore: 100
      };
    }
    
    const totalResponseTime = services.reduce((sum, service) => 
      sum + service.performanceMetrics.averageResponseTime, 0);
    const averageResponseTime = totalResponseTime / totalServices;
    
    const totalErrors = services.reduce((sum, service) => 
      sum + service.errorCount, 0);
    
    const activeAlerts = this.getActiveAlerts().length;
    
    // Calculate health score (0-100)
    const errorPenalty = Math.min(totalErrors * 10, 50); // Max 50 points penalty for errors
    const alertPenalty = Math.min(activeAlerts * 5, 30); // Max 30 points penalty for alerts
    const healthScore = Math.max(100 - errorPenalty - alertPenalty, 0);
    
    return {
      totalServices,
      averageResponseTime,
      totalErrors,
      activeAlerts,
      healthScore
    };
  }

  /**
   * Export metrics to JSON
   * @returns Exported metrics data
   */
  exportMetrics(): string {
    const services = serviceRegistry.getAllServices();
    const data = {
      timestamp: new Date().toISOString(),
      services: Array.from(services.entries()).map(([name, service]) => ({
        name,
        metadata: service.metadata,
        metrics: service.performanceMetrics,
        state: service.state
      })),
      alerts: Array.from(this.alerts.values()),
      summary: this.getPerformanceSummary()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Global performance monitor instance
export const servicePerformanceMonitor = new ServicePerformanceMonitor();

export default servicePerformanceMonitor;
