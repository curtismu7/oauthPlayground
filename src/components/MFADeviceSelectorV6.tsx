// src/components/MFADeviceSelectorV6.tsx
// MFA Device Selector Component using V6 Architecture

import React, { useState, useCallback, useEffect } from 'react';
import { 
  FiSmartphone, 
  FiMail, 
  FiMessageSquare, 
  FiPhone, 
  FiShield, 
  FiKey,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import PingOneMfaService, { 
  type MfaDevice, 
  type MfaCredentials,
  type DeviceRegistrationConfig 
} from '../services/pingOneMfaService';
import styled from 'styled-components';

export interface MFADeviceSelectorProps {
  credentials: MfaCredentials;
  onDeviceSelected: (device: MfaDevice) => void;
  onRegisterNewDevice: (config: DeviceRegistrationConfig) => void;
  onDeviceManagement?: (action: 'edit' | 'delete', device: MfaDevice) => void;
  showRegistrationOption?: boolean;
  allowMultipleSelection?: boolean;
  theme?: 'blue' | 'green' | 'purple';
  selectedDeviceId?: string;
}

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const DeviceCard = styled.div<{ $selected?: boolean; $status?: string }>`
  padding: 1.5rem;
  border: 2px solid ${props => {
    if (props.$selected) return '#3b82f6';
    if (props.$status === 'ACTIVE') return '#10b981';
    if (props.$status === 'PENDING_ACTIVATION') return '#f59e0b';
    return '#e5e7eb';
  }};
  border-radius: 0.75rem;
  background: ${props => {
    if (props.$selected) return '#eff6ff';
    if (props.$status === 'ACTIVE') return '#f0fdf4';
    if (props.$status === 'PENDING_ACTIVATION') return '#fffbeb';
    return '#ffffff';
  }};
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const DeviceIcon = styled.div<{ $type: string }>`
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: ${props => {
    switch (props.$type) {
      case 'TOTP': return '#3b82f6';
      case 'SMS': return '#10b981';
      case 'EMAIL': return '#f59e0b';
      case 'VOICE': return '#8b5cf6';
      case 'FIDO2': return '#ef4444';
      case 'MOBILE': return '#06b6d4';
      default: return '#6b7280';
    }
  }};
`;

const DeviceInfo = styled.div`
  flex: 1;
  margin-left: 1rem;
`;

const DeviceTitle = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const DeviceSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
`;

const DeviceStatus = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.$status) {
      case 'ACTIVE':
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case 'PENDING_ACTIVATION':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'BLOCKED':
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const DeviceActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #e5e7eb; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AddDeviceCard = styled.div`
  padding: 2rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 200px;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: translateY(-2px);
  }
`;

const AddDeviceIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const DeviceTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const DeviceTypeCard = styled.div`
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  h4 {
    margin: 0.5rem 0 0.25rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
  }

  p {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const MFADeviceSelectorV6: React.FC<MFADeviceSelectorProps> = ({
  credentials,
  onDeviceSelected,
  onRegisterNewDevice,
  onDeviceManagement,
  showRegistrationOption = true,
  allowMultipleSelection = false,
  theme = 'blue',
  selectedDeviceId
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  const [devices, setDevices] = useState<MfaDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeviceTypes, setShowDeviceTypes] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>(selectedDeviceId);

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, [credentials]);

  const loadDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userDevices = await PingOneMfaService.getRegisteredDevices(credentials);
      setDevices(userDevices);
    } catch (err) {
      console.error('Failed to load MFA devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load MFA devices');
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  const handleDeviceSelect = useCallback((device: MfaDevice) => {
    if (device.status !== 'ACTIVE') {
      return; // Don't allow selection of inactive devices
    }

    setSelectedDevice(device.id);
    onDeviceSelected(device);
  }, [onDeviceSelected]);

  const handleDeviceTypeSelect = useCallback((type: MfaDevice['type']) => {
    const config: DeviceRegistrationConfig = {
      type,
      nickname: `My ${type} Device`
    };
    
    setShowDeviceTypes(false);
    onRegisterNewDevice(config);
  }, [onRegisterNewDevice]);

  const getDeviceIcon = (type: MfaDevice['type']) => {
    switch (type) {
      case 'TOTP':
        return <FiSmartphone size={20} />;
      case 'SMS':
        return <FiMessageSquare size={20} />;
      case 'EMAIL':
        return <FiMail size={20} />;
      case 'VOICE':
        return <FiPhone size={20} />;
      case 'FIDO2':
        return <FiKey size={20} />;
      case 'MOBILE':
        return <FiShield size={20} />;
      default:
        return <FiShield size={20} />;
    }
  };

  const getDeviceDescription = (device: MfaDevice): string => {
    switch (device.type) {
      case 'TOTP':
        return 'Authenticator app (Google Authenticator, Authy, etc.)';
      case 'SMS':
        return `SMS to ${device.phoneNumber || 'registered number'}`;
      case 'EMAIL':
        return `Email to ${device.emailAddress || 'registered email'}`;
      case 'VOICE':
        return `Voice call to ${device.phoneNumber || 'registered number'}`;
      case 'FIDO2':
        return 'Security key or biometric authentication';
      case 'MOBILE':
        return 'PingID mobile app';
      default:
        return 'Multi-factor authentication device';
    }
  };

  const getStatusIcon = (status: MfaDevice['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <FiCheckCircle size={12} />;
      case 'PENDING_ACTIVATION':
        return <FiClock size={12} />;
      case 'BLOCKED':
        return <FiAlertCircle size={12} />;
      default:
        return <FiAlertCircle size={12} />;
    }
  };

  const getStatusText = (status: MfaDevice['status']): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'PENDING_ACTIVATION':
        return 'Pending Activation';
      case 'ACTIVATION_REQUIRED':
        return 'Activation Required';
      case 'BLOCKED':
        return 'Blocked';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Layout.Container>
        <Layout.ContentWrapper>
          <Layout.MainCard>
            <LoadingSpinner>
              <FiRefreshCw size={24} />
              <span style={{ marginLeft: '0.5rem' }}>Loading MFA devices...</span>
            </LoadingSpinner>
          </Layout.MainCard>
        </Layout.ContentWrapper>
      </Layout.Container>
    );
  }

  if (error) {
    return (
      <Layout.Container>
        <Layout.ContentWrapper>
          <Layout.MainCard>
            <Info.InfoBox $variant="danger">
              <FiAlertCircle size={20} />
              <div>
                <Info.InfoTitle>Error Loading Devices</Info.InfoTitle>
                <Info.InfoText>{error}</Info.InfoText>
              </div>
            </Info.InfoBox>
            <div style={{ marginTop: '1rem' }}>
              <ActionButton $variant="primary" onClick={loadDevices}>
                <FiRefreshCw size={14} />
                Retry
              </ActionButton>
            </div>
          </Layout.MainCard>
        </Layout.ContentWrapper>
      </Layout.Container>
    );
  }

  return (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>MFA Device Selection</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>
                {devices.length === 0 
                  ? 'No MFA devices registered' 
                  : `${devices.length} device${devices.length === 1 ? '' : 's'} available`
                }
              </Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            {devices.length === 0 ? (
              <Info.InfoBox $variant="info">
                <FiShield size={20} />
                <div>
                  <Info.InfoTitle>No MFA Devices Registered</Info.InfoTitle>
                  <Info.InfoText>
                    You haven't registered any MFA devices yet. Register your first device to secure your account.
                  </Info.InfoText>
                </div>
              </Info.InfoBox>
            ) : (
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('devices')}
                  aria-expanded={!collapsedSections.devices}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiShield /> Your MFA Devices
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.devices}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.devices && (
                  <Collapsible.CollapsibleContent>
                    <DeviceGrid>
                      {devices.map((device) => (
                        <DeviceCard
                          key={device.id}
                          $selected={selectedDevice === device.id}
                          $status={device.status}
                          onClick={() => handleDeviceSelect(device)}
                        >
                          <DeviceHeader>
                            <DeviceIcon $type={device.type}>
                              {getDeviceIcon(device.type)}
                            </DeviceIcon>
                            <DeviceInfo>
                              <DeviceTitle>{device.nickname || device.deviceName}</DeviceTitle>
                              <DeviceSubtitle>{getDeviceDescription(device)}</DeviceSubtitle>
                            </DeviceInfo>
                          </DeviceHeader>

                          <DeviceStatus $status={device.status}>
                            {getStatusIcon(device.status)}
                            {getStatusText(device.status)}
                          </DeviceStatus>

                          {device.lastUsed && (
                            <DeviceSubtitle style={{ marginTop: '0.5rem' }}>
                              Last used: {device.lastUsed.toLocaleDateString()}
                            </DeviceSubtitle>
                          )}

                          {onDeviceManagement && (
                            <DeviceActions>
                              <ActionButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeviceManagement('edit', device);
                                }}
                              >
                                <FiEdit3 size={12} />
                                Edit
                              </ActionButton>
                              <ActionButton
                                $variant="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeviceManagement('delete', device);
                                }}
                              >
                                <FiTrash2 size={12} />
                                Delete
                              </ActionButton>
                            </DeviceActions>
                          )}
                        </DeviceCard>
                      ))}
                    </DeviceGrid>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            )}

            {showRegistrationOption && (
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('register')}
                  aria-expanded={!collapsedSections.register}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiPlus /> Register New Device
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.register}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.register && (
                  <Collapsible.CollapsibleContent>
                    <Cards.FlowSuitability>
                      <Cards.SuitabilityCard $variant="success">
                        <h4>Recommended</h4>
                        <ul>
                          <li><strong>TOTP Authenticator:</strong> Most secure, works offline</li>
                          <li><strong>FIDO2 Security Key:</strong> Hardware-based security</li>
                        </ul>
                      </Cards.SuitabilityCard>
                      
                      <Cards.SuitabilityCard $variant="info">
                        <h4>Convenient</h4>
                        <ul>
                          <li><strong>SMS:</strong> Quick setup, works on any phone</li>
                          <li><strong>Email:</strong> Easy access, no phone required</li>
                        </ul>
                      </Cards.SuitabilityCard>
                      
                      <Cards.SuitabilityCard $variant="warning">
                        <h4>Alternative</h4>
                        <ul>
                          <li><strong>Voice Call:</strong> For areas with poor SMS coverage</li>
                          <li><strong>Mobile App:</strong> PingID app integration</li>
                        </ul>
                      </Cards.SuitabilityCard>
                    </Cards.FlowSuitability>

                    <DeviceTypeGrid>
                      <DeviceTypeCard onClick={() => handleDeviceTypeSelect('TOTP')}>
                        <DeviceIcon $type="TOTP">
                          <FiSmartphone size={20} />
                        </DeviceIcon>
                        <h4>TOTP Authenticator</h4>
                        <p>Use Google Authenticator, Authy, or similar apps</p>
                      </DeviceTypeCard>

                      <DeviceTypeCard onClick={() => handleDeviceTypeSelect('SMS')}>
                        <DeviceIcon $type="SMS">
                          <FiMessageSquare size={20} />
                        </DeviceIcon>
                        <h4>SMS</h4>
                        <p>Receive codes via text message</p>
                      </DeviceTypeCard>

                      <DeviceTypeCard onClick={() => handleDeviceTypeSelect('EMAIL')}>
                        <DeviceIcon $type="EMAIL">
                          <FiMail size={20} />
                        </DeviceIcon>
                        <h4>Email</h4>
                        <p>Receive codes via email</p>
                      </DeviceTypeCard>

                      <DeviceTypeCard onClick={() => handleDeviceTypeSelect('FIDO2')}>
                        <DeviceIcon $type="FIDO2">
                          <FiKey size={20} />
                        </DeviceIcon>
                        <h4>FIDO2 Security Key</h4>
                        <p>Hardware security keys and biometrics</p>
                      </DeviceTypeCard>

                      <DeviceTypeCard onClick={() => handleDeviceTypeSelect('VOICE')}>
                        <DeviceIcon $type="VOICE">
                          <FiPhone size={20} />
                        </DeviceIcon>
                        <h4>Voice Call</h4>
                        <p>Receive codes via phone call</p>
                      </DeviceTypeCard>

                      <DeviceTypeCard onClick={() => handleDeviceTypeSelect('MOBILE')}>
                        <DeviceIcon $type="MOBILE">
                          <FiShield size={20} />
                        </DeviceIcon>
                        <h4>Mobile App</h4>
                        <p>PingID mobile application</p>
                      </DeviceTypeCard>
                    </DeviceTypeGrid>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            )}

            <Info.InfoBox $variant="info">
              <FiShield size={20} />
              <div>
                <Info.InfoTitle>MFA Security Benefits</Info.InfoTitle>
                <Info.InfoText>
                  Multi-factor authentication adds an extra layer of security to your account by requiring 
                  a second form of verification beyond your password.
                </Info.InfoText>
                <Info.InfoList>
                  <li>Protects against password breaches and phishing attacks</li>
                  <li>Reduces risk of unauthorized account access</li>
                  <li>Meets compliance requirements for secure authentication</li>
                  <li>Provides audit trail of authentication events</li>
                </Info.InfoList>
              </div>
            </Info.InfoBox>
          </Layout.StepContentWrapper>
        </Layout.MainCard>
      </Layout.ContentWrapper>
    </Layout.Container>
  );
};

export default MFADeviceSelectorV6;