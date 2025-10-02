# V5 Flow Template Standardization Plan

## 🎯 Overview

This document outlines the comprehensive plan for creating reusable services and ensuring all V5 OAuth/OIDC flows follow a consistent template structure. The goal is to achieve 100% consistency across all flows while maintaining their unique flow-specific characteristics.

## 📊 Current State Analysis

### ✅ Existing Services
- **FlowHeaderService** - Header management and configuration
- **ThemeService** - Color theming and visual consistency
- **FlowSequenceService** - Flow step sequences and walkthroughs
- **FlowInfoService** - Flow information cards and documentation
- **FlowWalkthroughService** - Interactive flow walkthroughs

### ❌ Missing Services
- **FlowLayoutService** - Standardized layout components
- **FlowStateService** - Common state management patterns
- **FlowValidationService** - Step validation logic
- **FlowThemeService** - Flow-specific theming

## 🔧 Recommended Reusable Services

### 1. FlowLayoutService (High Priority)

**Purpose**: Centralized styled components and layout management

```typescript
// src/services/flowLayoutService.ts
export interface FlowLayoutConfig {
  flowType: string;
  theme: 'green' | 'orange' | 'blue' | 'purple' | 'red';
  stepCount: number;
  hasPkce?: boolean;
  hasTokenExchange?: boolean;
  hasUserInfo?: boolean;
}

export class FlowLayoutService {
  // Container and wrapper components
  static getContainerStyles(): StyledComponent;
  static getContentWrapperStyles(): StyledComponent;
  static getMainCardStyles(): StyledComponent;
  
  // Step header components
  static getStepHeaderStyles(theme: string): StyledComponent;
  static getStepHeaderLeftStyles(): StyledComponent;
  static getStepHeaderRightStyles(): StyledComponent;
  static getVersionBadgeStyles(theme: string): StyledComponent;
  static getStepHeaderTitleStyles(): StyledComponent;
  static getStepHeaderSubtitleStyles(): StyledComponent;
  static getStepNumberStyles(): StyledComponent;
  static getStepTotalStyles(): StyledComponent;
  
  // Content components
  static getStepContentWrapperStyles(): StyledComponent;
  static getCollapsibleSectionStyles(): StyledComponent;
  static getCollapsibleHeaderButtonStyles(): StyledComponent;
  static getCollapsibleTitleStyles(): StyledComponent;
  static getCollapsibleToggleIconStyles(): StyledComponent;
  static getCollapsibleContentStyles(): StyledComponent;
  
  // Information display components
  static getInfoBoxStyles(): StyledComponent;
  static getInfoTitleStyles(): StyledComponent;
  static getInfoTextStyles(): StyledComponent;
  static getInfoListStyles(): StyledComponent;
  
  // Action components
  static getButtonStyles(variant: string): StyledComponent;
  static getHighlightedActionButtonStyles(): StyledComponent;
  static getActionRowStyles(): StyledComponent;
  
  // Results and data display
  static getResultsSectionStyles(): StyledComponent;
  static getResultsHeadingStyles(): StyledComponent;
  static getHelperTextStyles(): StyledComponent;
  static getGeneratedContentBoxStyles(): StyledComponent;
  static getParameterGridStyles(): StyledComponent;
  static getParameterLabelStyles(): StyledComponent;
  static getParameterValueStyles(): StyledComponent;
  
  // Requirements and validation
  static getRequirementsIndicatorStyles(): StyledComponent;
  static getRequirementsIconStyles(): StyledComponent;
  static getRequirementsTextStyles(): StyledComponent;
  
  // Code and technical display
  static getCodeBlockStyles(): StyledComponent;
  static getGeneratedUrlDisplayStyles(): StyledComponent;
  static getGeneratedLabelStyles(): StyledComponent;
}
```

### 2. FlowStateService (High Priority)

**Purpose**: Common state management patterns and configuration

```typescript
// src/services/flowStateService.ts
export interface FlowStateConfig {
  flowKey: string;
  stepCount: number;
  introSectionKeys: string[];
  defaultCollapsedSections: Record<string, boolean>;
}

export interface StepConfig {
  title: string;
  subtitle: string;
  description?: string;
  requirements?: string[];
}

export class FlowStateService {
  // Step metadata creation
  static createStepMetadata(steps: StepConfig[]): StepMetadata[];
  
  // Intro section key generation
  static createIntroSectionKeys(flowType: string): string[];
  
  // Default collapsed sections
  static createDefaultCollapsedSections(keys: string[]): Record<string, boolean>;
  
  // Step completion state
  static createStepCompletions(stepCount: number): StepCompletionState;
  
  // Flow-specific configurations
  static getFlowConfig(flowType: string): FlowStateConfig;
  
  // Common state handlers
  static createToggleSectionHandler(
    setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  ): (key: string) => void;
  
  static createStepNavigationHandlers(
    currentStep: number,
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>,
    stepCount: number
  ): {
    handleNext: () => void;
    handlePrev: () => void;
    canNavigateNext: () => boolean;
  };
}
```

### 3. FlowValidationService (Medium Priority)

**Purpose**: Step validation logic and requirements

```typescript
// src/services/flowValidationService.ts
export interface ValidationConfig {
  flowType: string;
  stepIndex: number;
  controller: any;
  credentials?: any;
  tokens?: any;
  authCode?: string;
  authUrl?: string;
}

export class FlowValidationService {
  // Step validation
  static validateStep(stepIndex: number, flowType: string, controller: any): boolean;
  
  // Step requirements
  static getStepRequirements(stepIndex: number, flowType: string): string[];
  
  // Navigation validation
  static canNavigateNext(currentStep: number, flowType: string, controller: any): boolean;
  
  // Flow-specific validation rules
  static getValidationRules(flowType: string): ValidationRule[];
  
  // Common validation patterns
  static validateCredentials(credentials: any, requiredFields: string[]): boolean;
  static validateTokens(tokens: any, requiredTokens: string[]): boolean;
  static validateAuthCode(authCode: string): boolean;
  static validateAuthUrl(authUrl: string): boolean;
}
```

### 4. FlowThemeService (Medium Priority)

**Purpose**: Flow-specific theming and color management

```typescript
// src/services/flowThemeService.ts
export interface FlowTheme {
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

export class FlowThemeService {
  // Theme definitions
  static getFlowTheme(flowType: string): FlowTheme;
  
  // Styled component themes
  static getStepHeaderGradient(theme: string): string;
  static getButtonColors(theme: string): ButtonColors;
  static getInfoBoxColors(theme: string): InfoBoxColors;
  static getCollapsibleColors(theme: string): CollapsibleColors;
  
  // Theme-specific styles
  static getThemeStyles(theme: string): Record<string, any>;
  
  // Available themes
  static getAvailableThemes(): string[];
  static getThemeForFlowType(flowType: string): string;
}
```

## 📐 Standardized Flow Template Structure

### Template Pattern for All V5 Flows

```typescript
// Standard V5 Flow Template
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiChevronDown, FiCopy, FiExternalLink, FiInfo, FiKey, FiRefreshCw, FiSettings, FiShield } from 'react-icons/fi';
import styled from 'styled-components';

// Service imports
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowLayoutService } from '../../services/flowLayoutService';
import { FlowStateService } from '../../services/flowStateService';
import { FlowThemeService } from '../../services/flowThemeService';
import { FlowValidationService } from '../../services/flowValidationService';

// Component imports
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import PingOneApplicationConfig, { type PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import { HelperText, ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';

// Hook imports
import { useFlowController } from '../../hooks/useFlowController';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Flow configuration
const FLOW_TYPE = 'flow-type';
const FLOW_KEY = 'flow-key-v5';
const FLOW_THEME = 'green'; // or 'orange', 'blue', 'purple', 'red'

// Step configuration
const STEP_CONFIGS: StepConfig[] = [
  { title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Flow' },
  { title: 'Step 1: Configuration', subtitle: 'Set up credentials and parameters' },
  { title: 'Step 2: Authorization', subtitle: 'Initiate authorization process' },
  { title: 'Step 3: Token Exchange', subtitle: 'Exchange authorization for tokens' },
  { title: 'Step 4: Validation', subtitle: 'Validate and inspect tokens' },
  { title: 'Step 5: Security Features', subtitle: 'Advanced security demonstrations' },
];

// Service-generated components
const Container = FlowLayoutService.getContainerStyles();
const ContentWrapper = FlowLayoutService.getContentWrapperStyles();
const MainCard = FlowLayoutService.getMainCardStyles();
const StepHeader = FlowLayoutService.getStepHeaderStyles(FLOW_THEME);
const StepHeaderLeft = FlowLayoutService.getStepHeaderLeftStyles();
const StepHeaderRight = FlowLayoutService.getStepHeaderRightStyles();
const VersionBadge = FlowLayoutService.getVersionBadgeStyles(FLOW_THEME);
const StepHeaderTitle = FlowLayoutService.getStepHeaderTitleStyles();
const StepHeaderSubtitle = FlowLayoutService.getStepHeaderSubtitleStyles();
const StepNumber = FlowLayoutService.getStepNumberStyles();
const StepTotal = FlowLayoutService.getStepTotalStyles();
const StepContentWrapper = FlowLayoutService.getStepContentWrapperStyles();
const CollapsibleSection = FlowLayoutService.getCollapsibleSectionStyles();
const CollapsibleHeaderButton = FlowLayoutService.getCollapsibleHeaderButtonStyles();
const CollapsibleTitle = FlowLayoutService.getCollapsibleTitleStyles();
const CollapsibleToggleIcon = FlowLayoutService.getCollapsibleToggleIconStyles();
const CollapsibleContent = FlowLayoutService.getCollapsibleContentStyles();
const InfoBox = FlowLayoutService.getInfoBoxStyles();
const InfoTitle = FlowLayoutService.getInfoTitleStyles();
const InfoText = FlowLayoutService.getInfoTextStyles();
const InfoList = FlowLayoutService.getInfoListStyles();
const Button = FlowLayoutService.getButtonStyles('primary');
const HighlightedActionButton = FlowLayoutService.getHighlightedActionButtonStyles();
const ActionRow = FlowLayoutService.getActionRowStyles();
const ResultsSection = FlowLayoutService.getResultsSectionStyles();
const ResultsHeading = FlowLayoutService.getResultsHeadingStyles();
const HelperText = FlowLayoutService.getHelperTextStyles();
const GeneratedContentBox = FlowLayoutService.getGeneratedContentBoxStyles();
const ParameterGrid = FlowLayoutService.getParameterGridStyles();
const ParameterLabel = FlowLayoutService.getParameterLabelStyles();
const ParameterValue = FlowLayoutService.getParameterValueStyles();
const RequirementsIndicator = FlowLayoutService.getRequirementsIndicatorStyles();
const RequirementsIcon = FlowLayoutService.getRequirementsIconStyles();
const RequirementsText = FlowLayoutService.getRequirementsTextStyles();
const CodeBlock = FlowLayoutService.getCodeBlockStyles();
const GeneratedUrlDisplay = FlowLayoutService.getGeneratedUrlDisplayStyles();
const GeneratedLabel = FlowLayoutService.getGeneratedLabelStyles();

// Service-generated metadata
const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);
const INTRO_SECTION_KEYS = FlowStateService.createIntroSectionKeys(FLOW_TYPE);
const DEFAULT_COLLAPSED_SECTIONS = FlowStateService.createDefaultCollapsedSections(INTRO_SECTION_KEYS);

// Flow component
const FlowV5: React.FC = () => {
  // Controller hook
  const controller = useFlowController({
    flowKey: FLOW_KEY,
    defaultFlowVariant: 'oauth', // or 'oidc'
    enableDebugger: true,
  });

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
  const [emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(DEFAULT_COLLAPSED_SECTIONS);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Service-generated handlers
  const toggleSection = FlowStateService.createToggleSectionHandler(setCollapsedSections);
  const { handleNext, handlePrev, canNavigateNext } = FlowStateService.createStepNavigationHandlers(
    currentStep,
    setCurrentStep,
    STEP_METADATA.length
  );

  // Validation
  const isStepValid = useCallback((stepIndex: number) => 
    FlowValidationService.validateStep(stepIndex, FLOW_TYPE, controller), 
    [controller]
  );

  const getStepRequirements = useCallback((stepIndex: number) => 
    FlowValidationService.getStepRequirements(stepIndex, FLOW_TYPE), 
    []
  );

  // Step completion state
  const stepCompletions = useMemo(() => 
    FlowStateService.createStepCompletions(STEP_METADATA.length), 
    [controller]
  );

  // Render step content
  const renderStepContent = useMemo(() => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <FlowConfigurationRequirements flowType={FLOW_TYPE} variant="oauth" />
            
            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('overview')}
                aria-expanded={!collapsedSections.overview}
              >
                <CollapsibleTitle>
                  <FiInfo /> Flow Overview
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.overview && (
                <CollapsibleContent>
                  <InfoBox $variant="info">
                    <FiShield size={20} />
                    <div>
                      <InfoTitle>Flow Information</InfoTitle>
                      <InfoText>
                        Detailed information about this OAuth/OIDC flow.
                      </InfoText>
                    </div>
                  </InfoBox>
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <EnhancedFlowWalkthrough flowId={FLOW_KEY} />
            <FlowSequenceDisplay flowType={FLOW_TYPE} />
            
            <ConfigurationSummaryCard
              configuration={controller.credentials}
              onSaveConfiguration={handleSaveConfiguration}
              onLoadConfiguration={handleLoadConfiguration}
              primaryColor={FlowThemeService.getFlowTheme(FLOW_THEME).primary}
            />
          </>
        );

      // Additional steps...
      default:
        return null;
    }
  }, [currentStep, collapsedSections, controller, toggleSection]);

  return (
    <Container>
      <ContentWrapper>
        <FlowHeader flowId={FLOW_KEY} />
        <EnhancedFlowInfoCard 
          flowType={FLOW_TYPE}
          showAdditionalInfo={true}
          showDocumentation={true}
          showCommonIssues={false}
          showImplementationNotes={false}
        />
        
        <MainCard>
          <StepHeader>
            <StepHeaderLeft>
              <VersionBadge>{FLOW_TYPE} Flow · V5</VersionBadge>
              <StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
              <StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
            </StepHeaderLeft>
            <StepHeaderRight>
              <StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
              <StepTotal>of {String(STEP_METADATA.length).padStart(2, '0')}</StepTotal>
            </StepHeaderRight>
          </StepHeader>

          {!isStepValid(currentStep) && currentStep !== 0 && (
            <RequirementsIndicator>
              <RequirementsIcon>
                <FiAlertCircle />
              </RequirementsIcon>
              <RequirementsText>
                <strong>Complete this step to continue:</strong>
                <ul>
                  {getStepRequirements(currentStep).map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </RequirementsText>
            </RequirementsIndicator>
          )}
          
          <StepContentWrapper>
            {renderStepContent}
          </StepContentWrapper>
        </MainCard>
      </ContentWrapper>

      <StepNavigationButtons
        currentStep={currentStep}
        totalSteps={STEP_METADATA.length}
        onPrevious={handlePrev}
        onReset={handleResetFlow}
        onNext={handleNext}
        canNavigateNext={canNavigateNext()}
        isFirstStep={currentStep === 0}
        nextButtonText={isStepValid(currentStep) ? 'Next' : 'Complete above action'}
        disabledMessage="Complete the action above to continue"
      />
    </Container>
  );
};

export default FlowV5;
```

## 🎨 Standardized Component Patterns

### 1. Consistent Styled Components
All flows should use the same base styled components generated by `FlowLayoutService`:

- **Container** - Main wrapper with consistent padding and background
- **ContentWrapper** - Content container with max-width and centering
- **MainCard** - Main content card with consistent styling
- **StepHeader** - Step header with theme-specific gradients
- **CollapsibleSection** - Collapsible content sections
- **InfoBox** - Information display boxes with variants
- **Button** - Action buttons with consistent variants
- **ResultsSection** - Results display sections
- **ParameterGrid** - Parameter display grids
- **CodeBlock** - Code display blocks

### 2. Consistent State Management
All flows should follow the same state pattern:

```typescript
// Standard state structure
const [currentStep, setCurrentStep] = useState(0);
const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
const [emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(DEFAULT_COLLAPSED_SECTIONS);
const [copiedField, setCopiedField] = useState<string | null>(null);
```

### 3. Consistent Step Structure
All flows should have a standardized step structure:

- **Step 0**: Introduction & Setup
  - Flow overview and information
  - Configuration requirements
  - Credentials setup
  - Flow walkthrough
  - Flow sequence display
  - Configuration summary

- **Step 1-N**: Flow-specific steps
  - Authorization request
  - Token exchange
  - Validation steps
  - Flow-specific functionality

- **Final Step**: Security Features Demo
  - Token introspection
  - Security demonstrations
  - Advanced features

## 🔧 Implementation Priority

### Phase 1: Create Core Services (Week 1)
1. ✅ **FlowLayoutService** - Standardized styled components
2. ✅ **FlowStateService** - Common state management
3. ✅ **FlowThemeService** - Theme management
4. ✅ **FlowValidationService** - Step validation logic

### Phase 2: Update Existing Flows (Week 2)
1. ✅ **Authorization Code Flow** - Already standardized
2. ✅ **Implicit Flow** - Already standardized
3. ✅ **Client Credentials Flow** - Update to template
4. ✅ **Device Authorization Flow** - Update to template
5. ✅ **Resource Owner Password Flow** - Update to template
6. ✅ **JWT Bearer Token Flow** - Update to template

### Phase 3: Create New Flows (Week 3)
1. ✅ **All remaining flows** - Use template from start
2. ✅ **PingOne-specific flows** - Use template with PingOne theming
3. ✅ **OIDC flows** - Use template with OIDC-specific features

## 📊 Benefits of This Approach

### For Developers
- ✅ **Consistent Patterns** - Same structure across all flows
- ✅ **Faster Development** - Template-based approach reduces development time
- ✅ **Easy Maintenance** - Centralized styling and logic
- ✅ **Type Safety** - Full TypeScript support with comprehensive types
- ✅ **Reusability** - Services can be used across multiple flows
- ✅ **Documentation** - Self-documenting code with clear patterns

### For Users
- ✅ **Consistent UX** - Same experience across all flows
- ✅ **Predictable Navigation** - Same interaction patterns
- ✅ **Professional Look** - Consistent visual design
- ✅ **Better Performance** - Optimized shared components
- ✅ **Accessibility** - Consistent accessibility patterns
- ✅ **Mobile Responsive** - Consistent responsive behavior

### For Maintenance
- ✅ **Centralized Updates** - Update services to affect all flows
- ✅ **Consistent Bug Fixes** - Fix once, apply everywhere
- ✅ **Easy Testing** - Standardized patterns are easier to test
- ✅ **Code Reuse** - Maximum code reuse across flows
- ✅ **Version Control** - Clear versioning of services

## 🚀 Next Steps

### Immediate Actions
1. **Create FlowLayoutService** with all standardized styled components
2. **Create FlowStateService** for common state management patterns
3. **Create FlowThemeService** for consistent theming
4. **Create FlowValidationService** for step validation logic

### Implementation Steps
1. **Start with one flow** - Update Client Credentials Flow to use new services
2. **Validate the pattern** - Ensure the template works correctly
3. **Update remaining flows** - Apply the template to all existing flows
4. **Create new flows** - Use the template for any new flows

### Quality Assurance
1. **Visual consistency check** - Ensure all flows look consistent
2. **Functionality testing** - Verify all flows work correctly
3. **Performance testing** - Ensure services don't impact performance
4. **Accessibility testing** - Verify consistent accessibility patterns

## 📝 Template Usage Guide

### Creating a New Flow
1. Copy the template structure
2. Update flow-specific configuration
3. Define step configurations
4. Implement flow-specific logic
5. Test and validate

### Updating an Existing Flow
1. Identify current inconsistencies
2. Replace custom styled components with service-generated ones
3. Update state management to use service patterns
4. Implement service-based validation
5. Test and validate changes

### Customizing for Specific Flows
1. Use flow-specific theme colors
2. Add flow-specific step configurations
3. Implement flow-specific validation rules
4. Add flow-specific components as needed
5. Maintain consistency with base template

This approach ensures all V5 flows are 100% consistent while maintaining their unique flow-specific characteristics and providing a solid foundation for future development.
