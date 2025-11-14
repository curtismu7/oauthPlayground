# Implementation Plan

- [x] 1. Create WorkerTokenEducationalPanel component
  - Create new component file with TypeScript interface
  - Implement overview section explaining worker tokens and Client Credentials flow
  - Implement authorization model section (PingOne Roles vs OAuth Scopes)
  - Implement token types section (what's included/excluded)
  - Implement use cases section (appropriate vs inappropriate uses)
  - Add styled-components with gradient background and responsive layout
  - Add icons for visual hierarchy
  - Export component for use in WorkerTokenFlowV7
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2. Add showScopes prop to CredentialsInput component
  - Add `showScopes?: boolean` to CredentialsInputProps interface
  - Add `flowType?: string` to CredentialsInputProps interface for flow detection
  - Implement useMemo hook to determine if scopes should be shown based on flowType
  - Wrap scopes input field in conditional rendering based on shouldShowScopes
  - Ensure backward compatibility (show scopes by default if prop not provided)
  - _Requirements: 4.1_

- [x] 3. Update ComprehensiveCredentialsService to pass showScopes prop
  - Add useMemo hook to determine if scopes should be shown for worker-token flows
  - Pass `showScopes={false}` to CredentialsInput for worker-token and client-credentials flows
  - Pass `flowType` prop to CredentialsInput
  - Verify response type already hidden via existing getFlowResponseTypes logic
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 4. Implement automatic scope configuration in WorkerTokenFlowV7
  - Initialize credentials state with scopes set to 'pi:read:user'
  - Add useEffect hook to enforce scopes on mount and credential changes
  - Add useEffect hook to override saved credentials with 'pi:read:user' scope
  - Add validation function to check and enforce correct scope value
  - Add toast notification when scopes are automatically overridden
  - Update ComprehensiveCredentialsService props to pass enforced scopes
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 5. Integrate WorkerTokenEducationalPanel into WorkerTokenFlowV7
  - Import WorkerTokenEducationalPanel component
  - Add educational panel to Step 0 (renderStep0) before ComprehensiveCredentialsService
  - Configure panel with all sections enabled (variant="full")
  - Add appropriate spacing and layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.2_

- [x] 6. Update WorkerTokenFlowV7 page header and descriptions
  - Update FlowHeader title to include "Client Credentials" reference
  - Update FlowHeader description to mention OAuth 2.0 Client Credentials grant
  - Update step helper text to clarify PingOne Management API purpose
  - Ensure consistent terminology throughout the component
  - _Requirements: 5.1, 5.2, 7.1_

- [x] 7. Verify response type field is hidden
  - Test that response type field does not appear in WorkerTokenFlowV7
  - Verify getFlowResponseTypes returns empty array for client-credentials
  - Confirm no response_type parameter sent to token endpoint
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Add error handling and validation
  - Implement validateAndEnforceScope function with console warnings
  - Add try-catch blocks around scope enforcement logic
  - Add graceful fallbacks for undefined flowType in CredentialsInput
  - Add user-friendly error messages via toast notifications
  - _Requirements: 4.3, 4.4_

- [x] 9. Test implementation
  - Verify educational panel renders correctly in Step 0
  - Verify scopes field is hidden in worker token flow
  - Verify response type field is hidden in worker token flow
  - Verify scopes automatically set to 'pi:read:user' on mount
  - Verify saved credentials are overridden with correct scope
  - Verify token request includes 'pi:read:user' scope
  - Test navigation to other flows to ensure scopes field still visible
  - Test responsive design on mobile/tablet
  - _Requirements: All_

- [x] 10. Documentation and cleanup
  - Add code comments explaining scope enforcement logic
  - Add JSDoc comments to WorkerTokenEducationalPanel component
  - Update any inline documentation in WorkerTokenFlowV7
  - Remove any debug console.log statements (keep warnings)
  - _Requirements: All_
