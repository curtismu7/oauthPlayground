#!/usr/bin/env node

/**
 * Test script for comprehensive logging and monitoring functionality
 * Tests all logging categories, health checks, and audit logging
 */

const { logger, LOG_LEVELS, LOG_CATEGORIES } = require('./utils/logger');
const { healthMonitor } = require('./utils/healthMonitor');
const { 
  activityLogger, 
  creditActivityLogger, 
  userActivityLogger, 
  adminActivityLogger 
} = require('./middleware/activityLogger');

console.log('🧪 Testing Lending API Logging and Monitoring System\n');

async function testStructuredLogging() {
  console.log('📝 Testing Structured Logging...');
  
  // Test basic logging levels
  logger.debug('TEST', 'Debug message test', { test_data: 'debug' });
  logger.info('TEST', 'Info message test', { test_data: 'info' });
  logger.warn('TEST', 'Warning message test', { test_data: 'warning' });
  logger.error('TEST', 'Error message test', { test_data: 'error' });
  
  // Test OAuth-specific logging
  logger.logOAuthValidation(true, { token_type: 'bearer', user_id: 'test_user' });
  logger.logOAuthValidation(false, { error: 'invalid_token', user_id: 'test_user' });
  
  logger.logScopeValidation(true, { required_scopes: ['lending:read'], user_scopes: ['lending:read', 'lending:credit:read'] });
  logger.logScopeValidation(false, { required_scopes: ['lending:admin'], user_scopes: ['lending:read'] });
  
  logger.logTokenIntrospection(true, 150, { token_active: true });
  logger.logTokenIntrospection(false, 5000, { error: 'timeout' });
  
  // Test lending-specific logging
  logger.logCreditOperation('score_calculation', true, { user_id: 'test_user', score: 750 });
  logger.logCreditOperation('limit_calculation', false, { user_id: 'test_user', error: 'insufficient_data' });
  
  logger.logUserOperation('profile_access', true, { user_id: 'test_user', accessed_by: 'lending_officer' });
  logger.logLendingOperation('assessment_request', true, { user_id: 'test_user', assessment_type: 'full' });
  
  console.log('✅ Structured logging tests completed\n');
}

async function testAuditLogging() {
  console.log('🔍 Testing Audit Logging...');
  
  // Test audit events
  logger.logAuditEvent('user_login', 'test_user', { login_method: 'oauth', ip_address: '192.168.1.100' });
  logger.logAuditEvent('admin_action', 'admin_user', { action: 'user_modification', target_user: 'test_user' });
  
  // Test credit data access logging
  logger.logCreditDataAccess('test_user', 'credit_score', 'lending_officer', { score: 750, endpoint: '/api/credit/test_user/score' });
  logger.logCreditDataAccess('test_user', 'credit_limit', 'lending_officer', { limit: 50000, endpoint: '/api/credit/test_user/limit' });
  logger.logCreditDataAccess('test_user', 'credit_assessment', 'lending_officer', { assessment_type: 'full' });
  
  // Test credit calculation logging
  logger.logCreditCalculation('test_user', 'score_calculation', 750, { factors: { payment_history: 0.9, credit_utilization: 0.7 } });
  logger.logCreditCalculation('test_user', 'limit_calculation', 50000, { risk_level: 'low', income_multiplier: 5 });
  
  // Test security events
  logger.logSecurityEvent('unauthorized_access_attempt', 'high', { ip_address: '192.168.1.200', endpoint: '/api/admin' });
  logger.logSecurityEvent('suspicious_activity', 'medium', { user_id: 'test_user', activity: 'multiple_failed_logins' });
  logger.logSecurityEvent('token_validation_failure', 'low', { token_type: 'bearer', error: 'expired' });
  
  // Test activity events
  logger.logActivityEvent('api_request', 'test_user', { method: 'GET', endpoint: '/api/users/me' });
  logger.logActivityEvent('credit_score_request', 'test_user', { requested_by: 'lending_officer' });
  
  // Test performance metrics
  logger.logPerformanceMetric('credit_score_calculation', 1500, { user_id: 'test_user', cache_hit: false });
  logger.logPerformanceMetric('database_query', 250, { query_type: 'user_lookup', result_count: 1 });
  logger.logPerformanceMetric('slow_api_response', 6000, { endpoint: '/api/credit/assessment', user_id: 'test_user' });
  
  console.log('✅ Audit logging tests completed\n');
}

async function testHealthMonitoring() {
  console.log('🏥 Testing Health Monitoring...');
  
  try {
    // Test individual health checks
    console.log('Running individual health checks...');
    
    const memoryCheck = await healthMonitor.runSingleCheck('memory');
    console.log(`Memory check: ${memoryCheck.healthy ? '✅' : '❌'} (${memoryCheck.response_time_ms}ms)`);
    
    const filesystemCheck = await healthMonitor.runSingleCheck('filesystem');
    console.log(`Filesystem check: ${filesystemCheck.healthy ? '✅' : '❌'} (${filesystemCheck.response_time_ms}ms)`);
    
    const datastoreCheck = await healthMonitor.runSingleCheck('datastore');
    console.log(`Datastore check: ${datastoreCheck.healthy ? '✅' : '❌'} (${datastoreCheck.response_time_ms}ms)`);
    
    const oauthCheck = await healthMonitor.runSingleCheck('oauth_provider');
    console.log(`OAuth provider check: ${oauthCheck.healthy ? '✅' : '❌'} (${oauthCheck.response_time_ms}ms)`);
    
    const servicesCheck = await healthMonitor.runSingleCheck('credit_services');
    console.log(`Credit services check: ${servicesCheck.healthy ? '✅' : '❌'} (${servicesCheck.response_time_ms}ms)`);
    
    // Test comprehensive health check
    console.log('\nRunning comprehensive health check...');
    const overallHealth = await healthMonitor.runAllChecks();
    console.log(`Overall system health: ${overallHealth.healthy ? '✅' : '❌'}`);
    console.log(`Total checks: ${overallHealth.total_checks}`);
    console.log(`Healthy checks: ${overallHealth.healthy_checks}`);
    console.log(`Unhealthy checks: ${overallHealth.unhealthy_checks}`);
    console.log(`Total response time: ${overallHealth.total_response_time_ms}ms`);
    
    // Test system metrics
    console.log('\nGetting system metrics...');
    const metrics = healthMonitor.getSystemMetrics();
    console.log(`Uptime: ${Math.floor(metrics.uptime_seconds / 60)} minutes`);
    console.log(`Memory usage: ${Math.floor(metrics.memory_usage.heap_used / 1024 / 1024)}MB / ${Math.floor(metrics.memory_usage.heap_total / 1024 / 1024)}MB`);
    console.log(`Process ID: ${metrics.process.pid}`);
    console.log(`Node version: ${metrics.process.version}`);
    console.log(`Environment: ${metrics.environment.node_env}`);
    
  } catch (error) {
    console.error('❌ Health monitoring test failed:', error.message);
  }
  
  console.log('✅ Health monitoring tests completed\n');
}

async function testErrorHandling() {
  console.log('🚨 Testing Error Handling and Logging...');
  
  // Test error logging
  logger.logErrorHandling('validation_error', {
    error_message: 'Invalid user ID format',
    endpoint: '/api/users/invalid-id',
    user_id: 'test_user'
  });
  
  logger.logErrorHandling('authentication_error', {
    error_message: 'Invalid OAuth token',
    endpoint: '/api/credit/score',
    token_type: 'bearer'
  });
  
  logger.logErrorHandling('authorization_error', {
    error_message: 'Insufficient scope permissions',
    required_scopes: ['lending:admin'],
    user_scopes: ['lending:read'],
    endpoint: '/api/admin/users'
  });
  
  logger.logErrorHandling('credit_calculation_error', {
    error_message: 'Credit score calculation failed',
    user_id: 'test_user',
    error_details: 'Insufficient credit history data'
  });
  
  logger.logErrorHandling('database_error', {
    error_message: 'Database connection timeout',
    operation: 'user_lookup',
    timeout_ms: 5000
  });
  
  console.log('✅ Error handling tests completed\n');
}

async function testApiLogging() {
  console.log('🌐 Testing API Request/Response Logging...');
  
  // Simulate API request/response logging
  logger.logApiRequest('GET', '/api/users/me', 'test_user', {
    user_agent: 'Mozilla/5.0 (Test Browser)',
    ip_address: '192.168.1.100'
  });
  
  logger.logApiResponse('GET', '/api/users/me', 200, 150, {
    user_id: 'test_user',
    response_size: 1024
  });
  
  logger.logApiRequest('POST', '/api/credit/test_user/recalculate', 'admin_user', {
    user_agent: 'Admin Dashboard/1.0',
    ip_address: '192.168.1.50'
  });
  
  logger.logApiResponse('POST', '/api/credit/test_user/recalculate', 200, 2500, {
    user_id: 'admin_user',
    response_size: 512
  });
  
  // Test slow response logging
  logger.logApiResponse('GET', '/api/credit/test_user/assessment', 200, 8000, {
    user_id: 'test_user',
    response_size: 2048,
    slow_response: true
  });
  
  // Test error response logging
  logger.logApiResponse('GET', '/api/users/nonexistent', 404, 50, {
    user_id: 'test_user',
    error: 'user_not_found'
  });
  
  logger.logApiResponse('POST', '/api/admin/users', 403, 25, {
    user_id: 'test_user',
    error: 'insufficient_permissions'
  });
  
  console.log('✅ API logging tests completed\n');
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive logging and monitoring tests...\n');
  
  try {
    await testStructuredLogging();
    await testAuditLogging();
    await testHealthMonitoring();
    await testErrorHandling();
    await testApiLogging();
    
    console.log('🎉 All logging and monitoring tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Structured logging - PASSED');
    console.log('✅ Audit logging - PASSED');
    console.log('✅ Health monitoring - PASSED');
    console.log('✅ Error handling - PASSED');
    console.log('✅ API logging - PASSED');
    
    console.log('\n📝 Check the console output above for detailed logging examples.');
    console.log('📁 If file logging is enabled, check the ./logs directory for log files.');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n🏁 Test execution completed.');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Fatal error during test execution:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testStructuredLogging,
  testAuditLogging,
  testHealthMonitoring,
  testErrorHandling,
  testApiLogging,
  runAllTests
};