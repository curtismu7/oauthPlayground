import React from 'react';
import './styles/sidebar.css';

interface SidebarProps {
  selectedFlow: string;
  onSelectFlow: (flow: 'oauth20' | 'oidc' | 'other') => void;
}

const FLOWS = [
  { id: 'oauth20', name: 'OAuth 2.0', variant: 'Auth Code' },
  { id: 'oidc', name: 'OpenID Connect', variant: 'Hybrid' },
  { id: 'other', name: 'Client Credentials', variant: 'M2M' },
];

export const Sidebar: React.FC<SidebarProps> = ({ selectedFlow, onSelectFlow }) => {
  return (
    <div className="oauth-authz-sidebar">
      <div className="sidebar-section-title">Flows</div>
      {FLOWS.map((flow) => (
        <div
          key={flow.id}
          className={`sidebar-flow-item ${selectedFlow === flow.id ? 'active' : ''}`}
          onClick={() => onSelectFlow(flow.id as 'oauth20' | 'oidc' | 'other')}
        >
          <div className="sidebar-flow-name">{flow.name}</div>
          <div className="sidebar-flow-meta">{flow.variant}</div>
        </div>
      ))}
    </div>
  );
};
