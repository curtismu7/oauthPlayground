import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { StepNavigationV8 } from '../components/StepNavigationV8';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  overflow-y: auto;
  padding-bottom: 40px;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const SettingsCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const CardTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
`;

const CardDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.span`
  color: #374151;
  font-size: 0.875rem;
`;

const SettingValue = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #2563eb;
  }

  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

interface SettingItem {
	label: string;
	value: string | 'toggle';
	enabled?: boolean;
}

export const MFASettingsV8: React.FC = () => {
	const navigate = useNavigate();

	const settings = [
		{
			title: 'Pairing Settings',
			description: 'Configure device pairing requirements and policies',
			items: [
				{ label: 'Require device verification', value: 'toggle', enabled: true },
				{ label: 'Auto-approve trusted devices', value: 'toggle', enabled: false },
				{ label: 'Pairing timeout (minutes)', value: '15' },
				{ label: 'Maximum paired devices', value: '5' },
			],
		},
		{
			title: 'Lockout Policies',
			description: 'Set up account lockout and security policies',
			items: [
				{ label: 'Failed attempts threshold', value: '5' },
				{ label: 'Lockout duration (minutes)', value: '30' },
				{ label: 'Progressive lockout', value: 'toggle', enabled: true },
				{ label: 'Admin override allowed', value: 'toggle', enabled: false },
			],
		},
		{
			title: 'Device Limits',
			description: 'Manage device registration and usage limits',
			items: [
				{ label: 'Devices per user', value: '10' },
				{ label: 'Concurrent sessions', value: '3' },
				{ label: 'Device expiration (days)', value: '90' },
				{ label: 'Require device re-auth', value: 'toggle', enabled: true },
			],
		},
		{
			title: 'OTP Configuration',
			description: 'Configure one-time password settings',
			items: [
				{ label: 'OTP length', value: '6' },
				{ label: 'OTP validity (seconds)', value: '300' },
				{ label: 'Allow backup codes', value: 'toggle', enabled: true },
				{ label: 'Hash algorithm', value: 'SHA256' },
			],
		},
		{
			title: 'Security Policies',
			description: 'Define security requirements and enforcement',
			items: [
				{ label: 'Minimum password strength', value: 'Medium' },
				{ label: 'Require biometric fallback', value: 'toggle', enabled: false },
				{ label: 'Geolocation verification', value: 'toggle', enabled: false },
				{ label: 'Risk-based authentication', value: 'toggle', enabled: true },
			],
		},
	];

	const renderSettingValue = (item: SettingItem) => {
		if (item.value === 'toggle') {
			return (
				<ToggleSwitch>
					<ToggleInput type="checkbox" defaultChecked={item.enabled} />
					<ToggleSlider />
				</ToggleSwitch>
			);
		}
		return <SettingValue>{item.value}</SettingValue>;
	};

	return (
		<Container>
			<MFAHeaderV8
				title="MFA Settings"
				description="Configure multi-factor authentication policies and settings"
				versionTag="V8"
				currentPage="settings"
				showRestartFlow={false}
				showBackToMain={true}
				headerColor="blue"
			/>

			<SettingsGrid>
				{settings.map((section, index) => (
					<SettingsCard key={index}>
						<CardTitle>{section.title}</CardTitle>
						<CardDescription>{section.description}</CardDescription>
						{section.items.map((item: SettingItem, itemIndex: number) => (
							<SettingItem key={itemIndex}>
								<SettingLabel>{item.label}</SettingLabel>
								{renderSettingValue(item)}
							</SettingItem>
						))}
					</SettingsCard>
				))}
			</SettingsGrid>

			<StepNavigationV8
				steps={['Configuration', 'Testing', 'Deployment']}
				currentStep={0}
				onStepChange={() => {}}
				showNext={false}
				showPrevious={true}
				onPrevious={() => navigate('/v8/mfa-hub')}
			/>
		</Container>
	);
};
