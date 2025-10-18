// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/hooks/useFlowStateManagement.ts
// V7.1 Flow State Management - Consolidated state management for OAuth Authorization Code Flow

import { useState, useCallback, useMemo, useEffect } from 'react';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import type { 
  FlowState, 
  FlowVariant, 
  AuthCodeState, 
  PKCECodes, 
  TokenResponse, 
  UserInfo, 
  StepCompletionState,
  FlowCredentials 
} from '../types/flowTypes';

// Initial state factory
const createInitialFlowState = (): FlowState => ({
  authCode: { code: null, source: 'manual', timestamp: 0 },
  currentStep: 0,
  flowVariant: FLOW_CONSTANTS.DEFAULT_FLOW_VARIANT,
  collapsedSections: {},
  showModals: { redirect: false, loginSuccess: false }
});

// Storage keys for persistence
const STORAGE_KEYS = {
  FLOW_STATE: 'oauth-authz-v7-1-flow-state',
  PKCE_CODES: 'oauth-authz-v7-1-pkce-codes',
  TOKENS: 'oauth-authz-v7-1-tokens',
  USER_INFO: 'oauth-authz-v7-1-user-info',
  STEP_COMPLETION: 'oauth-authz-v7-1-step-completion',
  CREDENTIALS: 'oauth-authz-v7-1-credentials',
} as const;

export const useFlowStateManagement = () => {
  // Core flow state
  const [flowState, setFlowState] = useState<FlowState>(createInitialFlowState);
  
  // Additional state
  const [pkceCodes, setPkceCodes] = useState<PKCECodes>({
    codeVerifier: '',
    codeChallenge: '',
    codeChallengeMethod: FLOW_CONSTANTS.PKCE_CHALLENGE_METHOD,
  });
  
  const [tokens, setTokens] = useState<TokenResponse | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [stepCompletion, setStepCompletion] = useState<StepCompletionState>({});
  const [credentials, setCredentials] = useState<FlowCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: FLOW_CONSTANTS.DEFAULT_REDIRECT_URI,
    scope: FLOW_CONSTANTS.DEFAULT_SCOPE,
  });

  // Load state from storage on mount
  useEffect(() => {
    try {
      // Load flow state
      const storedFlowState = sessionStorage.getItem(STORAGE_KEYS.FLOW_STATE);
      if (storedFlowState) {
        const parsed = JSON.parse(storedFlowState);
        setFlowState(prev => ({ ...prev, ...parsed }));
      }

      // Load PKCE codes
      const storedPkceCodes = sessionStorage.getItem(STORAGE_KEYS.PKCE_CODES);
      if (storedPkceCodes) {
        setPkceCodes(JSON.parse(storedPkceCodes));
      }

      // Load tokens
      const storedTokens = sessionStorage.getItem(STORAGE_KEYS.TOKENS);
      if (storedTokens) {
        setTokens(JSON.parse(storedTokens));
      }

      // Load user info
      const storedUserInfo = sessionStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }

      // Load step completion
      const storedStepCompletion = sessionStorage.getItem(STORAGE_KEYS.STEP_COMPLETION);
      if (storedStepCompletion) {
        setStepCompletion(JSON.parse(storedStepCompletion));
      }

      // Load credentials
      const storedCredentials = sessionStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (storedCredentials) {
        setCredentials(JSON.parse(storedCredentials));
      }
    } catch (error) {
      console.warn('Failed to load flow state from storage:', error);
    }
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.FLOW_STATE, JSON.stringify(flowState));
    } catch (error) {
      console.warn('Failed to save flow state to storage:', error);
    }
  }, [flowState]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.PKCE_CODES, JSON.stringify(pkceCodes));
    } catch (error) {
      console.warn('Failed to save PKCE codes to storage:', error);
    }
  }, [pkceCodes]);

  useEffect(() => {
    try {
      if (tokens) {
        sessionStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.TOKENS);
      }
    } catch (error) {
      console.warn('Failed to save tokens to storage:', error);
    }
  }, [tokens]);

  useEffect(() => {
    try {
      if (userInfo) {
        sessionStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
    } catch (error) {
      console.warn('Failed to save user info to storage:', error);
    }
  }, [userInfo]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.STEP_COMPLETION, JSON.stringify(stepCompletion));
    } catch (error) {
      console.warn('Failed to save step completion to storage:', error);
    }
  }, [stepCompletion]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
    } catch (error) {
      console.warn('Failed to save credentials to storage:', error);
    }
  }, [credentials]);

  // Flow state management functions
  const updateFlowState = useCallback((updates: Partial<FlowState>) => {
    setFlowState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAuthCode = useCallback((code: string, source: AuthCodeState['source']) => {
    setFlowState(prev => ({
      ...prev,
      authCode: { code, source, timestamp: Date.now() }
    }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setFlowState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setFlowVariant = useCallback((variant: FlowVariant) => {
    setFlowState(prev => ({ ...prev, flowVariant: variant }));
  }, []);

  const toggleSection = useCallback((section: string) => {
    setFlowState(prev => ({
      ...prev,
      collapsedSections: {
        ...prev.collapsedSections,
        [section]: !prev.collapsedSections[section]
      }
    }));
  }, []);

  const setSectionCollapsed = useCallback((section: string, collapsed: boolean) => {
    setFlowState(prev => ({
      ...prev,
      collapsedSections: {
        ...prev.collapsedSections,
        [section]: collapsed
      }
    }));
  }, []);

  const toggleModal = useCallback((modal: 'redirect' | 'loginSuccess') => {
    setFlowState(prev => ({
      ...prev,
      showModals: {
        ...prev.showModals,
        [modal]: !prev.showModals[modal]
      }
    }));
  }, []);

  const setModalVisible = useCallback((modal: 'redirect' | 'loginSuccess', visible: boolean) => {
    setFlowState(prev => ({
      ...prev,
      showModals: {
        ...prev.showModals,
        [modal]: visible
      }
    }));
  }, []);

  // PKCE codes management
  const updatePkceCodes = useCallback((codes: Partial<PKCECodes>) => {
    setPkceCodes(prev => ({ ...prev, ...codes }));
  }, []);

  const clearPkceCodes = useCallback(() => {
    setPkceCodes({
      codeVerifier: '',
      codeChallenge: '',
      codeChallengeMethod: FLOW_CONSTANTS.PKCE_CHALLENGE_METHOD,
    });
  }, []);

  // Token management
  const updateTokens = useCallback((newTokens: TokenResponse | null) => {
    setTokens(newTokens);
  }, []);

  const clearTokens = useCallback(() => {
    setTokens(null);
  }, []);

  // User info management
  const updateUserInfo = useCallback((info: UserInfo | null) => {
    setUserInfo(info);
  }, []);

  const clearUserInfo = useCallback(() => {
    setUserInfo(null);
  }, []);

  // Step completion management
  const setStepCompleted = useCallback((step: number, completed: boolean) => {
    setStepCompletion(prev => ({ ...prev, [step]: completed }));
  }, []);

  const markStepCompleted = useCallback((step: number) => {
    setStepCompleted(step, true);
  }, [setStepCompleted]);

  const markStepIncomplete = useCallback((step: number) => {
    setStepCompleted(step, false);
  }, [setStepCompleted]);

  const clearStepCompletion = useCallback(() => {
    setStepCompletion({});
  }, []);

  // Credentials management
  const updateCredentials = useCallback((newCredentials: Partial<FlowCredentials>) => {
    setCredentials(prev => ({ ...prev, ...newCredentials }));
  }, []);

  const clearCredentials = useCallback(() => {
    setCredentials({
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: FLOW_CONSTANTS.DEFAULT_REDIRECT_URI,
      scope: FLOW_CONSTANTS.DEFAULT_SCOPE,
    });
  }, []);

  // Reset functions
  const resetFlow = useCallback(() => {
    setFlowState(createInitialFlowState());
    setPkceCodes({
      codeVerifier: '',
      codeChallenge: '',
      codeChallengeMethod: FLOW_CONSTANTS.PKCE_CHALLENGE_METHOD,
    });
    setTokens(null);
    setUserInfo(null);
    setStepCompletion({});
    setCredentials({
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: FLOW_CONSTANTS.DEFAULT_REDIRECT_URI,
      scope: FLOW_CONSTANTS.DEFAULT_SCOPE,
    });
  }, []);

  const clearAllStorage = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }, []);

  // Computed values
  const isStepCompleted = useCallback((step: number) => {
    return stepCompletion[step] === true;
  }, [stepCompletion]);

  const getCompletedSteps = useCallback(() => {
    return Object.keys(stepCompletion)
      .filter(step => stepCompletion[parseInt(step)] === true)
      .map(step => parseInt(step))
      .sort((a, b) => a - b);
  }, [stepCompletion]);

  const getCompletionProgress = useCallback(() => {
    const completedSteps = getCompletedSteps();
    return {
      completed: completedSteps.length,
      total: FLOW_CONSTANTS.TOTAL_STEPS,
      percentage: Math.round((completedSteps.length / FLOW_CONSTANTS.TOTAL_STEPS) * 100)
    };
  }, [getCompletedSteps]);

  const canGoToStep = useCallback((targetStep: number) => {
    if (targetStep === 0) return true; // Always allow going to step 0
    if (targetStep === flowState.currentStep) return true; // Current step
    if (targetStep < flowState.currentStep) return true; // Previous steps
    if (targetStep === flowState.currentStep + 1) return true; // Next step
    
    // Check if all previous steps are completed
    for (let i = 0; i < targetStep; i++) {
      if (!isStepCompleted(i)) {
        return false;
      }
    }
    return true;
  }, [flowState.currentStep, isStepCompleted]);

  const canGoBack = useCallback(() => {
    return flowState.currentStep > 0;
  }, [flowState.currentStep]);

  const canGoForward = useCallback(() => {
    return flowState.currentStep < FLOW_CONSTANTS.TOTAL_STEPS - 1;
  }, [flowState.currentStep]);

  const isFlowComplete = useCallback(() => {
    return flowState.currentStep === FLOW_CONSTANTS.TOTAL_STEPS - 1 && 
           isStepCompleted(FLOW_CONSTANTS.TOTAL_STEPS - 1);
  }, [flowState.currentStep, isStepCompleted]);

  // Navigation functions
  const goToStep = useCallback((step: number) => {
    if (canGoToStep(step)) {
      setCurrentStep(step);
    }
  }, [canGoToStep, setCurrentStep]);

  const goToNextStep = useCallback(() => {
    if (canGoForward()) {
      setCurrentStep(flowState.currentStep + 1);
    }
  }, [canGoForward, flowState.currentStep, setCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (canGoBack()) {
      setCurrentStep(flowState.currentStep - 1);
    }
  }, [canGoBack, flowState.currentStep, setCurrentStep]);

  const goToFirstStep = useCallback(() => {
    setCurrentStep(0);
  }, [setCurrentStep]);

  const goToLastStep = useCallback(() => {
    setCurrentStep(FLOW_CONSTANTS.TOTAL_STEPS - 1);
  }, [setCurrentStep]);

  // Return the complete state management interface
  return {
    // State
    flowState,
    pkceCodes,
    tokens,
    userInfo,
    stepCompletion,
    credentials,
    
    // Flow state management
    updateFlowState,
    updateAuthCode,
    setCurrentStep,
    setFlowVariant,
    toggleSection,
    setSectionCollapsed,
    toggleModal,
    setModalVisible,
    
    // PKCE codes management
    updatePkceCodes,
    clearPkceCodes,
    
    // Token management
    updateTokens,
    clearTokens,
    
    // User info management
    updateUserInfo,
    clearUserInfo,
    
    // Step completion management
    setStepCompleted,
    markStepCompleted,
    markStepIncomplete,
    clearStepCompletion,
    
    // Credentials management
    updateCredentials,
    clearCredentials,
    
    // Reset functions
    resetFlow,
    clearAllStorage,
    
    // Computed values
    isStepCompleted,
    getCompletedSteps,
    getCompletionProgress,
    canGoToStep,
    canGoBack,
    canGoForward,
    isFlowComplete,
    
    // Navigation functions
    goToStep,
    goToNextStep,
    goToPreviousStep,
    goToFirstStep,
    goToLastStep,
  };
};

export default useFlowStateManagement;
