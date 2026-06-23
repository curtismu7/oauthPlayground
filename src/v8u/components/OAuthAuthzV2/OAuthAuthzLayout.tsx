import React, { useEffect, useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { Header } from './components/Header';
import { InspectorPanel } from './components/InspectorPanel';
import { ProtocolPanel } from './components/ProtocolPanel';
import { Sidebar } from './components/Sidebar';
import { useTheme } from './ThemeContext';
import { flowExecutionService, FlowListener } from './services/flowExecutionService';
import { OAuthConfig } from './types';

export const OAuthAuthzLayout: React.FC = () => {
  const { mode, toggle } = useTheme();
  const [selectedFlow, setSelectedFlow] = useState<'oauth20' | 'oidc' | 'other'>('oauth20');
  const [flowStarted, setFlowStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<OAuthConfig>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: 'https://localhost:3000/callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    advancedOptions: { pkce: true },
  });

  useEffect(() => {
    if (!flowStarted) return;

    const listener: FlowListener = {
      onStepChange: setCurrentStep,
    };

    const unsubscribe = flowExecutionService.subscribe(listener);
    return unsubscribe;
  }, [flowStarted]);

  const handleStartFlow = () => {
    setFlowStarted(true);
    flowExecutionService.startFlow(config);
  };

  return (
    <div className="oauth-authz-container">
      {/* Header */}
      <Header mode={mode} onToggleTheme={toggle} />

      {/* Sidebar: Flow Selector */}
      <Sidebar selectedFlow={selectedFlow} onSelectFlow={setSelectedFlow} />

      {/* Config Panel */}
      <ConfigPanel config={config} onConfigChange={setConfig} onStartFlow={handleStartFlow} />

      {/* Protocol Panel */}
      <ProtocolPanel config={config} flowStarted={flowStarted} currentStep={currentStep} />

      {/* Inspector Panel */}
      <InspectorPanel />
    </div>
  );
};
