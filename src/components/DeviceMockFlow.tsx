// src/components/DeviceMockFlow.tsx
// Mock flow to showcase all realistic device components

import React, { useState } from 'react';
import styled from 'styled-components';
import RingDoorbellDeviceFlow from './RingDoorbellDeviceFlow';
import VizioTVDeviceFlow from './VizioTVDeviceFlow';
import SonyGameControllerDeviceFlow from './SonyGameControllerDeviceFlow';
import BoseSmartSpeakerDeviceFlow from './BoseSmartSpeakerDeviceFlow';
import SquarePOSDeviceFlow from './SquarePOSDeviceFlow';
import AirportKioskDeviceFlow from './AirportKioskDeviceFlow';

const MockContainer = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #64748b;
  max-width: 600px;
  margin: 0 auto;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const DeviceCard = styled.div`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const DeviceTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const DeviceDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 1rem;
`;

const MockDeviceFlow: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('ring-doorbell');

  // Mock device flow state
  const mockState = {
    status: 'pending' as const,
    userCode: 'ABCD-EFGH',
    deviceCode: 'mock-device-code-12345',
    verificationUri: 'https://example.com/device',
    verificationUriComplete: 'https://example.com/device?user_code=ABCD-EFGH',
    interval: 5,
    expiresIn: 600,
    tokens: null,
  };

  const mockProps = {
    state: mockState,
    onStateUpdate: () => {},
    onComplete: () => {},
    onError: () => {},
  };

  const devices = [
    {
      id: 'ring-doorbell',
      name: 'Ring Doorbell',
      description: 'Smart home security device with camera and doorbell button',
      component: <RingDoorbellDeviceFlow {...mockProps} />,
    },
    {
      id: 'vizio-tv',
      name: 'Vizio TV',
      description: 'Smart TV with streaming apps and SmartCast interface',
      component: <VizioTVDeviceFlow {...mockProps} />,
    },
    {
      id: 'sony-controller',
      name: 'Sony Controller',
      description: 'PlayStation DualSense controller with gaming interface',
      component: <SonyGameControllerDeviceFlow {...mockProps} />,
    },
    {
      id: 'bose-speaker',
      name: 'Bose Speaker',
      description: 'Smart speaker with music apps and voice control',
      component: <BoseSmartSpeakerDeviceFlow {...mockProps} />,
    },
    {
      id: 'square-pos',
      name: 'Square POS',
      description: 'Point of sale terminal with payment processing',
      component: <SquarePOSDeviceFlow {...mockProps} />,
    },
    {
      id: 'airport-kiosk',
      name: 'Airport Kiosk',
      description: 'Airport check-in kiosk with boarding pass interface',
      component: <AirportKioskDeviceFlow {...mockProps} />,
    },
  ];

  return (
    <MockContainer>
      <Header>
        <Title>Realistic Device Components Showcase</Title>
        <Subtitle>
          Each device is designed to look like actual hardware with authentic branding, 
          realistic interfaces, and proper user experience patterns.
        </Subtitle>
      </Header>

      <DeviceGrid>
        {devices.map((device) => (
          <DeviceCard key={device.id}>
            <DeviceTitle>{device.name}</DeviceTitle>
            <DeviceDescription>{device.description}</DeviceDescription>
            {device.component}
          </DeviceCard>
        ))}
      </DeviceGrid>
    </MockContainer>
  );
};

export default MockDeviceFlow;
