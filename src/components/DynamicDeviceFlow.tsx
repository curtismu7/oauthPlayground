// src/components/DynamicDeviceFlow.tsx
// Dynamic Device Flow Component that renders the appropriate device interface

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DeviceFlowState } from '../services/deviceFlowService';
import GasPumpDeviceFlow from './GasPumpDeviceFlow';
import SmartTVDeviceFlow from './SmartTVDeviceFlow';
import IndustrialIoTControllerDeviceFlow from './IndustrialIoTControllerDeviceFlow';
import GamingConsoleDeviceFlow from './GamingConsoleDeviceFlow';
import FitnessTrackerDeviceFlow from './FitnessTrackerDeviceFlow';
import MobilePhoneDeviceFlow from './MobilePhoneDeviceFlow';
import AIAgentDeviceFlow from './AIAgentDeviceFlow';
import MCPServerDeviceFlow from './MCPServerDeviceFlow';
import SmartSpeakerDeviceFlow from './SmartSpeakerDeviceFlow';
import SmartVehicleDeviceFlow from './SmartVehicleDeviceFlow';
import SmartPrinterDeviceFlow from './SmartPrinterDeviceFlow';
import POSTerminalDeviceFlow from './POSTerminalDeviceFlow';
import AirportKioskDeviceFlow from './AirportKioskDeviceFlow';
import RingDoorbellDeviceFlow from './RingDoorbellDeviceFlow';
import VizioTVDeviceFlow from './VizioTVDeviceFlow';
import SonyGameControllerDeviceFlow from './SonyGameControllerDeviceFlow';
import BoseSmartSpeakerDeviceFlow from './BoseSmartSpeakerDeviceFlow';
import SquarePOSDeviceFlow from './SquarePOSDeviceFlow';

// Note: All devices now have dedicated realistic components
// No generic layouts are used

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
      return <SmartPrinterDeviceFlow {...commonProps} />;
    
      case 'airport-kiosk':
        return <AirportKioskDeviceFlow {...commonProps} />;
      case 'ring-doorbell':
        return <RingDoorbellDeviceFlow {...commonProps} />;
      case 'vizio-tv':
        return <VizioTVDeviceFlow {...commonProps} />;
      case 'sony-controller':
        return <SonyGameControllerDeviceFlow {...commonProps} />;
      case 'bose-speaker':
        return <BoseSmartSpeakerDeviceFlow {...commonProps} />;
      case 'square-pos':
        return <SquarePOSDeviceFlow {...commonProps} />;
    
    case 'pos-terminal':
      return <POSTerminalDeviceFlow {...commonProps} />;
    
    case 'ai-agent':
      return <AIAgentDeviceFlow {...commonProps} />;
    
    case 'mcp-server':
      return <MCPServerDeviceFlow {...commonProps} />;
    
    case 'smart-speaker':
      return <SmartSpeakerDeviceFlow {...commonProps} />;
    
    case 'smart-vehicle':
      return <SmartVehicleDeviceFlow {...commonProps} />;
    
    default:
      return <GasPumpDeviceFlow {...commonProps} />;
  }
};

export default DynamicDeviceFlow;
