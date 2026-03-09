// src/components/DeviceTypeSelector.tsx
// Device Type Selector for V7 Device Authorization Flow

import { FiSpeaker } from '@icons';
import React from 'react';
import { FaCar, FaTv } from 'react-icons/fa';
import styled from 'styled-components';

const DeviceSelectorContainer = styled.div<{ $isCompact?: boolean }>`
  background: ${(props) => (props.$isCompact ? 'transparent' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)')};
  border-radius: 0.75rem;
  padding: ${(props) => (props.$isCompact ? '0' : '1.5rem')};
  margin-bottom: ${(props) => (props.$isCompact ? '0' : '2rem')};
  border: ${(props) => (props.$isCompact ? 'none' : '1px solid #cbd5e1')};
`;

const SelectorTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DeviceDropdown = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #cbd5e1;
  border-radius: 0.5rem;
  background: white;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
  }
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const DeviceOption = styled.option`
  padding: 0.5rem;
  font-size: 1rem;
`;

export interface DeviceType {
	value: string;
	label: string;
	description: string;
	icon: React.ComponentType;
	emoji: string;
}

// Primary device types - realistic device displays
export const DEVICE_TYPES: DeviceType[] = [
	{
		value: 'apple-tv',
		label: 'Apple TV',
		description: 'Authentic Apple TV interface with tvOS design',
		icon: FaTv,
		emoji: '📺',
	},
	{
		value: 'tesla-car',
		label: 'Tesla Car Display',
		description: 'Realistic Tesla infotainment screen interface',
		icon: FaCar,
		emoji: '🚗',
	},
	{
		value: 'amazon-echo-show',
		label: 'Amazon Echo Show',
		description: 'Authentic Amazon Echo Show with Alexa interface',
		icon: FiSpeaker,
		emoji: '🔊',
	},
];

interface DeviceTypeSelectorProps {
	selectedDevice: string;
	onDeviceChange: (deviceType: string) => void;
	variant?: 'default' | 'compact';
}

const DeviceTypeSelector: React.FC<DeviceTypeSelectorProps> = ({
	selectedDevice,
	onDeviceChange,
	variant = 'default',
}) => {
	const isCompact = variant === 'compact';

	return (
		<DeviceSelectorContainer $isCompact={isCompact}>
			{!isCompact && <SelectorTitle>Simulate Device View</SelectorTitle>}
			<DropdownContainer>
				<DeviceDropdown value={selectedDevice} onChange={(e) => onDeviceChange(e.target.value)}>
					{DEVICE_TYPES.map((device) => (
						<DeviceOption key={device.value} value={device.value}>
							{device.emoji} {device.label} - {device.description}
						</DeviceOption>
					))}
				</DeviceDropdown>
			</DropdownContainer>
		</DeviceSelectorContainer>
	);
};

export { DeviceTypeSelector };
export default DeviceTypeSelector;
