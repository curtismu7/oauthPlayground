/**
 * Health check routes for system monitoring and status reporting
 * Provides comprehensive health information for all system components
 */

const express = require('express');
const { healthMonitor } = require('../utils/healthMonitor');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Run basic health checks
    const healthStatus = await healthMonitor.runAllChecks();
    const responseTime = Date.now() - startTime;
    
    const statusCode = healthStatus.healthy ? 200 : 503;
    
    logger.logApiResponse('GET', '/health', statusCode, responseTime, {
      healthy: healthStatus.healthy,
      total_checks: healthStatus.total_checks
    });

    res.status(statusCode).json({
      status: healthStatus.healthy ? 'healthy' : 'unhealthy',
      timestamp: healthStatus.timestamp,
      service: 'lending_api',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: healthStatus.checks.map(check => ({
        name: check.name,
        healthy: check.healthy,
        response_time_ms: check.response_time_ms
      }))
    });
  } catch (error) {
    logger.logErrorHandling('health_check_error', {
      error: error.message,
      endpoint: '/health'
    });

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      error: 'Health check failed',
      details: error.message
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Run comprehensive health checks
    const healthStatus = await healthMonitor.runAllChecks();
    const systemMetrics = healthMonitor.getSystemMetrics();
    const responseTime = Date.now() - startTime;
    
    const statusCode = healthStatus.healthy ? 200 : 503;
    
    logger.logApiResponse('GET', '/health/detailed', statusCode, responseTime, {
      healthy: healthStatus.healthy,
      total_checks: healthStatus.total_checks,
      detailed: true
    });

    res.status(statusCode).json({
      status: healthStatus.healthy ? 'healthy' : 'unhealthy',
      timestamp: healthStatus.timestamp,
      service: 'lending_api',
      version: process.env.npm_package_version || '1.0.0',
      health_summary: {
        total_checks: healthStatus.total_checks,
        healthy_checks: healthStatus.healthy_checks,
        unhealthy_checks: healthStatus.unhealthy_checks,
        total_response_time_ms: healthStatus.total_response_time_ms
      },
      system_metrics: systemMetrics,
      detailed_checks: healthStatus.checks
    });
  } catch (error) {
    logger.logErrorHandling('detailed_health_check_error', {
      error: error.message,
      endpoint: '/health/detailed'
    });

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      error: 'Detailed health check failed',
      details: error.message
    });
  }
});

/**
 * Individual component health check
 * GET /health/check/:component
 */
router.get('/check/:component', async (req, res) => {
  try {
    const component = req.params.component;
    const startTime = Date.now();
    
    // Run specific health check
    const checkResult = await healthMonitor.runSingleCheck(component);
    const responseTime = Date.now() - startTime;
    
    const statusCode = checkResult.healthy ? 200 : 503;
    
    logger.logApiResponse('GET', `/health/check/${component}`, statusCode, responseTime, {
      component,
      healthy: checkResult.healthy
    });

    res.status(statusCode).json({
      status: checkResult.healthy ? 'healthy' : 'unhealthy',
      timestamp: checkResult.timestamp,
      service: 'lending_api',
      component: component,
      check_result: checkResult
    });
  } catch (error) {
    logger.logErrorHandling('component_health_check_error', {
      error: error.message,
      component: req.params.component,
      endpoint: `/health/check/${req.params.component}`
    });

    res.status(404).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      component: req.params.component,
      error: 'Component health check failed',
      details: error.message
    });
  }
});

/**
 * System metrics endpoint
 * GET /health/metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const startTime = Date.now();
    
    const systemMetrics = healthMonitor.getSystemMetrics();
    const lastHealthCheck = healthMonitor.getLastHealthCheck();
    const responseTime = Date.now() - startTime;
    
    logger.logApiResponse('GET', '/health/metrics', 200, responseTime, {
      metrics_requested: true
    });

    res.json({
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      system_metrics: systemMetrics,
      last_health_check: lastHealthCheck ? {
        timestamp: lastHealthCheck.timestamp,
        healthy: lastHealthCheck.healthy,
        total_checks: lastHealthCheck.total_checks,
        healthy_checks: lastHealthCheck.healthy_checks
      } : null
    });
  } catch (error) {
    logger.logErrorHandling('metrics_error', {
      error: error.message,
      endpoint: '/health/metrics'
    });

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      error: 'Metrics retrieval failed',
      details: error.message
    });
  }
});

/**
 * Readiness probe endpoint (for Kubernetes/Docker)
 * GET /health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check critical components for readiness
    const criticalChecks = ['datastore', 'filesystem'];
    const results = [];
    
    for (const checkName of criticalChecks) {
      const result = await healthMonitor.runSingleCheck(checkName);
      results.push(result);
    }
    
    const ready = results.every(result => result.healthy);
    const responseTime = Date.now() - startTime;
    const statusCode = ready ? 200 : 503;
    
    logger.logApiResponse('GET', '/health/ready', statusCode, responseTime, {
      ready,
      critical_checks: criticalChecks.length
    });

    res.status(statusCode).json({
      ready,
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      critical_checks: results
    });
  } catch (error) {
    logger.logErrorHandling('readiness_check_error', {
      error: error.message,
      endpoint: '/health/ready'
    });

    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      error: 'Readiness check failed',
      details: error.message
    });
  }
});

/**
 * Liveness probe endpoint (for Kubernetes/Docker)
 * GET /health/live
 */
router.get('/live', (req, res) => {
  try {
    const startTime = Date.now();
    const responseTime = Date.now() - startTime;
    
    logger.logApiResponse('GET', '/health/live', 200, responseTime, {
      liveness_check: true
    });

    res.json({
      alive: true,
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      uptime: process.uptime(),
      pid: process.pid
    });
  } catch (error) {
    logger.logErrorHandling('liveness_check_error', {
      error: error.message,
      endpoint: '/health/live'
    });

    res.status(500).json({
      alive: false,
      timestamp: new Date().toISOString(),
      service: 'lending_api',
      error: 'Liveness check failed',
      details: error.message
    });
  }
});

module.exports = router;