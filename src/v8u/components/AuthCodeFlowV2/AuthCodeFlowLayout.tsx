import React, { useEffect, useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { Header } from '../OAuthAuthzV2/components/Header';
import { InspectorPanel } from '../OAuthAuthzV2/components/InspectorPanel';
import { ProtocolPanel } from './components/ProtocolPanel';
import { Sidebar } from '../OAuthAuthzV2/components/Sidebar';
import { useTheme } from '../OAuthAuthzV2/ThemeContext';
import { authCodeFlowExecutionService, FlowListener } from './services/flowExecutionService';
import { AuthCodeConfig } from './types';
import { globalWorkerTokenService } from '../../../v8/services/globalWorkerTokenService';

const STORAGE_KEY = 'authcode-flow-config';

export const AuthCodeFlowLayout: React.FC = () => {
  const { mode, toggle } = useTheme();
  const [selectedFlow, setSelectedFlow] = useState<'oauth20' | 'oidc' | 'other'>('oauth20');
  const [flowStarted, setFlowStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showWorkerTokenDialog, setShowWorkerTokenDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [config, setConfig] = useState<AuthCodeConfig>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: 'https://api.ping.demo/authz-callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    advancedOptions: { pkce: true },
    mode: 'mock',
    spec: '2.0',
    oidc: true,
    region: 'us',
  });

  useEffect(() => {
    const loadConfig = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const savedConfig = JSON.parse(saved);
          setConfig(savedConfig);
          setHasUnsavedChanges(false);
          return;
        } catch (error) {
          console.error('Failed to parse saved config:', error);
        }
      }

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
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed to load env config:', error);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedConfig = saved ? JSON.parse(saved) : null;
    const configChanged = !savedConfig || JSON.stringify(savedConfig) !== JSON.stringify(config);
    setHasUnsavedChanges(configChanged);
  }, [config]);

  useEffect(() => {
    if (!flowStarted) return;

    const listener: FlowListener = {
      onStepChange: setCurrentStep,
    };

    const unsubscribe = authCodeFlowExecutionService.subscribe(listener);
    return unsubscribe;
  }, [flowStarted]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleStartFlow = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save config before starting flow:', error);
    }
    setFlowStarted(true);
    authCodeFlowExecutionService.startFlow(config);
  };

  const handleSaveConfig = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasUnsavedChanges(false);
      setSaveStatus('✅ Config saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus('❌ Failed to save config');
      console.error('Failed to save config:', error);
    }
  };

  const handleClearConfig = () => {
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
      const isConfigured = await globalWorkerTokenService.isConfigured();
      if (!isConfigured) {
        setShowWorkerTokenDialog(true);
        setUpdateStatus('❌ Worker token required - please configure it');
        return;
      }

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
      <Header mode={mode} onToggleTheme={toggle} title="Authorization Code Flow" />
      <Sidebar selectedFlow={selectedFlow} onSelectFlow={setSelectedFlow} />
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
      <ProtocolPanel config={config} flowStarted={flowStarted} currentStep={currentStep} />
      <InspectorPanel />

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
