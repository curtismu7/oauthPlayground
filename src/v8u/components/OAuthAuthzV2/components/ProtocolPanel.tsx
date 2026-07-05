import React, { useMemo } from 'react';
import { FlowStep, StepStatus } from './FlowStep';
import { OAuthConfig } from '../types';
import { getFlowStepsData } from './flowStepsData';
import './styles/protocol.css';

interface ProtocolPanelProps {
  config: OAuthConfig;
  flowStarted?: boolean;
  currentStep?: number;
}

export const ProtocolPanel: React.FC<ProtocolPanelProps> = ({ config, currentStep = 0 }) => {
  const flowStepsData = useMemo(() => getFlowStepsData(config), [config]);

  const getStepStatus = (stepNumber: number): StepStatus => {
    if (currentStep === 0) return 'pending';
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="oauth-authz-protocol-panel">
      <div className="panel-title">Live Protocol</div>

      {currentStep === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--oauth-authz-textSecondary, #64748b)', paddingTop: '2rem' }}>
          <p>Configure your app settings and click "START FLOW"</p>
          <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'var(--oauth-authz-textTertiary, #9ca3af)' }}>
            You will see the OAuth protocol steps here, with actual values from your configuration.
          </p>
        </div>
      ) : (
        <div className="flow-diagram">
          {flowStepsData.map((step) => (
            <FlowStep
              key={step.number}
              {...step}
              status={getStepStatus(step.number)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
