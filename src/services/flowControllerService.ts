// src/services/flowControllerService.ts
// FlowControllerService - Standardized flow controller patterns and management

import { useCallback, useState, useMemo } from 'react';

export interface FlowControllerConfig {
  flowType: string;
  flowKey: string;
  defaultFlowVariant: 'oauth' | 'oidc' | 'pingone';
  enableDebugger?: boolean;
  customValidation?: (stepIndex: number, controller: any) => boolean;
  customRequirements?: (stepIndex: number) => string[];
}

export interface StepValidation {
  isStepValid: (stepIndex: number) => boolean;
  getStepRequirements: (stepIndex: number) => string[];
  canNavigateNext: (currentStep: number, totalSteps: number) => boolean;
}

export interface NavigationHandlers {
  handleNext: () => void;
  handlePrev: () => void;
  handleReset: () => void;
  canNavigateNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface StateManagement {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  collapsedSections: Record<string, boolean>;
  setCollapsedSections: (sections: Record<string, boolean>) => void;
  toggleSection: (key: string) => void;
}

export interface FlowController {
  config: FlowControllerConfig;
  validation: StepValidation;
  navigation: NavigationHandlers;
  state: StateManagement;
}

export class FlowControllerService {
  /**
   * Create a standardized flow controller
   */
  static createFlowController(
    config: FlowControllerConfig,
    controller: any,
    stepCount: number,
    introSectionKeys: string[]
  ): FlowController {
    // State management
    const [currentStep, setCurrentStep] = useState(0);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
      this.createDefaultCollapsedSections(introSectionKeys)
    );

    // Navigation handlers
    const { handleNext, handlePrev, handleReset, canNavigateNext, isFirstStep, isLastStep } = 
      this.createNavigationHandlers(currentStep, setCurrentStep, stepCount);

    // Toggle section handler
    const toggleSection = useCallback((key: string) => {
      setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // Validation
    const validation = this.createStepValidation(config, controller);

    return {
      config,
      validation,
      navigation: {
        handleNext,
        handlePrev,
        handleReset,
        canNavigateNext,
        isFirstStep,
        isLastStep,
      },
      state: {
        currentStep,
        setCurrentStep,
        collapsedSections,
        setCollapsedSections,
        toggleSection,
      },
    };
  }

  /**
   * Create step validation logic
   */
  static createStepValidation(config: FlowControllerConfig, controller: any): StepValidation {
    const isStepValid = useCallback((stepIndex: number): boolean => {
      if (config.customValidation) {
        return config.customValidation(stepIndex, controller);
      }
      
      // Default validation based on flow type
      switch (config.flowType) {
        case 'implicit':
          return this.validateImplicitStep(stepIndex, controller);
        case 'authorization-code':
          return this.validateAuthorizationCodeStep(stepIndex, controller);
        case 'client-credentials':
          return this.validateClientCredentialsStep(stepIndex, controller);
        case 'device-authorization':
          return this.validateDeviceAuthorizationStep(stepIndex, controller);
        case 'resource-owner-password':
          return this.validateResourceOwnerPasswordStep(stepIndex, controller);
        case 'jwt-bearer':
          return this.validateJWTBearerStep(stepIndex, controller);
        case 'ciba':
          return this.validateCIBAStep(stepIndex, controller);
        case 'hybrid':
          return this.validateHybridStep(stepIndex, controller);
        case 'redirectless':
          return this.validateRedirectlessStep(stepIndex, controller);
        case 'token-introspection':
          return this.validateTokenIntrospectionStep(stepIndex, controller);
        case 'token-revocation':
          return this.validateTokenRevocationStep(stepIndex, controller);
        case 'user-info':
          return this.validateUserInfoStep(stepIndex, controller);
        default:
          return true;
      }
    }, [config, controller]);

    const getStepRequirements = useCallback((stepIndex: number): string[] => {
      if (config.customRequirements) {
        return config.customRequirements(stepIndex);
      }
      
      // Default requirements based on flow type
      return this.getDefaultStepRequirements(config.flowType, stepIndex);
    }, [config]);

    const canNavigateNext = useCallback((currentStep: number, totalSteps: number): boolean => {
      return isStepValid(currentStep) && currentStep < totalSteps - 1;
    }, [isStepValid]);

    return {
      isStepValid,
      getStepRequirements,
      canNavigateNext,
    };
  }

  /**
   * Create navigation handlers
   */
  static createNavigationHandlers(
    currentStep: number,
    setCurrentStep: (step: number) => void,
    totalSteps: number
  ): NavigationHandlers {
    const handleNext = useCallback(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, [currentStep, totalSteps, setCurrentStep]);

    const handlePrev = useCallback(() => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    }, [currentStep, setCurrentStep]);

    const handleReset = useCallback(() => {
      setCurrentStep(0);
    }, [setCurrentStep]);

    const canNavigateNext = currentStep < totalSteps - 1;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return {
      handleNext,
      handlePrev,
      handleReset,
      canNavigateNext,
      isFirstStep,
      isLastStep,
    };
  }

  /**
   * Create default collapsed sections
   */
  static createDefaultCollapsedSections(introSectionKeys: string[]): Record<string, boolean> {
    const sections: Record<string, boolean> = {};
    
    introSectionKeys.forEach(key => {
      // Default to collapsed for certain sections
      const collapsedByDefault = [
        'flowDiagram',
        'details',
        'implementation',
        'troubleshooting',
        'advanced',
      ];
      
      sections[key] = collapsedByDefault.some(pattern => key.includes(pattern));
    });
    
    return sections;
  }

  /**
   * Flow-specific validation methods
   */
  private static validateImplicitStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.authUrl);
      case 2: return Boolean(controller.tokens);
      case 3: return Boolean(controller.tokens);
      case 4: return true;
      default: return false;
    }
  }

  private static validateAuthorizationCodeStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.authUrl);
      case 2: return Boolean(controller.tokens);
      case 3: return Boolean(controller.tokens);
      case 4: return true;
      default: return false;
    }
  }

  private static validateClientCredentialsStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.credentials?.clientId && controller.credentials?.clientSecret);
      case 2: return Boolean(controller.tokens?.access_token);
      case 3: return true;
      default: return false;
    }
  }

  private static validateDeviceAuthorizationStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.deviceCodeData);
      case 2: return Boolean(controller.tokens);
      case 3: return Boolean(controller.tokens);
      case 4: return true;
      default: return false;
    }
  }

  private static validateResourceOwnerPasswordStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.credentials?.username && controller.credentials?.password);
      case 2: return Boolean(controller.tokens?.access_token);
      case 3: return true;
      default: return false;
    }
  }

  private static validateJWTBearerStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.credentials?.privateKey);
      case 2: return Boolean(controller.tokens?.access_token);
      case 3: return true;
      default: return false;
    }
  }

  private static validateCIBAStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.authRequestId);
      case 2: return Boolean(controller.tokens);
      case 3: return Boolean(controller.tokens);
      case 4: return true;
      default: return false;
    }
  }

  private static validateHybridStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.authUrl);
      case 2: return Boolean(controller.tokens);
      case 3: return Boolean(controller.tokens);
      case 4: return true;
      default: return false;
    }
  }

  private static validateRedirectlessStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.pkceCodes?.codeVerifier && controller.pkceCodes?.codeChallenge);
      case 2: return Boolean(controller.authUrl);
      case 3: return Boolean(controller.flowResponse);
      case 4: return Boolean(controller.tokens);
      case 5: return true;
      default: return false;
    }
  }

  private static validateTokenIntrospectionStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.credentials?.clientId);
      case 2: return Boolean(controller.introspectionResult);
      case 3: return true;
      default: return false;
    }
  }

  private static validateTokenRevocationStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.credentials?.clientId);
      case 2: return Boolean(controller.revocationResult);
      case 3: return true;
      default: return false;
    }
  }

  private static validateUserInfoStep(stepIndex: number, controller: any): boolean {
    switch (stepIndex) {
      case 0: return true;
      case 1: return Boolean(controller.tokens?.access_token);
      case 2: return Boolean(controller.userInfo);
      case 3: return true;
      default: return false;
    }
  }

  /**
   * Get default step requirements
   */
  private static getDefaultStepRequirements(flowType: string, stepIndex: number): string[] {
    const commonRequirements = {
      0: ['Complete the introduction and setup'],
      1: ['Configure credentials and generate request'],
      2: ['Complete the authentication process'],
      3: ['Validate and process the response'],
      4: ['Review results and next steps'],
    };

    const flowSpecificRequirements = {
      'implicit': {
        1: ['Configure credentials and generate authorization URL'],
        2: ['Complete authorization and receive tokens'],
        3: ['Validate and inspect received tokens'],
      },
      'authorization-code': {
        1: ['Configure credentials and generate authorization URL'],
        2: ['Complete authorization and exchange code for tokens'],
        3: ['Validate and inspect received tokens'],
      },
      'client-credentials': {
        1: ['Configure client credentials'],
        2: ['Request access token using client credentials'],
      },
      'device-authorization': {
        1: ['Configure credentials and request device code'],
        2: ['Complete device authorization'],
        3: ['Poll for tokens'],
      },
      'resource-owner-password': {
        1: ['Configure credentials and user credentials'],
        2: ['Request access token using user credentials'],
      },
      'jwt-bearer': {
        1: ['Configure JWT signing key'],
        2: ['Request access token using JWT assertion'],
      },
      'ciba': {
        1: ['Configure credentials and initiate CIBA request'],
        2: ['Complete CIBA authentication'],
        3: ['Poll for tokens'],
      },
      'hybrid': {
        1: ['Configure credentials and generate authorization URL'],
        2: ['Complete authorization and receive tokens'],
        3: ['Validate and inspect received tokens'],
      },
      'redirectless': {
        1: ['Generate PKCE parameters'],
        2: ['Build authorization URL with response_mode=pi.flow'],
        3: ['Receive and process flow object'],
        4: ['Receive tokens in JSON format'],
      },
      'token-introspection': {
        1: ['Configure credentials and access token'],
        2: ['Introspect the access token'],
      },
      'token-revocation': {
        1: ['Configure credentials and access token'],
        2: ['Revoke the access token'],
      },
      'user-info': {
        1: ['Configure access token'],
        2: ['Request user information'],
      },
    };

    const specific = flowSpecificRequirements[flowType as keyof typeof flowSpecificRequirements];
    if (specific && specific[stepIndex as keyof typeof specific]) {
      return specific[stepIndex as keyof typeof specific];
    }

    return commonRequirements[stepIndex as keyof typeof commonRequirements] || [];
  }

  /**
   * Create a flow controller hook
   */
  static useFlowController(
    config: FlowControllerConfig,
    controller: any,
    stepCount: number,
    introSectionKeys: string[]
  ): FlowController {
    return useMemo(() => 
      this.createFlowController(config, controller, stepCount, introSectionKeys),
      [config, controller, stepCount, introSectionKeys]
    );
  }
}

export default FlowControllerService;
