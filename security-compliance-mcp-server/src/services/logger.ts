/**
 * Logger service for compliance checker operations
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatEntry('debug', message, context);
      this.logs.push(entry);
      console.log(`[DEBUG] ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      const entry = this.formatEntry('info', message, context);
      this.logs.push(entry);
      console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatEntry('warn', message, context);
      this.logs.push(entry);
      console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const entry = this.formatEntry('error', message, context);
      this.logs.push(entry);
      console.error(`[ERROR] ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger(process.env.LOG_LEVEL as LogLevel || 'info');
