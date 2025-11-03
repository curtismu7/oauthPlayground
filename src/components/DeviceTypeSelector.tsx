// src/components/DeviceTypeSelector.tsx
// Device Type Selector for V7 Device Authorization Flow

import React from 'react';
import styled from 'styled-components';
import { FaCar, FaGasPump, FaGamepad, FaIndustry, FaRobot, FaServer, FaTv, FaWalking } from 'react-icons/fa';
import { FiPrinter, FiSpeaker } from 'react-icons/fi';
import { MdOutlineAirportShuttle, MdPointOfSale } from 'react-icons/md';
import { IoIosPhonePortrait } from 'react-icons/io';

const DeviceSelectorContainer = styled.div<{ $isCompact?: boolean }>`
  background: ${props => props.$isCompact ? 'transparent' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'};
  border-radius: 0.75rem;
  padding: ${props => props.$isCompact ? '0' : '1.5rem'};
  margin-bottom: ${props => props.$isCompact ? '0' : '2rem'};
  border: ${props => props.$isCompact ? 'none' : '1px solid #cbd5e1'};
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

export const DEVICE_TYPES: DeviceType[] = [
  {
    value: 'streaming-tv',
    label: 'Smart TV',
    description: 'Ideal for streaming apps and smart home displays',
    icon: FaTv,
    emoji: '📺'
  },
  {
    value: 'gas-pump',
    label: 'Gas Pump',
    description: 'Ideal for gas stations, charging stations',
    icon: FaGasPump,
    emoji: '⛽'
  },
  {
    value: 'iot-device',
    label: 'Industrial IoT Controller',
    description: 'Ideal for manufacturing and industrial automation',
    icon: FaIndustry,
    emoji: '🏭'
  },
  {
    value: 'gaming-console',
    label: 'Gaming Console',
    description: 'Ideal for gaming platforms and entertainment systems',
    icon: FaGamepad,
    emoji: '🎮'
  },
  {
    value: 'fitness-wearable',
    label: 'Fitness Tracker',
    description: 'Ideal for wearable devices and health monitoring',
    icon: FaWalking,
    emoji: '⌚'
  },
  {
    value: 'smart-printer',
    label: 'Smart Printer',
    description: 'Ideal for office equipment and document management',
    icon: FiPrinter,
    emoji: '🖨️'
  },
  {
    value: 'airport-kiosk',
    label: 'Airport Kiosk',
    description: 'Ideal for self-service terminals and public displays',
    icon: MdOutlineAirportShuttle,
    emoji: '✈️'
  },
  {
    value: 'pos-terminal',
    label: 'POS Terminal',
    description: 'Ideal for point of sale and payment systems',
    icon: MdPointOfSale,
    emoji: '💳'
  },
  {
    value: 'ai-agent',
    label: 'AI Agent',
    description: 'Ideal for AI assistants and automated systems',
    icon: FaRobot,
    emoji: '🤖'
  },
  {
    value: 'mcp-server',
    label: 'MCP Server',
    description: 'Ideal for server applications and backend services',
    icon: FaServer,
    emoji: '🖥️'
  },
  {
    value: 'smart-speaker',
    label: 'Smart Speaker',
    description: 'Ideal for voice assistants and audio devices',
    icon: FiSpeaker,
    emoji: '🔊'
  },
  {
    value: 'smartphone',
    label: 'Mobile Phone',
    description: 'Ideal for mobile apps and smartphone interfaces',
    icon: IoIosPhonePortrait,
    emoji: '📱'
  },
  {
    value: 'smart-vehicle',
    label: 'Smart Vehicle',
    description: 'Ideal for automotive systems and connected cars',
    icon: FaCar,
    emoji: '🚗'
  }
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
        <DeviceDropdown
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value)}
        >
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