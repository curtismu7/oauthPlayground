// src/services/deviceDisplayTemplateService.ts
// Service to configure device-specific content for the DeviceDisplayTemplate

import React from 'react';
import { 
  FiCamera, 
  FiPrinter, 
  FiCreditCard, 
  FiTv, 
  FiActivity,
  FiSmartphone,
  FiVolume2,
  FiMic,
  FiShield,
  FiCar,
  FiGamepad2
} from 'react-icons/fi';
import { DeviceFlowState } from './deviceFlowService';
import { deviceFlowService } from './deviceFlowService';

export interface DeviceDisplayConfig {
  brandName: string;
  brandIcon: string;
  brandColor: string;
  deviceInfo: Array<{ label: string; value: string }>;
  statusIcon: (status: string) => React.ReactNode;
  statusTitle: (status: string) => string;
  statusDescription: (state: DeviceFlowState) => string;
}

export const DeviceDisplayTemplateService = {
  /**
   * Get device-specific configuration for the template
   */
  getDeviceConfig(deviceType: string): DeviceDisplayConfig {
    switch (deviceType) {
      case 'airport-kiosk':
        return {
          brandName: 'CLEAR Kiosk',
          brandIcon: '👁️',
          brandColor: '#0ea5e9',
          deviceInfo: [
            { label: 'Location', value: 'Terminal C - Gate C15' },
            { label: 'Service', value: 'CLEAR Security' },
            { label: 'Status', value: 'Available' }
          ],
          statusIcon: (status) => status === 'authorized' ? '✅' : '⏳',
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Check-in Complete';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => deviceFlowService.getStatusMessage(state)
        };

      case 'smart-printer':
        return {
          brandName: 'HP LaserJet M140we',
          brandIcon: '🖨️',
          brandColor: '#00a86b',
          deviceInfo: [
            { label: 'Model', value: 'HP LaserJet M140we' },
            { label: 'Status', value: 'Ready to Print' },
            { label: 'Paper', value: '100% Loaded' }
          ],
          statusIcon: (status) => <FiPrinter />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Printer Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable printing features'
        };

      case 'square-pos':
      case 'pos-terminal':
        return {
          brandName: 'Square POS',
          brandIcon: '💳',
          brandColor: '#00d4aa',
          deviceInfo: [
            { label: 'Terminal', value: 'Square Terminal #001' },
            { label: 'Register', value: 'Register 1' },
            { label: 'Network', value: 'Connected' }
          ],
          statusIcon: (status) => <FiCreditCard />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Terminal Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable payment processing'
        };

      case 'streaming-tv':
        return {
          brandName: 'Smart TV',
          brandIcon: '📺',
          brandColor: '#3b82f6',
          deviceInfo: [
            { label: 'Brand', value: 'Smart TV' },
            { label: 'Resolution', value: '4K UHD' },
            { label: 'Status', value: 'Connected' }
          ],
          statusIcon: (status) => <FiTv />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'TV Authorized';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable streaming features'
        };

      case 'fitness-wearable':
        return {
          brandName: 'Fitness Tracker',
          brandIcon: '⌚',
          brandColor: '#00ff96',
          deviceInfo: [
            { label: 'Device', value: 'Smart Watch' },
            { label: 'Battery', value: '85%' },
            { label: 'Status', value: 'Connected' }
          ],
          statusIcon: (status) => <FiActivity />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Tracker Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to sync fitness data'
        };

      case 'smartphone':
        return {
          brandName: 'Mobile Device',
          brandIcon: '📱',
          brandColor: '#6366f1',
          deviceInfo: [
            { label: 'Device', value: 'Mobile Phone' },
            { label: 'OS', value: 'iOS/Android' },
            { label: 'Status', value: 'Connected' }
          ],
          statusIcon: (status) => <FiSmartphone />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Device Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable mobile access'
        };

      case 'smart-speaker':
      case 'bose-speaker':
        return {
          brandName: 'Amazon Echo Dot',
          brandIcon: '🗣️',
          brandColor: '#f97316',
          deviceInfo: [
            { label: 'Device', value: 'Amazon Echo Dot (4th Gen)' },
            { label: 'Status', value: 'Online' },
            { label: 'Wake Word', value: 'Alexa' }
          ],
          statusIcon: (status) => <FiMic />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Speaker Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable voice commands'
        };

      case 'ai-agent':
        return {
          brandName: 'AI Agent',
          brandIcon: '🤖',
          brandColor: '#8b5cf6',
          deviceInfo: [
            { label: 'Agent Type', value: 'Intelligent Assistant' },
            { label: 'Status', value: 'Active' },
            { label: 'Capabilities', value: 'Decision Making' }
          ],
          statusIcon: (status) => <FiShield />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Agent Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable autonomous tasks'
        };

      case 'smart-vehicle':
        return {
          brandName: 'Smart Vehicle',
          brandIcon: '🚗',
          brandColor: '#0ea5e9',
          deviceInfo: [
            { label: 'Vehicle', value: 'Smart Car' },
            { label: 'Battery', value: '85%' },
            { label: 'Status', value: 'Parked' }
          ],
          statusIcon: (status) => <FiCar />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Vehicle Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable vehicle controls'
        };

      case 'gaming-console':
        return {
          brandName: 'Gaming Console',
          brandIcon: '🎮',
          brandColor: '#0096ff',
          deviceInfo: [
            { label: 'Console', value: 'Gaming Console' },
            { label: 'Network', value: 'Connected' },
            { label: 'Status', value: 'Online' }
          ],
          statusIcon: (status) => <FiGamepad2 />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Console Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable gaming features'
        };

      case 'gas-pump':
      default:
        return {
          brandName: 'Gas Pump',
          brandIcon: '⛽',
          brandColor: '#1e40af',
          deviceInfo: [
            { label: 'Pump', value: 'Pump #7' },
            { label: 'Fuel', value: 'Regular, Premium' },
            { label: 'Status', value: 'Ready' }
          ],
          statusIcon: (status) => <FiCamera />,
          statusTitle: (status) => {
            switch (status) {
              case 'authorized': return 'Pump Ready';
              case 'pending': return 'Authorization Pending';
              case 'denied': return 'Authorization Denied';
              default: return 'Ready';
            }
          },
          statusDescription: (state) => 'Complete authorization to enable fuel dispensing'
        };
    }
  },

  /**
   * Get formatted authorization code from user code
   */
  formatAuthCode(userCode: string): string {
    return deviceFlowService.formatUserCode(userCode);
  }
};

export default DeviceDisplayTemplateService;

