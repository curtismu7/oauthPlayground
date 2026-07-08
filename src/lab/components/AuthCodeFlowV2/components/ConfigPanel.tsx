import React, { useState } from 'react';
import { FormErrors, AuthCodeConfig } from '../types';
import { hasErrors, validateConfig } from '../utils/validation';
import '../../OAuthAuthzV2/components/styles/config.css';

interface ConfigPanelProps {
  config: AuthCodeConfig;
  onConfigChange: (config: AuthCodeConfig) => void;
  onStartFlow?: () => void;
  onUpdateRedirectUri?: () => void;
  onSaveConfig?: () => void;
  onClearConfig?: () => void;
  updateStatus?: string | null;
  saveStatus?: string | null;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  onConfigChange, 
  onStartFlow,
  onUpdateRedirectUri,
  onSaveConfig,
  onClearConfig,
  updateStatus,
  saveStatus
}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof AuthCodeConfig, value: string | string[] | boolean) => {
    const newConfig = { ...config, [field]: value };
    onConfigChange(newConfig);
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

      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--oauth-authz-bgTertiary)', borderRadius: '0.375rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="mode"
              value="mock"
              checked={config.mode === 'mock'}
              onChange={(e) => handleChange('mode', e.target.value as 'mock' | 'real')}
            />
            <span>Mock</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="mode"
              value="real"
              checked={config.mode === 'real'}
              onChange={(e) => handleChange('mode', e.target.value as 'mock' | 'real')}
            />
            <span>Real PingOne</span>
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--oauth-authz-bgTertiary)', borderRadius: '0.375rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="spec"
              value="2.0"
              checked={config.spec === '2.0'}
              onChange={(e) => handleChange('spec', e.target.value as '2.0' | '2.1')}
            />
            <span>OAuth 2.0</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="spec"
              value="2.1"
              checked={config.spec === '2.1'}
              onChange={(e) => handleChange('spec', e.target.value as '2.0' | '2.1')}
            />
            <span>OAuth 2.1</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={config.oidc}
            onChange={(e) => handleChange('oidc', e.target.checked)}
          />
          <span>OIDC</span>
        </label>
        <div className="form-helper">OpenID Connect (adds openid scope and ID token)</div>
      </div>

      <div className="form-group">
        <label>Region</label>
        <select
          value={config.region}
          onChange={(e) => handleChange('region', e.target.value)}
        >
          <option value="us">US</option>
          <option value="eu">EU</option>
          <option value="ap">AP</option>
          <option value="ca">Canada</option>
        </select>
      </div>

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
              placeholder="https://api.ping.demo/authz-callback"
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

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={handleStartFlow}
        >
          START FLOW
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onSaveConfig}
          title="Save config to browser storage"
        >
          Save
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClearConfig}
          title="Clear saved config"
        >
          Clear
        </button>
      </div>
      {saveStatus && <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>{saveStatus}</div>}
    </div>
  );
};
