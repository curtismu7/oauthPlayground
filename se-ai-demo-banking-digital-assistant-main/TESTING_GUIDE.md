# Consumer Lending Service - Testing Guide

This guide provides comprehensive instructions for testing the Consumer Lending Service after fixing the initial issues.

## 🔧 **Issues Fixed**

✅ **Data Store Constructor Error**: Fixed health monitor to use singleton instance  
✅ **Credit Services Constructor Error**: Fixed service imports and initialization  
✅ **Health Check Routes**: Corrected endpoint paths and response handling  
✅ **OAuth Configuration**: Updated health checks to support both P1AIC and generic OAuth  

## 🧪 **Testing Options**

### 1. **Quick Health Verification** ⚡

The fastest way to verify everything is working:

```bash
# Test the fixes
node lending_api_server/test-health-fix.js

# Test the API endpoints
node lending_api_server/test-api-basic.js
```

### 2. **Manual Health Checks** 🏥

```bash
# Basic health check
curl http://localhost:3002/health

# Detailed health check
curl http://localhost:3002/health/detailed

# Individual component checks
curl http://localhost:3002/health/check/datastore
curl http://localhost:3002/health/check/credit_services
```

### 3. **Comprehensive Test Suites** 🧪

```bash
cd lending_api_server

# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Run business logic tests (no OAuth required)
npm test src/__tests__/business-logic.test.js

# Run credit service tests
npm test src/__tests__/credit-service.test.js
```

### 4. **Interactive API Testing** 🔄

```bash
cd lending_api_server/examples

# Run all basic examples (handles sample data)
./curl-examples.sh all

# Test specific areas
./curl-examples.sh health
./curl-examples.sh user user123
./curl-examples.sh credit user123
```

### 5. **Development Mode Testing** 🚀

The service includes sample data and mock authentication for testing:

```bash
# Start the server
cd lending_api_server
npm run dev

# In another terminal, test with sample data
curl http://localhost:3002/health
curl http://localhost:3002/health/detailed
```

## 📊 **Expected Test Results**

### Health Check Status
- ✅ **Memory**: Should pass
- ✅ **Filesystem**: Should pass  
- ✅ **Datastore**: Should pass (now loads 7 sample users)
- ✅ **Credit Services**: Should pass
- ❌ **OAuth Provider**: Expected to fail until configured

### API Endpoints
- ✅ **Health endpoints** (`/health`, `/health/detailed`): Should return 200/503
- ✅ **Protected endpoints** (`/api/users`, `/api/credit/*`): Should return 401 (auth required)
- ✅ **Non-existent endpoints**: Should return 404

## 🔐 **Testing Without OAuth**

Since OAuth isn't configured yet, you can test core functionality:

### Sample Data Available
The service includes 7 sample users with IDs: `1`, `2`, `3`, `4`, `5`, plus two UUIDs.

### Business Logic Testing
```bash
# Test credit scoring algorithms
npm test src/__tests__/business-logic.test.js

# Test credit limit calculations  
npm test src/__tests__/credit-service.test.js

# Test data store operations
npm test src/__tests__/users.test.js
```

### Mock Authentication
Some tests include mock authentication to test protected endpoints without OAuth setup.

## 🚀 **Next Steps for Full Testing**

### 1. **Configure OAuth** (Optional for basic testing)
```bash
# Update .env file with real OAuth provider
OAUTH_ISSUER_URL=https://your-oauth-provider.com
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
```

### 2. **Test with Real Authentication**
```bash
# Get OAuth token (replace with your method)
export ACCESS_TOKEN="your_oauth_token"

# Test authenticated endpoints
cd lending_api_server/examples
export ACCESS_TOKEN="your_token"
./curl-examples.sh all
```

### 3. **UI Testing**
```bash
cd lending_api_ui
npm install
npm start

# Test UI components
npm test
```

## 🐛 **Troubleshooting**

### If Health Checks Still Fail

1. **Check server logs**:
   ```bash
   # Look for errors in the console output
   tail -f lending_api_server/logs/error.log
   ```

2. **Verify data directories**:
   ```bash
   ls -la lending_api_server/data/persistent/
   ls -la lending_api_server/logs/
   ```

3. **Test individual components**:
   ```bash
   node lending_api_server/test-health-fix.js
   ```

### If API Endpoints Don't Respond

1. **Check if server is running**:
   ```bash
   curl http://localhost:3002/health
   ```

2. **Verify port availability**:
   ```bash
   lsof -i :3002
   ```

3. **Check for errors**:
   ```bash
   cd lending_api_server
   npm run dev
   # Look for startup errors
   ```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Port 3002 in use | Change PORT in .env or kill existing process |
| Permission errors | Check file permissions in data/ and logs/ directories |
| Module not found | Run `npm install` in lending_api_server |
| OAuth errors | Expected - configure OAuth or use mock authentication |

## 📈 **Performance Testing**

```bash
# Run performance tests
npm test src/__tests__/e2e/performance-load.test.js

# Test response times
cd lending_api_server/examples
./curl-examples.sh performance
```

## 🔍 **Monitoring and Debugging**

### Enable Debug Mode
```bash
# API Server
LOG_LEVEL=debug npm run dev

# UI Application  
REACT_APP_DEBUG_MODE=true npm start
```

### View Detailed Logs
```bash
# Real-time logs
tail -f lending_api_server/logs/info.log

# Error logs only
tail -f lending_api_server/logs/error.log
```

### Health Monitoring
```bash
# Continuous health monitoring
watch -n 30 'curl -s http://localhost:3002/health | jq'

# Component-specific monitoring
curl http://localhost:3002/health/check/datastore
curl http://localhost:3002/health/check/credit_services
```

## ✅ **Testing Checklist**

- [ ] **Server starts without errors**
- [ ] **Health endpoints respond correctly**
- [ ] **Sample data loads (7 users)**
- [ ] **Credit services initialize**
- [ ] **Protected endpoints require auth (401)**
- [ ] **Business logic tests pass**
- [ ] **Data store operations work**
- [ ] **Error handling works correctly**

## 🎯 **Quick Test Commands**

```bash
# One-liner to test everything quickly
cd lending_api_server && \
node test-health-fix.js && \
node test-api-basic.js && \
npm test src/__tests__/business-logic.test.js

# Test with cURL examples
cd lending_api_server/examples && \
./curl-examples.sh health && \
./curl-examples.sh user user123
```

The Consumer Lending Service is now properly configured and ready for testing! The core functionality works without OAuth, and you can add authentication later for full functionality.