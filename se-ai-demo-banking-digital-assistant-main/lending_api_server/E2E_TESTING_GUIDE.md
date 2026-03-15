# End-to-End Testing Guide

This guide provides comprehensive information about the E2E testing setup for the Consumer Lending Service.

## Overview

The E2E testing suite validates complete user workflows, cross-service communication, performance characteristics, and system reliability under various conditions.

## Test Structure

```
src/__tests__/e2e/
├── user-workflows.test.js           # Complete user workflow tests
├── cross-service-communication.test.js  # External service integration tests
├── performance-load.test.js         # Performance and load testing
├── test-data-manager.js            # Test data management utilities
├── setup.js                        # E2E test setup and utilities
├── run-e2e-tests.js               # Main test runner
├── jest.setup.js                  # Jest configuration for E2E
├── global-setup.js                # Global test setup
├── global-teardown.js             # Global test cleanup
└── results-processor.js           # Test results processing
```

## Test Categories

### 1. User Workflow Tests (`user-workflows.test.js`)

Tests complete end-to-end user journeys:

- **Lending Officer Workflow**: Authentication → User lookup → Credit assessment
- **Admin Workflow**: Admin authentication → User management → Credit reporting
- **Error Recovery**: Invalid data handling, authentication failures
- **Data Consistency**: Cross-endpoint data validation

### 2. Cross-Service Communication Tests (`cross-service-communication.test.js`)

Tests integration with external services:

- **OAuth Provider Communication**: Token validation, provider failures
- **Banking API Integration**: User data retrieval, service unavailability
- **Credit Bureau Integration**: External credit scores, fallback mechanisms
- **Notification Service**: High-risk alerts, delivery failures
- **Audit Service**: Activity logging, audit failures
- **Circuit Breaker**: Service failure handling
- **Health Monitoring**: Service status reporting
- **Data Synchronization**: Cross-service data consistency

### 3. Performance and Load Tests (`performance-load.test.js`)

Tests system performance characteristics:

- **Response Time Performance**: Individual endpoint response times
- **Concurrent Request Load**: Multiple simultaneous requests
- **Memory and Resource Usage**: Memory leak detection, resource efficiency
- **Stress Testing**: High load scenarios, graceful degradation
- **Database Performance**: Query optimization, bulk operations
- **Caching Performance**: Cache hit/miss ratios, invalidation
- **Rate Limiting**: Proper enforcement of rate limits

## Running E2E Tests

### Individual Test Suites

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e-user-workflows
npm run test:e2e-cross-service
npm run test:e2e-performance

# Run with custom test runner
npm run test:e2e-runner
```

### Configuration Options

```bash
# Run with verbose output
npm run test:e2e -- --verbose

# Run with coverage (not recommended for E2E)
npm run test:e2e -- --coverage

# Run specific test file
npx jest src/__tests__/e2e/user-workflows.test.js --config=jest.e2e.config.js
```

## Test Data Management

### Test Data Manager

The `TestDataManager` class provides utilities for:

- **Data Setup**: Creating test users, credit scores, and limits
- **Data Cleanup**: Removing test data after tests
- **Data Backup**: Preserving original data
- **Performance Data**: Generating large datasets for load testing

### Usage Example

```javascript
const TestDataManager = require('./test-data-manager');

const manager = new TestDataManager();
await manager.initialize();

// Create specific test user
const user = await manager.createTestUser({
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com'
});

// Generate performance test data
await manager.generatePerformanceTestData(1000);

// Cleanup
await manager.cleanup();
```

## Test Environment Setup

### Prerequisites

1. **Node.js**: Version 16 or higher
2. **Dependencies**: All dev dependencies installed
3. **Environment Variables**: Test environment configured
4. **Services**: Backend API server running (for integration tests)

### Environment Configuration

```bash
# Test environment variables
NODE_ENV=test
CREDIT_SCORE_TTL=60
LOG_LEVEL=error
JWT_SECRET=test-jwt-secret-for-e2e-tests
```

### Global Setup Process

1. **Initialize Test Data Manager**: Create test data structures
2. **Backup Original Data**: Preserve existing data
3. **Create Test Data**: Generate comprehensive test datasets
4. **Validate Environment**: Ensure all services are available

## Performance Testing

### Performance Metrics

The performance tests measure:

- **Response Times**: Individual endpoint performance
- **Throughput**: Requests per second capacity
- **Concurrency**: Simultaneous request handling
- **Memory Usage**: Memory consumption patterns
- **Resource Utilization**: CPU and I/O efficiency

### Performance Thresholds

```javascript
// Response time thresholds
USER_LOOKUP_THRESHOLD = 500ms
CREDIT_SCORE_THRESHOLD = 1000ms
CREDIT_LIMIT_THRESHOLD = 1500ms
FULL_ASSESSMENT_THRESHOLD = 2000ms

// Concurrency thresholds
CONCURRENT_USERS = 20
CONCURRENT_ASSESSMENTS = 10
SUCCESS_RATE_MINIMUM = 70%
```

### Load Testing Scenarios

1. **Normal Load**: Typical usage patterns
2. **Peak Load**: High traffic scenarios
3. **Stress Load**: Beyond normal capacity
4. **Spike Load**: Sudden traffic increases

## Error Handling and Recovery

### Error Scenarios Tested

- **Authentication Failures**: Invalid tokens, expired sessions
- **Service Unavailability**: External service downtime
- **Data Inconsistency**: Conflicting data across services
- **Network Issues**: Timeouts, connection failures
- **Rate Limiting**: Quota exceeded scenarios

### Recovery Mechanisms

- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breakers**: Prevent cascade failures
- **Fallback Strategies**: Alternative data sources
- **Graceful Degradation**: Reduced functionality during issues

## Reporting and Analysis

### Test Reports

Generated reports include:

1. **JSON Report**: Detailed test results (`e2e-results.json`)
2. **HTML Report**: Visual test summary (`e2e-report.html`)
3. **Performance Metrics**: Performance analysis (`e2e-performance-metrics.json`)
4. **Summary Report**: Markdown summary (`e2e-summary.md`)

### Report Locations

```
reports/
├── e2e-results.json              # Detailed test results
├── e2e-report.html              # HTML test report
├── e2e-performance-metrics.json  # Performance analysis
├── e2e-summary.md               # Summary report
└── e2e-detailed-results.json    # Processed results
```

### Performance Analysis

Performance reports include:

- **Response Time Statistics**: Min, max, average, 95th percentile
- **Throughput Metrics**: Requests per second
- **Error Rates**: Success/failure ratios
- **Resource Usage**: Memory and CPU utilization

## Best Practices

### Test Design

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Deterministic**: Tests should produce consistent results
4. **Realistic**: Use realistic test data and scenarios

### Performance Testing

1. **Baseline**: Establish performance baselines
2. **Monitoring**: Monitor resource usage during tests
3. **Gradual Load**: Increase load gradually
4. **Realistic Data**: Use production-like data volumes

### Error Handling

1. **Comprehensive**: Test all error scenarios
2. **Recovery**: Verify recovery mechanisms
3. **Logging**: Ensure proper error logging
4. **User Experience**: Test error message clarity

## Troubleshooting

### Common Issues

1. **Test Data Conflicts**: Ensure proper cleanup between runs
2. **Service Dependencies**: Verify all required services are running
3. **Timeout Issues**: Adjust timeouts for slower environments
4. **Memory Issues**: Monitor memory usage during large tests

### Debug Mode

```bash
# Run with debug output
DEBUG=* npm run test:e2e

# Run single test with verbose output
npx jest src/__tests__/e2e/user-workflows.test.js --verbose --no-cache
```

### Log Analysis

Check logs in:
- `logs/` directory for application logs
- Jest output for test execution logs
- `reports/` directory for detailed test results

## Continuous Integration

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    npm install
    npm run test:e2e-runner
  env:
    NODE_ENV: test
    CI: true
```

### Test Scheduling

- **Pre-deployment**: Run before production deployments
- **Nightly**: Full test suite execution
- **On-demand**: Manual test execution for debugging

## Maintenance

### Regular Tasks

1. **Update Test Data**: Keep test data current
2. **Review Thresholds**: Adjust performance thresholds
3. **Clean Reports**: Archive old test reports
4. **Update Dependencies**: Keep testing libraries current

### Performance Monitoring

1. **Trend Analysis**: Monitor performance trends over time
2. **Threshold Adjustment**: Update thresholds based on system changes
3. **Capacity Planning**: Use results for capacity planning
4. **Optimization**: Identify optimization opportunities

## Security Considerations

### Test Data Security

- **No Production Data**: Never use production data in tests
- **Encrypted Secrets**: Encrypt sensitive test data
- **Access Control**: Limit access to test environments
- **Data Cleanup**: Ensure complete data cleanup

### Authentication Testing

- **Token Management**: Proper test token lifecycle
- **Permission Testing**: Verify authorization controls
- **Security Scenarios**: Test security failure scenarios
- **Audit Logging**: Verify security event logging