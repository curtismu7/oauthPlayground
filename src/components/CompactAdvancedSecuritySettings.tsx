// src/components/CompactAdvancedSecuritySettings.tsx
// Compact version of Advanced Security Settings for use inside flows

import React, { useState } from 'react';
import styled from 'styled-components';
import {
	type AdvancedSecuritySettings,
	advancedSecuritySettingsService,
} from '../services/advancedSecuritySettingsService';

type SecurityAssessment = ReturnType<
	typeof advancedSecuritySettingsService.getSecurityLevelAssessment
>;
type SettingKey = keyof AdvancedSecuritySettings;

const Container = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SecurityBadge = styled.span<{ level: 'low' | 'medium' | 'high' | 'critical' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${(props) => {
		switch (props.level) {
			case 'critical':
				return '#fef2f2';
			case 'high':
				return '#fef3c7';
			case 'medium':
				return '#dbeafe';
			case 'low':
				return '#f3f4f6';
			default:
				return '#f3f4f6';
		}
	}};
  color: ${(props) => {
		switch (props.level) {
			case 'critical':
				return '#dc2626';
			case 'high':
				return '#d97706';
			case 'medium':
				return '#2563eb';
			case 'low':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.level) {
			case 'critical':
				return '#ef4444';
			case 'high':
				return '#f59e0b';
			case 'medium':
				return '#e5e7eb';
			case 'low':
				return '#e5e7eb';
			default:
				return '#e5e7eb';
		}
	}};
`;

const ToggleIcon = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(0deg)' : 'rotate(-90deg)')};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: ${({ $expanded }) => ($expanded ? 'rotate(0deg) scale(1.1)' : 'rotate(-90deg) scale(1.1)')};
  }
`;

const Content = styled.div<{ $expanded: boolean }>`
  max-height: ${(props) => (props.$expanded ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: ${(props) => (props.$expanded ? '1rem' : '0')};
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SettingLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_DARK;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SettingInput = styled.input`
  margin-right: 0.5rem;
`;

const SettingSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  min-width: 120px;
`;

const SettingDescription = styled.p`
  font-size: 0.75rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin: 0;
  line-height: 1.4;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  
  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: V9_COLORS.PRIMARY.BLUE;
          color: white;
          border-color: V9_COLORS.PRIMARY.BLUE;
          &:hover {
            background: V9_COLORS.PRIMARY.BLUE_DARK;
            border-color: V9_COLORS.PRIMARY.BLUE_DARK;
          }
        `;
			default:
				return `
          background: white;
          color: V9_COLORS.TEXT.GRAY_DARK;
          border-color: V9_COLORS.TEXT.GRAY_LIGHTER;
          &:hover {
            background: #f9fafb;
            border-color: V9_COLORS.TEXT.GRAY_LIGHT;
          }
        `;
		}
	}}
`;

const AssessmentSummary = styled.div<{ level: 'low' | 'medium' | 'high' | 'critical' }>`
  padding: 0.75rem;
  border-radius: 6px;
  background: ${(props) => {
		switch (props.level) {
			case 'critical':
				return '#fef2f2';
			case 'high':
				return '#fef3c7';
			case 'medium':
				return '#dbeafe';
			case 'low':
				return '#f3f4f6';
			default:
				return '#f3f4f6';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.level) {
			case 'critical':
				return '#ef4444';
			case 'high':
				return '#f59e0b';
			case 'medium':
				return '#e5e7eb';
			case 'low':
				return '#e5e7eb';
			default:
				return '#e5e7eb';
		}
	}};
  margin-bottom: 1rem;
`;

const AssessmentText = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CompactAdvancedSecuritySettings: React.FC = () => {
	const [settings, setSettings] = useState<AdvancedSecuritySettings>(
		advancedSecuritySettingsService.getCurrentSettings()
	);
	const [assessment, setAssessment] = useState<SecurityAssessment>(
		advancedSecuritySettingsService.getSecurityLevelAssessment()
	);
	const [isExpanded, setIsExpanded] = useState(false);

	const handleSettingChange = (settingId: SettingKey, value: boolean | string) => {
		const newSettings: AdvancedSecuritySettings = {
			...settings,
			[settingId]: value as AdvancedSecuritySettings[SettingKey],
		};
		setSettings(newSettings);
		advancedSecuritySettingsService.updateSettings(newSettings);
		setAssessment(advancedSecuritySettingsService.getSecurityLevelAssessment());
	};

	const handleReset = () => {
		advancedSecuritySettingsService.resetToDefaults();
		const defaultSettings = advancedSecuritySettingsService.getCurrentSettings();
		setSettings(defaultSettings);
		setAssessment(advancedSecuritySettingsService.getSecurityLevelAssessment());
	};

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<Container>
			<Header onClick={toggleExpanded}>
				<Title>
					<span style={{ fontSize: '16px' }}>🛡️</span>
					Advanced Security Settings
					{assessment && (
						<SecurityBadge level={assessment.overall}>
							{assessment.overall.toUpperCase()} ({assessment.score}%)
						</SecurityBadge>
					)}
				</Title>
				<ToggleIcon $expanded={isExpanded}>
					<span style={{ fontSize: '16px' }}>⬇️</span>
				</ToggleIcon>
			</Header>

			{assessment && (
				<AssessmentSummary level={assessment.overall}>
					<AssessmentText>
						<span style={{ fontSize: '14px' }}>🛡️</span>
						Security Level: {assessment.overall.toUpperCase()} ({assessment.score}%)
						{assessment.recommendations.length > 0 && (
							<span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
								• {assessment.recommendations.length} recommendations
							</span>
						)}
					</AssessmentText>
				</AssessmentSummary>
			)}

			<Content $expanded={isExpanded}>
				<SettingsGrid>
					{/* Authentication Security */}
					<SettingItem>
						<SettingLabel>
							<SettingInput
								type="checkbox"
								checked={settings.includeX5tParameter}
								onChange={(e) => handleSettingChange('includeX5tParameter', e.target.checked)}
							/>
							Include x5t Parameter
						</SettingLabel>
						<SettingDescription>X.509 certificate thumbprint in JWT tokens</SettingDescription>
					</SettingItem>

					<SettingItem>
						<SettingLabel>
							<SettingInput
								type="checkbox"
								checked={settings.requireClientAuthentication}
								onChange={(e) =>
									handleSettingChange('requireClientAuthentication', e.target.checked)
								}
							/>
							Require Client Authentication
						</SettingLabel>
						<SettingDescription>Enforce client authentication methods</SettingDescription>
					</SettingItem>

					{/* Session Management */}
					<SettingItem>
						<SettingLabel>
							<SettingInput
								type="checkbox"
								checked={settings.openIdConnectSessionManagement}
								onChange={(e) =>
									handleSettingChange('openIdConnectSessionManagement', e.target.checked)
								}
							/>
							OIDC Session Management
						</SettingLabel>
						<SettingDescription>Enable OIDC session features</SettingDescription>
					</SettingItem>

					<SettingItem>
						<SettingLabel>
							<SettingInput
								type="checkbox"
								checked={settings.terminateUserSessionByIdToken}
								onChange={(e) =>
									handleSettingChange('terminateUserSessionByIdToken', e.target.checked)
								}
							/>
							Terminate Session by ID Token
						</SettingLabel>
						<SettingDescription>Single logout functionality</SettingDescription>
					</SettingItem>

					{/* Token Security */}
					<SettingItem>
						<SettingLabel>
							<SettingInput
								type="checkbox"
								checked={settings.additionalRefreshTokenReplayProtection}
								onChange={(e) =>
									handleSettingChange('additionalRefreshTokenReplayProtection', e.target.checked)
								}
							/>
							Refresh Token Replay Protection
						</SettingLabel>
						<SettingDescription>Prevent refresh token reuse</SettingDescription>
					</SettingItem>

					<SettingItem>
						<SettingLabel>
							<SettingInput
								type="checkbox"
								checked={settings.enforcePKCE}
								onChange={(e) => handleSettingChange('enforcePKCE', e.target.checked)}
							/>
							Enforce PKCE
						</SettingLabel>
						<SettingDescription>Proof Key for Code Exchange</SettingDescription>
					</SettingItem>

					{/* Request Security */}
					<SettingItem>
						<SettingLabel>
							<SettingInput
								type="checkbox"
								checked={settings.requirePushedAuthorizationRequests}
								onChange={(e) =>
									handleSettingChange('requirePushedAuthorizationRequests', e.target.checked)
								}
							/>
							Require PAR
						</SettingLabel>
						<SettingDescription>Pushed Authorization Requests</SettingDescription>
					</SettingItem>

					<SettingItem>
						<SettingLabel>Request Parameter Signature</SettingLabel>
						<SettingSelect
							value={settings.requestParameterSignature}
							onChange={(e) => handleSettingChange('requestParameterSignature', e.target.value)}
						>
							<option value="default">Default</option>
							<option value="require_signed">Require Signed</option>
							<option value="allow_unsigned">Allow Unsigned</option>
						</SettingSelect>
						<SettingDescription>Cryptographic signature requirements</SettingDescription>
					</SettingItem>
				</SettingsGrid>

				<QuickActions>
					<ActionButton onClick={handleReset}>
						<span style={{ fontSize: '12px' }}>⚙️</span>
						Reset
					</ActionButton>
					<ActionButton variant="primary">
						<span style={{ fontSize: '12px' }}>✅</span>
						Apply Settings
					</ActionButton>
				</QuickActions>
			</Content>
		</Container>
	);
};

export default CompactAdvancedSecuritySettings;
