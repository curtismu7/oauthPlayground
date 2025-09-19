 
export interface FlowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  disabled?: boolean;
}

export interface FlowConfig {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  type: 'oauth' | 'oidc' | 'custom';
  category: 'authorization' | 'authentication' | 'token' | 'userinfo';
}

export interface FlowResult {
  success: boolean;
  data?: unknown;
  error?: string;
  stepId?: string;
}

export interface FlowContext {
  flow: string;
  step: number;
  returnPath: string;
  redirectUri: string;
  timestamp: number;
}

export type FlowType = 'authorization-code' | 'implicit' | 'client-credentials' | 'password' | 'device-code' | 'hybrid';

export interface FlowMetadata {
  name: string;
  description: string;
  category: string;
  security: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
  recommended: boolean;
}
