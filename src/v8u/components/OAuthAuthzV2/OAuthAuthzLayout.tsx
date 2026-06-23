import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ConfigPanel } from './components/ConfigPanel';
import { ProtocolPanel } from './components/ProtocolPanel';
import { InspectorPanel } from './components/InspectorPanel';

interface OAuthConfig {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  responseType: 'code' | 'token' | 'id_token';
  advancedOptions: {
    pkce: boolean;
    state?: string;
    nonce?: string;
  };
}

export const OAuthAuthzLayout: React.FC = () => {
  const { mode, toggle } = useTheme();
  const [selectedFlow, setSelectedFlow] = useState<'oauth20' | 'oidc' | 'other'>('oauth20');
  const [config, setConfig] = useState<OAuthConfig>({
    environmentId: '',
    clientId: '',
    redirectUri: 'https://localhost:3000/callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    advancedOptions: { pkce: true },
  });

  return (
    <div className="oauth-authz-container">
      {/* Header */}
      <Header mode={mode} onToggleTheme={toggle} />

      {/* Sidebar: Flow Selector */}
      <Sidebar selectedFlow={selectedFlow} onSelectFlow={setSelectedFlow} />

      {/* Config Panel */}
      <ConfigPanel config={config} onConfigChange={setConfig} />

      {/* Protocol Panel */}
      <ProtocolPanel config={config} />

      {/* Inspector Panel */}
      <InspectorPanel />
    </div>
  );
};
