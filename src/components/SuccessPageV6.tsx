// src/components/SuccessPageV6.tsx
// Success Page Component using V6 Architecture

import React, { useState, useEffect } from 'react';
import { 
  FiCheckCircle, 
  FiShield, 
  FiClock, 
  FiUser, 
  FiSmartphone,
  FiKey,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiPlus,
  FiSettings,
  FiArrowRight,
  FiDownload,
  FiRefreshCw,
  FiInfo,
  FiLock,
  FiEye,
  FiTrash2
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import FlowStateService, { type FlowState } from '../services/flowStateService';
import MFAVerificationService, { type MFASession } from '../services/mfaVerificationService';
import PingOneMfaService, { type MfaDevice } from '../services/pingOneMfaService';
import styled from 'styled-components';

export interface SuccessPageProps {
  flowId: string;
  sessionId?: string;
  onRegisterAdditionalDevice: () => void;
  onManageDevices: () => void;
  onReturnToApplication: (sessionData: any) => void;
  onDownloadBackupCodes?: () => void;
  theme?: 'blue' | 'green' | 'purple';
  showDeviceManagement?: boolean;
  showBackupCodes?: boolean;
  returnUrl?: string;
}

const SuccessContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const SuccessHeader = styled.div`
  text-align: center;
  padding: 2rem 0;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  margin-bottom: 2rem;
  color: white;
`;

const SuccessIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
`;

const SuccessTitle = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
`;

const SuccessSubtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
`;

const StatCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const DeviceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DeviceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const DeviceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DeviceIcon = styled.div<{ $type: string }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
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

const DeviceDetails = styled.div`
  flex: 1;
`;

const DeviceName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const DeviceDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const DeviceActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
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

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'outline' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover:not(:disabled) { background: #059669; }
        `;
      case 'outline':
        return `
          background: transparent;
          color: #3b82f6;
          border: 2px solid #3b82f6;
          &:hover:not(:disabled) { 
            background: #3b82f6; 
            color: white;
          }
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

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
`;

export const SuccessPageV6: React.FC<SuccessPageProps> = ({
  flowId,
  sessionId,
  onRegisterAdditionalDevice,
  onManageDevices,
  onReturnToApplication,
  onDownloadBackupCodes,
  theme = 'green',
  showDeviceManagement = true,
  showBackupCodes = false,
  returnUrl
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  // State management
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [mfaSession, setMfaSession] = useState<MFASession | null>(null);
  const [userDevices, setUserDevices] = useState<MfaDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load flow and session data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get flow state
        const flow = FlowStateService.getFlowState(flowId);
        if (!flow) {
          throw new Error('Flow not found');
        }
        setFlowState(flow);

        // Get MFA session if provided
        if (sessionId) {
          const sessionValidation = MFAVerificationService.validateMFASession(sessionId);
          if (sessionValidation.valid && sessionValidation.session) {
            setMfaSession(sessionValidation.session);
          }
        }

        // Load user devices
        if (flow.userId) {
          const devices = await PingOneMfaService.getRegisteredDevices({
            userId: flow.userId,
            accessToken: 'mock_token', // In real implementation, get from auth service
            environmentId: 'mock_env'
          });
          setUserDevices(devices);
        }
      } catch (err) {
        console.error('Failed to load success page data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [flowId, sessionId]);

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
        return 'Authenticator app';
      case 'SMS':
        return `SMS to ${device.phoneNumber || 'registered number'}`;
      case 'EMAIL':
        return `Email to ${device.emailAddress || 'registered email'}`;
      case 'VOICE':
        return `Voice call to ${device.phoneNumber || 'registered number'}`;
      case 'FIDO2':
        return 'Security key or biometric';
      case 'MOBILE':
        return 'PingID mobile app';
      default:
        return 'Multi-factor authentication device';
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleReturnToApplication = () => {
    const sessionData = {
      flowId,
      sessionId,
      userId: flowState?.userId,
      completedAt: flowState?.completedAt,
      securityScore: flowState?.results.securityScore,
      authenticatedDevices: flowState?.results.authenticatedDevices || [],
      returnUrl
    };
    
    onReturnToApplication(sessionData);
  };

  const handleDeviceAction = async (device: MfaDevice, action: 'view' | 'delete') => {
    try {
      switch (action) {
        case 'view':
          // In a real implementation, show device details modal
          console.log('View device details:', device);
          break;
        case 'delete':
          // In a real implementation, delete the device
          console.log('Delete device:', device);
          // Refresh device list
          break;
      }
    } catch (err) {
      console.error(`Failed to ${action} device:`, err);
      setError(`Failed to ${action} device`);
    }
  };

  if (isLoading) {
    return (
      <Layout.Container>
        <Layout.ContentWrapper>
          <Layout.MainCard>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <FiRefreshCw size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                Loading Success Information
              </h3>
              <p style={{ margin: 0, color: '#6b7280' }}>
                Preparing your authentication summary...
              </p>
            </div>
          </Layout.MainCard>
        </Layout.ContentWrapper>
      </Layout.Container>
    );
  }

  if (error || !flowState) {
    return (
      <Layout.Container>
        <Layout.ContentWrapper>
          <Layout.MainCard>
            <Info.InfoBox $variant="danger">
              <FiInfo size={20} />
              <div>
                <Info.InfoTitle>Error Loading Success Page</Info.InfoTitle>
                <Info.InfoText>
                  {error || 'Unable to load authentication flow information.'}
                </Info.InfoText>
              </div>
            </Info.InfoBox>
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
              <Layout.StepHeaderTitle>Authentication Complete</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>
                Your multi-factor authentication has been successfully completed
              </Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <SuccessContainer>
              {/* Success Header */}
              <SuccessHeader>
                <SuccessIcon>
                  <FiCheckCircle size={32} />
                </SuccessIcon>
                <SuccessTitle>Authentication Successful!</SuccessTitle>
                <SuccessSubtitle>
                  You have been securely authenticated and can now access your account
                </SuccessSubtitle>
              </SuccessHeader>

              {/* Authentication Statistics */}
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('stats')}
                  aria-expanded={!collapsedSections.stats}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiShield /> Authentication Summary
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.stats}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.stats && (
                  <Collapsible.CollapsibleContent>
                    <StatsGrid>
                      <StatCard>
                        <StatValue>{flowState.results.authenticatedDevices.length}</StatValue>
                        <StatLabel>Devices Used</StatLabel>
                      </StatCard>
                      <StatCard>
                        <StatValue>
                          {flowState.totalDuration ? formatDuration(flowState.totalDuration) : 'N/A'}
                        </StatValue>
                        <StatLabel>Completion Time</StatLabel>
                      </StatCard>
                      <StatCard>
                        <StatValue>{flowState.results.securityScore || 'N/A'}</StatValue>
                        <StatLabel>Security Score</StatLabel>
                      </StatCard>
                      <StatCard>
                        <StatValue>{flowState.completedAt?.toLocaleTimeString() || 'N/A'}</StatValue>
                        <StatLabel>Completed At</StatLabel>
                      </StatCard>
                    </StatsGrid>

                    <Cards.ParameterGrid>
                      <Cards.ParameterItem>
                        <Cards.ParameterLabel>Flow ID</Cards.ParameterLabel>
                        <Cards.ParameterValue>{flowState.flowId}</Cards.ParameterValue>
                      </Cards.ParameterItem>
                      <Cards.ParameterItem>
                        <Cards.ParameterLabel>User ID</Cards.ParameterLabel>
                        <Cards.ParameterValue>{flowState.userId}</Cards.ParameterValue>
                      </Cards.ParameterItem>
                      <Cards.ParameterItem>
                        <Cards.ParameterLabel>Flow Type</Cards.ParameterLabel>
                        <Cards.ParameterValue>{flowState.flowType}</Cards.ParameterValue>
                      </Cards.ParameterItem>
                      {mfaSession && (
                        <Cards.ParameterItem>
                          <Cards.ParameterLabel>Session Expires</Cards.ParameterLabel>
                          <Cards.ParameterValue>{mfaSession.expiresAt.toLocaleString()}</Cards.ParameterValue>
                        </Cards.ParameterItem>
                      )}
                    </Cards.ParameterGrid>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>

              {/* Device Management */}
              {showDeviceManagement && userDevices.length > 0 && (
                <Collapsible.CollapsibleSection>
                  <Collapsible.CollapsibleHeaderButton
                    onClick={() => toggleSection('devices')}
                    aria-expanded={!collapsedSections.devices}
                  >
                    <Collapsible.CollapsibleTitle>
                      <FiSmartphone /> Your MFA Devices ({userDevices.length})
                    </Collapsible.CollapsibleTitle>
                    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.devices}>
                      <FiRefreshCw />
                    </Collapsible.CollapsibleToggleIcon>
                  </Collapsible.CollapsibleHeaderButton>
                  {!collapsedSections.devices && (
                    <Collapsible.CollapsibleContent>
                      <DeviceList>
                        {userDevices.map((device) => (
                          <DeviceItem key={device.id}>
                            <DeviceInfo>
                              <DeviceIcon $type={device.type}>
                                {getDeviceIcon(device.type)}
                              </DeviceIcon>
                              <DeviceDetails>
                                <DeviceName>{device.nickname || device.deviceName}</DeviceName>
                                <DeviceDescription>{getDeviceDescription(device)}</DeviceDescription>
                                {device.lastUsed && (
                                  <DeviceDescription style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    Last used: {device.lastUsed.toLocaleDateString()}
                                  </DeviceDescription>
                                )}
                              </DeviceDetails>
                            </DeviceInfo>
                            <DeviceActions>
                              <ActionButton
                                onClick={() => handleDeviceAction(device, 'view')}
                                title="View device details"
                              >
                                <FiEye size={16} />
                              </ActionButton>
                              <ActionButton
                                $variant="danger"
                                onClick={() => handleDeviceAction(device, 'delete')}
                                title="Delete device"
                              >
                                <FiTrash2 size={16} />
                              </ActionButton>
                            </DeviceActions>
                          </DeviceItem>
                        ))}
                      </DeviceList>
                    </Collapsible.CollapsibleContent>
                  )}
                </Collapsible.CollapsibleSection>
              )}

              {/* Action Options */}
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('actions')}
                  aria-expanded={!collapsedSections.actions}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiSettings /> Next Steps
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.actions}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.actions && (
                  <Collapsible.CollapsibleContent>
                    <ActionGrid>
                      <Button $variant="success" onClick={handleReturnToApplication}>
                        <FiArrowRight size={16} />
                        Continue to Application
                      </Button>
                      
                      <Button $variant="outline" onClick={onRegisterAdditionalDevice}>
                        <FiPlus size={16} />
                        Add Another Device
                      </Button>
                      
                      <Button onClick={onManageDevices}>
                        <FiSettings size={16} />
                        Manage Devices
                      </Button>
                      
                      {showBackupCodes && onDownloadBackupCodes && (
                        <Button onClick={onDownloadBackupCodes}>
                          <FiDownload size={16} />
                          Download Backup Codes
                        </Button>
                      )}
                    </ActionGrid>

                    <Info.InfoBox $variant="success">
                      <FiLock size={20} />
                      <div>
                        <Info.InfoTitle>Secure Session Established</Info.InfoTitle>
                        <Info.InfoText>
                          Your authentication session is now active and secure. You can safely proceed to use the application.
                        </Info.InfoText>
                        <Info.InfoList>
                          <li>Session will expire automatically for security</li>
                          <li>You can add additional devices for convenience</li>
                          <li>Manage your devices anytime from account settings</li>
                          <li>Contact support if you experience any issues</li>
                        </Info.InfoList>
                      </div>
                    </Info.InfoBox>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>

              {/* Security Information */}
              <Info.InfoBox $variant="info">
                <FiShield size={20} />
                <div>
                  <Info.InfoTitle>Security & Privacy</Info.InfoTitle>
                  <Info.InfoText>
                    Your authentication data is encrypted and securely stored. We follow industry best practices to protect your information.
                  </Info.InfoText>
                </div>
              </Info.InfoBox>
            </SuccessContainer>
          </Layout.StepContentWrapper>
        </Layout.MainCard>
      </Layout.ContentWrapper>
    </Layout.Container>
  );
};

export default SuccessPageV6;