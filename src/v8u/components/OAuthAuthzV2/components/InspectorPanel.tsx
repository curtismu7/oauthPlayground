import React from 'react';
import './styles/inspector.css';

export const InspectorPanel: React.FC = () => {
  return (
    <div className="oauth-authz-inspector-panel">
      <div className="inspector-title">Live Inspector</div>

      <div className="status-bar">
        <div className="status-indicator waiting"></div>
        <div style={{ fontSize: '0.8rem', color: 'var(--oauth-authz-textSecondary)' }}>Waiting...</div>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">Current Request</div>
        <div
          className="code-block"
          style={{
            fontSize: '0.65rem',
            background: 'var(--oauth-authz-codeBg)',
            color: 'var(--oauth-authz-codeText)',
          }}
        >
          GET /as/authorization<br/>
          ?client_id=...
        </div>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">Latest Response</div>
        <div className="token-info">
          <div className="token-label">Status</div>
          <div style={{ fontSize: '0.75rem' }}>Waiting for response</div>
        </div>
      </div>
    </div>
  );
};
