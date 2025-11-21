// src/components/DynamicDeviceFlow.tsx
// Dynamic Device Flow Component that renders the appropriate device interface

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import styled from 'styled-components';
import { DeviceFlowState } from '../services/deviceFlowService';
import AIAgentDeviceFlow from './AIAgentDeviceFlow';
import AirportKioskDeviceFlow from './AirportKioskDeviceFlow';
import BoseSmartSpeakerDeviceFlow from './BoseSmartSpeakerDeviceFlow';
import FitnessTrackerDeviceFlow from './FitnessTrackerDeviceFlow';
import GamingConsoleDeviceFlow from './GamingConsoleDeviceFlow';
import GasPumpDeviceFlow from './GasPumpDeviceFlow';
import IndustrialIoTControllerDeviceFlow from './IndustrialIoTControllerDeviceFlow';
import MCPServerDeviceFlow from './MCPServerDeviceFlow';
import MobilePhoneDeviceFlow from './MobilePhoneDeviceFlow';
import POSTerminalDeviceFlow from './POSTerminalDeviceFlow';
import RingDoorbellDeviceFlow from './RingDoorbellDeviceFlow';
import SmartPrinterDeviceFlow from './SmartPrinterDeviceFlow';
import SmartSpeakerDeviceFlow from './SmartSpeakerDeviceFlow';
import SmartTVDeviceFlow from './SmartTVDeviceFlow';
import SmartVehicleDeviceFlow from './SmartVehicleDeviceFlow';
import SonyGameControllerDeviceFlow from './SonyGameControllerDeviceFlow';
import SquarePOSDeviceFlow from './SquarePOSDeviceFlow';
import VizioTVDeviceFlow from './VizioTVDeviceFlow';

// Standardized Device Container - All devices use same max-width
const StandardizedDeviceContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  
  /* Ensure all child containers respect this constraint */
  & > * {
    max-width: 100%;
  }
`;

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

	const renderDevice = () => {
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

	return <StandardizedDeviceContainer>{renderDevice()}</StandardizedDeviceContainer>;
};

export default DynamicDeviceFlow;
