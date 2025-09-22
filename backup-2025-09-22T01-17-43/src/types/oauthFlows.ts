import { ReactNode } from 'react';

export interface OAuthFlowStep {
  title: string;
  description: string;
  code?: string;
}

export interface OAuthFlowUseCase {
  title: string;
  description: string;
  code?: string;
}

export interface OAuthFlow {
  id: string;
  title: string;
  icon: ReactNode;
  description: string;
  useCases: OAuthFlowUseCase[];
  steps: OAuthFlowStep[];
  recommended: boolean;
  security: 'high' | 'medium' | 'low';
  complexity: 'high' | 'medium' | 'low';
  useCase?: string;
}
