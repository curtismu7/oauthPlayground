// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/FlowConfiguration.tsx
// V7.1 Flow Configuration - Configuration section for credentials and settings

import { FiChevronRight, FiInfo, FiRefreshCw, FiSave } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import { UI_CONSTANTS } from '../constants/uiConstants';
import type { FlowCredentials, FlowVariant } from '../types/flowTypes';

interface FlowConfigurationProps {
	credentials: FlowCredentials;
	onCredentialsChange: (credentials: FlowCredentials) => void;
	flowVariant: FlowVariant;
	onVariantChange: (variant: FlowVariant) => void;
	appConfig: PingOneApplicationState;
	onAppConfigChange: (config: PingOneApplicationState) => void;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
	showAdvancedSettings?: boolean;
	onToggleAdvancedSettings?: () => void;
}

const ConfigurationContainer = styled.div`
  background: ${UI_CONSTANTS.SECTION.BACKGROUND};
  border: ${UI_CONSTANTS.SECTION.BORDER};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  padding: ${UI_CONSTANTS.SECTION.PADDING};
  margin-bottom: ${UI_CONSTANTS.SECTION.MARGIN_BOTTOM};
`;

const SectionHeader = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${UI_CONSTANTS.SPACING.LG};
  background: ${UI_CONSTANTS.COLORS.GRAY_50};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:hover {
    background: ${UI_CONSTANTS.COLORS.GRAY_100};
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.MD};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.LG};
  font-weight: ${UI_CONSTANTS.SECTION.HEADER_FONT_WEIGHT};
  color: ${UI_CONSTANTS.COLORS.GRAY_900};
`;

const CollapseIcon = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${UI_CONSTANTS.COLORS.GRAY_600};
  transition: transform ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  svg {
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(90deg)')};
  }
`;

const SectionContent = styled.div<{ $collapsed: boolean }>`
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  padding: ${UI_CONSTANTS.SPACING.LG} 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${UI_CONSTANTS.SPACING.LG};
  margin-bottom: ${UI_CONSTANTS.SPACING.LG};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.SM};
`;

const Label = styled.label`
  font-size: ${UI_CONSTANTS.FORM.LABEL_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.FORM.LABEL_FONT_WEIGHT};
  color: ${UI_CONSTANTS.FORM.LABEL_COLOR};
`;

const Input = styled.input<{ $hasError?: boolean; $hasSuccess?: boolean }>`
  padding: ${UI_CONSTANTS.FORM.INPUT_PADDING};
  border: 1px solid ${(props) =>
		props.$hasError
			? UI_CONSTANTS.FORM.INPUT_ERROR_BORDER
			: props.$hasSuccess
				? UI_CONSTANTS.FORM.INPUT_SUCCESS_BORDER
				: UI_CONSTANTS.FORM.INPUT_BORDER};
  border-radius: ${UI_CONSTANTS.FORM.INPUT_BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.FORM.INPUT_FONT_SIZE};
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:focus {
    outline: none;
    border-color: ${UI_CONSTANTS.FORM.INPUT_FOCUS_BORDER};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background: ${UI_CONSTANTS.COLORS.GRAY_100};
    color: ${UI_CONSTANTS.COLORS.GRAY_500};
    cursor: not-allowed;
  }
`;

const _TextArea = styled.textarea<{ $hasError?: boolean; $hasSuccess?: boolean }>`
  padding: ${UI_CONSTANTS.FORM.INPUT_PADDING};
  border: 1px solid ${(props) =>
		props.$hasError
			? UI_CONSTANTS.FORM.INPUT_ERROR_BORDER
			: props.$hasSuccess
				? UI_CONSTANTS.FORM.INPUT_SUCCESS_BORDER
				: UI_CONSTANTS.FORM.INPUT_BORDER};
  border-radius: ${UI_CONSTANTS.FORM.INPUT_BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.FORM.INPUT_FONT_SIZE};
  font-family: monospace;
  resize: vertical;
  min-height: 100px;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:focus {
    outline: none;
    border-color: ${UI_CONSTANTS.FORM.INPUT_FOCUS_BORDER};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const HelperText = styled.div<{ $type: 'info' | 'error' | 'success' }>`
  font-size: ${UI_CONSTANTS.FORM.HELPER_TEXT_FONT_SIZE};
  color: ${(props) => {
		switch (props.$type) {
			case 'error':
				return UI_CONSTANTS.STATUS.ERROR_COLOR;
			case 'success':
				return UI_CONSTANTS.STATUS.SUCCESS_COLOR;
			default:
				return UI_CONSTANTS.FORM.HELPER_TEXT_COLOR;
		}
	}};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${UI_CONSTANTS.SPACING.MD};
  margin-top: ${UI_CONSTANTS.SPACING.LG};
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
  padding: ${UI_CONSTANTS.SPACING.MD} ${UI_CONSTANTS.SPACING.LG};
  border: none;
  border-radius: ${UI_CONSTANTS.BUTTON.PRIMARY_BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_WEIGHT};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background: ${UI_CONSTANTS.BUTTON.PRIMARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.PRIMARY_COLOR};
          box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_SHADOW};
          
          &:hover {
            box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_HOVER_SHADOW};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
        `;
			case 'secondary':
				return `
          background: ${UI_CONSTANTS.BUTTON.SECONDARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.SECONDARY_COLOR};
          border: ${UI_CONSTANTS.BUTTON.SECONDARY_BORDER};
          
          &:hover {
            background: ${UI_CONSTANTS.BUTTON.SECONDARY_HOVER_BACKGROUND};
          }
        `;
			case 'danger':
				return `
          background: ${UI_CONSTANTS.STATUS.ERROR_COLOR};
          color: ${UI_CONSTANTS.COLORS.WHITE};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.GRAY_700};
          }
        `;
			default:
				return '';
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const InfoBox = styled.div`
  padding: ${UI_CONSTANTS.SPACING.MD};
  background: ${UI_CONSTANTS.STATUS.INFO_BACKGROUND};
  border: 1px solid ${UI_CONSTANTS.STATUS.INFO_BORDER};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  margin-bottom: ${UI_CONSTANTS.SPACING.LG};
`;

const InfoText = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${UI_CONSTANTS.SPACING.SM};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${UI_CONSTANTS.STATUS.INFO_COLOR};
  line-height: ${UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.RELAXED};
`;

export const FlowConfiguration: React.FC<FlowConfigurationProps> = ({
	credentials,
	onCredentialsChange,
	flowVariant,
	onVariantChange,
	appConfig,
	onAppConfigChange,
	isCollapsed = false,
	onToggleCollapse,
	showAdvancedSettings = false,
	onToggleAdvancedSettings,
}) => {
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

	const validateCredentials = (creds: FlowCredentials): Record<string, string> => {
		const errors: Record<string, string> = {};

		if (!creds.environmentId) {
			errors.environmentId = 'Environment ID is required';
		}

		if (!creds.clientId) {
			errors.clientId = 'Client ID is required';
		}

		if (!creds.redirectUri) {
			errors.redirectUri = 'Redirect URI is required';
		} else if (
			!creds.redirectUri.startsWith('https://') &&
			!creds.redirectUri.startsWith('http://localhost')
		) {
			errors.redirectUri = 'Redirect URI must be HTTPS or localhost';
		}

		if (!creds.scope) {
			errors.scope = 'Scope is required';
		}

		return errors;
	};

	const handleCredentialsChange = (field: keyof FlowCredentials, value: string) => {
		const updatedCredentials = { ...credentials, [field]: value };
		onCredentialsChange(updatedCredentials);

		// Validate and update errors
		const errors = validateCredentials(updatedCredentials);
		setValidationErrors(errors);
	};

	const handleSave = () => {
		const errors = validateCredentials(credentials);
		if (Object.keys(errors).length === 0) {
			// Save to storage
			try {
				sessionStorage.setItem(
					'oauth-authorization-code-v7-1-credentials',
					JSON.stringify(credentials)
				);
				sessionStorage.setItem(
					'oauth-authorization-code-v7-1-app-config',
					JSON.stringify(appConfig)
				);
				console.log('✅ Configuration saved successfully');
			} catch (error) {
				console.error('❌ Failed to save configuration:', error);
			}
		} else {
			setValidationErrors(errors);
		}
	};

	const handleReset = () => {
		const defaultCredentials: FlowCredentials = {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: FLOW_CONSTANTS.DEFAULT_REDIRECT_URI,
			scope: FLOW_CONSTANTS.DEFAULT_SCOPE,
		};

		onCredentialsChange(defaultCredentials);
		setValidationErrors({});
	};

	return (
		<ConfigurationContainer>
			<SectionHeader $collapsed={isCollapsed} onClick={onToggleCollapse}>
				<SectionTitle>
					<CollapseIcon $collapsed={isCollapsed}>
						<FiChevronRight />
					</CollapseIcon>
					<span>Flow Configuration</span>
				</SectionTitle>
			</SectionHeader>

			<SectionContent $collapsed={isCollapsed}>
				<InfoBox>
					<InfoText>
						<FiInfo />
						<div>
							Configure your OAuth application credentials and settings. The{' '}
							{flowVariant.toUpperCase()} variant requires specific scopes and configuration.
						</div>
					</InfoText>
				</InfoBox>

				<FormGrid>
					<FormGroup>
						<Label htmlFor="environmentId">Environment ID *</Label>
						<Input
							id="environmentId"
							type="text"
							value={credentials.environmentId}
							onChange={(e) => handleCredentialsChange('environmentId', e.target.value)}
							placeholder="Enter your PingOne Environment ID"
							$hasError={!!validationErrors.environmentId}
						/>
						{validationErrors.environmentId && (
							<HelperText $type="error">{validationErrors.environmentId}</HelperText>
						)}
						<HelperText $type="info">
							Your PingOne Environment ID (e.g., b9817c16-9910-4415-b67e-4ac687da74d9)
						</HelperText>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="clientId">Client ID *</Label>
						<Input
							id="clientId"
							type="text"
							value={credentials.clientId}
							onChange={(e) => handleCredentialsChange('clientId', e.target.value)}
							placeholder="Enter your Client ID"
							$hasError={!!validationErrors.clientId}
						/>
						{validationErrors.clientId && (
							<HelperText $type="error">{validationErrors.clientId}</HelperText>
						)}
						<HelperText $type="info">Your OAuth application Client ID</HelperText>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="clientSecret">Client Secret</Label>
						<Input
							id="clientSecret"
							type="password"
							value={credentials.clientSecret}
							onChange={(e) => handleCredentialsChange('clientSecret', e.target.value)}
							placeholder="Enter your Client Secret (optional for public clients)"
						/>
						<HelperText $type="info">
							Client Secret for confidential clients (leave empty for public clients)
						</HelperText>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="redirectUri">Redirect URI *</Label>
						<Input
							id="redirectUri"
							type="url"
							value={credentials.redirectUri}
							onChange={(e) => handleCredentialsChange('redirectUri', e.target.value)}
							placeholder="https://localhost:3000/authz-callback"
							$hasError={!!validationErrors.redirectUri}
						/>
						{validationErrors.redirectUri && (
							<HelperText $type="error">{validationErrors.redirectUri}</HelperText>
						)}
						<HelperText $type="info">
							Must match the redirect URI configured in your PingOne application
						</HelperText>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="scope">Scope *</Label>
						<Input
							id="scope"
							type="text"
							value={credentials.scope}
							onChange={(e) => handleCredentialsChange('scope', e.target.value)}
							placeholder="openid profile email"
							$hasError={!!validationErrors.scope}
						/>
						{validationErrors.scope && (
							<HelperText $type="error">{validationErrors.scope}</HelperText>
						)}
						<HelperText $type="info">
							Space-separated list of scopes (e.g., openid profile email)
						</HelperText>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="state">State (Optional)</Label>
						<Input
							id="state"
							type="text"
							value={credentials.state || ''}
							onChange={(e) => handleCredentialsChange('state', e.target.value)}
							placeholder="Random state value for CSRF protection"
						/>
						<HelperText $type="info">
							Random string for CSRF protection (auto-generated if empty)
						</HelperText>
					</FormGroup>
				</FormGrid>

				<ButtonGroup>
					<Button $variant="primary" onClick={handleSave}>
						<FiSave />
						Save Configuration
					</Button>
					<Button $variant="secondary" onClick={handleReset}>
						<FiRefreshCw />
						Reset to Defaults
					</Button>
				</ButtonGroup>
			</SectionContent>
		</ConfigurationContainer>
	);
};

export default FlowConfiguration;
