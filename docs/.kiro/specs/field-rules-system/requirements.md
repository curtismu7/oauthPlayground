# Requirements Document

## Introduction

The Field Rules System provides specification-compliant field visibility, editability, and validation for OAuth 2.0 and OIDC flows in the OAuth Playground application. The system ensures that users can only configure fields that are valid for their selected flow type, with clear explanations for any restrictions based on RFC specifications.

## Glossary

- **Field Rules System**: The centralized service and UI components that determine which credential fields are visible, editable, and required for each OAuth/OIDC flow type
- **OAuth Playground**: The educational web application for learning OAuth 2.0 and OIDC protocols
- **Flow Type**: A specific OAuth 2.0 or OIDC authentication/authorization pattern (e.g., Authorization Code, Client Credentials, Implicit)
- **Credential Field**: An input field for OAuth/OIDC configuration parameters (e.g., client_id, redirect_uri, scope)
- **Read-Only Field**: A field that displays a value but cannot be edited by the user
- **Hidden Field**: A field that is not displayed because it is not applicable to the current flow type
- **Field Rule**: A configuration object that defines visibility, editability, required status, and valid values for a credential field
- **OIDC Flow**: An OpenID Connect flow that extends OAuth 2.0 with identity features
- **OAuth Flow**: A pure OAuth 2.0 flow for authorization without identity features
- **RFC**: Request for Comments - the official specification documents for OAuth 2.0 and OIDC protocols

## Requirements

### Requirement 1

**User Story:** As a developer learning OAuth 2.0, I want to see only the credential fields that are relevant to my selected flow type, so that I am not confused by irrelevant configuration options.

#### Acceptance Criteria

1. WHEN a user selects a flow type, THE Field Rules System SHALL display only the credential fields that are applicable to that flow type according to the relevant RFC specification
2. WHEN a credential field is not applicable to the selected flow type, THE Field Rules System SHALL hide that field from the user interface
3. WHEN a credential field is hidden, THE Field Rules System SHALL provide an explanation panel stating why the field is not applicable to the current flow type
4. WHERE a hidden field explanation is displayed, THE Field Rules System SHALL include a reference to the relevant RFC specification section

### Requirement 2

**User Story:** As a developer learning OIDC, I want fields that must have specific values to be read-only with explanations, so that I understand the specification requirements without making configuration errors.

#### Acceptance Criteria

1. WHEN a credential field must have a specific value according to the specification, THE Field Rules System SHALL render that field as read-only
2. WHEN a field is rendered as read-only, THE Field Rules System SHALL display a lock icon next to the field label
3. WHEN a field is rendered as read-only, THE Field Rules System SHALL display an explanation below the field stating why the value is fixed
4. WHEN a field is rendered as read-only, THE Field Rules System SHALL apply distinct visual styling (gray background) to differentiate it from editable fields
5. THE Field Rules System SHALL ensure read-only fields cannot be modified through user interaction

### Requirement 3

**User Story:** As a developer implementing OIDC flows, I want the system to automatically enforce OIDC-specific requirements like the openid scope, so that my configuration is always specification-compliant.

#### Acceptance Criteria

1. WHEN a user selects an OIDC flow variant, THE Field Rules System SHALL automatically include "openid" in the scope field value
2. WHEN a user attempts to remove "openid" from the scope field in an OIDC flow, THE Field Rules System SHALL display a warning message explaining that "openid" is required for OIDC flows
3. WHEN a user attempts to remove "openid" from the scope field in an OIDC flow, THE Field Rules System SHALL prevent the removal and restore "openid" to the scope value
4. WHERE an OIDC flow requires the "openid" scope, THE Field Rules System SHALL include a reference to the OIDC Core specification section 3.1.2.1

### Requirement 4

**User Story:** As a developer learning different OAuth flows, I want to understand which response types are valid for my selected flow, so that I can configure the flow correctly according to the specification.

#### Acceptance Criteria

1. WHEN a flow type supports multiple response types, THE Field Rules System SHALL display a response type selector with all valid options
2. WHEN a flow type supports only one response type, THE Field Rules System SHALL display the response type as a read-only field with the fixed value
3. WHEN a response type is fixed for a flow, THE Field Rules System SHALL display an explanation stating that the response type is defined by the OAuth 2.0 specification
4. THE Field Rules System SHALL prevent users from selecting invalid response types for the current flow type

### Requirement 5

**User Story:** As a developer using the OAuth Playground, I want helpful tooltips on credential fields, so that I can understand what each field does and how it relates to the OAuth specification.

#### Acceptance Criteria

1. WHEN a user hovers over a credential field label, THE Field Rules System SHALL display a tooltip explaining the purpose of that field
2. WHERE applicable, THE Field Rules System SHALL include a reference to the relevant RFC specification section in the tooltip
3. THE Field Rules System SHALL display tooltips within 300 milliseconds of hover interaction
4. THE Field Rules System SHALL dismiss tooltips when the user moves the cursor away from the field label

### Requirement 6

**User Story:** As a maintainer of the OAuth Playground, I want field rules to be centralized in a single service, so that I can easily update rules when specifications change or new flows are added.

#### Acceptance Criteria

1. THE Field Rules System SHALL implement a centralized service that defines all field rules for all flow types
2. THE Field Rules System SHALL provide a consistent interface for querying field rules based on flow type and OIDC variant
3. WHEN a new flow type is added to the application, THE Field Rules System SHALL allow field rules to be defined without modifying UI components
4. THE Field Rules System SHALL document each field rule with a reference to the relevant RFC specification section

### Requirement 7

**User Story:** As a developer testing OAuth flows, I want the field rules to be validated against the actual OAuth 2.0 and OIDC specifications, so that I can trust the educational content is accurate.

#### Acceptance Criteria

1. THE Field Rules System SHALL implement field rules that match the requirements defined in RFC 6749 (OAuth 2.0)
2. THE Field Rules System SHALL implement field rules that match the requirements defined in OpenID Connect Core 1.0 specification
3. WHERE a field rule is based on a specification requirement, THE Field Rules System SHALL include a comment in the code referencing the specific RFC section
4. THE Field Rules System SHALL provide unit tests that verify field rules against specification requirements

### Requirement 8

**User Story:** As a developer learning Client Credentials flow, I want to understand why redirect_uri is not needed, so that I can understand the differences between machine-to-machine and user-facing flows.

#### Acceptance Criteria

1. WHEN a user selects Client Credentials flow, THE Field Rules System SHALL hide the redirect_uri field
2. WHEN the redirect_uri field is hidden in Client Credentials flow, THE Field Rules System SHALL display an explanation stating that Client Credentials is a machine-to-machine flow that does not use browser redirects
3. WHEN the redirect_uri field is hidden in Client Credentials flow, THE Field Rules System SHALL include a reference to RFC 6749 Section 4.4
4. THE Field Rules System SHALL apply this pattern consistently for all fields that are not applicable to specific flow types
