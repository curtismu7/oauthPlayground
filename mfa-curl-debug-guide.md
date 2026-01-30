# MFA SMS Registration - cURL Debug Guide

This guide provides cURL commands and sample outputs to help debug SMS registration issues. Based on the official PingOne MFA API and our enhanced implementation.

## 🔧 Prerequisites

Before running these curl commands, make sure you have:
- **Environment ID**: Your PingOne environment UUID
- **Worker Token**: Valid worker token with MFA permissions
- **Username**: Test user's username or email
- **Phone Number**: Test user's phone number in E.164 format

## 📋 Step-by-Step Debugging

### Step 1: Check Worker Token Status

```bash
curl -X POST http://localhost:3001/api/pingone/worker-token-status \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Success Response:**
```json
{
  "hasToken": true,
  "tokenValid": true,
  "tokenExpiresIn": 3600,
  "lastFetchedAt": 1640995200000,
  "appInfo": {
    "appId": "your-app-id",
    "appName": "OAuth Playground",
    "appVersion": "9.2.6"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Worker token is not available or invalid",
  "details": {
    "hasCredentials": false,
    "hasToken": false,
    "tokenValid": false
  }
}
```

### Step 2: Lookup User by Username

```bash
curl -X POST http://localhost:3001/api/pingone/mfa/lookup-user \
  -H "Content-Type: application/json" \
  -d '{
    "environmentId": "your-environment-id",
    "username": "test.user@example.com",
    "workerToken": "your-worker-token-here"
  }'
```

**Expected Success Response:**
```json
{
  "id": "12345678-1234-1234-1234-123456789012",
  "username": "test.user@example.com",
  "email": "test.user@example.com",
  "name": {
    "given": "Test",
    "family": "User"
  },
  "phoneNumbers": [
    {
      "type": "MOBILE",
      "value": "+15551234567"
    }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields",
  "details": {
    "environmentId": false,
    "username": false,
    "workerToken": false
  }
}
```

**Error Response (401):**
```json
{
  "error": "User is not authorized to access this resource with an explicit deny in an identity-based policy"
}
```

**Error Response (404):**
```json
{
  "error": "User not found",
  "username": "test.user@example.com"
}
```

### Step 3: Get Device Authentication Policies

```bash
curl -X GET http://localhost:3001/api/pingone/mfa/device-authentication-policies \
  -H "Authorization: Bearer your-worker-token" \
  -H "Accept: application/json"
```

**Expected Success Response:**
```json
{
  "_embedded": {
    "deviceAuthenticationPolicies": [
      {
        "id": "12345678-1234-1234-1234-123456789012",
        "name": "Default MFA Policy",
        "description": "Default policy for MFA devices",
        "enabled": true,
        "otp": {
          "failure": {
            "count": 3,
            "coolDown": {
              "duration": 2,
              "timeUnit": "MINUTES"
            }
          },
          "lifetime": {
            "duration": 10,
            "timeUnit": "MINUTES"
          },
          "otpLength": 6
        },
        "offline": {
          "enabled": true,
          "otp": {
            "enabled": true
          }
        }
      }
    ]
  }
}
```

### Step 4: Register SMS Device

```bash
curl -X POST http://localhost:3001/api/pingone/mfa/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-worker-token" \
  -d '{
    "environmentId": "your-environment-id",
    "username": "test.user@example.com",
    "type": "SMS",
    "phone": "+15551234567",
    "nickname": "Test SMS Device",
    "status": "ACTIVATION_REQUIRED",
    "deviceAuthenticationPolicyId": "12345678-1234-1234-1234-123456789012"
  }'
```

**Expected Success Response (201):**
```json
{
  "id": "87654321-4321-4321-4321-210987654321",
  "type": "SMS",
  "phone": "+15551234567",
  "nickname": "Test SMS Device",
  "status": "ACTIVATION_REQUIRED",
  "createdAt": "2026-01-30T13:45:00.000Z",
  "updatedAt": "2026-01-30T13:45:00.000Z",
  "_links": {
    "self": {
      "href": "/v1/environments/your-env-id/users/user-id/devices/87654321-4321-4321-4321-210987654321"
    },
    "activate": {
      "href": "/v1/environments/your-env-id/users/user-id/devices/87654321-4321-4321-4321-210987654321/activate"
    }
  }
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields",
  "details": {
    "environmentId": false,
    "username": false,
    "type": false,
    "phone": false,
    "deviceAuthenticationPolicyId": false
  }
}
```

### Step 5: Activate Device with OTP

```bash
curl -X POST http://localhost:3001/api/pingone/mfa/activate-device \
  -H "Content-Type: application/vnd.pingidentity.device.activate+json" \
  -H "Authorization: Bearer your-worker-token" \
  -d '{
    "environmentId": "your-environment-id",
    "username": "test.user@example.com",
    "deviceId": "87654321-4321-4321-4321-210987654321",
    "otp": "123456"
  }'
```

**Expected Success Response (200):**
```json
{
  "id": "87654321-4321-4321-4321-210987654321",
  "type": "SMS",
  "phone": "+15551234567",
  "nickname": "Test SMS Device",
  "status": "ACTIVE",
  "activatedAt": "2026-01-30T13:50:00.000Z",
  "updatedAt": "2026-01-30T13:50:00.000Z"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid OTP",
  "details": {
    "otp": "OTP code is invalid or expired"
  }
}
```

**Error Response (404):**
```json
{
  "error": "Device not found",
  "deviceId": "87654321-4321-4321-4321-210987654321"
}
```

## 🔍 Debugging Our Enhanced Implementation

### Check Server Logs

Our enhanced implementation adds detailed logging. Check the server output for:

```bash
[LOOKUP-USER] Request body:
{
  environmentId: 'present',
  username: 'present', 
  workerToken: 'present',
  environmentIdValue: 'your-environment-id',
  usernameValue: 'test.user@example.com',
  workerTokenLength: 2048
}

[LOOKUP-USER] PingOne API Success:
{
  userCount: 1,
  hasUsers: true
}
```

### Verify Database Storage

Our implementation uses dual storage. Check that data is being persisted:

```bash
# Browser Storage (localStorage)
localStorage.getItem('mfa-flow-v8')

# Database Storage (via API)
curl -X GET http://localhost:3001/api/storage/load \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "mfa",
    "filename": "mfa-credentials.json"
  }'
```

## 🚀 Common Issues & Solutions

### Issue: 400 Bad Request on lookup-user

**Root Cause**: Missing or invalid parameters
**Solution**: 
1. Verify environment ID is valid UUID format
2. Ensure worker token is valid and not expired
3. Check username exists in PingOne

### Issue: Worker Token Invalid

**Root Cause**: Token expired or permissions missing
**Solution**:
1. Refresh worker token in Worker Token UI
2. Ensure MFA permissions are enabled
3. Check token expiration time

### Issue: User Not Found

**Root Cause**: Username doesn't exist in environment
**Solution**:
1. Verify username is correct
2. Check user exists in PingOne admin console
3. Ensure user is in correct environment

### Issue: Device Registration Fails

**Root Cause**: Missing required fields or invalid policy
**Solution**:
1. Verify deviceAuthenticationPolicyId is valid
2. Ensure phone number is in E.164 format (+1.xxx.xxx.xxxx)
3. Check policy allows SMS devices

### Issue: OTP Activation Fails

**Root Cause**: Invalid OTP or device not found
**Solution**:
1. Use the exact OTP received via SMS
2. Ensure deviceId is correct from registration step
3. Check OTP hasn't expired (10 minutes)

## 📱 Enhanced Features Verification

Our enhanced implementation includes:

### Database Persistence
```bash
# Verify data persists across browser sessions
# 1. Clear browser storage
localStorage.clear()

# 2. Reload page and check if data is restored from database
# Should see credentials restored automatically
```

### Enhanced Debugging
```bash
# Check server logs for detailed debugging
# Look for [LOOKUP-USER] and [UNIFIED-FLOW] tags
```

### Worker Token Validation
```bash
# Check pre-validation in registration form
# Should prevent API calls with invalid tokens
```

## 🎯 Testing Checklist

- [ ] Worker token is valid and not expired
- [ ] User exists in PingOne environment
- [ ] Device authentication policy allows SMS
- [ ] Phone number is in E.164 format
- [ ] OTP code is correct and not expired
- [ ] Device ID matches registration step
- [ ] Database persistence is working
- [ ] Server logs show detailed debugging

## 📚 Reference

- [PingOne MFA API Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/)
- [Our Enhanced Implementation](../docs/otp-template-guide.md)
- [Server Debugging Logs](../server.js)

## 🔧 Quick Test Script

```bash
#!/bin/bash

# Quick test script for SMS registration
ENV_ID="your-environment-id"
USERNAME="test.user@example.com"
WORKER_TOKEN="your-worker-token"
PHONE="+15551234567"

echo "🔍 Testing SMS Registration Flow..."

echo "1. Testing worker token status..."
curl -s -X POST http://localhost:3001/api/pingone/worker-token-status \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

echo -e "\n2. Testing user lookup..."
curl -s -X POST http://localhost:3001/api/pingone/mfa/lookup-user \
  -H "Content-Type: application/json" \
  -d "{\"environmentId\":\"$ENV_ID\",\"username\":\"$USERNAME\",\"workerToken\":\"$WORKER_TOKEN\"}" | jq .

echo -e "\n3. Testing device registration..."
curl -s -X POST http://localhost:3001/api/pingone/mfa/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d "{\"environmentId\":\"$ENV_ID\",\"username\":\"$USERNAME\",\"type\":\"SMS\",\"phone\":\"$PHONE\",\"nickname\":\"Test SMS Device\",\"status\":\"ACTIVATION_REQUIRED\"}" | jq .

echo -e "\n✅ Test complete. Check responses above for any errors."
```

Save this as `test-sms-registration.sh` and run: `chmod +x test-sms-registration.sh && ./test-sms-registration.sh`
