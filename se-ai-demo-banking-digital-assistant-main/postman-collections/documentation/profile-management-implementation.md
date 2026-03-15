# User Profile Management Implementation

## Overview

This document describes the implementation of user profile management endpoints in the Banking API End User Postman collection. The profile management functionality allows end users to retrieve and update their own profile information while ensuring proper authorization and access control.

## Implemented Endpoints

### 1. Get My Profile
- **Endpoint**: `GET /api/auth/me`
- **Purpose**: Retrieve current user's profile information
- **Scopes Required**: `profile` (included in OAuth flow)
- **Authorization**: Bearer token from OAuth authentication

#### Features:
- Retrieves complete user profile without sensitive data
- Validates profile scope in OAuth token
- Stores user data in environment variables for subsequent tests
- Comprehensive response validation

#### Test Validations:
- Response status is 200
- Response contains user object with required fields
- No sensitive data (passwords) in response
- User role is appropriate for end user (customer/user)
- Profile scope validation passed

### 2. Update My Profile
- **Endpoint**: `PUT /api/users/{userId}`
- **Purpose**: Update current user's profile information
- **Scopes Required**: `banking:write`
- **Authorization**: Bearer token + ownership validation

#### Features:
- Updates user profile fields (firstName, lastName, email)
- Prevents role escalation (users cannot change their role to admin)
- Validates email uniqueness
- Dynamic test data generation with timestamps

#### Test Validations:
- Response status is 200
- Success message in response
- Updated user data reflects changes
- User cannot change role to admin
- Banking write scope validation passed

## Negative Testing Implementation

The collection includes comprehensive negative tests to verify proper authorization and access control:

### Admin Endpoint Access Tests

#### 1. Try Access Admin Stats (Should Fail)
- **Endpoint**: `GET /api/admin/stats`
- **Expected Result**: 403 Forbidden
- **Validates**: End users cannot access admin statistics

#### 2. Try Access Admin Activity Logs (Should Fail)
- **Endpoint**: `GET /api/admin/activity`
- **Expected Result**: 403 Forbidden
- **Validates**: End users cannot access system activity logs

#### 3. Try Access All Users List (Should Fail)
- **Endpoint**: `GET /api/users`
- **Expected Result**: 403 Forbidden
- **Validates**: End users cannot list all system users

### User Data Access Tests

#### 4. Try Access Other User Profile (Should Fail)
- **Endpoint**: `GET /api/users/{otherUserId}`
- **Expected Result**: 403 Forbidden or 404 Not Found
- **Validates**: Users cannot access other users' profiles

#### 5. Try Create User (Should Fail)
- **Endpoint**: `POST /api/users`
- **Expected Result**: 403 Forbidden
- **Validates**: End users cannot create new users

#### 6. Try Delete Activity Logs (Should Fail)
- **Endpoint**: `DELETE /api/admin/activity/clear`
- **Expected Result**: 403 Forbidden
- **Validates**: End users cannot perform admin operations

## Security Considerations

### Scope Validation
- Profile endpoints require appropriate OAuth scopes
- Write operations require `banking:write` scope
- Admin operations require `banking:admin` scope (which end users don't have)

### Data Protection
- Passwords are never returned in API responses
- Users can only access their own data
- Role escalation is prevented
- Sensitive admin data is not leaked in error responses

### Access Control
- Ownership validation ensures users can only modify their own profiles
- Admin role checks prevent unauthorized administrative actions
- Proper HTTP status codes for different error scenarios

## Environment Variables

The profile management tests use and set the following environment variables:

### Set by Tests:
- `current_user_id`: Current user's ID for subsequent requests
- `current_username`: Current user's username
- `current_user_email`: Current user's email
- `updated_email`: Updated email for profile update tests
- `other_user_id`: Fake user ID for negative testing

### Required from Environment:
- `access_token`: OAuth access token
- `base_url`: API base URL

## Test Execution Order

1. **Authentication**: Run OAuth Login Flow first
2. **Profile Retrieval**: Get My Profile to populate user data
3. **Profile Update**: Update My Profile to test write operations
4. **Negative Tests**: Run all negative tests to verify access control

## Error Handling

### Expected Error Responses:
- **403 Forbidden**: Insufficient permissions/scopes
- **404 Not Found**: Resource not found or access denied
- **400 Bad Request**: Validation errors

### Error Response Validation:
- Proper error structure with `error` field
- Appropriate error messages
- No sensitive data in error responses
- Acceptable response times

## Integration with Collection

The profile management functionality integrates seamlessly with the existing collection:

- Uses the same OAuth authentication flow
- Leverages existing environment variables
- Follows the same testing patterns
- Maintains consistent error handling

## Usage Examples

### Running Profile Tests:
1. Execute OAuth Login Flow
2. Run "Get My Profile" to retrieve user information
3. Run "Update My Profile" to test profile updates
4. Execute negative tests to verify access control

### Collection Runner:
The profile management tests are designed to work with Postman's Collection Runner for automated testing scenarios.

## Compliance and Standards

- Follows OAuth 2.0 best practices
- Implements proper scope-based authorization
- Adheres to RESTful API design principles
- Includes comprehensive test coverage
- Maintains security best practices