// Enhanced logging utility for OAuth Playground
interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logHistory: LogEntry[] = [];
  private maxLogEntries = 1000;

  private addToHistory(level: string, component: string, message: string, data?: any, error?: Error) {
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

  error(component: string, message: string, data?: any, error?: Error) {
    this.addToHistory('ERROR', component, message, data, error);
    console.error(`❌ [${component}] ${message}`, data || '', error || '');
  }

  warn(component: string, message: string, data?: any) {
    this.addToHistory('WARN', component, message, data);
    console.warn(`⚠️ [${component}] ${message}`, data || '');
  }

  info(component: string, message: string, data?: any) {
    this.addToHistory('INFO', component, message, data);
    console.log(`ℹ️ [${component}] ${message}`, data || '');
  }

  debug(component: string, message: string, data?: any) {
    this.addToHistory('DEBUG', component, message, data);
    console.debug(`🐛 [${component}] ${message}`, data || '');
  }

  success(component: string, message: string, data?: any) {
    this.addToHistory('SUCCESS', component, message, data);
    console.log(`✅ [${component}] ${message}`, data || '');
  }

  flow(component: string, message: string, data?: any) {
    this.addToHistory('FLOW', component, message, data);
    console.log(`🔄 [${component}] ${message}`, data || '');
  }

  auth(component: string, message: string, data?: any) {
    this.addToHistory('AUTH', component, message, data);
    console.log(`🔐 [${component}] ${message}`, data || '');
  }

  config(component: string, message: string, data?: any) {
    this.addToHistory('CONFIG', component, message, data);
    console.log(`⚙️ [${component}] ${message}`, data || '');
  }

  api(component: string, message: string, data?: any) {
    this.addToHistory('API', component, message, data);
    console.log(`🌐 [${component}] ${message}`, data || '');
  }

  storage(component: string, message: string, data?: any) {
    this.addToHistory('STORAGE', component, message, data);
    console.log(`💾 [${component}] ${message}`, data || '');
  }

  ui(component: string, message: string, data?: any) {
    this.addToHistory('UI', component, message, data);
    console.log(`🎨 [${component}] ${message}`, data || '');
  }

  getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory() {
    this.logHistory = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

export const logger = new Logger();
export default logger;