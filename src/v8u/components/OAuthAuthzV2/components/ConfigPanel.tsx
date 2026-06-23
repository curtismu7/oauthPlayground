import React, { useState } from 'react';
import { FormErrors, OAuthConfig } from '../types';
import { hasErrors, validateConfig } from '../utils/validation';
import './styles/config.css';

interface ConfigPanelProps {
  config: OAuthConfig;
  onConfigChange: (config: OAuthConfig) => void;
  onStartFlow?: () => void;
  onUpdateRedirectUri?: () => void;
  updateStatus?: string | null;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  onConfigChange, 
  onStartFlow,
  onUpdateRedirectUri,
  updateStatus
}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof OAuthConfig, value: string | string[] | boolean) => {
    const newConfig = { ...config, [field]: value };
    onConfigChange(newConfig);
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleAdvancedChange = (field: string, value: string | boolean) => {
    const newConfig = {
      ...config,
      advancedOptions: { ...config.advancedOptions, [field]: value },
    };
    onConfigChange(newConfig);
  };

  const handleStartFlow = () => {
    const validationErrors = validateConfig(config);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    onStartFlow?.();
  };

  return (
    <div className="oauth-authz-config-panel">
      <div className="panel-title">App Settings</div>

      <div className="form-group">
        <label>Environment ID *</label>
        <input
          type="text"
          value={config.environmentId}
          onChange={(e) => handleChange('environmentId', e.target.value)}
          placeholder="abc123def456"
          className={errors.environmentId ? 'error' : ''}
        />
        {errors.environmentId && <div className="form-error">{errors.environmentId}</div>}
        <div className="form-helper">PingOne environment ID</div>
      </div>

      <div className="form-group">
        <label>Client ID *</label>
        <input
          type="text"
          value={config.clientId}
          onChange={(e) => handleChange('clientId', e.target.value)}
          placeholder="mobile_app_client"
          className={errors.clientId ? 'error' : ''}
        />
        {errors.clientId && <div className="form-error">{errors.clientId}</div>}
      </div>

      <div className="form-group">
        <label>Client Secret</label>
        <input
          type="password"
          value={config.clientSecret || ''}
          onChange={(e) => handleChange('clientSecret', e.target.value)}
          placeholder="Leave empty for public clients"
        />
        <div className="form-helper">Optional for public clients (SPA, mobile)</div>
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Redirect URI *</label>
            <input
              type="text"
              value={config.redirectUri}
              onChange={(e) => handleChange('redirectUri', e.target.value)}
              placeholder="https://localhost:3010/authz-callback"
              className={errors.redirectUri ? 'error' : ''}
            />
            {errors.redirectUri && <div className="form-error">{errors.redirectUri}</div>}
            <div className="form-helper">Must match registered redirect URI exactly</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onUpdateRedirectUri}
            style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
            title="Update this redirect URI in PingOne"
          >
            Update URI
          </button>
        </div>
        {updateStatus && <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{updateStatus}</div>}
      </div>

      <div className="form-group">
        <label>Scopes *</label>
        <input
          type="text"
          value={config.scopes.join(' ')}
          onChange={(e) => handleChange('scopes', e.target.value.split(' ').filter(Boolean))}
          placeholder="openid profile email"
          className={errors.scopes ? 'error' : ''}
        />
        {errors.scopes && <div className="form-error">{errors.scopes}</div>}
        <div className="form-helper">Space-separated scope values</div>
      </div>

      <div className="form-group">
        <label>Response Type *</label>
        <select
          value={config.responseType}
          onChange={(e) => handleChange('responseType', e.target.value as 'code' | 'token' | 'id_token')}
        >
          <option value="code">code (Authorization Code — recommended)</option>
          <option value="token">token (Implicit — legacy)</option>
          <option value="id_token">id_token (OIDC only)</option>
        </select>
        <div className="form-helper">Authorization Code is the most secure flow</div>
      </div>

      {/* Advanced Options */}
      <div className="advanced-section">
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          type="button"
        >
          <span className={showAdvanced ? 'arrow-down' : 'arrow-right'}>▶</span>
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="option-group">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={config.advancedOptions.pkce}
                  onChange={(e) => handleAdvancedChange('pkce', e.target.checked)}
                />
                <span>Enable PKCE</span>
              </label>
              <div className="form-helper">Proof Key for Public Clients (recommended for SPAs)</div>
            </div>

            <div className="form-group">
              <label>State Parameter</label>
              <input
                type="text"
                value={config.advancedOptions.state || ''}
                onChange={(e) => handleAdvancedChange('state', e.target.value)}
                placeholder="Auto-generated if empty"
              />
              <div className="form-helper">CSRF protection token (auto-generated if empty)</div>
            </div>

            <div className="form-group">
              <label>Nonce (OIDC)</label>
              <input
                type="text"
                value={config.advancedOptions.nonce || ''}
                onChange={(e) => handleAdvancedChange('nonce', e.target.value)}
                placeholder="Auto-generated if empty"
              />
              <div className="form-helper">Prevents token replay attacks</div>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '1.5rem' }}
        onClick={handleStartFlow}
      >
        START FLOW
      </button>
    </div>
  );
};
