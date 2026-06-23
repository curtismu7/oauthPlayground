import React from 'react';
import './styles/config.css';

interface ConfigPanelProps {
  config: any;
  onConfigChange: (config: any) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: string, value: any) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="oauth-authz-config-panel">
      <div className="panel-title">App Settings</div>

      <div className="form-group">
        <label>Environment ID</label>
        <input
          type="text"
          value={config.environmentId}
          onChange={(e) => handleChange('environmentId', e.target.value)}
          placeholder="abc123def456"
        />
        <div className="form-helper">PingOne environment where your app is registered</div>
      </div>

      <div className="form-group">
        <label>Client ID</label>
        <input
          type="text"
          value={config.clientId}
          onChange={(e) => handleChange('clientId', e.target.value)}
          placeholder="mobile_app_client"
        />
      </div>

      <div className="form-group">
        <label>Redirect URI</label>
        <input
          type="text"
          value={config.redirectUri}
          onChange={(e) => handleChange('redirectUri', e.target.value)}
        />
        <div className="form-helper">Where OAuth server will send the user back</div>
      </div>

      <div className="form-group">
        <label>Scopes</label>
        <input
          type="text"
          value={config.scopes.join(' ')}
          onChange={(e) => handleChange('scopes', e.target.value.split(' '))}
        />
        <div className="form-helper">Space-separated scope values</div>
      </div>

      <div className="form-group">
        <label>Response Type</label>
        <select
          value={config.responseType}
          onChange={(e) => handleChange('responseType', e.target.value)}
        >
          <option value="code">code (Authorization Code flow)</option>
          <option value="token">token (Implicit flow)</option>
          <option value="id_token">id_token (OIDC only)</option>
        </select>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
        START FLOW
      </button>
    </div>
  );
};
