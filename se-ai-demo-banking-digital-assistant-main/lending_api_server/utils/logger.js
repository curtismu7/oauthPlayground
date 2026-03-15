/**
 * Structured logging utility for Lending API OAuth token validation and error handling
 * Provides consistent logging format across the lending application
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Log categories for better organization
const LOG_CATEGORIES = {
  OAUTH_VALIDATION: 'oauth_validation',
  SCOPE_VALIDATION: 'scope_validation',
  TOKEN_INTROSPECTION: 'token_introspection',
  PROVIDER_HEALTH: 'provider_health',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  ERROR_HANDLING: 'error_handling',
  CREDIT_OPERATIONS: 'credit_operations',
  USER_OPERATIONS: 'user_operations',
  LENDING_OPERATIONS: 'lending_operations',
  AUDIT: 'audit',
  ACTIVITY: 'activity',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  HEALTH_CHECK: 'health_check'
};

class StructuredLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
    this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
    this.logDirectory = process.env.LOG_DIRECTORY || './logs';
    
    // Create logs directory if file logging is enabled
    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error.message);
    }
  }

  shouldLog(level) {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  formatLogEntry(level, category, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      service: 'lending_api',
      ...metadata
    };

    return {
      formatted: JSON.stringify(logEntry),
      entry: logEntry
    };
  }

  writeToFile(logEntry, level) {
    if (!this.enableFileLogging) return;

    try {
      const filename = `${level.toLowerCase()}.log`;
      const filepath = path.join(this.logDirectory, filename);
      fs.appendFileSync(filepath, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  log(level, category, message, metadata = {}) {
    if (!this.shouldLog(level)) return;

    const { formatted, entry } = this.formatLogEntry(level, category, message, metadata);
    
    // Console output with color coding
    const colorCode = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m'  // Gray
    };
    
    const resetColor = '\x1b[0m';
    console.log(`${colorCode[level]}[${level}]${resetColor} ${formatted}`);
    
    // Write to file if enabled
    this.writeToFile(formatted, level);
    
    return entry;
  }

  error(category, message, metadata = {}) {
    return this.log(LOG_LEVELS.ERROR, category, message, metadata);
  }

  warn(category, message, metadata = {}) {
    return this.log(LOG_LEVELS.WARN, category, message, metadata);
  }

  info(category, message, metadata = {}) {
    return this.log(LOG_LEVELS.INFO, category, message, metadata);
  }

  debug(category, message, metadata = {}) {
    return this.log(LOG_LEVELS.DEBUG, category, message, metadata);
  }

  // OAuth-specific logging methods
  logOAuthValidation(success, metadata = {}) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    const message = success ? 'OAuth token validation successful' : 'OAuth token validation failed';
    return this.log(level, LOG_CATEGORIES.OAUTH_VALIDATION, message, metadata);
  }

  logScopeValidation(success, metadata = {}) {
    const level = success ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    const message = success ? 'Scope validation passed' : 'Scope validation failed';
    return this.log(level, LOG_CATEGORIES.SCOPE_VALIDATION, message, metadata);
  }

  logTokenIntrospection(success, responseTime, metadata = {}) {
    const level = success ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
    const message = success ? 'Token introspection successful' : 'Token introspection failed';
    return this.log(level, LOG_CATEGORIES.TOKEN_INTROSPECTION, message, {
      response_time_ms: responseTime,
      ...metadata
    });
  }

  logProviderHealth(healthy, responseTime, metadata = {}) {
    const level = healthy ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    const message = healthy ? 'OAuth provider healthy' : 'OAuth provider unhealthy';
    return this.log(level, LOG_CATEGORIES.PROVIDER_HEALTH, message, {
      response_time_ms: responseTime,
      ...metadata
    });
  }

  logAuthenticationAttempt(success, metadata = {}) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    const message = success ? 'Authentication successful' : 'Authentication failed';
    return this.log(level, LOG_CATEGORIES.AUTHENTICATION, message, metadata);
  }

  logAuthorizationAttempt(success, metadata = {}) {
    const level = success ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    const message = success ? 'Authorization granted' : 'Authorization denied';
    return this.log(level, LOG_CATEGORIES.AUTHORIZATION, message, metadata);
  }

  logErrorHandling(errorType, metadata = {}) {
    return this.log(LOG_LEVELS.ERROR, LOG_CATEGORIES.ERROR_HANDLING, `Error handled: ${errorType}`, metadata);
  }

  // Lending-specific logging methods
  logCreditOperation(operation, success, metadata = {}) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    const message = success ? `Credit operation successful: ${operation}` : `Credit operation failed: ${operation}`;
    return this.log(level, LOG_CATEGORIES.CREDIT_OPERATIONS, message, metadata);
  }

  logUserOperation(operation, success, metadata = {}) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    const message = success ? `User operation successful: ${operation}` : `User operation failed: ${operation}`;
    return this.log(level, LOG_CATEGORIES.USER_OPERATIONS, message, metadata);
  }

  logLendingOperation(operation, success, metadata = {}) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    const message = success ? `Lending operation successful: ${operation}` : `Lending operation failed: ${operation}`;
    return this.log(level, LOG_CATEGORIES.LENDING_OPERATIONS, message, metadata);
  }

  // Audit logging methods for compliance and security
  logAuditEvent(event, userId, metadata = {}) {
    return this.log(LOG_LEVELS.INFO, LOG_CATEGORIES.AUDIT, `Audit event: ${event}`, {
      user_id: userId,
      audit_timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logCreditDataAccess(userId, dataType, accessedBy, metadata = {}) {
    return this.logAuditEvent('credit_data_access', userId, {
      data_type: dataType,
      accessed_by: accessedBy,
      access_type: 'read',
      ...metadata
    });
  }

  logCreditCalculation(userId, calculationType, result, metadata = {}) {
    return this.logAuditEvent('credit_calculation', userId, {
      calculation_type: calculationType,
      calculation_result: result,
      ...metadata
    });
  }

  logSecurityEvent(event, severity, metadata = {}) {
    const level = severity === 'high' ? LOG_LEVELS.ERROR : 
                  severity === 'medium' ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    return this.log(level, LOG_CATEGORIES.SECURITY, `Security event: ${event}`, {
      severity,
      security_timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logActivityEvent(activity, userId, metadata = {}) {
    return this.log(LOG_LEVELS.INFO, LOG_CATEGORIES.ACTIVITY, `Activity: ${activity}`, {
      user_id: userId,
      activity_timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logPerformanceMetric(operation, duration, metadata = {}) {
    const level = duration > 5000 ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    return this.log(level, LOG_CATEGORIES.PERFORMANCE, `Performance metric: ${operation}`, {
      duration_ms: duration,
      performance_timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  logHealthCheck(component, healthy, responseTime, metadata = {}) {
    const level = healthy ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    const message = `Health check ${healthy ? 'passed' : 'failed'}: ${component}`;
    return this.log(level, LOG_CATEGORIES.HEALTH_CHECK, message, {
      component,
      healthy,
      response_time_ms: responseTime,
      health_timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Request/Response logging for API endpoints
  logApiRequest(method, path, userId, metadata = {}) {
    return this.logActivityEvent('api_request', userId, {
      http_method: method,
      request_path: path,
      ...metadata
    });
  }

  logApiResponse(method, path, statusCode, responseTime, metadata = {}) {
    const level = statusCode >= 500 ? LOG_LEVELS.ERROR :
                  statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    return this.log(level, LOG_CATEGORIES.ACTIVITY, 'API response', {
      http_method: method,
      request_path: path,
      status_code: statusCode,
      response_time_ms: responseTime,
      ...metadata
    });
  }
}

// Create singleton instance
const logger = new StructuredLogger();

module.exports = {
  logger,
  LOG_LEVELS,
  LOG_CATEGORIES,
  StructuredLogger
};