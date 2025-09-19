 
import { logger } from './logger';

// Security headers configuration
export interface SecurityHeadersConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXFrameOptions: boolean;
  enableXContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  cspDirectives: Record<string, string[]>;
  hstsMaxAge: number;
  referrerPolicy: string;
  permissionsPolicy: Record<string, string[]>;
}

// Default security headers configuration
const defaultConfig: SecurityHeadersConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: true,
  enableXContentTypeOptions: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'self'"],
    'frame-src': ["'self'"],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"]
  },
  hstsMaxAge: 31536000, // 1 year
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    'camera': ['none'],
    'microphone': ['none'],
    'geolocation': ['none'],
    'payment': ['none'],
    'usb': ['none'],
    'magnetometer': ['none'],
    'gyroscope': ['none'],
    'accelerometer': ['none'],
    'ambient-light-sensor': ['none'],
    'autoplay': ['none'],
    'battery': ['none'],
    'bluetooth': ['none'],
    'clipboard-read': ['none'],
    'clipboard-write': ['none'],
    'display-capture': ['none'],
    'document-domain': ['none'],
    'encrypted-media': ['none'],
    'fullscreen': ['none'],
    'gamepad': ['none'],
    'hid': ['none'],
    'idle-detection': ['none'],
    'local-fonts': ['none'],
    'midi': ['none'],
    'otp-credentials': ['none'],
    'picture-in-picture': ['none'],
    'publickey-credentials-get': ['none'],
    'screen-wake-lock': ['none'],
    'serial': ['none'],
    'speaker-selection': ['none'],
    'storage-access': ['none'],
    'sync-xhr': ['none'],
    'unoptimized-images': ['none'],
    'usb': ['none'],
    'vertical-scroll': ['none'],
    'web-share': ['none'],
    'xr-spatial-tracking': ['none']
  }
};

// Security Headers Manager class
export class SecurityHeadersManager {
  private config: SecurityHeadersConfig;

  constructor(config: Partial<SecurityHeadersConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Generate Content Security Policy header
  private generateCSPHeader(): string {
    const directives = Object.entries(this.config.cspDirectives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
    
    return directives;
  }

  // Generate Permissions Policy header
  private generatePermissionsPolicyHeader(): string {
    const policies = Object.entries(this.config.permissionsPolicy)
      .map(([feature, allowlist]) => `${feature}=(${allowlist.join(' ')})`)
      .join(', ');
    
    return policies;
  }

  // Get all security headers
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = this.generateCSPHeader();
    }

    // HTTP Strict Transport Security
    if (this.config.enableHSTS) {
      headers['Strict-Transport-Security'] = `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`;
    }

    // X-Frame-Options
    if (this.config.enableXFrameOptions) {
      headers['X-Frame-Options'] = 'DENY';
    }

    // X-Content-Type-Options
    if (this.config.enableXContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer Policy
    if (this.config.enableReferrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy;
    }

    // Permissions Policy
    if (this.config.enablePermissionsPolicy) {
      headers['Permissions-Policy'] = this.generatePermissionsPolicyHeader();
    }

    // Additional security headers
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';

    return headers;
  }

  // Apply security headers to response
  applySecurityHeaders(response: Response): Response {
    const headers = this.getSecurityHeaders();
    
    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        ...headers
      }
    });

    logger.info('[SecurityHeaders] Security headers applied to response');
    return newResponse;
  }

  // Apply security headers to Express response
  applySecurityHeadersExpress(res: unknown): void {
    const headers = this.getSecurityHeaders();
    
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    logger.info('SecurityHeaders', 'Security headers applied to Express response');
  }

  // Update CSP directive
  updateCSPDirective(directive: string, sources: string[]): void {
    this.config.cspDirectives[directive] = sources;
    logger.info('SecurityHeaders', `CSP directive updated: ${directive}`);
  }

  // Add CSP source to directive
  addCSPSource(directive: string, source: string): void {
    if (!this.config.cspDirectives[directive]) {
      this.config.cspDirectives[directive] = [];
    }
    
    if (!this.config.cspDirectives[directive].includes(source)) {
      this.config.cspDirectives[directive].push(source);
      logger.info('SecurityHeaders', `CSP source added: ${directive} -> ${source}`);
    }
  }

  // Remove CSP source from directive
  removeCSPSource(directive: string, source: string): void {
    if (this.config.cspDirectives[directive]) {
      const index = this.config.cspDirectives[directive].indexOf(source);
      if (index > -1) {
        this.config.cspDirectives[directive].splice(index, 1);
        logger.info('SecurityHeaders', `CSP source removed: ${directive} -> ${source}`);
      }
    }
  }

  // Update permissions policy
  updatePermissionsPolicy(feature: string, allowlist: string[]): void {
    this.config.permissionsPolicy[feature] = allowlist;
    logger.info('SecurityHeaders', `Permissions policy updated: ${feature}`);
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('SecurityHeaders', 'Configuration updated');
  }

  // Get current configuration
  getConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }

  // Validate CSP directive
  validateCSPDirective(directive: string, sources: string[]): boolean {
    const validDirectives = [
      'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
      'connect-src', 'media-src', 'object-src', 'child-src', 'frame-src',
      'worker-src', 'manifest-src', 'form-action', 'base-uri', 'frame-ancestors'
    ];

    if (!validDirectives.includes(directive)) {
      logger.warn('SecurityHeaders', `Invalid CSP directive: ${directive}`);
      return false;
    }

    const validSources = [
      "'self'", "'unsafe-inline'", "'unsafe-eval'", "'none'", "'strict-dynamic'",
      'data:', 'blob:', 'https:', 'http:', 'ws:', 'wss:'
    ];

    for (const source of sources) {
      if (!validSources.includes(source) && !source.startsWith('http') && !source.startsWith('data')) {
        logger.warn('SecurityHeaders', `Invalid CSP source: ${source}`);
        return false;
      }
    }

    return true;
  }

  // Get CSP report
  getCSPReport(): {
    directives: Record<string, string[]>;
    totalDirectives: number;
    totalSources: number;
  } {
    const totalDirectives = Object.keys(this.config.cspDirectives).length;
    const totalSources = Object.values(this.config.cspDirectives)
      .reduce((sum, sources) => sum + sources.length, 0);

    return {
      directives: { ...this.config.cspDirectives },
      totalDirectives,
      totalSources
    };
  }
}

// Create global security headers manager instance
export const securityHeadersManager = new SecurityHeadersManager();

// Utility functions
export const getSecurityHeaders = (): Record<string, string> => {
  return securityHeadersManager.getSecurityHeaders();
};

export const applySecurityHeaders = (response: Response): Response => {
  return securityHeadersManager.applySecurityHeaders(response);
};

export const applySecurityHeadersExpress = (res: unknown): void => {
  securityHeadersManager.applySecurityHeadersExpress(res);
};

export const updateCSPDirective = (directive: string, sources: string[]): void => {
  securityHeadersManager.updateCSPDirective(directive, sources);
};

export const addCSPSource = (directive: string, source: string): void => {
  securityHeadersManager.addCSPSource(directive, source);
};

export const removeCSPSource = (directive: string, source: string): void => {
  securityHeadersManager.removeCSPSource(directive, source);
};

export const updatePermissionsPolicy = (feature: string, allowlist: string[]): void => {
  securityHeadersManager.updatePermissionsPolicy(feature, allowlist);
};

export const getCSPReport = () => {
  return securityHeadersManager.getCSPReport();
};

export default securityHeadersManager;
