import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';

// Declare performance global for browser compatibility
declare global {
  interface Window {
    performance: {
      now(): number;
    };
  }
  var performance: {
    now(): number;
  };
}

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      )
    }),

    // Server log file - rotates daily
    new DailyRotateFile({
      filename: path.join(logsDir, 'server-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    }),

    // Error log file - separate file for errors only
    new DailyRotateFile({
      filename: path.join(logsDir, 'server-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat
    })
  ]
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d'
  })
);

logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d'
  })
);

// Export logger
export default logger;

// Type for logger metadata
type LogMeta = Record<string, unknown>;

// Helper functions for different log levels
export const logStartup = (message: string, meta: LogMeta = {}): void => {
  logger.info(`🚀 STARTUP: ${message}`, meta);
};

export const logError = (message: string, error: unknown = null, meta: LogMeta = {}): void => {
  const errorInfo = error && typeof error === 'object' 
    ? { 
        error: 'message' in error ? error.message : String(error),
        stack: 'stack' in error ? error.stack : undefined
      }
    : { error: String(error) };
    
  logger.error(`❌ ERROR: ${message}`, { ...errorInfo, ...meta });
};

export const logWarning = (message: string, meta: LogMeta = {}): void => {
  logger.warn(`⚠️  WARNING: ${message}`, meta);
};

export const logSuccess = (message: string, meta: LogMeta = {}): void => {
  logger.info(`✅ SUCCESS: ${message}`, meta);
};

export const logInfo = (message: string, meta: LogMeta = {}): void => {
  logger.info(`ℹ️  INFO: ${message}`, meta);
};

export const logDebug = (message: string, meta: LogMeta = {}): void => {
  logger.debug(`🐛 DEBUG: ${message}`, meta);
};

// Performance monitoring
export class PerformanceMonitor {
  private static timers = new Map<string, number>();
  private static metrics = new Map<string, number[]>();

  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      logger.warn(`⚠️ PERFORMANCE: Timer '${label}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    // Store metric for aggregation
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    // Log performance metric
    logger.info(`⏱️ PERFORMANCE: ${label} completed in ${duration.toFixed(2)}ms`);

    return duration;
  }

  static getMetrics(label: string): { count: number; avg: number; min: number; max: number } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { count, avg, min, max };
  }

  static logMetrics(label: string): void {
    const metrics = this.getMetrics(label);
    if (metrics) {
      logger.info(`📊 METRICS: ${label}`, {
        count: metrics.count,
        average: `${metrics.avg.toFixed(2)}ms`,
        min: `${metrics.min.toFixed(2)}ms`,
        max: `${metrics.max.toFixed(2)}ms`
      });
    }
  }

  static clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }
}

// Structured logging with context
export class StructuredLogger {
  private context: Record<string, unknown> = {};

  constructor(initialContext: Record<string, unknown> = {}) {
    this.context = { ...initialContext };
  }

  addContext(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  removeContext(key: string): this {
    delete this.context[key];
    return this;
  }

  clearContext(): this {
    this.context = {};
    return this;
  }

  info(message: string, meta: LogMeta = {}): void {
    logger.info(`ℹ️ INFO: ${message}`, { ...this.context, ...meta });
  }

  warn(message: string, meta: LogMeta = {}): void => {
    logger.warn(`⚠️ WARNING: ${message}`, { ...this.context, ...meta });
  }

  error(message: string, error: unknown = null, meta: LogMeta = {}): void => {
    const errorInfo = error && typeof error === 'object' 
      ? { 
          error: 'message' in error ? error.message : String(error),
          stack: 'stack' in error ? error.stack : undefined
        }
      : { error: String(error) };
    
    logger.error(`❌ ERROR: ${message}`, { ...this.context, ...errorInfo, ...meta });
  }

  debug(message: string, meta: LogMeta = {}): void {
    logger.debug(`🐛 DEBUG: ${message}`, { ...this.context, ...meta });
  }

  performance(label: string, operation: () => void | Promise<void>): void {
    PerformanceMonitor.startTimer(label);
    try {
      const result = operation();
      if (result instanceof Promise) {
        result.finally(() => PerformanceMonitor.endTimer(label));
      } else {
        PerformanceMonitor.endTimer(label);
      }
    } catch (error) {
      PerformanceMonitor.endTimer(label);
      throw error;
    }
  }

  async performanceAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    PerformanceMonitor.startTimer(label);
    try {
      const result = await operation();
      PerformanceMonitor.endTimer(label);
      return result;
    } catch (error) {
      PerformanceMonitor.endTimer(label);
      throw error;
    }
  }
}

// OAuth flow specific logging
export const logOAuthFlow = (flowName: string, step: string, meta: LogMeta = {}): void => {
  logger.info(`🔄 OAUTH: ${flowName} - ${step}`, { flowName, step, ...meta });
};

export const logTokenOperation = (operation: string, tokenType: string, meta: LogMeta = {}): void => {
  logger.info(`🔑 TOKEN: ${operation} ${tokenType}`, { operation, tokenType, ...meta });
};

export const logAPIRequest = (endpoint: string, method: string, meta: LogMeta = {}): void => {
  logger.info(`🌐 API: ${method} ${endpoint}`, { endpoint, method, ...meta });
};

export const logAPIResponse = (endpoint: string, status: number, meta: LogMeta = {}): void => {
  const level = status >= 400 ? 'error' : 'info';
  logger[level](`🌐 API: ${endpoint} responded with ${status}`, { endpoint, status, ...meta });
};
