# Admin API Documentation

This document describes the administrative API endpoints for the Consumer Lending Service.

## Authentication

All admin endpoints require:
1. Valid OAuth Bearer token in the Authorization header
2. Admin role or `lending:admin` scope
3. Proper scope validation for each endpoint

## Base URL

```
http://localhost:3002/api/admin
```

## Endpoints

### User Management

#### GET /api/admin/users

Get all users with pagination and filtering options.

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 50) - Number of users per page
- `search` (string) - Search term for user lookup
- `isActive` (boolean) - Filter by active status
- `sortBy` (string, default: 'createdAt') - Field to sort by
- `sortOrder` (string, default: 'desc') - Sort order (asc/desc)

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01T00:00:00.000Z",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zipCode": "12345"
      },
      "employment": {
        "employer": "Tech Corp",
        "position": "Software Engineer",
        "annualIncome": 75000,
        "employmentLength": 24
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "search": null,
    "isActive": null,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

#### GET /api/admin/users/:userId

Get detailed information for a specific user including credit data.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    // ... other user fields
  },
  "creditAssessment": {
    "user": {
      "id": "user-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "employment": {
        "employer": "Tech Corp",
        "position": "Software Engineer",
        "annualIncome": 75000,
        "employmentLength": 24
      }
    },
    "creditScore": {
      "id": "score-id",
      "userId": "user-id",
      "score": 720,
      "scoreDate": "2024-01-01T00:00:00.000Z",
      "factors": {
        "paymentHistory": 35,
        "creditUtilization": 30,
        "creditLength": 15,
        "creditMix": 10,
        "newCredit": 10
      },
      "source": "calculated"
    },
    "creditLimit": {
      "id": "limit-id",
      "userId": "user-id",
      "creditScore": 720,
      "calculatedLimit": 25000,
      "approvedLimit": 25000,
      "riskLevel": "low",
      "businessRules": {
        "incomeMultiplier": 0.33,
        "debtToIncomeRatio": 0.25,
        "minimumScore": 600
      },
      "calculatedAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-07-01T00:00:00.000Z"
    },
    "assessmentDate": "2024-01-01T00:00:00.000Z"
  },
  "creditHistory": {
    "scores": [
      // Array of historical credit scores (last 10)
    ],
    "limits": [
      // Array of historical credit limits (last 10)
    ]
  },
  "activitySummary": {
    "totalActivities": 50,
    "recentActivities": [
      // Array of recent activities (last 20)
    ]
  }
}
```

#### PUT /api/admin/users/:userId

Update user information (admin only).

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated@example.com",
  "phone": "+1234567890",
  "address": {
    "street": "456 New St",
    "city": "New City",
    "state": "NY",
    "zipCode": "54321"
  },
  "employment": {
    "employer": "New Corp",
    "position": "Senior Engineer",
    "annualIncome": 85000,
    "employmentLength": 36
  },
  "isActive": true
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    // Updated user object
  }
}
```

### Credit Management

#### GET /api/admin/credit/reports

Get credit reporting and analytics data.

**Query Parameters:**
- `reportType` (string, default: 'summary') - Type of report: 'summary', 'detailed', 'trends', 'all'
- `startDate` (string) - Start date for filtering (ISO format)
- `endDate` (string) - End date for filtering (ISO format)
- `riskLevel` (string) - Filter by risk level: 'low', 'medium', 'high'
- `includeExpired` (boolean, default: false) - Include expired credit limits

**Response (summary):**
```json
{
  "reportType": "summary",
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "filters": {
    "startDate": null,
    "endDate": null,
    "riskLevel": null,
    "includeExpired": false
  },
  "summary": {
    "creditScores": {
      "count": 100,
      "average": 720,
      "min": 580,
      "max": 850,
      "median": 715
    },
    "creditLimits": {
      "count": 100,
      "average": 22500,
      "min": 5000,
      "max": 50000,
      "totalApproved": 2250000
    },
    "riskDistribution": {
      "low": 60,
      "medium": 30,
      "high": 10,
      "total": 100
    },
    "expiredLimits": {
      "count": 5,
      "totalValue": 125000
    }
  }
}
```

#### POST /api/admin/credit/recalculate

Trigger credit recalculation for users.

**Request Body:**
```json
{
  "userIds": ["user-id-1", "user-id-2"],
  "recalculateAll": false,
  "forceRecalculation": true,
  "recalculationType": "both"
}
```

**Parameters:**
- `userIds` (array) - Array of user IDs to recalculate (required if recalculateAll is false)
- `recalculateAll` (boolean, default: false) - Recalculate for all active users
- `forceRecalculation` (boolean, default: false) - Force recalculation even if recent data exists
- `recalculationType` (string, default: 'both') - What to recalculate: 'scores', 'limits', 'both'

**Response:**
```json
{
  "message": "Credit recalculation completed",
  "results": {
    "totalUsers": 2,
    "successful": 2,
    "failed": 0,
    "skipped": 0,
    "startedAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:00:05.000Z",
    "duration": 5000,
    "details": [
      {
        "userId": "user-id-1",
        "userName": "John Doe",
        "status": "success",
        "actions": ["credit_score_recalculated", "credit_limit_recalculated"],
        "errors": []
      },
      {
        "userId": "user-id-2",
        "userName": "Jane Smith",
        "status": "success",
        "actions": ["credit_score_recalculated", "credit_limit_recalculated"],
        "errors": []
      }
    ]
  }
}
```

### System Management

#### GET /api/admin/system/status

Get system status and health information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "dataStore": {
    "totalUsers": 100,
    "activeUsers": 95,
    "inactiveUsers": 5,
    "totalCreditScores": 100,
    "totalCreditLimits": 100,
    "totalActivityLogs": 1000,
    "expiredLimitsCount": 5
  },
  "recentActivity": {
    "last24Hours": 50,
    "byAction": {
      "user_login": 20,
      "credit_score_calculated": 15,
      "credit_limit_calculated": 15
    }
  },
  "systemHealth": {
    "memoryUsage": {
      "rss": 50000000,
      "heapTotal": 30000000,
      "heapUsed": 20000000,
      "external": 1000000,
      "arrayBuffers": 500000
    },
    "cpuUsage": {
      "user": 1000000,
      "system": 500000
    },
    "nodeVersion": "v18.17.0",
    "platform": "darwin"
  },
  "warnings": [
    "5 credit limits have expired"
  ]
}
```

#### GET /api/admin/activity-logs

Get system activity logs with filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 100) - Number of logs per page
- `userId` (string) - Filter by user ID
- `action` (string) - Filter by action type
- `startDate` (string) - Start date for filtering (ISO format)
- `endDate` (string) - End date for filtering (ISO format)
- `sortOrder` (string, default: 'desc') - Sort order (asc/desc)

**Response:**
```json
{
  "activityLogs": [
    {
      "id": "log-id",
      "userId": "user-id",
      "action": "credit_score_calculated",
      "details": {
        "score": 720,
        "previousScore": 710
      },
      "metadata": {
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1000,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "userId": null,
    "action": null,
    "startDate": null,
    "endDate": null,
    "sortOrder": "desc"
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "error_code",
  "error_description": "Human readable description",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/admin/endpoint",
  "method": "GET"
}
```

### Common Error Codes

- `authentication_required` (401) - Missing or invalid authentication
- `access_denied` (403) - Insufficient permissions
- `user_not_found` (404) - User does not exist
- `validation_error` (400) - Invalid request parameters
- `internal_server_error` (500) - Server error

## Rate Limiting

Admin endpoints are subject to rate limiting:
- Development: 500 requests per 15 minutes
- Production: 50 requests per 15 minutes

## Security Considerations

1. All admin endpoints require OAuth authentication with admin privileges
2. Sensitive data (SSN) is never returned in API responses
3. All admin actions are logged for audit purposes
4. Rate limiting prevents abuse
5. Input validation prevents injection attacks

## Testing

Use the provided test script to verify admin endpoints:

```bash
node test-admin-endpoints.js http://localhost:3002 your-oauth-token
```

Or run the Jest test suite:

```bash
npm test -- --testPathPattern=admin-routes.test.js
```