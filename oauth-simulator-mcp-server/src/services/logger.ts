type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data } = entry;
    if (data !== undefined) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(data)}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        data,
      };
      console.log(this.formatLog(entry));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        data,
      };
      console.log(this.formatLog(entry));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        data,
      };
      console.warn(this.formatLog(entry));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        data,
      };
      console.error(this.formatLog(entry));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);
