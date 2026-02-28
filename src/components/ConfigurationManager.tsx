// src/components/ConfigurationManager.tsx
// Interactive configuration management component
// Allows developers to view, edit, and validate flow configurations

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiDownload,
	FiRefreshCw,
	FiSave,
	FiSettings,
	FiUpload,
	FiZap,
} from '@icons';
import styled from 'styled-components';
import {
	BaseFlowConfig,
	ConfigurationSuggestion,
	ConfigurationValidationResult,
	EnhancedConfigurationService,
	Environment,
	FlowSpecificConfig,
	FlowType,
} from '../services/enhancedConfigurationService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const ControlsSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ControlLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const ControlSelect = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
			case 'success':
				return `
          background: #10b981;
          color: white;
          border-color: #10b981;
          &:hover {
            background: #059669;
            border-color: #059669;
          }
        `;
			case 'warning':
				return `
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
          &:hover {
            background: #d97706;
            border-color: #d97706;
          }
        `;
			default:
				return `
          background: white;
          color: #374151;
          border-color: #d1d5db;
          &:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }
        `;
		}
	}}
`;

const ConfigurationSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ConfigGroup = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
`;

const ConfigGroupTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ConfigItem = styled.div`
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ConfigLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const ConfigInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ConfigCheckbox = styled.input`
  margin-right: 0.5rem;
`;

const ValidationSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const ValidationStatus = styled.div<{ status: 'valid' | 'invalid' | 'warning' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  ${(props) => {
		switch (props.status) {
			case 'valid':
				return 'background: #dcfce7; border: 1px solid #16a34a; color: #166534;';
			case 'warning':
				return 'background: #fef3c7; border: 1px solid #d97706; color: #92400e;';
			default:
				return 'background: #fee2e2; border: 1px solid #dc2626; color: #991b1b;';
		}
	}}
`;

const ValidationItem = styled.div`
  font-size: 0.875rem;
  line-height: 1.4;
`;

const SuggestionsSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const SuggestionCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SuggestionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const SuggestionText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const SuggestionBenefit = styled.div`
  font-size: 0.875rem;
  color: #059669;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface ConfigurationManagerProps {
	initialFlowType?: FlowType;
	initialEnvironment?: Environment;
}

const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
	initialFlowType = FlowType.OAUTH_AUTHORIZATION_CODE,
	initialEnvironment = Environment.DEVELOPMENT,
}) => {
	const [selectedFlowType, setSelectedFlowType] = useState<FlowType>(initialFlowType);
	const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(initialEnvironment);
	const [config, setConfig] = useState<FlowSpecificConfig | null>(null);
	const [validation, setValidation] = useState<ConfigurationValidationResult | null>(null);
	const [suggestions, setSuggestions] = useState<ConfigurationSuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const loadConfiguration = useCallback(async () => {
		setIsLoading(true);
		try {
			const loadedConfig = EnhancedConfigurationService.getFlowConfig(
				selectedFlowType,
				selectedEnvironment
			);
			setConfig(loadedConfig);

			// Validate configuration
			const validationResult = EnhancedConfigurationService.validateConfiguration(loadedConfig);
			setValidation(validationResult);

			// Get suggestions
			const configSuggestions =
				EnhancedConfigurationService.getConfigurationSuggestions(loadedConfig);
			setSuggestions(configSuggestions);

			setHasUnsavedChanges(false);
		} catch (error) {
			console.error('Failed to load configuration:', error);
		} finally {
			setIsLoading(false);
		}
	}, [selectedFlowType, selectedEnvironment]);

	// Load configuration when flow type or environment changes
	useEffect(() => {
		loadConfiguration();
	}, [loadConfiguration]);

	const handleConfigChange = useCallback(
		<K extends keyof BaseFlowConfig>(field: K, value: BaseFlowConfig[K]) => {
			if (!config) return;

			const updatedConfig = { ...config, [field]: value };
			setConfig(updatedConfig);
			setHasUnsavedChanges(true);

			// Re-validate
			const validationResult = EnhancedConfigurationService.validateConfiguration(updatedConfig);
			setValidation(validationResult);

			// Re-suggest
			const configSuggestions =
				EnhancedConfigurationService.getConfigurationSuggestions(updatedConfig);
			setSuggestions(configSuggestions);
		},
		[config]
	);

	const handleSaveConfiguration = useCallback(async () => {
		if (!config) return;

		try {
			// Save snapshot
			EnhancedConfigurationService.saveConfigurationSnapshot(
				selectedFlowType,
				config,
				'ConfigurationManager',
				`Updated configuration for ${selectedFlowType} in ${selectedEnvironment}`
			);

			setHasUnsavedChanges(false);
			console.log('Configuration saved successfully');
		} catch (error) {
			console.error('Failed to save configuration:', error);
		}
	}, [config, selectedFlowType, selectedEnvironment]);

	const handleExportConfiguration = useCallback(() => {
		if (!config) return;

		const exportData = EnhancedConfigurationService.exportConfiguration(
			selectedFlowType,
			selectedEnvironment
		);

		// Download as JSON file
		const blob = new Blob([exportData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${selectedFlowType}-${selectedEnvironment}-config.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [selectedFlowType, selectedEnvironment, config]);

	const handleImportConfiguration = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;
					const imported = EnhancedConfigurationService.importConfiguration(content);

					if (imported.flowType === selectedFlowType) {
						setConfig(imported.config);
						setHasUnsavedChanges(true);

						// Re-validate
						const validationResult = EnhancedConfigurationService.validateConfiguration(
							imported.config
						);
						setValidation(validationResult);
					} else {
						alert(
							`Configuration is for ${imported.flowType}, but you're editing ${selectedFlowType}`
						);
					}
				} catch (error) {
					console.error('Failed to import configuration:', error);
					alert('Failed to import configuration. Please check the file format.');
				}
			};
			reader.readAsText(file);
		},
		[selectedFlowType]
	);

	const renderConfigValue = <K extends keyof BaseFlowConfig>(
		field: K,
		value: BaseFlowConfig[K]
	) => {
		if (typeof value === 'boolean') {
			return (
				<ConfigCheckbox
					type="checkbox"
					checked={value}
					onChange={(e) => handleConfigChange(field, e.target.checked)}
				/>
			);
		}

		if (Array.isArray(value)) {
			const arrayValue = value as string[];
			return (
				<ConfigInput
					type="text"
					value={arrayValue.join(', ')}
					onChange={(e) =>
						handleConfigChange(
							field,
							e.target.value.split(',').map((s) => s.trim()) as BaseFlowConfig[K]
						)
					}
				/>
			);
		}

		if (typeof value === 'number') {
			return (
				<ConfigInput
					type="number"
					value={value}
					onChange={(e) =>
						handleConfigChange(field, Number.parseInt(e.target.value, 10) as BaseFlowConfig[K])
					}
				/>
			);
		}

		if (typeof value === 'object' && value !== null) {
			return (
				<ConfigTextArea
					value={JSON.stringify(value, null, 2)}
					onChange={(e) => {
						try {
							handleConfigChange(field, JSON.parse(e.target.value) as BaseFlowConfig[K]);
						} catch (error) {
							console.error('Invalid JSON input:', error);
						}
					}}
				/>
			);
		}

		return (
			<ConfigInput
				type="text"
				value={String(value)}
				onChange={(e) => handleConfigChange(field, e.target.value as BaseFlowConfig[K])}
			/>
		);
	};

	const getValidationIcon = (status: 'valid' | 'invalid' | 'warning') => {
		switch (status) {
			case 'valid':
				return <FiCheckCircle />;
			case 'warning':
				return <FiAlertTriangle />;
			default:
				return <FiAlertTriangle />;
		}
	};

	if (!config) {
		return (
			<Container>
				<LoadingSpinner />
				<span style={{ marginLeft: '0.5rem' }}>Loading configuration...</span>
			</Container>
		);
	}

	return (
		<Container>
			<Header>
				<Title>⚙️ Configuration Manager</Title>
				<Subtitle>
					Manage OAuth/OIDC flow configurations with validation, suggestions, and
					environment-specific settings
				</Subtitle>
			</Header>

			<ControlsSection>
				<ControlsGrid>
					<ControlGroup>
						<ControlLabel>Flow Type</ControlLabel>
						<ControlSelect
							value={selectedFlowType}
							onChange={(e) => setSelectedFlowType(e.target.value as FlowType)}
						>
							{Object.values(FlowType).map((flowType) => (
								<option key={flowType} value={flowType}>
									{flowType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								</option>
							))}
						</ControlSelect>
					</ControlGroup>

					<ControlGroup>
						<ControlLabel>Environment</ControlLabel>
						<ControlSelect
							value={selectedEnvironment}
							onChange={(e) => setSelectedEnvironment(e.target.value as Environment)}
						>
							{Object.values(Environment).map((env) => (
								<option key={env} value={env}>
									{env.charAt(0).toUpperCase() + env.slice(1)}
								</option>
							))}
						</ControlSelect>
					</ControlGroup>
				</ControlsGrid>

				<ActionButtons>
					<ActionButton
						variant="success"
						onClick={handleSaveConfiguration}
						disabled={!hasUnsavedChanges}
					>
						<FiSave />
						{isLoading ? 'Saving...' : 'Save Configuration'}
					</ActionButton>

					<ActionButton onClick={loadConfiguration}>
						<FiRefreshCw />
						Reload
					</ActionButton>

					<ActionButton onClick={handleExportConfiguration}>
						<FiDownload />
						Export
					</ActionButton>

					<label style={{ position: 'relative' }}>
						<ActionButton as="span">
							<FiUpload />
							Import
						</ActionButton>
						<input
							type="file"
							accept=".json"
							onChange={handleImportConfiguration}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								opacity: 0,
								cursor: 'pointer',
							}}
						/>
					</label>
				</ActionButtons>
			</ControlsSection>

			<ConfigurationSection>
				<SectionTitle>
					<FiSettings />
					Configuration Settings
				</SectionTitle>

				<ConfigGrid>
					<ConfigGroup>
						<ConfigGroupTitle>OAuth/OIDC Settings</ConfigGroupTitle>

						<ConfigItem>
							<ConfigLabel>Response Types</ConfigLabel>
							{renderConfigValue('responseTypes', config.responseTypes)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Grant Types</ConfigLabel>
							{renderConfigValue('grantTypes', config.grantTypes)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Scopes</ConfigLabel>
							{renderConfigValue('scopes', config.scopes)}
						</ConfigItem>
					</ConfigGroup>

					<ConfigGroup>
						<ConfigGroupTitle>Security Settings</ConfigGroupTitle>

						<ConfigItem>
							<ConfigLabel>Require PKCE</ConfigLabel>
							{renderConfigValue('requirePkce', config.requirePkce)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Allow HTTP Redirects</ConfigLabel>
							{renderConfigValue('allowHttpRedirects', config.allowHttpRedirects)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Enforce State</ConfigLabel>
							{renderConfigValue('enforceState', config.enforceState)}
						</ConfigItem>
					</ConfigGroup>

					<ConfigGroup>
						<ConfigGroupTitle>UI Settings</ConfigGroupTitle>

						<ConfigItem>
							<ConfigLabel>Show Advanced Options</ConfigLabel>
							{renderConfigValue('showAdvancedOptions', config.showAdvancedOptions)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Enable Debug Mode</ConfigLabel>
							{renderConfigValue('enableDebugMode', config.enableDebugMode)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Display Token Details</ConfigLabel>
							{renderConfigValue('displayTokenDetails', config.displayTokenDetails)}
						</ConfigItem>
					</ConfigGroup>

					<ConfigGroup>
						<ConfigGroupTitle>Validation Settings</ConfigGroupTitle>

						<ConfigItem>
							<ConfigLabel>Validate Redirect URIs</ConfigLabel>
							{renderConfigValue('validateRedirectUris', config.validateRedirectUris)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Validate Scopes</ConfigLabel>
							{renderConfigValue('validateScopes', config.validateScopes)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Validate Client Credentials</ConfigLabel>
							{renderConfigValue('validateClientCredentials', config.validateClientCredentials)}
						</ConfigItem>
					</ConfigGroup>

					<ConfigGroup>
						<ConfigGroupTitle>Timeout Settings</ConfigGroupTitle>

						<ConfigItem>
							<ConfigLabel>Request Timeout (ms)</ConfigLabel>
							{renderConfigValue('requestTimeout', config.requestTimeout)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Token Exchange Timeout (ms)</ConfigLabel>
							{renderConfigValue('tokenExchangeTimeout', config.tokenExchangeTimeout)}
						</ConfigItem>
					</ConfigGroup>

					<ConfigGroup>
						<ConfigGroupTitle>Feature Flags</ConfigGroupTitle>

						<ConfigItem>
							<ConfigLabel>Enable Token Introspection</ConfigLabel>
							{renderConfigValue('enableTokenIntrospection', config.enableTokenIntrospection)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Enable Token Revocation</ConfigLabel>
							{renderConfigValue('enableTokenRevocation', config.enableTokenRevocation)}
						</ConfigItem>

						<ConfigItem>
							<ConfigLabel>Enable Refresh Tokens</ConfigLabel>
							{renderConfigValue('enableRefreshTokens', config.enableRefreshTokens)}
						</ConfigItem>
					</ConfigGroup>
				</ConfigGrid>
			</ConfigurationSection>

			{validation && (
				<ValidationSection>
					<SectionTitle>
						{getValidationIcon(
							validation.isValid ? 'valid' : validation.errors.length > 0 ? 'invalid' : 'warning'
						)}
						Configuration Validation
					</SectionTitle>

					<ValidationStatus
						status={
							validation.isValid ? 'valid' : validation.errors.length > 0 ? 'invalid' : 'warning'
						}
					>
						{validation.isValid ? (
							<>
								<FiCheckCircle />
								<div>
									<strong>Configuration is valid!</strong>
									<div>All settings are properly configured for the selected flow type.</div>
								</div>
							</>
						) : validation.errors.length > 0 ? (
							<>
								<FiAlertTriangle />
								<div>
									<strong>Configuration has errors</strong>
									<div>Please fix the following issues:</div>
									{validation.errors.map((error, index) => (
										<ValidationItem key={index}>
											• {error.field}: {error.message}
											{error.suggestion && ` (Suggestion: ${error.suggestion})`}
										</ValidationItem>
									))}
								</div>
							</>
						) : (
							<>
								<FiAlertTriangle />
								<div>
									<strong>Configuration has warnings</strong>
									<div>Consider the following improvements:</div>
									{validation.warnings.map((warning, index) => (
										<ValidationItem key={index}>
											• {warning.field}: {warning.message}
										</ValidationItem>
									))}
								</div>
							</>
						)}
					</ValidationStatus>
				</ValidationSection>
			)}

			{suggestions.length > 0 && (
				<SuggestionsSection>
					<SectionTitle>
						<FiZap />
						Configuration Suggestions
					</SectionTitle>

					{suggestions.map((suggestion, index) => (
						<SuggestionCard key={index}>
							<SuggestionTitle>{suggestion.field}</SuggestionTitle>
							<SuggestionText>
								<strong>Current:</strong> {JSON.stringify(suggestion.currentValue)}
								<br />
								<strong>Suggested:</strong> {JSON.stringify(suggestion.suggestedValue)}
								<br />
								<strong>Reason:</strong> {suggestion.reason}
							</SuggestionText>
							<SuggestionBenefit>✅ Benefit: {suggestion.benefit}</SuggestionBenefit>
						</SuggestionCard>
					))}
				</SuggestionsSection>
			)}
		</Container>
	);
};

export default ConfigurationManager;
