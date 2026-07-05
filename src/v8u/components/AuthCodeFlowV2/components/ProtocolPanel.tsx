import React from 'react';
import { AUTH_CODE_FLOW_STEPS } from './flowStepsData';
import { FlowStep } from '../../OAuthAuthzV2/components/FlowStep';
import { AuthCodeConfig } from '../types';
import '../../OAuthAuthzV2/components/styles/protocol.css';

interface ProtocolPanelProps {
  config: AuthCodeConfig;
  flowStarted: boolean;
  currentStep: number;
}

export const ProtocolPanel: React.FC<ProtocolPanelProps> = ({
  flowStarted,
  currentStep,
}) => {
  const getStepStatus = (stepIndex: number): 'pending' | 'active' | 'completed' => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="oauth-authz-protocol-panel">
      <div className="panel-title">Authorization Code Flow</div>

      {!flowStarted && (
        <div style={{
          padding: '1rem',
          background: 'var(--oauth-authz-bgTertiary)',
          borderRadius: '0.375rem',
          color: 'var(--oauth-authz-textSecondary)',
          fontSize: '0.9rem',
        }}>
          Click START FLOW to begin the OAuth 2.0 authorization code flow
        </div>
      )}

      <div className="flow-timeline">
        {AUTH_CODE_FLOW_STEPS.map((step, index) => (
          <FlowStep
            key={step.id}
            number={parseInt(step.id)}
            title={step.title}
            description={step.description}
            status={getStepStatus(index)}
          />
        ))}
      </div>

      {flowStarted && currentStep === AUTH_CODE_FLOW_STEPS.length && (
        <div style={{
          padding: '1rem',
          background: 'var(--oauth-authz-bgTertiary)',
          borderRadius: '0.375rem',
          color: 'var(--oauth-authz-accentSuccess)',
          fontSize: '0.9rem',
          marginTop: '1rem',
        }}>
          ✅ Authorization code flow complete. Tokens received and ready to use.
        </div>
      )}
    </div>
  );
};
