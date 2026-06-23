import React from 'react';
import './styles/protocol.css';

interface ProtocolPanelProps {
  config: any;
}

export const ProtocolPanel: React.FC<ProtocolPanelProps> = ({ config }) => {
  return (
    <div className="oauth-authz-protocol-panel">
      <div className="panel-title">Live Protocol</div>

      <div style={{ textAlign: 'center', color: 'var(--oauth-authz-textSecondary, #64748b)', paddingTop: '2rem' }}>
        <p>Protocol visualization will appear here</p>
        <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
          Step 1: Authorization Request<br/>
          Step 2: User Authorization<br/>
          Step 3: Authorization Code<br/>
          Step 4: Token Exchange<br/>
        </p>
      </div>
    </div>
  );
};
