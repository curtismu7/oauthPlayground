# Requirements Document: Foolproof Credential Storage System

## Introduction

The current credential storage system has ongoing issues with credential conflicts where credentials from one flow (e.g., Worker Token) appear in another flow (e.g., Implicit). This creates confusion and breaks the user experience. We need a foolproof system that:

1. Keeps credentials in browser storage for quick retrieval
2. Persists credentials to local file storage for retrieval across hard restarts
3. Never conflicts between different flows
4. Treats Worker Token credentials as a special shared resource since they're used heavily across the app

## Glossary

- **Flow-Specific Credentials**: Credentials that belong to a specific OAuth/OIDC flow (e.g., Implicit, Authorization Code, Device Flow)
- **Worker Token Credentials**: Special credentials used for PingOne Worker App (Client Credentials grant) that are shared across the entire application
- **Worker Access Token**: The actual access token obtained from the Worker Token flow, shared across all features that need it
- **Browser Storage**: sessionStorage and localStorage in the browser
- **Local File Storage**: File-based persistence on the user's local machine
- **Credential Bleeding**: When credentials from one flow incorrectly appear in another flow
- **Credential Manager**: The global credential storage system that currently causes conflicts
- **Flow Key**: Unique identifier for each flow type (e.g., "oauth-implicit-v7", "worker-token-v7")

## Requirements

### Requirement 1: Flow-Specific Credential Isolation

**User Story:** As a developer testing multiple OAuth flows, I want each flow to maintain its own separate credentials, so that switching between flows doesn't cause credential conflicts.

#### Acceptance Criteria

1. WHEN a user saves credentials in Flow A, THE System SHALL store those credentials with a unique flow-specific key
2. WHEN a user navigates to Flow B, THE System SHALL NOT load credentials from Flow A
3. WHEN a user returns to Flow A, THE System SHALL load only Flow A's credentials
4. THE System SHALL use a storage key pattern: `flow_credentials_{flowKey}` for each flow
5. WHERE a flow has never been configured, THE System SHALL show empty credential fields (no fallback to other flows)

### Requirement 2: Worker Token as Shared Resource

**User Story:** As a developer, I want Worker Token credentials AND the access token to be available across all flows that need them, so that I don't have to re-enter credentials or re-fetch tokens for every feature that uses the Worker App.

#### Acceptance Criteria

1. WHEN a user saves Worker Token credentials, THE System SHALL store them in a dedicated shared location: `worker_token_credentials`
2. WHEN a Worker Token is successfully obtained, THE System SHALL store it in a dedicated shared location: `worker_access_token`
3. WHEN any flow needs Worker Token credentials, THE System SHALL load from the shared Worker Token storage
4. WHEN any flow needs a Worker Access Token, THE System SHALL load from the shared token storage
5. THE System SHALL check if the stored Worker Access Token is expired before using it
6. WHERE the Worker Access Token is expired or missing, THE System SHALL automatically fetch a new one using stored credentials
7. THE System SHALL NOT mix Worker Token credentials with flow-specific OAuth credentials
8. WHERE Worker Token credentials are updated, THE System SHALL invalidate the old access token and notify all active flows
9. THE System SHALL treat Worker Token credentials as read-only for flows that consume them
10. THE System SHALL provide a "Refresh Worker Token" button to manually fetch a new access token

### Requirement 3: Dual Storage Strategy (Browser + File)

**User Story:** As a developer, I want my credentials to persist across browser sessions and hard restarts, so that I don't lose my configuration when I close the browser or restart my computer.

#### Acceptance Criteria

1. WHEN credentials are saved, THE System SHALL write to both browser localStorage AND local file storage
2. WHEN the application starts, THE System SHALL load credentials from local file storage if browser storage is empty
3. THE System SHALL use file path: `~/.pingone-playground/credentials/{flowKey}.json` for each flow
4. THE System SHALL use file path: `~/.pingone-playground/credentials/worker-token-credentials.json` for Worker Token credentials
5. THE System SHALL use file path: `~/.pingone-playground/credentials/worker-access-token.json` for Worker Access Token
6. WHERE file storage fails, THE System SHALL fall back to browser storage only and log a warning
7. THE System SHALL store token expiration time with the Worker Access Token for validation

### Requirement 4: Explicit Load Strategy (No Auto-Fallback)

**User Story:** As a developer, I want to explicitly see which credentials belong to which flow, so that I'm never confused about where credentials came from.

#### Acceptance Criteria

1. WHEN a flow loads, THE System SHALL ONLY attempt to load that flow's specific credentials
2. THE System SHALL NOT fall back to "global" or "shared" credentials (except for Worker Token)
3. WHERE no credentials exist for a flow, THE System SHALL show empty fields with a clear message
4. THE System SHALL provide a "Copy from Configuration" button to explicitly copy credentials if desired
5. THE System SHALL log all credential load attempts with clear source information

### Requirement 5: Worker Token Discovery and Validation

**User Story:** As a developer, I want the system to validate Worker Token credentials and help me discover the correct configuration, so that I can quickly set up the Worker App.

#### Acceptance Criteria

1. WHEN Worker Token credentials are entered, THE System SHALL validate the environment ID format (UUID)
2. WHEN Worker Token credentials are saved, THE System SHALL test them by attempting to get a token
3. WHERE Worker Token credentials are invalid, THE System SHALL show specific error messages
4. THE System SHALL provide a "Test Connection" button for Worker Token credentials
5. THE System SHALL store the last successful token fetch timestamp with the Worker Access Token
6. WHEN a Worker Access Token is fetched, THE System SHALL calculate and store the expiration timestamp
7. THE System SHALL provide a visual indicator showing Worker Token status (valid, expired, missing)
8. WHERE a Worker Access Token is about to expire (< 5 minutes), THE System SHALL show a warning and offer to refresh

### Requirement 6: Worker Token Lifecycle Management

**User Story:** As a developer using multiple features that need Worker Tokens, I want the system to automatically manage token lifecycle (fetch, refresh, expire), so that I always have a valid token without manual intervention.

#### Acceptance Criteria

1. WHEN the application starts, THE System SHALL check if a valid Worker Access Token exists in storage
2. WHERE no Worker Access Token exists but credentials are stored, THE System SHALL automatically fetch a new token
3. WHERE a Worker Access Token is expired, THE System SHALL automatically fetch a new token before using it
4. THE System SHALL cache the Worker Access Token in memory for the current session
5. WHEN any component requests a Worker Access Token, THE System SHALL return the cached token if valid
6. WHERE token fetch fails, THE System SHALL retry up to 3 times with exponential backoff
7. THE System SHALL broadcast token refresh events to all active tabs/components
8. WHERE Worker Token credentials change, THE System SHALL invalidate all cached tokens
9. THE System SHALL provide a `getWorkerToken()` method that always returns a valid token or throws an error
10. THE System SHALL log all token lifecycle events (fetch, refresh, expire, invalidate) for debugging

### Requirement 7: Credential Storage Audit Trail

**User Story:** As a developer debugging credential issues, I want to see exactly where credentials are being loaded from and saved to, so that I can understand and fix any conflicts.

#### Acceptance Criteria

1. WHEN credentials are loaded, THE System SHALL log the source (browser storage, file storage, or none)
2. WHEN credentials are saved, THE System SHALL log both storage locations (browser and file)
3. THE System SHALL provide a debug panel showing all stored credentials by flow
4. THE System SHALL show timestamps for when each credential set was last updated
5. WHERE credential conflicts are detected, THE System SHALL show a warning with resolution options

### Requirement 7: Migration from Old System

**User Story:** As an existing user, I want my current credentials to be migrated to the new system automatically, so that I don't lose my configuration.

#### Acceptance Criteria

1. WHEN the application starts with the new system, THE System SHALL detect old credential storage
2. THE System SHALL migrate old credentials to flow-specific storage based on heuristics
3. WHERE migration is ambiguous, THE System SHALL prompt the user to assign credentials to flows
4. THE System SHALL backup old credentials before migration
5. THE System SHALL provide a "Restore from Backup" option if migration fails

### Requirement 8: Clear Credential Management UI

**User Story:** As a developer, I want a clear UI to manage credentials across all flows, so that I can see and control all my stored credentials in one place.

#### Acceptance Criteria

1. THE System SHALL provide a "Manage Credentials" page showing all flows and their credentials
2. WHEN viewing the management page, THE System SHALL show which flows have credentials configured
3. THE System SHALL allow exporting all credentials to a JSON file
4. THE System SHALL allow importing credentials from a JSON file
5. THE System SHALL provide a "Clear All Credentials" button with confirmation dialog

### Requirement 9: Credential Sync Across Tabs

**User Story:** As a developer with multiple tabs open, I want credential changes in one tab to be reflected in other tabs, so that all tabs stay in sync.

#### Acceptance Criteria

1. WHEN credentials are saved in Tab A, THE System SHALL broadcast the change to all other tabs
2. WHEN Tab B receives a credential change event, THE System SHALL reload credentials for that flow
3. THE System SHALL use browser storage events for cross-tab communication
4. WHERE a tab has unsaved changes, THE System SHALL prompt before overwriting with synced credentials
5. THE System SHALL debounce sync events to prevent excessive reloads

### Requirement 10: Credential Security

**User Story:** As a security-conscious developer, I want my credentials to be stored securely, so that they're not easily accessible to malicious scripts or other applications.

#### Acceptance Criteria

1. THE System SHALL encrypt client secrets before storing in browser storage
2. THE System SHALL use file permissions (0600) for credential files on disk
3. THE System SHALL NOT log full client secrets in console (only first/last 4 characters)
4. WHERE credentials are exported, THE System SHALL warn about security implications
5. THE System SHALL provide an option to use environment variables instead of stored credentials

## Non-Functional Requirements

### Performance
- Credential load operations SHALL complete in < 100ms
- File storage operations SHALL not block the UI thread
- Cross-tab sync SHALL propagate within 500ms

### Reliability
- The system SHALL handle storage quota exceeded errors gracefully
- The system SHALL recover from corrupted credential files
- The system SHALL maintain data integrity during concurrent writes

### Usability
- Error messages SHALL be clear and actionable
- The UI SHALL indicate when credentials are loading
- The system SHALL provide helpful tooltips and documentation links

## Success Criteria

1. Zero credential bleeding incidents between flows
2. Worker Token credentials accessible from all flows that need them
3. Credentials persist across browser restarts and hard reboots
4. Clear audit trail for all credential operations
5. Successful migration of existing users without data loss
