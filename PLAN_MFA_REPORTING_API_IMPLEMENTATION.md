# Plan: Implement PingOne MFA Reporting API Endpoints

## Overview
Implement the four PingOne MFA Reporting API endpoints according to the official documentation:
https://apidocs.pingidentity.com/pingone/mfa/v1/api/#reporting

## Endpoints to Implement

### 1. Create Report of SMS Devices - Entries in Response
- **Endpoint**: `POST /v1/environments/{envID}/reports/smsDevices`
- **Purpose**: Create a report of SMS devices with entries returned directly in the response
- **Response**: Report data with embedded entries

### 2. Get Report Results - Entries in Response
- **Endpoint**: `GET /v1/environments/{envID}/reports/{reportID}`
- **Purpose**: Retrieve report results when entries are in the response
- **Response**: Report data with embedded entries

### 3. Create Report of MFA-Enabled Devices - Results in File
- **Endpoint**: `POST /v1/environments/{envID}/reports/mfaEnabledDevices`
- **Purpose**: Create a report of MFA-enabled devices with results stored in a file
- **Response**: Report job ID and status (requires polling)

### 4. Get Report Results - Results in File - Polling
- **Endpoint**: `GET /v1/environments/{envID}/reports/{reportID}`
- **Purpose**: Poll for report results when stored in a file
- **Response**: Report status and download link when ready

## Implementation Plan

### Phase 1: Backend Endpoints (server.js)
1. Add `/api/pingone/mfa/reports/create-sms-devices-report` endpoint
2. Add `/api/pingone/mfa/reports/get-report-results` endpoint
3. Add `/api/pingone/mfa/reports/create-mfa-enabled-devices-report` endpoint
4. Add polling support for file-based reports

### Phase 2: Frontend Service (mfaReportingServiceV8.ts)
1. Add `createSMSDevicesReport()` method
2. Add `getReportResults()` method
3. Add `createMFAEnabledDevicesReport()` method
4. Add `pollReportResults()` method for file-based reports

### Phase 3: UI Integration (MFAReportingFlowV8.tsx)
1. Add UI for creating SMS devices report
2. Add UI for creating MFA-enabled devices report
3. Add polling UI for file-based reports
4. Add download functionality for completed reports

## Error Handling
- Handle 403 Forbidden errors with proper scope requirements
- Handle report job status (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- Handle timeout scenarios for long-running reports

## Testing Considerations
- Test with valid worker tokens
- Test with insufficient permissions (403 errors)
- Test polling mechanism for file-based reports
- Test report download functionality

