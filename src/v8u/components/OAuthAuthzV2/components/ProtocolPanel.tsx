import React from 'react';
import { OAuthConfig } from '../types';
import './styles/protocol.css';

interface ProtocolPanelProps {
  config: OAuthConfig;
  flowStarted?: boolean;
}

export const ProtocolPanel: React.FC<ProtocolPanelProps> = ({ config, flowStarted }) => {
  return (
    <div className="oauth-authz-protocol-panel">
      <div className="panel-title">Live Protocol</div>

      {!flowStarted ? (
        <div style={{ textAlign: 'center', color: 'var(--oauth-authz-textSecondary, #64748b)', paddingTop: '2rem' }}>
          <p>Configure your app settings and click "START FLOW"</p>
          <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'var(--oauth-authz-textTertiary, #9ca3af)' }}>
            Protocol steps:<br/>
            1. Authorization Request<br/>
            2. User Authorization<br/>
            3. Authorization Code<br/>
            4. Token Exchange<br/>
            5. Validate Tokens
          </p>
        </div>
      ) : (
        <div style={{ paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--oauth-authz-textSecondary, #64748b)' }}>
            Executing flow with:
          </p>
          <pre style={{ fontSize: '0.75rem', padding: '1rem', background: 'var(--oauth-authz-bgTertiary, #ede9fe)', borderRadius: '0.5rem', marginTop: '1rem', overflow: 'auto' }}>
            {JSON.stringify({ environmentId: config.environmentId, clientId: config.clientId }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
