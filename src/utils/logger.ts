// Enhanced logging utility for OAuth Playground

// Define specific data types for different logging contexts
type LogData = 
  | string
  | number
  | boolean
  | object
  | null
  | undefined
  | Array<unknown>
  | Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  data?: LogData;
  error?: Error;
}

class Logger {
  private logHistory: LogEntry[] = [];
  private maxLogEntries = 1000;

  private addToHistory(level: string, component: string, message: string, data?: LogData, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      error
    };
    
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxLogEntries) {
      this.logHistory.shift();
    }
  }

  // Public method to add entries from console interception
  addEntry(level: string, component: string, message: string, data?: LogData, error?: Error) {
    this.addToHistory(level, component, message, data, error);
  }

  error(component: string, message: string, data?: LogData, error?: Error) {
    this.addToHistory('ERROR', component, message, data, error);
    console.error(`❌ [${component}] ${message}`, data || '', error || '');
  }

  warn(component: string, message: string, data?: LogData) {
    this.addToHistory('WARN', component, message, data);
    console.warn(`⚠️ [${component}] ${message}`, data || '');
  }

  info(component: string, message: string, data?: LogData) {
    this.addToHistory('INFO', component, message, data);
    console.log(`ℹ️ [${component}] ${message}`, data || '');
  }

  debug(component: string, message: string, data?: LogData) {
    this.addToHistory('DEBUG', component, message, data);
    console.debug(`🐛 [${component}] ${message}`, data || '');
  }

  success(component: string, message: string, data?: LogData) {
    this.addToHistory('SUCCESS', component, message, data);
    console.log(`✅ [${component}] ${message}`, data || '');
  }

  flow(component: string, message: string, data?: LogData) {
    this.addToHistory('FLOW', component, message, data);
    console.log(`🔄 [${component}] ${message}`, data || '');
  }

  auth(component: string, message: string, data?: LogData) {
    this.addToHistory('AUTH', component, message, data);
    console.log(`🔐 [${component}] ${message}`, data || '');
  }

  config(component: string, message: string, data?: LogData) {
    this.addToHistory('CONFIG', component, message, data);
    console.log(`⚙️ [${component}] ${message}`, data || '');
  }

  api(component: string, message: string, data?: LogData) {
    this.addToHistory('API', component, message, data);
    console.log(`🌐 [${component}] ${message}`, data || '');
  }

  storage(component: string, message: string, data?: LogData) {
    this.addToHistory('STORAGE', component, message, data);
    console.log(`💾 [${component}] ${message}`, data || '');
  }

  ui(component: string, message: string, data?: LogData) {
    this.addToHistory('UI', component, message, data);
    console.log(`🎨 [${component}] ${message}`, data || '');
  }

  discovery(component: string, message: string, data?: LogData) {
    this.addToHistory('DISCOVERY', component, message, data);
    console.log(`🔍 [${component}] ${message}`, data || '');
  }

  getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory() {
    this.logHistory = [];
  }

  exportLogs(): string {
    // Safe JSON stringify that handles circular references and DOM elements
    const safeStringify = (obj: any, space?: number): string => {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        // Skip circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        
        // Handle DOM elements
        if (value instanceof HTMLElement) {
          return `[HTMLElement: ${value.tagName}]`;
        }
        
        // Handle React components
        if (value && typeof value === 'object' && value.$$typeof) {
          return '[React Component]';
        }
        
        // Handle functions
        if (typeof value === 'function') {
          return '[Function]';
        }
        
        return value;
      }, space);
    };
    
    return safeStringify(this.logHistory, 2);
  }
}

export const logger = new Logger();
export default logger;