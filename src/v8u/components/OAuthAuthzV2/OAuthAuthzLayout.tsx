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
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [config, setConfig] = useState<OAuthConfig>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: 'https://localhost:3010/authz-callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    advancedOptions: { pkce: true },
  });

  // Load credentials from .env via API on mount
  useEffect(() => {
    const loadEnvConfig = async () => {
      try {
        const response = await fetch('/api/env-config');
        if (response.ok) {
          const envConfig = await response.json();
          setConfig((prev) => ({
            ...prev,
            environmentId: envConfig.environmentId || prev.environmentId,
            clientId: envConfig.clientId || prev.clientId,
            redirectUri: envConfig.redirectUri || prev.redirectUri,
            scopes: envConfig.scopes || prev.scopes,
          }));
        }
      } catch (error) {
        console.error('Failed to load env config:', error);
      }
    };

    loadEnvConfig();
  }, []);

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

  const handleUpdateRedirectUri = async () => {
    if (!config.environmentId || !config.clientId) {
      setUpdateStatus('❌ Environment ID and Client ID required');
      return;
    }

    setUpdateStatus('⏳ Updating PingOne...');
    try {
      const response = await fetch('/api/update-redirect-uri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environmentId: config.environmentId,
          clientId: config.clientId,
          redirectUri: config.redirectUri,
        }),
      });

      if (response.ok) {
        setUpdateStatus('✅ Redirect URI updated in PingOne');
        setTimeout(() => setUpdateStatus(null), 3000);
      } else {
        const error = await response.json();
        setUpdateStatus(`❌ ${error.message || 'Failed to update'}`);
      }
    } catch (error) {
      setUpdateStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="oauth-authz-container">
      {/* Header */}
      <Header mode={mode} onToggleTheme={toggle} />

      {/* Sidebar: Flow Selector */}
      <Sidebar selectedFlow={selectedFlow} onSelectFlow={setSelectedFlow} />

      {/* Config Panel */}
      <ConfigPanel 
        config={config} 
        onConfigChange={setConfig} 
        onStartFlow={handleStartFlow}
        onUpdateRedirectUri={handleUpdateRedirectUri}
        updateStatus={updateStatus}
      />

      {/* Protocol Panel */}
      <ProtocolPanel config={config} flowStarted={flowStarted} currentStep={currentStep} />

      {/* Inspector Panel */}
      <InspectorPanel />
    </div>
  );
};
