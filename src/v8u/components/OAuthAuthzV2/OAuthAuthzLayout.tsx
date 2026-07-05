import React, { useEffect, useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { Header } from './components/Header';
import { InspectorPanel } from './components/InspectorPanel';
import { ProtocolPanel } from './components/ProtocolPanel';
import { Sidebar } from './components/Sidebar';
import { useTheme } from './ThemeContext';
import { flowExecutionService, FlowListener } from './services/flowExecutionService';
import { OAuthConfig } from './types';
import { globalWorkerTokenService } from '../../../v8/services/globalWorkerTokenService';

const STORAGE_KEY = 'oauth-authz-config';

export const OAuthAuthzLayout: React.FC = () => {
  const { mode, toggle } = useTheme();
  const [selectedFlow, setSelectedFlow] = useState<'oauth20' | 'oidc' | 'other'>('oauth20');
  const [flowStarted, setFlowStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showWorkerTokenDialog, setShowWorkerTokenDialog] = useState(false);
  const [config, setConfig] = useState<OAuthConfig>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: 'https://localhost:3010/authz-callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    advancedOptions: { pkce: true },
  });

  // Load config from localStorage and .env on mount
  useEffect(() => {
    const loadConfig = async () => {
      // Try localStorage first
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const savedConfig = JSON.parse(saved);
          setConfig(savedConfig);
          return;
        } catch (error) {
          console.error('Failed to parse saved config:', error);
        }
      }

      // Fall back to .env config via API
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

    loadConfig();
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

  const handleSaveConfig = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSaveStatus('✅ Config saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus('❌ Failed to save config');
      console.error('Failed to save config:', error);
    }
  };

  const handleClearConfig = () => {
    // eslint-disable-next-line no-alert -- intentional confirm before a destructive reset
    if (confirm('Clear saved configuration?')) {
      localStorage.removeItem(STORAGE_KEY);
      setSaveStatus('🗑️ Config cleared');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const handleUpdateRedirectUri = async () => {
    if (!config.environmentId || !config.clientId) {
      setUpdateStatus('❌ Environment ID and Client ID required');
      return;
    }

    setUpdateStatus('⏳ Updating PingOne...');
    
    try {
      // Check if worker token is configured, get it silently if available
      const isConfigured = await globalWorkerTokenService.isConfigured();
      if (!isConfigured) {
        setShowWorkerTokenDialog(true);
        setUpdateStatus('❌ Worker token required - please configure it');
        return;
      }

      // Silently get worker token if configured
      const workerToken = await globalWorkerTokenService.getToken();
      if (!workerToken) {
        setShowWorkerTokenDialog(true);
        setUpdateStatus('❌ Failed to get worker token');
        return;
      }

      const response = await fetch('/api/update-redirect-uri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environmentId: config.environmentId,
          clientId: config.clientId,
          redirectUri: config.redirectUri,
          workerToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyExists) {
          setUpdateStatus('ℹ️ Redirect URI already configured');
        } else {
          setUpdateStatus('✅ Redirect URI updated in PingOne');
        }
        setTimeout(() => setUpdateStatus(null), 3000);
      } else if (data.needsWorkerToken) {
        setShowWorkerTokenDialog(true);
        setUpdateStatus('❌ Worker token required');
      } else {
        setUpdateStatus(`❌ ${data.message || 'Failed to update'}`);
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
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        updateStatus={updateStatus}
        saveStatus={saveStatus}
      />

      {/* Protocol Panel */}
      <ProtocolPanel config={config} flowStarted={flowStarted} currentStep={currentStep} />

      {/* Inspector Panel */}
      <InspectorPanel />

      {/* Worker Token Dialog */}
      {showWorkerTokenDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#1d2e3f' }}>Configure Worker Token</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Worker token is required to update the redirect URI in PingOne. Please configure your worker credentials first.
            </p>
            <a 
              href="/flows/worker-token-v9" 
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#1d4ed8',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                marginRight: '1rem',
              }}
            >
              Open Worker Token
            </a>
            <button
              type="button"
              onClick={() => setShowWorkerTokenDialog(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#e5e7eb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
