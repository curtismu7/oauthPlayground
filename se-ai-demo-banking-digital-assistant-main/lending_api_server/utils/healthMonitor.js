/**
 * Health monitoring utility for comprehensive system health checks
 * Provides detailed status information for all system components
 */

const { logger } = require('./logger');
const fs = require('fs');
const path = require('path');

class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.lastHealthCheck = null;
    this.healthCheckInterval = null;
    
    // Register default health checks
    this.registerDefaultChecks();
  }

  /**
   * Register a health check function
   */
  registerCheck(name, checkFunction, timeout = 5000) {
    this.checks.set(name, {
      name,
      checkFunction,
      timeout,
      lastResult: null,
      lastCheck: null
    });
  }

  /**
   * Register default system health checks
   */
  registerDefaultChecks() {
    // Memory usage check
    this.registerCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memoryUsagePercent = (usedMem / totalMem) * 100;
      
      return {
        healthy: memoryUsagePercent < 90,
        details: {
          heap_used: usedMem,
          heap_total: totalMem,
          usage_percent: memoryUsagePercent.toFixed(2),
          rss: memUsage.rss,
          external: memUsage.external
        }
      };
    });

    // File system check
    this.registerCheck('filesystem', async () => {
      try {
        const dataDir = path.join(__dirname, '../data');
        const logsDir = path.join(__dirname, '../logs');
        
        // Check if data directory is accessible
        await fs.promises.access(dataDir, fs.constants.R_OK | fs.constants.W_OK);
        
        // Check if logs directory is accessible (create if doesn't exist)
        try {
          await fs.promises.access(logsDir, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error) {
          await fs.promises.mkdir(logsDir, { recursive: true });
        }

        return {
          healthy: true,
          details: {
            data_directory: dataDir,
            logs_directory: logsDir,
            writable: true
          }
        };
      } catch (error) {
        return {
          healthy: false,
          details: {
            error: error.message,
            writable: false
          }
        };
      }
    });

    // Data store health check
    this.registerCheck('datastore', async () => {
      try {
        const lendingDataStore = require('../data/store');
        
        // Test basic operations
        const users = lendingDataStore.getAllUsers();
        const isHealthy = Array.isArray(users);
        
        return {
          healthy: isHealthy,
          details: {
            users_count: users.length,
            store_initialized: true,
            data_directory: lendingDataStore.dataDir
          }
        };
      } catch (error) {
        return {
          healthy: false,
          details: {
            error: error.message,
            store_initialized: false
          }
        };
      }
    });

    // OAuth provider health check
    this.registerCheck('oauth_provider', async () => {
      try {
        const startTime = Date.now();
        
        // Check for OAuth configuration (supports both P1AIC and generic OAuth)
        const p1aicTenant = process.env.P1AIC_TENANT_NAME;
        const p1aicClientId = process.env.P1AIC_CLIENT_ID;
        const genericOAuthUrl = process.env.OAUTH_ISSUER_URL;
        const genericClientId = process.env.OAUTH_CLIENT_ID;
        
        const isP1AICConfigured = !!(p1aicTenant && p1aicClientId);
        const isGenericConfigured = !!(genericOAuthUrl && genericClientId);
        const isConfigured = isP1AICConfigured || isGenericConfigured;
        
        const responseTime = Date.now() - startTime;
        
        return {
          healthy: isConfigured,
          details: {
            configured: isConfigured,
            provider_type: isP1AICConfigured ? 'P1AIC' : (isGenericConfigured ? 'Generic OAuth' : 'none'),
            tenant_name: p1aicTenant || 'not_configured',
            issuer_url: genericOAuthUrl || 'not_configured',
            response_time_ms: responseTime
          }
        };
      } catch (error) {
        return {
          healthy: false,
          details: {
            error: error.message,
            configured: false
          }
        };
      }
    });

    // Credit services health check
    this.registerCheck('credit_services', async () => {
      try {
        const creditScoringService = require('../services/CreditScoringService');
        const creditLimitService = require('../services/CreditLimitService');
        
        // Test service functionality
        const cacheStats = creditScoringService.getCacheStats();
        const servicesHealthy = !!(creditScoringService && creditLimitService);
        
        return {
          healthy: servicesHealthy,
          details: {
            credit_scoring_service: !!creditScoringService,
            credit_limit_service: !!creditLimitService,
            services_initialized: servicesHealthy,
            cache_stats: cacheStats
          }
        };
      } catch (error) {
        return {
          healthy: false,
          details: {
            error: error.message,
            services_initialized: false
          }
        };
      }
    });
  }

  /**
   * Run a single health check with timeout
   */
  async runSingleCheck(checkName) {
    const check = this.checks.get(checkName);
    if (!check) {
      throw new Error(`Health check '${checkName}' not found`);
    }

    const startTime = Date.now();
    
    try {
      // Run check with timeout
      const result = await Promise.race([
        check.checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
        )
      ]);

      const responseTime = Date.now() - startTime;
      
      const checkResult = {
        name: checkName,
        healthy: result.healthy,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
        details: result.details || {}
      };

      // Update last result
      check.lastResult = checkResult;
      check.lastCheck = new Date().toISOString();

      // Log health check result
      logger.logHealthCheck(checkName, result.healthy, responseTime, {
        details: result.details
      });

      return checkResult;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const checkResult = {
        name: checkName,
        healthy: false,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
        error: error.message,
        details: {}
      };

      check.lastResult = checkResult;
      check.lastCheck = new Date().toISOString();

      logger.logHealthCheck(checkName, false, responseTime, {
        error: error.message
      });

      return checkResult;
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    const startTime = Date.now();
    const results = [];
    
    logger.info('HEALTH_CHECK', 'Starting comprehensive health check');

    for (const checkName of this.checks.keys()) {
      try {
        const result = await this.runSingleCheck(checkName);
        results.push(result);
      } catch (error) {
        results.push({
          name: checkName,
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const overallHealthy = results.every(result => result.healthy);
    
    const healthStatus = {
      healthy: overallHealthy,
      timestamp: new Date().toISOString(),
      total_checks: results.length,
      healthy_checks: results.filter(r => r.healthy).length,
      unhealthy_checks: results.filter(r => !r.healthy).length,
      total_response_time_ms: totalTime,
      checks: results
    };

    this.lastHealthCheck = healthStatus;

    logger.logHealthCheck('overall_system', overallHealthy, totalTime, {
      total_checks: results.length,
      healthy_checks: healthStatus.healthy_checks,
      unhealthy_checks: healthStatus.unhealthy_checks
    });

    return healthStatus;
  }

  /**
   * Get the last health check results
   */
  getLastHealthCheck() {
    return this.lastHealthCheck;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      timestamp: new Date().toISOString(),
      uptime_seconds: uptime,
      memory_usage: {
        heap_used: memUsage.heapUsed,
        heap_total: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        log_level: process.env.LOG_LEVEL || 'INFO'
      }
    };
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs = 300000) { // Default 5 minutes
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        logger.error('HEALTH_CHECK', 'Periodic health check failed', {
          error: error.message
        });
      }
    }, intervalMs);

    logger.info('HEALTH_CHECK', 'Started periodic health checks', {
      interval_ms: intervalMs
    });
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('HEALTH_CHECK', 'Stopped periodic health checks');
    }
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

module.exports = {
  healthMonitor,
  HealthMonitor
};