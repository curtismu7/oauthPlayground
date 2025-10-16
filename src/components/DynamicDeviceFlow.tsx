// src/components/DynamicDeviceFlow.tsx
// Dynamic Device Flow Component that renders the appropriate device interface

import React from 'react';
import { DeviceFlowState } from '../services/deviceFlowService';
import GasPumpDeviceFlow from './GasPumpDeviceFlow';
import SmartTVDeviceFlow from './SmartTVDeviceFlow';
import IndustrialIoTControllerDeviceFlow from './IndustrialIoTControllerDeviceFlow';
import GamingConsoleDeviceFlow from './GamingConsoleDeviceFlow';
import FitnessTrackerDeviceFlow from './FitnessTrackerDeviceFlow';
import MobilePhoneDeviceFlow from './MobilePhoneDeviceFlow';

// Placeholder components for devices not yet implemented
const PlaceholderDeviceFlow: React.FC<{
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
  deviceName: string;
  deviceEmoji: string;
}> = ({ state, onStateUpdate, onComplete, onError, deviceName, deviceEmoji }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      border: '2px solid #cbd5e1',
      borderRadius: '1rem',
      padding: '2rem',
      margin: '2rem 0',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{deviceEmoji}</div>
      <h3 style={{ color: '#1e293b', marginBottom: '1rem' }}>{deviceName} Interface</h3>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        This device interface is coming soon! The OAuth flow will work the same way.
      </p>
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        margin: '1rem 0'
      }}>
        <h4 style={{ color: '#374151', marginBottom: '1rem' }}>Device Authorization Flow</h4>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          This device would display the authorization code and QR code for the OAuth flow.
          The functionality is the same across all device types.
        </p>
      </div>
    </div>
  );
};

interface DynamicDeviceFlowProps {
  deviceType: string;
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const DynamicDeviceFlow: React.FC<DynamicDeviceFlowProps> = ({
  deviceType,
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const commonProps = {
    state,
    onStateUpdate,
    onComplete,
    onError,
  };

  switch (deviceType) {
    case 'gas-pump':
      return <GasPumpDeviceFlow {...commonProps} />;
    
    case 'streaming-tv':
      return <SmartTVDeviceFlow {...commonProps} />;
    
    case 'iot-device':
      return <IndustrialIoTControllerDeviceFlow {...commonProps} />;
    
    case 'gaming-console':
      return <GamingConsoleDeviceFlow {...commonProps} />;
    
    case 'fitness-wearable':
      return <FitnessTrackerDeviceFlow {...commonProps} />;
    
    case 'smartphone':
      return <MobilePhoneDeviceFlow {...commonProps} />;
    
    case 'smart-printer':
      return (
        <PlaceholderDeviceFlow
          {...commonProps}
          deviceName="Smart Printer"
          deviceEmoji="🖨️"
        />
      );
    
    case 'airport-kiosk':
      return (
        <PlaceholderDeviceFlow
          {...commonProps}
          deviceName="Airport Kiosk"
          deviceEmoji="✈️"
        />
      );
    
    case 'pos-terminal':
      return (
        <PlaceholderDeviceFlow
          {...commonProps}
          deviceName="POS Terminal"
          deviceEmoji="💳"
        />
      );
    
    case 'ai-agent':
      return (
        <PlaceholderDeviceFlow
          {...commonProps}
          deviceName="AI Agent"
          deviceEmoji="🤖"
        />
      );
    
    case 'mcp-server':
      return (
        <PlaceholderDeviceFlow
          {...commonProps}
          deviceName="MCP Server"
          deviceEmoji="🖥️"
        />
      );
    
    case 'smart-speaker':
      return (
        <PlaceholderDeviceFlow
          {...commonProps}
          deviceName="Smart Speaker"
          deviceEmoji="🔊"
        />
      );
    
    case 'smart-vehicle':
      return (
        <PlaceholderDeviceFlow
          {...commonProps}
          deviceName="Smart Vehicle"
          deviceEmoji="🚗"
        />
      );
    
    default:
      return <GasPumpDeviceFlow {...commonProps} />;
  }
};

export default DynamicDeviceFlow;
