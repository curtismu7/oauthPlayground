# Requirements Document

## Introduction

This feature enhances the API call display component to clearly distinguish between real PingOne API calls and frontend/internal calls. Users need to understand what requests are being made to PingOne's servers versus what operations are happening client-side or through internal proxies.

## Glossary

- **PingOne API Call**: An HTTP request sent directly to PingOne's authentication/authorization servers (e.g., auth.pingone.com, api.pingone.com)
- **Frontend Call**: A client-side operation or JavaScript function execution that doesn't involve network requests
- **Internal Call**: An HTTP request to the application's own backend/proxy endpoints
- **API Call Display Component**: The React component that shows API call details to users
- **Call Type Badge**: A visual indicator showing whether a call is PingOne, Frontend, or Internal

## Requirements

### Requirement 1: Color-Coded Visual Call Type Identification

**User Story:** As a developer learning OAuth flows, I want to immediately see whether an API call is going to PingOne or is a frontend operation through color-coded table rows, so that I can quickly scan and understand what's actually happening in the authentication flow.

#### Acceptance Criteria

1. WHEN the API Call Display Component renders, THE System SHALL color-code the entire row background based on call type
2. WHEN the call type is "PingOne Backend", THE System SHALL use a yellow/amber background color (#fef3c7) with amber border (#f59e0b) for the entire row
3. WHEN the call type is "Frontend Client-Side", THE System SHALL use a blue background color (#dbeafe) with blue border (#3b82f6) for the entire row
4. WHEN the call type is "Internal Proxy", THE System SHALL use a purple background color (#e0e7ff) with purple border (#8b5cf6) for the entire row
5. THE System SHALL display a prominent badge in the row header indicating the call type with matching colors
6. WHERE the call is a PingOne API call, THE System SHALL display the actual PingOne endpoint URL prominently with a "🌐 PingOne API" icon
7. WHERE the call is a Frontend operation, THE System SHALL display "💻 Client-Side" icon
8. WHERE the call is an Internal call, THE System SHALL display "🔄 Internal Proxy" icon

### Requirement 2: Call Type Metadata

**User Story:** As a developer, I want to see clear metadata about each API call type, so that I understand the purpose and destination of each request.

#### Acceptance Criteria

1. WHEN displaying a PingOne API call, THE System SHALL show the actual PingOne domain (auth.pingone.com or api.pingone.com)
2. WHEN displaying a Frontend call, THE System SHALL indicate it's a client-side operation with no network request
3. WHEN displaying an Internal call, THE System SHALL show the internal endpoint path
4. WHERE a call has a proxy URL, THE System SHALL display both the proxy URL and the actual PingOne URL
5. THE System SHALL include a description explaining what each call type means

### Requirement 3: Enhanced PingOne Call Section

**User Story:** As a developer, I want detailed information about real PingOne API calls, so that I can replicate them in my own applications.

#### Acceptance Criteria

1. WHEN a PingOne API call is displayed, THE System SHALL show a dedicated "Real PingOne API Request" section
2. THE System SHALL display the complete HTTP method and URL for PingOne calls
3. THE System SHALL show all HTTP headers being sent to PingOne
4. THE System SHALL display the request body in formatted JSON
5. THE System SHALL provide working code examples in JavaScript, cURL, and Postman format
6. THE System SHALL include links to official PingOne API documentation
7. THE System SHALL highlight that this is the actual request sent to PingOne servers

### Requirement 4: Frontend Call Visualization

**User Story:** As a developer, I want to see what client-side operations are happening, so that I understand the complete flow including non-network operations.

#### Acceptance Criteria

1. WHEN a Frontend call is displayed, THE System SHALL clearly indicate no network request is made
2. THE System SHALL show the operation name or function being executed
3. THE System SHALL display any input parameters or configuration
4. THE System SHALL show the output or result of the operation
5. WHERE applicable, THE System SHALL provide JavaScript code examples showing how to perform the operation

### Requirement 5: API Call Type Detection and Classification

**User Story:** As a developer, I want the system to automatically detect and classify API calls as PingOne, Frontend, or Internal, so that I don't have to manually categorize them.

#### Acceptance Criteria

1. WHEN an API call URL contains "auth.pingone.com" or "api.pingone.com", THE System SHALL classify it as "PingOne Backend"
2. WHEN an API call has method "LOCAL" or no URL, THE System SHALL classify it as "Frontend Client-Side"
3. WHEN an API call URL points to the application's own domain, THE System SHALL classify it as "Internal Proxy"
4. THE System SHALL expose a callType property on the ApiCall interface with values: "pingone" | "frontend" | "internal"
5. WHERE a call type cannot be determined, THE System SHALL default to "internal" classification

### Requirement 6: Table-Based Call Display with Color Coding

**User Story:** As a developer reviewing multiple API calls in a table format, I want each row to be color-coded by call type, so that I can instantly identify frontend versus backend calls at a glance.

#### Acceptance Criteria

1. WHEN multiple API calls are displayed in a table, THE System SHALL apply consistent background colors to each row based on call type
2. WHEN a user scans the table, THE System SHALL make call types immediately distinguishable through color without reading text
3. THE System SHALL maintain sufficient contrast between text and background colors for accessibility (WCAG AA compliance)
4. WHERE a flow has both PingOne and Frontend calls, THE System SHALL alternate row colors based on actual call type
5. THE System SHALL display a legend explaining the color coding (Yellow = PingOne Backend, Blue = Frontend, Purple = Internal)
6. THE System SHALL use consistent color schemes across all sections of each row (header, content, code blocks)
7. WHEN a row is expanded or collapsed, THE System SHALL maintain the color coding throughout all nested content
