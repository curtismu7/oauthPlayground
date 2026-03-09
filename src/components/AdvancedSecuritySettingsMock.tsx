// src/components/AdvancedSecuritySettingsMock.tsx
// Mock component to demonstrate the Advanced Security Settings service

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
	type AdvancedSecuritySettings,
	advancedSecuritySettingsService,
	type SecurityCategory,
} from '../services/advancedSecuritySettingsService';

type SecurityAssessment = ReturnType<
	typeof advancedSecuritySettingsService.getSecurityLevelAssessment
>;
type SettingKey = keyof AdvancedSecuritySettings;

const ADVANCED_SECURITY_SETTING_KEYS: readonly SettingKey[] = [
	'requestParameterSignature',
	'includeX5tParameter',
	'requestScopesForMultipleResources',
	'additionalRefreshTokenReplayProtection',
	'openIdConnectSessionManagement',
	'terminateUserSessionByIdToken',
	'requirePushedAuthorizationRequests',
	'enforcePKCE',
	'tokenBindingRequired',
	'requireClientAuthentication',
];

const isSettingKey = (key: string): key is SettingKey =>
	(ADVANCED_SECURITY_SETTING_KEYS as readonly string[]).includes(key);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: V9_COLORS.TEXT.WHITE;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Description = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const SecurityAssessment = styled.div<{ level: 'low' | 'medium' | 'high' | 'critical' }>`
  padding: 1rem;
  border-radius: 8px;
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
  margin-bottom: 1.5rem;
`;

const AssessmentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const AssessmentTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
`;

const AssessmentScore = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const Recommendations = styled.div`
  margin-top: 0.75rem;
`;

const RecommendationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
`;

const CategoryCard = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  padding: 1.5rem;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const CategoryTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
`;

const CategoryDescription = styled.p`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin: 0 0 1rem 0;
`;

const SettingItem = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SettingHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
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

const SettingDescription = styled.p`
  font-size: 0.75rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
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
  min-width: 150px;
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

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
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
			case 'danger':
				return `
          background: V9_COLORS.PRIMARY.RED;
          color: white;
          border-color: V9_COLORS.PRIMARY.RED;
          &:hover {
            background: V9_COLORS.PRIMARY.RED_DARK;
            border-color: V9_COLORS.PRIMARY.RED_DARK;
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

const AdvancedSecuritySettingsMock: React.FC = () => {
	const [settings, setSettings] = useState<AdvancedSecuritySettings>(
		advancedSecuritySettingsService.getCurrentSettings()
	);
	const [categories, setCategories] = useState<SecurityCategory[]>([]);
	const [assessment, setAssessment] = useState<SecurityAssessment | null>(null);
	useEffect(() => {
		setCategories(advancedSecuritySettingsService.getAvailableSettings());
		setAssessment(advancedSecuritySettingsService.getSecurityLevelAssessment());
	}, []);

	const handleSettingChange = (settingId: string, value: boolean | string) => {
		if (!isSettingKey(settingId)) {
			return;
		}
		const newSettings: AdvancedSecuritySettings = {
			...settings,
			[settingId]: value as AdvancedSecuritySettings[SettingKey],
		};
		setSettings(newSettings);
		advancedSecuritySettingsService.updateSettings({
			[settingId]: value,
		} as Partial<AdvancedSecuritySettings>);
		setAssessment(advancedSecuritySettingsService.getSecurityLevelAssessment());
	};

	const handleReset = () => {
		advancedSecuritySettingsService.resetToDefaults();
		const defaultSettings = advancedSecuritySettingsService.getCurrentSettings();
		setSettings(defaultSettings);
		setAssessment(advancedSecuritySettingsService.getSecurityLevelAssessment());
	};

	const handleExport = () => {
		const exported = advancedSecuritySettingsService.exportSettings();
		const blob = new Blob([exported], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'advanced-security-settings.json';
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Container>
			<Header>
				<span style={{ fontSize: '24px' }}>🌐</span>
				<div>
					<Title>Advanced Security Settings</Title>
					<Description>
						Configure advanced security features for your OAuth/OIDC application. These settings
						enhance security but may impact compatibility with some clients.
					</Description>
				</div>
			</Header>

			{assessment && (
				<SecurityAssessment level={assessment.overall}>
					<AssessmentHeader>
						<span style={{ fontSize: '20px' }}>🛡️</span>
						<AssessmentTitle>Security Assessment</AssessmentTitle>
						<SecurityBadge level={assessment.overall}>
							{assessment.overall.toUpperCase()}
						</SecurityBadge>
					</AssessmentHeader>
					<AssessmentScore>Security Score: {assessment.score}%</AssessmentScore>

					{assessment.recommendations.length > 0 && (
						<Recommendations>
							<strong>Recommendations:</strong>
							{assessment.recommendations.map((rec, index) => (
								<RecommendationItem key={index}>
									<span style={{ fontSize: '14px' }}>ℹ️</span>
									{rec}
								</RecommendationItem>
							))}
						</Recommendations>
					)}

					{assessment.warnings.length > 0 && (
						<Recommendations>
							<strong>Warnings:</strong>
							{assessment.warnings.map((warning, index) => (
								<RecommendationItem key={index}>
									<span style={{ fontSize: '14px' }}>⚠️</span>
									{warning}
								</RecommendationItem>
							))}
						</Recommendations>
					)}
				</SecurityAssessment>
			)}

			<CategoriesGrid>
				{categories.map((category) => (
					<CategoryCard key={category.id}>
						<CategoryHeader>
							<span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
							<div>
								<CategoryTitle>{category.name}</CategoryTitle>
								<CategoryDescription>{category.description}</CategoryDescription>
							</div>
						</CategoryHeader>

						{category.settings.map((setting) => {
							const currentValue = isSettingKey(setting.id) ? settings[setting.id] : undefined;
							return (
								<SettingItem key={setting.id}>
									<SettingHeader>
										<SettingLabel>
											{setting.type === 'checkbox' ? (
												<SettingInput
													type="checkbox"
													checked={Boolean(currentValue)}
													onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
												/>
											) : null}
											{setting.label}
											{setting.recommended && (
												<SecurityBadge level="high">
													<span style={{ fontSize: '12px' }}>✅</span>
													Recommended
												</SecurityBadge>
											)}
										</SettingLabel>
									</SettingHeader>

									<SettingDescription>{setting.description}</SettingDescription>

									{setting.type === 'dropdown' && setting.options && (
										<SettingSelect
											value={typeof currentValue === 'string' ? currentValue : 'default'}
											onChange={(e) => handleSettingChange(setting.id, e.target.value)}
										>
											{setting.options.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</SettingSelect>
									)}

									{setting.type === 'dropdown' && setting.options && (
										<div
											style={{
												marginTop: '0.5rem',
												fontSize: '0.75rem',
												color: '#6b7280',
											}}
										>
											{
												setting.options.find(
													(opt) =>
														opt.value === (typeof currentValue === 'string' ? currentValue : '')
												)?.description
											}
										</div>
									)}
								</SettingItem>
							);
						})}
					</CategoryCard>
				))}
			</CategoriesGrid>

			<ActionBar>
				<ActionButton onClick={handleReset}>
					<span style={{ fontSize: '16px' }}>🔄</span>
					Reset to Defaults
				</ActionButton>
				<ActionButton onClick={handleExport}>
					<span style={{ fontSize: '16px' }}>📥</span>
					Export Settings
				</ActionButton>
				<ActionButton variant="primary">
					<span style={{ fontSize: '16px' }}>✅</span>
					Save Settings
				</ActionButton>
			</ActionBar>
		</Container>
	);
};

export default AdvancedSecuritySettingsMock;
