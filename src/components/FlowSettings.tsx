import { useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiSettings,
	FiToggleLeft,
	FiToggleRight,
	FiX,
} from '@icons';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';

const SettingsPanel = styled(Card)`
  margin-bottom: 2rem;
  border: 2px solid #e5e7eb;

  &.expanded {
    border-color: #3b82f6;
  }
`;

const SettingsHeader = styled(CardHeader)`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }
`;

const SettingsContent = styled(CardBody)`
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;

  &.expanded {
    max-height: 1000px;
    padding: 1.5rem;
  }
`;

const SettingGroup = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }

  &.disabled {
    opacity: 0.6;
    background-color: #fef2f2;
    border-color: #fecaca;
  }
`;

const SettingInfo = styled.div`
  flex: 1;

  .label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .warning {
    color: #d97706;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    border-color: #9ca3af;
    background-color: #f9fafb;
  }

  &.enabled {
    background-color: #dbeafe;
    border-color: #3b82f6;
    color: #1e40af;
  }

  &.disabled {
    background-color: #fef2f2;
    border-color: #ef4444;
    color: #dc2626;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const InputField = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  width: 100%;
  max-width: 300px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const FlowSettings = ({ flowType, onSettingsChange, initialSettings = {} }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [settings, setSettings] = useState({
		pkce: true,
		state: true,
		nonce: true,
		redirectUri: true,
		scope: true,
		clientSecret: true,
		https: true,
		customRedirectUri: '',
		customScope: 'openid profile email',
		...initialSettings,
	});

	const [errors, setErrors] = useState({});

	useEffect(() => {
		onSettingsChange?.(settings);
	}, [settings, onSettingsChange]);

	const updateSetting = (key, value) => {
		setSettings((prev) => ({ ...prev, [key]: value }));

		// Clear errors when user makes changes
		if (errors[key]) {
			setErrors((prev) => ({ ...prev, [key]: null }));
		}

		// Validate settings
		validateSettings(key, value);
	};

	const validateSettings = (key, value) => {
		const newErrors = { ...errors };

		switch (key) {
			case 'customRedirectUri':
				if (value && !value.startsWith('http')) {
					newErrors.customRedirectUri = 'Must be a valid HTTP/HTTPS URL';
				} else {
					delete newErrors.customRedirectUri;
				}
				break;
			case 'customScope':
				if (value && !value.trim()) {
					newErrors.customScope = 'Scope cannot be empty';
				} else {
					delete newErrors.customScope;
				}
				break;
		}

		setErrors(newErrors);
	};

	const getSettingConfig = () => {
		const baseSettings = [
			{
				key: 'pkce',
				label: 'PKCE (Proof Key for Code Exchange)',
				description:
					'Enhances security for public clients by preventing authorization code interception',
				warning: settings.pkce ? null : 'PKCE disabled - less secure for public clients',
				required: flowType === 'authorization-code',
				defaultValue: true,
			},
			{
				key: 'state',
				label: 'State Parameter',
				description: 'Prevents CSRF attacks and maintains state between requests',
				warning: settings.state ? null : 'CSRF protection disabled',
				required: true,
				defaultValue: true,
			},
			{
				key: 'nonce',
				label: 'Nonce Parameter',
				description: 'Prevents replay attacks in OpenID Connect flows',
				warning: settings.nonce ? null : 'Replay attack protection disabled',
				required: flowType === 'implicit' || flowType === 'hybrid',
				defaultValue: true,
			},
			{
				key: 'scope',
				label: 'Scope Parameter',
				description: 'Defines what permissions the application is requesting',
				warning: settings.scope ? null : 'No permissions requested',
				required: true,
				defaultValue: true,
			},
			{
				key: 'redirectUri',
				label: 'Redirect URI',
				description: 'Where the user is redirected after authentication',
				warning: settings.redirectUri ? null : 'No redirect URI configured',
				required: true,
				defaultValue: true,
			},
		];

		// Add flow-specific settings
		if (flowType === 'authorization-code' || flowType === 'hybrid') {
			baseSettings.push({
				key: 'clientSecret',
				label: 'Client Secret',
				description: 'Secret used to authenticate with the authorization server',
				warning: settings.clientSecret ? null : 'Client secret disabled - less secure',
				required: flowType === 'authorization-code',
				defaultValue: true,
			});
		}

		baseSettings.push({
			key: 'https',
			label: 'HTTPS Only',
			description: 'Require secure HTTPS connections for all requests',
			warning: settings.https ? null : 'HTTP allowed - not recommended for production',
			required: false,
			defaultValue: true,
		});

		return baseSettings;
	};

	const renderSettingInput = (setting) => {
		if (setting.key === 'customRedirectUri') {
			return (
				<div style={{ marginTop: '0.5rem' }}>
					<InputField
						placeholder="https://your-app.com/callback"
						value={settings.customRedirectUri}
						onChange={(e) => updateSetting('customRedirectUri', e.target.value)}
						className={errors.customRedirectUri ? 'error' : ''}
					/>
					{errors.customRedirectUri && (
						<ErrorMessage>
							<FiX size={12} />
							{errors.customRedirectUri}
						</ErrorMessage>
					)}
				</div>
			);
		}

		if (setting.key === 'customScope') {
			return (
				<div style={{ marginTop: '0.5rem' }}>
					<InputField
						placeholder="openid profile email"
						value={settings.customScope}
						onChange={(e) => updateSetting('customScope', e.target.value)}
						className={errors.customScope ? 'error' : ''}
					/>
					{errors.customScope && (
						<ErrorMessage>
							<FiX size={12} />
							{errors.customScope}
						</ErrorMessage>
					)}
				</div>
			);
		}

		return null;
	};

	return (
		<SettingsPanel className={isExpanded ? 'expanded' : ''}>
			<SettingsHeader onClick={() => setIsExpanded(!isExpanded)}>
				<h3>
					<FiSettings />
					Flow Settings & Experimentation
					<span
						style={{
							fontSize: '0.75rem',
							fontWeight: 'normal',
							color: '#6b7280',
							marginLeft: '0.5rem',
						}}
					>
						(Click to {isExpanded ? 'collapse' : 'expand'})
					</span>
				</h3>
				<div
					style={{
						transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.3s',
					}}
				></div>
			</SettingsHeader>

			<SettingsContent className={isExpanded ? 'expanded' : ''}>
				<div
					style={{
						marginBottom: '1rem',
						padding: '1rem',
						backgroundColor: '#eff6ff',
						borderRadius: '0.5rem',
						border: '1px solid #dbeafe',
					}}
				>
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
					>
						<FiAlertTriangle style={{ color: '#3b82f6' }} size={16} />
						<strong style={{ color: '#1e40af' }}>Experiment Mode</strong>
					</div>
					<p style={{ margin: 0, fontSize: '0.875rem', color: '#3730a3' }}>
						Toggle settings on/off to see how they affect the OAuth flow. Some combinations may
						cause errors or change behavior - this is intentional for learning!
					</p>
				</div>

				<SettingGroup>
					<h4>
						<FiToggleRight style={{ color: '#059669' }} />
						Core OAuth Settings
					</h4>

					{getSettingConfig().map((setting) => (
						<SettingItem
							key={setting.key}
							className={!settings[setting.key] && setting.required ? 'disabled' : ''}
						>
							<SettingInfo>
								<div className="label">
									{setting.label}
									{setting.required && (
										<span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
									)}
								</div>
								<div className="description">{setting.description}</div>
								{setting.warning && !settings[setting.key] && (
									<div className="warning">
										<FiAlertTriangle size={12} />
										{setting.warning}
									</div>
								)}
								{renderSettingInput(setting)}
							</SettingInfo>

							<ToggleButton
								className={settings[setting.key] ? 'enabled' : 'disabled'}
								onClick={() => updateSetting(setting.key, !settings[setting.key])}
							>
								{settings[setting.key] ? <FiToggleRight /> : <FiToggleLeft />}
								{settings[setting.key] ? 'Enabled' : 'Disabled'}
							</ToggleButton>
						</SettingItem>
					))}
				</SettingGroup>

				<SettingGroup>
					<h4>
						<FiCheckCircle style={{ color: '#059669' }} />
						Current Configuration Summary
					</h4>

					<div
						style={{
							padding: '1rem',
							backgroundColor: '#f8fafc',
							borderRadius: '0.5rem',
							border: '1px solid #e2e8f0',
							fontFamily: 'monospace',
							fontSize: '0.875rem',
						}}
					>
						<div>
							<strong>Flow Type:</strong> {flowType}
						</div>
						<div>
							<strong>PKCE:</strong> {settings.pkce ? ' Enabled' : ' Disabled'}
						</div>
						<div>
							<strong>State:</strong> {settings.state ? ' Enabled' : ' Disabled'}
						</div>
						<div>
							<strong>Nonce:</strong> {settings.nonce ? ' Enabled' : ' Disabled'}
						</div>
						<div>
							<strong>Scope:</strong> {settings.scope ? ' Enabled' : ' Disabled'}
						</div>
						<div>
							<strong>Redirect URI:</strong> {settings.redirectUri ? ' Enabled' : ' Disabled'}
						</div>
						<div>
							<strong>Client Secret:</strong> {settings.clientSecret ? ' Enabled' : ' Disabled'}
						</div>
						<div>
							<strong>HTTPS:</strong> {settings.https ? ' Enabled' : ' Disabled'}
						</div>
					</div>
				</SettingGroup>
			</SettingsContent>
		</SettingsPanel>
	);
};

export default FlowSettings;
