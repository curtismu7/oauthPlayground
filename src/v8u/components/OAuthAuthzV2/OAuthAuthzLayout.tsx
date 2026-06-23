import React, { useEffect, useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { Header } from './components/Header';
import { InspectorPanel } from './components/InspectorPanel';
import { ProtocolPanel } from './components/ProtocolPanel';
import { Sidebar } from './components/Sidebar';
import { useTheme } from './ThemeContext';
import { flowExecutionService, FlowListener } from './services/flowExecutionService';
import { OAuthConfig } from './types';
import { useAuthConfig } from '../../../contexts/AuthConfigContext';

export const OAuthAuthzLayout: React.FC = () => {
  const { mode, toggle } = useTheme();
  const authConfig = useAuthConfig();
  const [selectedFlow, setSelectedFlow] = useState<'oauth20' | 'oidc' | 'other'>('oauth20');
  const [flowStarted, setFlowStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<OAuthConfig>(() => {
    const defaults = {
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: 'https://localhost:3000/callback',
      scopes: ['openid', 'profile', 'email'],
      responseType: 'code' as const,
      advancedOptions: { pkce: true },
    };

    // Load from stored config if available
    if (authConfig) {
      return {
        environmentId: authConfig.environmentId || defaults.environmentId,
        clientId: authConfig.clientId || defaults.clientId,
        clientSecret: authConfig.clientSecret || defaults.clientSecret,
        redirectUri: authConfig.redirectUri || defaults.redirectUri,
        scopes: authConfig.scopes?.length ? authConfig.scopes : defaults.scopes,
        responseType: 'code',
        advancedOptions: { pkce: true },
      };
    }

    return defaults;
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
