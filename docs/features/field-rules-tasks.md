# Implementation Plan

- [x] 1. Create Field Rules Service
  - Create `src/services/fieldRulesService.ts` with core interfaces and types
  - Implement `FieldRule`, `FlowFieldRules`, and `FieldRulesService` interfaces
  - Implement `isMockFlow()` helper function to detect mock flows
  - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [x] 1.1 Implement field rules for Authorization Code flows
  - Define rules for `authorization-code-v7` (OAuth variant)
  - Define rules for `oidc-authorization-code-v7` (OIDC variant)
  - Include RFC 6749 Section 4.1 references in comments
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 7.1, 7.3_

- [x] 1.2 Implement field rules for Implicit flows
  - Define rules for `implicit-v7` (OAuth variant)
  - Define rules for `oidc-implicit-v7` (OIDC variant)
  - Include RFC 6749 Section 4.2 references in comments
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 7.1, 7.3_

- [x] 1.3 Implement field rules for Client Credentials flow
  - Define rules for `client-credentials-v7`
  - Hide redirect_uri field with explanation about machine-to-machine flows
  - Include RFC 6749 Section 4.4 references in comments
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4_

- [x] 1.4 Implement field rules for Device Authorization flow
  - Define rules for `device-authorization-v7`
  - Hide redirect_uri field with explanation about device flows
  - Include RFC 8628 references in comments
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.5 Implement field rules for Hybrid flow
  - Define rules for `oidc-hybrid-v7`
  - Support multiple response types (code, token, id_token combinations)
  - Include OIDC Core Section 3.3 references in comments
  - _Requirements: 1.1, 2.1, 4.1, 4.2, 4.3_

- [x] 1.6 Implement field rules for advanced flows
  - Define rules for CIBA (`ciba-v7`)
  - Define rules for Worker Token (`worker-token-v7`)
  - Define rules for ROPC (`ropc-v7`)
  - Include relevant RFC references in comments
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.7 Implement field rules for bearer token flows
  - Define rules for JWT Bearer (`jwt-bearer-v7`)
  - Define rules for SAML Bearer (`saml-bearer-v7`)
  - Hide redirect_uri and response_type fields with explanations
  - Include RFC 7523 and RFC 7522 references in comments
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.8 Implement field rules for mock flows
  - Create generic mock flow rules (all fields optional)
  - Implement mock flow detection logic (check for '-mock' suffix or 'Mock' in name)
  - Add educational explanations for mock flow behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.9 Implement helper methods
  - Implement `getValidResponseTypes()` method
  - Implement `isFieldVisible()` method
  - Add flow type normalization helper
  - _Requirements: 4.1, 4.2, 4.4, 6.3_

- [x] 2. Create UI components for field rules
  - Create `src/components/ReadOnlyField.tsx` component
  - Implement lock icon display with FiLock from react-icons
  - Apply gray background styling for read-only fields
  - Display explanation text below field
  - Add optional spec reference link
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Create HiddenFieldExplanation component
  - Create `src/components/HiddenFieldExplanation.tsx` component
  - Display info icon with field name
  - Show explanation for why field is hidden
  - Add optional spec reference link
  - Style as info panel with blue background
  - _Requirements: 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4_

- [x] 2.2 Add tooltip support to CredentialsInput
  - Add tooltip component or use existing tooltip library
  - Implement hover tooltips for all credential field labels
  - Include field purpose and spec references in tooltips
  - Ensure 300ms hover delay for tooltips
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Update CredentialsInput component
  - Add `fieldRules` prop to CredentialsInput interface
  - Add `showFieldExplanations` prop (default: true)
  - Implement field visibility logic based on rules
  - Implement read-only field rendering based on rules
  - _Requirements: 1.1, 2.1, 2.5_

- [x] 3.1 Implement conditional field rendering
  - Check `fieldRules.visible` for each field before rendering
  - Render HiddenFieldExplanation when field is hidden and showFieldExplanations is true
  - Maintain existing field layout when fields are hidden
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.2 Implement read-only field styling
  - Apply read-only attribute when `fieldRules.editable` is false
  - Add lock icon to field label for read-only fields
  - Apply gray background color (#f9fafb) to read-only inputs
  - Display explanation text below read-only fields
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.3 Implement required field indicators
  - Show red asterisk (*) for required fields based on `fieldRules.required`
  - Update validation to use field rules for required checks
  - Display appropriate error messages for missing required fields
  - _Requirements: 1.1, 2.1_

- [x] 4. Integrate field rules into ComprehensiveCredentialsService
  - Import fieldRulesService into ComprehensiveCredentialsService
  - Add useMemo hook to compute field rules based on flowType and isOIDC
  - Pass field rules to CredentialsInput component
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4.1 Implement OIDC scope enforcement
  - Add useEffect hook to monitor scope changes in OIDC flows
  - Auto-add "openid" scope when missing in OIDC flows
  - Display warning message when user tries to remove "openid"
  - Prevent removal of "openid" scope in OIDC flows
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4.2 Implement response type validation
  - Get valid response types from fieldRulesService
  - Disable response type selector when only one valid option
  - Show explanation for fixed response types
  - Validate selected response type against valid options
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.3 Implement mock flow handling
  - Detect mock flows using fieldRulesService.isMockFlow()
  - Apply mock flow rules (all fields optional)
  - Display educational note about mock flow behavior
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Add comprehensive documentation
  - Document fieldRulesService API with JSDoc comments
  - Create usage examples for each flow type
  - Document how to add new flow types
  - Add inline code comments with RFC references
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.3_

- [x] 5.1 Create user guide for field rules
  - Explain what field rules are and why they exist
  - Provide examples of field rules in action
  - Document how to interpret read-only fields and explanations
  - Add troubleshooting section for common issues
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 6. Implement validation and error handling
  - Create FieldValidationError interface
  - Implement field validation based on rules
  - Display inline error messages for invalid fields
  - Add error summary panel for multiple errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6.1 Add auto-fix functionality
  - Implement auto-fix button for common errors (e.g., missing openid scope)
  - Add confirmation before applying auto-fixes
  - Log auto-fix actions for debugging
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Add remaining flow types
  - Implement rules for PAR flow (`par-v7`)
  - Implement rules for RAR flow (`rar-v7`)
  - Implement rules for Token Exchange (`token-exchange-v7`)
  - Implement rules for DPoP flow (`dpop-v7`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7.1 Implement rules for PingOne-specific flows
  - Implement rules for PingOne MFA flows
  - Implement rules for PingOne PAR flow
  - Implement rules for Redirectless flow
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Testing and validation
  - Verify field rules against OAuth 2.0 specification (RFC 6749)
  - Verify field rules against OIDC Core specification
  - Test all flow types for correct field visibility
  - Test all flow types for correct field editability
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8.1 Test OIDC scope enforcement
  - Test auto-addition of openid scope in OIDC flows
  - Test prevention of openid scope removal
  - Test warning message display
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8.2 Test response type validation
  - Test response type selector for each flow type
  - Test read-only response types
  - Test multiple response type options
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8.3 Test mock flow behavior
  - Test mock flow detection
  - Test optional fields in mock flows
  - Test educational explanations for mock flows
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8.4 Test Client Credentials flow
  - Verify redirect_uri is hidden
  - Verify explanation is displayed
  - Verify spec reference link works
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8.5 Accessibility testing
  - Test screen reader announcements for read-only fields
  - Test keyboard navigation for all interactive elements
  - Verify ARIA labels for field states
  - Test color contrast for read-only styling
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8.6 Cross-browser testing
  - Test in Chrome, Firefox, Safari, and Edge
  - Verify field rules work correctly in all browsers
  - Test responsive behavior on mobile devices
  - _Requirements: 1.1, 2.1, 2.2, 2.3_
