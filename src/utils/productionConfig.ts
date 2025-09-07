import { logger } from './logger';

// Production configuration interface
export interface ProductionConfig {
  enableDebugMode: boolean;
  enableConsoleLogs: boolean;
  enableErrorReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableAnalytics: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableSourceMaps: boolean;
  enableHotReload: boolean;
  enableDevTools: boolean;
  enableTestMode: boolean;
}

// Development configuration (default)
const developmentConfig: ProductionConfig = {
  enableDebugMode: true,
  enableConsoleLogs: true,
  enableErrorReporting: false,
  enablePerformanceMonitoring: false,
  enableAnalytics: false,
  logLevel: 'debug',
  enableSourceMaps: true,
  enableHotReload: true,
  enableDevTools: true,
  enableTestMode: false
};

// Production configuration
const productionConfig: ProductionConfig = {
  enableDebugMode: false,
  enableConsoleLogs: false,
  enableErrorReporting: true,
  enablePerformanceMonitoring: true,
  enableAnalytics: true,
  logLevel: 'error',
  enableSourceMaps: false,
  enableHotReload: false,
  enableDevTools: false,
  enableTestMode: false
};

// Production Configuration Manager class
export class ProductionConfigManager {
  private config: ProductionConfig;
  private isProduction: boolean;

  constructor() {
    this.isProduction = this.detectProductionEnvironment();
    this.config = this.isProduction ? productionConfig : developmentConfig;
    this.applyConfiguration();
  }

  // Detect if running in production environment
  private detectProductionEnvironment(): boolean {
    // Check environment variables
    if (process.env.NODE_ENV === 'production') {
      return true;
    }

    // Check if running in production build
    if (process.env.VITE_MODE === 'production') {
      return true;
    }

    // Check if running in production URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('dev')) {
        return true;
      }
    }

    return false;
  }

  // Apply configuration based on environment
  private applyConfiguration(): void {
    if (this.isProduction) {
      this.applyProductionSettings();
    } else {
      this.applyDevelopmentSettings();
    }

    logger.info(`[ProductionConfig] Configuration applied for ${this.isProduction ? 'production' : 'development'} environment`);
  }

  // Apply production settings
  private applyProductionSettings(): void {
    // Disable console logs in production
    if (!this.config.enableConsoleLogs) {
      this.disableConsoleLogs();
    }

    // Disable debug mode
    if (!this.config.enableDebugMode) {
      this.disableDebugMode();
    }

    // Disable dev tools
    if (!this.config.enableDevTools) {
      this.disableDevTools();
    }

    // Enable error reporting
    if (this.config.enableErrorReporting) {
      this.enableErrorReporting();
    }

    // Enable performance monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.enablePerformanceMonitoring();
    }
  }

  // Apply development settings
  private applyDevelopmentSettings(): void {
    // Enable console logs
    if (this.config.enableConsoleLogs) {
      this.enableConsoleLogs();
    }

    // Enable debug mode
    if (this.config.enableDebugMode) {
      this.enableDebugMode();
    }

    // Enable dev tools
    if (this.config.enableDevTools) {
      this.enableDevTools();
    }
  }

  // Disable console logs
  private disableConsoleLogs(): void {
    if (typeof window !== 'undefined') {
      const noop = () => {};
      console.log = noop;
      console.info = noop;
      console.debug = noop;
      console.warn = noop;
      // Keep console.error for critical errors
    }
  }

  // Enable console logs
  private enableConsoleLogs(): void {
    // Console logs are enabled by default in development
    // This method is here for completeness
  }

  // Disable debug mode
  private disableDebugMode(): void {
    // Remove debug flags from window object
    if (typeof window !== 'undefined') {
      delete (window as any).__DEBUG__;
      delete (window as any).__DEV__;
      delete (window as any).__TEST__;
    }

    // Disable debug features
    this.disableDebugFeatures();
  }

  // Enable debug mode
  private enableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG__ = true;
      (window as any).__DEV__ = true;
    }

    // Enable debug features
    this.enableDebugFeatures();
  }

  // Disable debug features
  private disableDebugFeatures(): void {
    // Remove debug panels
    const debugPanels = document.querySelectorAll('[data-debug]');
    debugPanels.forEach(panel => panel.remove());

    // Remove debug classes
    const debugElements = document.querySelectorAll('.debug, .dev-only');
    debugElements.forEach(element => element.remove());

    // Disable debug logging
    if (typeof window !== 'undefined') {
      (window as any).debug = () => {};
    }
  }

  // Enable debug features
  private enableDebugFeatures(): void {
    // Debug features are enabled by default in development
    // This method is here for completeness
  }

  // Disable dev tools
  private disableDevTools(): void {
    if (typeof window !== 'undefined') {
      // Disable right-click context menu
      document.addEventListener('contextmenu', (e) => e.preventDefault());

      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      document.addEventListener('keydown', (e) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
        }
      });

      // Disable dev tools detection
      let devtools = { open: false, orientation: null };
      const threshold = 160;

      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            // Redirect or show warning
            console.clear();
            document.body.innerHTML = '<h1>Developer tools are not allowed</h1>';
          }
        } else {
          devtools.open = false;
        }
      }, 500);
    }
  }

  // Enable dev tools
  private enableDevTools(): void {
    // Dev tools are enabled by default in development
    // This method is here for completeness
  }

  // Enable error reporting
  private enableErrorReporting(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.reportError('JavaScript Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.reportError('Unhandled Promise Rejection', {
          reason: event.reason,
          stack: event.reason?.stack
        });
      });
    }
  }

  // Enable performance monitoring
  private enablePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor page load performance
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.reportPerformance({
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        });
      });
    }
  }

  // Report error to external service
  private reportError(type: string, data: any): void {
    // TODO: Implement external error reporting (e.g., Sentry, Bugsnag)
    logger.error(`[ErrorReporting] ${type}:`, data);
  }

  // Report performance metrics
  private reportPerformance(metrics: any): void {
    // TODO: Implement external performance monitoring (e.g., Google Analytics, New Relic)
    logger.info('[PerformanceMonitoring] Performance metrics:', metrics);
  }

  // Get current configuration
  getConfig(): ProductionConfig {
    return { ...this.config };
  }

  // Check if running in production
  isProductionEnvironment(): boolean {
    return this.isProduction;
  }

  // Check if debug mode is enabled
  isDebugModeEnabled(): boolean {
    return this.config.enableDebugMode;
  }

  // Check if console logs are enabled
  areConsoleLogsEnabled(): boolean {
    return this.config.enableConsoleLogs;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ProductionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyConfiguration();
    logger.info('[ProductionConfig] Configuration updated');
  }

  // Force production mode
  forceProductionMode(): void {
    this.isProduction = true;
    this.config = productionConfig;
    this.applyConfiguration();
    logger.info('[ProductionConfig] Forced to production mode');
  }

  // Force development mode
  forceDevelopmentMode(): void {
    this.isProduction = false;
    this.config = developmentConfig;
    this.applyConfiguration();
    logger.info('[ProductionConfig] Forced to development mode');
  }
}

// Create global production config manager instance
export const productionConfigManager = new ProductionConfigManager();

// Utility functions
export const isProduction = (): boolean => {
  return productionConfigManager.isProductionEnvironment();
};

export const isDebugModeEnabled = (): boolean => {
  return productionConfigManager.isDebugModeEnabled();
};

export const areConsoleLogsEnabled = (): boolean => {
  return productionConfigManager.areConsoleLogsEnabled();
};

export const getProductionConfig = (): ProductionConfig => {
  return productionConfigManager.getConfig();
};

export const updateProductionConfig = (config: Partial<ProductionConfig>): void => {
  productionConfigManager.updateConfig(config);
};

export const forceProductionMode = (): void => {
  productionConfigManager.forceProductionMode();
};

export const forceDevelopmentMode = (): void => {
  productionConfigManager.forceDevelopmentMode();
};

export default productionConfigManager;
