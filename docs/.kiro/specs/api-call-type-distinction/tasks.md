# Implementation Plan: API Call Type Distinction with Color Coding

## Task List

- [x] 1. Create API Call Type Detection Utility
  - Create new utility file for call type detection
  - Implement URL pattern matching for PingOne domains
  - Implement method-based detection for frontend operations
  - Add color theme mapping function
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Update API Call Interfaces and Services
  - [x] 2.1 Update ApiCall interface with callType property
    - Add callType field to ApiCall interface
    - Update EnhancedApiCallData interface
    - Export ApiCallType type definition
    - _Requirements: 5.4_
  
  - [x] 2.2 Enhance API Call Tracker Service
    - Import call type detector utility
    - Auto-detect call type when tracking new calls
    - Store callType with each API call
    - Update existing trackApiCall method
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Create Color Legend Component
  - Create new ApiCallColorLegend component file
  - Implement styled components for legend layout
  - Add icons and descriptions for each call type
  - Apply color themes to legend items
  - Export component for use in pages
  - _Requirements: 6.5_

- [x] 4. Enhance API Call Display Component
  - [x] 4.1 Update Container styling with call type colors
    - Add $callType prop to Container styled component
    - Apply background color based on call type
    - Apply border color based on call type
    - Ensure proper color contrast
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.3_
  
  - [x] 4.2 Create and add Call Type Badge
    - Create CallTypeBadge styled component
    - Add icon display in badge
    - Position badge in header section
    - Apply call-type-specific colors
    - _Requirements: 1.5, 1.6, 1.7, 1.8_
  
  - [x] 4.3 Update section headers with call type colors
    - Modify SectionHeader to accept callType prop
    - Update gradient backgrounds based on call type
    - Update border colors based on call type
    - Maintain hover effects with proper colors
    - _Requirements: 6.6, 6.7_
  
  - [x] 4.4 Add call type detection to component
    - Import ApiCallTypeDetector utility
    - Detect call type from apiCall prop
    - Pass callType to all styled components
    - Handle missing or invalid call types
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Update Flow Components to Use New System
  - [x] 5.1 Update WorkerTokenFlowV7
    - Ensure API calls include proper URL/method
    - Verify call type detection works correctly
    - Add color legend to page
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 5.2 Update PingOnePARFlowV7
    - Ensure API calls include proper URL/method
    - Verify call type detection works correctly
    - Add color legend to page
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 5.3 Update other flow components
    - Review all components using EnhancedApiCallDisplay
    - Ensure consistent call type detection
    - Add color legends where appropriate
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Update Pages with API Call Displays
  - [x] 6.1 Add color legend to User Profile page
    - Import ApiCallColorLegend component
    - Position legend above API call list
    - _Requirements: 6.5_
  
  - [x] 6.2 Add color legend to Identity Metrics page
    - Import ApiCallColorLegend component
    - Position legend above API call list
    - _Requirements: 6.5_
  
  - [x] 6.3 Add color legend to Audit Activities page
    - Import ApiCallColorLegend component
    - Position legend above API call list
    - _Requirements: 6.5_
  
  - [x] 6.4 Add color legend to Bulk User Lookup page
    - Import ApiCallColorLegend component
    - Position legend above API call list
    - _Requirements: 6.5_
  
  - [x] 6.5 Add color legend to Organization Licensing page
    - Import ApiCallColorLegend component
    - Position legend above API call list
    - _Requirements: 6.5_

- [x] 7. Verify and Test Implementation
  - [x] 7.1 Test call type detection
    - Test PingOne URL detection (auth.pingone.com, api.pingone.com)
    - Test frontend operation detection (LOCAL method)
    - Test internal/proxy detection (other URLs)
    - Verify edge cases and fallback behavior
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 7.2 Verify color coding across all call types
    - Check PingOne calls display with amber/yellow theme
    - Check frontend calls display with blue theme
    - Check internal calls display with purple theme
    - Verify color consistency across all sections
    - _Requirements: 1.2, 1.3, 1.4, 6.1, 6.2, 6.6, 6.7_
  
  - [x] 7.3 Verify implementation with real flows
    - Run Worker Token flow and verify call types
    - Run PAR flow and verify call types
    - Check mixed frontend/backend call sequences
    - Verify color legend displays correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.4, 6.5_
