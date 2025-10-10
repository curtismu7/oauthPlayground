// src/services/uiSettingsService.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSettings, FiToggleLeft, FiToggleRight, FiRefreshCw, FiKey, FiExternalLink, FiShield } from 'react-icons/fi';
import { CollapsibleHeader } from './collapsibleHeaderService';

// Styled components for the UI Settings panel
const SettingsPanel = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;


const SettingItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 0;
	border-bottom: 1px solid #f1f5f9;

	&:last-child {
		border-bottom: none;
	}
`;

const SettingInfo = styled.div`
	flex: 1;
`;

const SettingLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SettingIcon = styled.div`
	color: #6b7280;
`;

const SettingDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
	background: ${({ $active }) => 
		$active 
			? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
			: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
	};
	border: none;
	border-radius: 1.5rem;
	width: 3rem;
	height: 1.5rem;
	position: relative;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: ${({ $active }) => 
		$active 
			? '0 2px 4px rgba(16, 185, 129, 0.3)' 
			: '0 1px 2px rgba(0, 0, 0, 0.1)'
	};

	&:hover {
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}

	&::after {
		content: '';
		position: absolute;
		top: 0.125rem;
		left: ${({ $active }) => $active ? '1.375rem' : '0.125rem'};
		width: 1.25rem;
		height: 1.25rem;
		background: white;
		border-radius: 50%;
		transition: left 0.2s ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
`;

// Settings interface
export interface UISettings {
	pkceAutoGenerate: boolean;
	authUrlAutoGenerate: boolean;
	tokenAutoExchange: boolean;
	stateAutoGenerate: boolean;
	nonceAutoGenerate: boolean;
	redirectAutoOpen: boolean;
	devicePollingAutoStart: boolean;
	devicePollingAutoScroll: boolean;
}

// Default settings
const DEFAULT_SETTINGS: UISettings = {
	pkceAutoGenerate: false,
	authUrlAutoGenerate: false,
	tokenAutoExchange: false,
	stateAutoGenerate: false,
	nonceAutoGenerate: false,
	redirectAutoOpen: false,
	devicePollingAutoStart: false,
	devicePollingAutoScroll: false,
};

// Settings storage key
const SETTINGS_STORAGE_KEY = 'oauth-playground-ui-settings';

// Hook for managing UI settings
export const useUISettings = () => {
	const [settings, setSettings] = useState<UISettings>(() => {
		try {
			const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
			return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
		} catch {
			return DEFAULT_SETTINGS;
		}
	});

	const updateSetting = (key: keyof UISettings, value: boolean) => {
		const newSettings = { ...settings, [key]: value };
		setSettings(newSettings);
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
	};

	const resetSettings = () => {
		setSettings(DEFAULT_SETTINGS);
		localStorage.removeItem(SETTINGS_STORAGE_KEY);
	};

	return {
		settings,
		updateSetting,
		resetSettings,
	};
};

// Settings configuration
const SETTINGS_CONFIG = [
	{
		key: 'pkceAutoGenerate' as keyof UISettings,
		label: 'PKCE Auto-Generation',
		description: 'Automatically generate PKCE codes when reaching Step 2',
		icon: FiKey,
		flows: ['oauth-authorization-code', 'oidc-authorization-code', 'oidc-hybrid'], // Only flows that use PKCE
	},
	{
		key: 'authUrlAutoGenerate' as keyof UISettings,
		label: 'Authorization URL Auto-Generation',
		description: 'Automatically generate authorization URL when PKCE codes are ready',
		icon: FiExternalLink,
		flows: ['oauth-authorization-code', 'oidc-authorization-code', 'oidc-hybrid', 'oauth-implicit', 'oidc-implicit'], // Flows with authorization URLs
	},
	{
		key: 'tokenAutoExchange' as keyof UISettings,
		label: 'Token Auto-Exchange',
		description: 'Automatically exchange authorization code for tokens',
		icon: FiShield,
		flows: ['oauth-authorization-code', 'oidc-authorization-code', 'oidc-hybrid'], // Only flows that exchange codes for tokens
	},
	{
		key: 'stateAutoGenerate' as keyof UISettings,
		label: 'State Auto-Generation',
		description: 'Automatically generate state parameter for requests',
		icon: FiRefreshCw,
		flows: ['oauth-authorization-code', 'oidc-authorization-code', 'oidc-hybrid', 'oauth-implicit', 'oidc-implicit'], // All flows with authorization requests
	},
	{
		key: 'nonceAutoGenerate' as keyof UISettings,
		label: 'Nonce Auto-Generation',
		description: 'Automatically generate nonce parameter for OIDC flows',
		icon: FiRefreshCw,
		flows: ['oidc-authorization-code', 'oidc-hybrid', 'oidc-implicit'], // Only OIDC flows
	},
	{
		key: 'redirectAutoOpen' as keyof UISettings,
		label: 'Redirect Auto-Open',
		description: 'Automatically open authentication modal when URL is ready',
		icon: FiExternalLink,
		flows: ['oauth-authorization-code', 'oidc-authorization-code', 'oidc-hybrid', 'oauth-implicit', 'oidc-implicit'], // Flows with authorization URLs
	},
	{
		key: 'devicePollingAutoStart' as keyof UISettings,
		label: 'Device Polling Auto-Start',
		description: 'Automatically start polling for device authorization tokens',
		icon: FiRefreshCw,
		flows: ['device-authorization'], // Only device authorization flows
	},
	{
		key: 'devicePollingAutoScroll' as keyof UISettings,
		label: 'Device Polling Auto-Scroll',
		description: 'Automatically scroll to Smart TV display when polling starts',
		icon: FiExternalLink,
		flows: ['device-authorization'], // Only device authorization flows
	},
];

// Flow-specific settings filters
const getFlowSpecificSettings = (flowType?: string) => {
	if (!flowType) return SETTINGS_CONFIG;
	
	const filteredSettings = SETTINGS_CONFIG.filter(config => 
		config.flows.some(flow => flowType.includes(flow))
	);
	
	// If no settings match, show a message for device flows
	if (filteredSettings.length === 0 && flowType.includes('device-authorization')) {
		return [{
			key: 'devicePollingAutoStart' as keyof UISettings,
			label: 'Device Polling Auto-Start',
			description: 'Automatically start polling for device authorization tokens',
			icon: FiRefreshCw,
			flows: ['device-authorization'],
		}, {
			key: 'devicePollingAutoScroll' as keyof UISettings,
			label: 'Device Polling Auto-Scroll',
			description: 'Automatically scroll to Smart TV display when polling starts',
			icon: FiExternalLink,
			flows: ['device-authorization'],
		}];
	}
	
	return filteredSettings;
};

// UI Settings Component
export const UISettingsPanel: React.FC<{ flowType?: string }> = ({ flowType }) => {
	const { settings, updateSetting, resetSettings } = useUISettings();

	return (
		<SettingsPanel>
			<CollapsibleHeader
				title="UI Behavior Settings"
				subtitle="Configure automatic generation and user interaction behavior"
				icon={<FiSettings size={16} />}
				defaultCollapsed={true}
			>
				{getFlowSpecificSettings(flowType).map((config) => {
					const IconComponent = config.icon;
					return (
						<SettingItem key={config.key}>
							<SettingInfo>
								<SettingLabel>
									<SettingIcon>
										<IconComponent size={14} />
									</SettingIcon>
									{config.label}
								</SettingLabel>
								<SettingDescription>
									{config.description}
								</SettingDescription>
							</SettingInfo>
							<ToggleButton
								$active={settings[config.key]}
								onClick={() => updateSetting(config.key, !settings[config.key])}
								title={`${settings[config.key] ? 'Disable' : 'Enable'} ${config.label}`}
							/>
						</SettingItem>
					);
				})}
			</CollapsibleHeader>
		</SettingsPanel>
	);
};

// Service class for easy integration
export class UISettingsService {
	/**
	 * Get current UI settings
	 */
	static getSettings(): UISettings {
		try {
			const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
			return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
		} catch {
			return DEFAULT_SETTINGS;
		}
	}

	/**
	 * Update a specific setting
	 */
	static updateSetting(key: keyof UISettings, value: boolean): void {
		const current = this.getSettings();
		const updated = { ...current, [key]: value };
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
	}

	/**
	 * Reset all settings to defaults
	 */
	static resetSettings(): void {
		localStorage.removeItem(SETTINGS_STORAGE_KEY);
	}

	/**
	 * Check if a specific setting is enabled
	 */
	static isEnabled(setting: keyof UISettings): boolean {
		const settings = this.getSettings();
		const isEnabled = settings[setting];
		console.log(`[UISettingsService] isEnabled('${setting}'):`, {
			setting,
			isEnabled,
			allSettings: settings
		});
		return isEnabled;
	}

	/**
	 * Get settings panel component
	 */
	static getSettingsPanel(): React.ReactElement {
		return <UISettingsPanel />;
	}

	/**
	 * Get flow-specific settings panel component
	 */
	static getFlowSpecificSettingsPanel(flowType: string): React.ReactElement {
		return <UISettingsPanel flowType={flowType} />;
	}
}

export default UISettingsService;
