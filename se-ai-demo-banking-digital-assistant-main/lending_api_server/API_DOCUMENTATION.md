# Consumer Lending API Documentation

Complete API reference for the Consumer Lending Service.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [User Management](#user-management)
  - [Credit Operations](#credit-operations)
  - [Administrative](#administrative)
- [Examples](#examples)
- [SDKs and Libraries](#sdks-and-libraries)

## Authentication

All API endpoints require OAuth 2.0 Bearer token authentication.

### Required Headers

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### OAuth Scopes

| Scope | Description |
|-------|-------------|
| `lending:read` | Basic user and credit data access |
| `lending:credit:read` | Credit score access |
| `lending:credit:limits` | Credit limit access |
| `lending:admin` | Administrative access |

### Token Acquisition

```bash
# Example OAuth flow (replace with your OAuth provider details)
curl -X POST https://auth.pingone.com/your-environment-id/as/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=lending:read lending:credit:read lending:credit:limits"
```

## Base URL

- **Development**: `http://localhost:3002`
- **Production**: `https://your-domain.com`

All endpoints are prefixed with `/api` unless otherwise noted.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error context
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `INVALID_TOKEN` | OAuth token is invalid or expired |
| `INSUFFICIENT_SCOPE` | Token lacks required scope |
| `USER_NOT_FOUND` | Requested user does not exist |
| `CREDIT_CALCULATION_FAILED` | Credit score/limit calculation error |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user
- **Admin**: 5000 requests per 15 minutes per admin user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Endpoints

### Health Check

#### Get Basic Health Status

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

#### Get Detailed Health Status

```http
GET /api/health/detailed
```

**Required Scope:** `lending:admin`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "oauth": "healthy",
    "creditEngine": "healthy"
  },
  "metrics": {
    "requestsPerMinute": 45,
    "averageResponseTime": 120,
    "errorRate": 0.02
  }
}
```

### User Management

#### Get Current User Profile

```http
GET /api/users/me
```

**Required Scope:** `lending:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "dateOfBirth": "1985-06-15",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    },
    "employment": {
      "employer": "Tech Corp",
      "position": "Software Engineer",
      "annualIncome": 85000,
      "employmentLength": 36
    },
    "isActive": true,
    "createdAt": "2023-01-15T10:30:00.000Z"
  }
}
```

#### Get User by ID

```http
GET /api/users/:id
```

**Required Scope:** `lending:read`

**Parameters:**
- `id` (string): User ID

**Response:** Same as current user profile

#### List All Users

```http
GET /api/users
```

**Required Scope:** `lending:admin`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `search` (string, optional): Search term for name or email
- `status` (string, optional): Filter by status (`active`, `inactive`)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Credit Operations

#### Get Credit Score

```http
GET /api/credit/:userId/score
```

**Required Scope:** `lending:credit:read`

**Parameters:**
- `userId` (string): User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "score123",
    "userId": "user123",
    "score": 720,
    "scoreDate": "2024-01-15T10:30:00.000Z",
    "factors": {
      "paymentHistory": 35,
      "creditUtilization": 30,
      "creditLength": 15,
      "creditMix": 10,
      "newCredit": 10
    },
    "source": "calculated",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get Credit Limit

```http
GET /api/credit/:userId/limit
```

**Required Scope:** `lending:credit:limits`

**Parameters:**
- `userId` (string): User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "limit123",
    "userId": "user123",
    "creditScore": 720,
    "calculatedLimit": 15000,
    "approvedLimit": 15000,
    "riskLevel": "low",
    "businessRules": {
      "incomeMultiplier": 0.3,
      "debtToIncomeRatio": 0.25,
      "minimumScore": 600
    },
    "calculatedAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-02-15T10:30:00.000Z"
  }
}
```

#### Get Full Credit Assessment

```http
GET /api/credit/:userId/assessment
```

**Required Scope:** `lending:credit:read` + `lending:credit:limits`

**Parameters:**
- `userId` (string): User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "user": {
      "id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "creditScore": {
      "score": 720,
      "scoreDate": "2024-01-15T10:30:00.000Z",
      "factors": {
        "paymentHistory": 35,
        "creditUtilization": 30,
        "creditLength": 15,
        "creditMix": 10,
        "newCredit": 10
      }
    },
    "creditLimit": {
      "calculatedLimit": 15000,
      "approvedLimit": 15000,
      "riskLevel": "low"
    },
    "recommendation": {
      "approved": true,
      "maxAmount": 15000,
      "interestRate": 12.5,
      "terms": "Standard terms apply"
    }
  }
}
```

### Administrative

#### Get Admin Dashboard

```http
GET /api/admin/dashboard
```

**Required Scope:** `lending:admin`

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalUsers": 1250,
      "activeUsers": 1180,
      "totalCreditAssessments": 3450,
      "averageCreditScore": 685,
      "totalCreditLimits": 18750000
    },
    "recentActivity": [
      {
        "type": "credit_assessment",
        "userId": "user123",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### List All Users (Admin)

```http
GET /api/admin/users
```

**Required Scope:** `lending:admin`

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `search` (string, optional): Search term
- `sortBy` (string, optional): Sort field (`name`, `email`, `createdAt`)
- `sortOrder` (string, optional): Sort order (`asc`, `desc`)

**Response:** Extended user list with admin fields

#### Recalculate Credit Scores

```http
POST /api/admin/credit/recalculate
```

**Required Scope:** `lending:admin`

**Request Body:**
```json
{
  "userIds": ["user123", "user456"],
  "force": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "recalc_job_789",
    "status": "started",
    "usersQueued": 2,
    "estimatedCompletion": "2024-01-15T10:35:00.000Z"
  }
}
```

#### Get Credit Reports

```http
GET /api/admin/credit/reports
```

**Required Scope:** `lending:admin`

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `format` (string, optional): Response format (`json`, `csv`)

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report_123",
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-15T23:59:59.000Z"
    },
    "summary": {
      "totalAssessments": 450,
      "averageScore": 692,
      "approvalRate": 0.78,
      "totalLimitsIssued": 6750000
    },
    "details": [
      {
        "date": "2024-01-15",
        "assessments": 30,
        "averageScore": 695,
        "approvals": 24
      }
    ]
  }
}
```

## Examples

### Complete Credit Assessment Workflow

```bash
#!/bin/bash

# 1. Get OAuth token
TOKEN=$(curl -s -X POST https://auth.pingone.com/your-env/as/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=lending:read lending:credit:read lending:credit:limits" \
  | jq -r '.access_token')

# 2. Get user profile
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3002/api/users/user123

# 3. Get credit assessment
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3002/api/credit/user123/assessment

# 4. Check health status
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3002/api/health/detailed
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

class LendingAPIClient {
  constructor(baseURL, accessToken) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getUserProfile(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  async getCreditAssessment(userId) {
    try {
      const response = await this.client.get(`/api/credit/${userId}/assessment`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get credit assessment: ${error.message}`);
    }
  }

  async listUsers(options = {}) {
    try {
      const params = new URLSearchParams(options);
      const response = await this.client.get(`/api/users?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
  }
}

// Usage
const client = new LendingAPIClient('http://localhost:3002', 'your_access_token');

async function example() {
  try {
    // Get user profile
    const user = await client.getUserProfile('user123');
    console.log('User:', user.data);

    // Get credit assessment
    const assessment = await client.getCreditAssessment('user123');
    console.log('Credit Assessment:', assessment.data);

    // List users (admin only)
    const users = await client.listUsers({ page: 1, limit: 10 });
    console.log('Users:', users.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
```

### Python Example

```python
import requests
import json

class LendingAPIClient:
    def __init__(self, base_url, access_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

    def get_user_profile(self, user_id):
        """Get user profile by ID"""
        response = requests.get(
            f'{self.base_url}/api/users/{user_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_credit_assessment(self, user_id):
        """Get full credit assessment for user"""
        response = requests.get(
            f'{self.base_url}/api/credit/{user_id}/assessment',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def list_users(self, **params):
        """List users with optional parameters"""
        response = requests.get(
            f'{self.base_url}/api/users',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage
client = LendingAPIClient('http://localhost:3002', 'your_access_token')

try:
    # Get user profile
    user = client.get_user_profile('user123')
    print(f"User: {user['data']['firstName']} {user['data']['lastName']}")

    # Get credit assessment
    assessment = client.get_credit_assessment('user123')
    credit_data = assessment['data']
    print(f"Credit Score: {credit_data['creditScore']['score']}")
    print(f"Credit Limit: ${credit_data['creditLimit']['calculatedLimit']}")

except requests.exceptions.RequestException as e:
    print(f"API Error: {e}")
```

### cURL Examples

#### Get Credit Score
```bash
curl -X GET \
  http://localhost:3002/api/credit/user123/score \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Search Users
```bash
curl -X GET \
  "http://localhost:3002/api/users?search=john&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Recalculate Credit Scores (Admin)
```bash
curl -X POST \
  http://localhost:3002/api/admin/credit/recalculate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user123", "user456"],
    "force": true
  }'
```

## SDKs and Libraries

### Official SDKs

- **JavaScript/Node.js**: `@lending-service/js-sdk`
- **Python**: `lending-service-python`
- **Java**: `lending-service-java`

### Installation

```bash
# JavaScript/Node.js
npm install @lending-service/js-sdk

# Python
pip install lending-service-python

# Java
<dependency>
  <groupId>com.lending-service</groupId>
  <artifactId>lending-service-java</artifactId>
  <version>1.0.0</version>
</dependency>
```

### SDK Usage

```javascript
// JavaScript
const { LendingClient } = require('@lending-service/js-sdk');

const client = new LendingClient({
  baseURL: 'http://localhost:3002',
  accessToken: 'your_token'
});

const assessment = await client.credit.getAssessment('user123');
```

```python
# Python
from lending_service import LendingClient

client = LendingClient(
    base_url='http://localhost:3002',
    access_token='your_token'
)

assessment = client.credit.get_assessment('user123')
```

## Webhooks

### Webhook Events

The API can send webhooks for the following events:

- `credit.score.calculated` - Credit score calculation completed
- `credit.limit.updated` - Credit limit updated
- `user.profile.updated` - User profile updated
- `admin.action.performed` - Administrative action performed

### Webhook Configuration

Configure webhooks through the admin API:

```bash
curl -X POST \
  http://localhost:3002/api/admin/webhooks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/lending",
    "events": ["credit.score.calculated", "credit.limit.updated"],
    "secret": "your_webhook_secret"
  }'
```

## Support

For API support:

1. **Documentation**: Check this documentation first
2. **Health Check**: Verify service status at `/api/health`
3. **Logs**: Check application logs for detailed error information
4. **Rate Limits**: Ensure you're not exceeding rate limits
5. **OAuth**: Verify token validity and scopes

For technical issues, contact the development team or create an issue in the repository.