# PingOne Audit Activities - Feature Summary

## Overview
The PingOne Audit Activities page provides comprehensive access to all audit activity endpoints from the PingOne Platform API.

## API Endpoints Supported

### 1. **READ all activities** (GET /environments/{environmentId}/activities)
- ✅ Retrieves a paginated list of audit activities
- ✅ Supports filtering by multiple criteria
- ✅ Ordered by newest first (createdAt DESC)
- ✅ Configurable limit (10, 25, 50, 100, 500, 1000)

### 2. **READ one activity** (GET /environments/{environmentId}/activities/{activityId})
- ✅ Retrieves a single audit activity by its unique ID
- ✅ Returns detailed information about the specific activity
- ✅ Useful for deep-diving into specific audit events

## Filter Capabilities

### Supported Filters (OData syntax)
1. **Action Type** - Filter by the type of action performed
   - Examples: USER.CREATED, USER.UPDATED, SESSION.CREATED, TOKEN.CREATED, etc.
   
2. **Result Status** - Filter by success or failure
   - Options: success, failure
   
3. **Actor Filtering** - Filter by who performed the action
   - **Actor Type Selector**: Choose between User or Client (Application)
   - **User**: Only supports ID (UUID)
   - **Client**: Only supports ID (UUID)
   - Filters by: 
     - `actors.user.id eq "..."`
     - `actors.client.id eq "..."`
   - Note: Username and email filtering are NOT supported by the PingOne API
   
4. **Resource ID** - Filter by the resource that was affected
   - Uses array filter syntax: `resources[id eq "..."]`
   
5. **Correlation ID** - Track related activities
   - Filter: `correlationId eq "..."`

### API Limitations Discovered
- ⚠️ Time-based filtering (createdAt gt) is **not supported** by the PingOne API
- ⚠️ `actors.system.id` filtering is **not supported** by the PingOne API
- ⚠️ `actors.user.username` filtering is **not supported** by the PingOne API
- ⚠️ `actors.user.email` filtering is **not supported** by the PingOne API
- ⚠️ OR operator for actors is **not supported** - must filter by one actor type at a time
- ✅ Only `actors.user.id` and `actors.client.id` are supported for actor filtering
- Results are always ordered by newest first (createdAt DESC)

## Features

### Authentication
- Uses Worker Token with `p1:read:audit` scope
- Integrated with Worker Token Modal
- Supports all PingOne regions (US, EU, CA, AP/Asia)

### View Modes
1. **List Mode** - Query multiple activities with filters
2. **Single Mode** - Retrieve a specific activity by ID

### Data Display
- **Summary Statistics**
  - Total activities
  - Success count
  - Failure count
  - Unique action types
  - Unique users
  - Total count from API

- **Activity Cards** - Clickable cards showing:
  - Action type and description
  - Result status (success/failure)
  - Actor information (user, client, system)
  - Resource count
  - IP address
  - Timestamp

- **Detail Modal** - Full activity details including:
  - Basic information (ID, action type, created at)
  - Result information (status, description, errors)
  - Actors (user, client, system)
  - Resources (type, name, ID)
  - Request context (IP, user agent, correlation ID)
  - Environment & organization
  - Target information
  - Complete JSON with copy functionality

### API Integration
- Educational modal before each API call
- API call tracking and display
- Full request/response visibility
- Error handling with helpful messages
- Permission error detection (403)

## Required Permissions
- Worker App must have `p1:read:audit` scope

## Common Use Cases

1. **Security Monitoring** - Track failed authentication attempts
   - Filter: Action Type = "AUTHENTICATION.FAILURE"

2. **User Activity Tracking** - Monitor user actions
   - Filter: Actor ID = specific user ID

3. **Application Changes** - Track application modifications
   - Filter: Action Type = "APPLICATION.UPDATED"

4. **Token Management** - Monitor token creation and revocation
   - Filter: Action Type = "TOKEN.CREATED" or "TOKEN.REVOKED"

5. **Correlation Tracking** - Follow a transaction across multiple activities
   - Filter: Correlation ID = specific correlation ID

6. **Deep Dive** - Investigate a specific activity
   - Mode: Single Activity by ID

## API Reference
Based on: https://apidocs.pingidentity.com/pingone/platform/v1/api/#audit-activities
