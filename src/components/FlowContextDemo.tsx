// src/components/FlowContextDemo.tsx
// Demo component showcasing FlowContextService functionality

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSettings, FiArrowRight, FiRefreshCw, FiTrash2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import FlowContextService, { type FlowContext } from '../services/flowContextService';
import RedirectStateManager, { type FlowState } from '../services/redirectStateManager';
import FlowContextUtils from '../services/flowContextUtils';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f9fafb;
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
`;

const Section = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background: #e5e7eb; }
        `;
    }
  }}
`;

const StatusDisplay = styled.div<{ status: 'success' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;

  ${props => {
    switch (props.status) {
      case 'success':
        return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case 'error':
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      default:
        return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
    }
  }}
`;

const CodeBlock = styled.pre`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

export const FlowContextDemo: React.FC = () => {
  const [flowType, setFlowType] = useState('authorization-code');
  const [currentStep, setCurrentStep] = useState(1);
  const [returnPath, setReturnPath] = useState('/flows/authorization-code');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [activeContext, setActiveContext] = useState<FlowContext | null>(null);
  const [flowIntegrity, setFlowIntegrity] = useState<any>(null);

  // Update return path when flow type changes
  useEffect(() => {
    const path = FlowContextService.buildReturnPath(flowType, currentStep.toString());
    setReturnPath(path);
  }, [flowType, currentStep]);

  // Check for active context on mount and periodically
  useEffect(() => {
    const checkActiveContext = () => {
      const context = FlowContextService.getFlowContext();
      setActiveContext(context);
      
      const integrity = FlowContextUtils.validateFlowIntegrity();
      setFlowIntegrity(integrity);
    };

    checkActiveContext();
    const interval = setInterval(checkActiveContext, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveContext = () => {
    try {
      const flowState: FlowState = {
        currentStep,
        credentials: {
          environmentId: 'demo-env',
          clientId: 'demo-client',
          clientSecret: 'demo-secret'
        },
        formData: { demo: 'data' }
      };

      const context = FlowContextService.createFlowContext(
        flowType,
        returnPath,
        currentStep,
        { step: currentStep },
        flowState.credentials
      );

      const success = FlowContextService.saveFlowContext(`${flowType}-demo`, context);
      
      if (success) {
        setStatus({ type: 'success', message: 'Flow context saved successfully!' });
        setActiveContext(context);
      } else {
        setStatus({ type: 'error', message: 'Failed to save flow context' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleSimulateRedirect = () => {
    try {
      const flowState: FlowState = {
        currentStep,
        credentials: {
          environmentId: 'demo-env',
          clientId: 'demo-client'
        }
      };

      const flowId = FlowContextUtils.initializeOAuthFlow(flowType, currentStep, flowState);
      setStatus({ type: 'success', message: `OAuth flow initialized with ID: ${flowId}` });
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to initialize OAuth flow: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleSimulateCallback = () => {
    try {
      const callbackData = {
        code: 'demo-auth-code',
        state: 'demo-state',
        session_state: 'demo-session'
      };

      const result = FlowContextUtils.handleOAuthCallback(callbackData);
      
      if (result.success) {
        setStatus({ type: 'success', message: `Callback handled successfully! Redirect to: ${result.redirectUrl}` });
      } else {
        setStatus({ type: 'error', message: `Callback failed: ${result.error}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Callback error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleClearContext = () => {
    try {
      FlowContextService.clearFlowContext();
      RedirectStateManager.cleanupExpiredStates();
      setActiveContext(null);
      setStatus({ type: 'success', message: 'All flow context cleared!' });
    } catch (error) {
      setStatus({ type: 'error', message: `Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleEmergencyCleanup = () => {
    try {
      FlowContextUtils.emergencyCleanup();
      setActiveContext(null);
      setStatus({ type: 'success', message: 'Emergency cleanup completed!' });
    } catch (error) {
      setStatus({ type: 'error', message: `Emergency cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  return (
    <Container>
      <Header>
        <Title>Flow Context Service Demo</Title>
        <Subtitle>
          Interactive demonstration of centralized flow state and redirect management
        </Subtitle>
      </Header>

      {status && (
        <StatusDisplay status={status.type}>
          {status.type === 'success' && <FiCheckCircle size={16} />}
          {status.type === 'error' && <FiAlertCircle size={16} />}
          {status.type === 'info' && <FiSettings size={16} />}
          {status.message}
        </StatusDisplay>
      )}

      <Grid>
        <div>
          <Section>
            <SectionTitle>
              <FiSettings size={20} />
              Flow Configuration
            </SectionTitle>
            
            <FormGroup>
              <Label>Flow Type</Label>
              <Select value={flowType} onChange={(e) => setFlowType(e.target.value)}>
                <option value="authorization-code">Authorization Code</option>
                <option value="authorization-code-v5">Authorization Code V5</option>
                <option value="rar">RAR</option>
                <option value="rar-v5">RAR V5</option>
                <option value="rar-v6">RAR V6</option>
                <option value="pingone-mfa">PingOne MFA</option>
                <option value="pingone-mfa-v5">PingOne MFA V5</option>
                <option value="pingone-mfa-v6">PingOne MFA V6</option>
                <option value="client-credentials">Client Credentials</option>
                <option value="device-authorization">Device Authorization</option>
                <option value="implicit">Implicit</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Current Step</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={currentStep}
                onChange={(e) => setCurrentStep(parseInt(e.target.value) || 0)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Return Path</Label>
              <Input
                value={returnPath}
                onChange={(e) => setReturnPath(e.target.value)}
                placeholder="/flows/authorization-code"
              />
            </FormGroup>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={handleSaveContext}>
                <FiSettings size={14} />
                Save Context
              </Button>
              <Button onClick={handleSimulateRedirect}>
                <FiArrowRight size={14} />
                Simulate Redirect
              </Button>
              <Button onClick={handleSimulateCallback}>
                <FiRefreshCw size={14} />
                Simulate Callback
              </Button>
            </div>
          </Section>

          <Section>
            <SectionTitle>
              <FiTrash2 size={20} />
              Cleanup Actions
            </SectionTitle>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button onClick={handleClearContext}>
                <FiTrash2 size={14} />
                Clear Context
              </Button>
              <Button variant="danger" onClick={handleEmergencyCleanup}>
                <FiAlertCircle size={14} />
                Emergency Cleanup
              </Button>
            </div>
          </Section>
        </div>

        <div>
          <Section>
            <SectionTitle>Active Flow Context</SectionTitle>
            {activeContext ? (
              <CodeBlock>{JSON.stringify(activeContext, null, 2)}</CodeBlock>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No active flow context</p>
            )}
          </Section>

          <Section>
            <SectionTitle>Flow Integrity Status</SectionTitle>
            {flowIntegrity ? (
              <div>
                <StatusDisplay status={flowIntegrity.valid ? 'success' : 'error'}>
                  {flowIntegrity.valid ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                  {flowIntegrity.valid ? 'Flow integrity is valid' : 'Flow integrity issues detected'}
                </StatusDisplay>
                
                {flowIntegrity.issues.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Issues:</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {flowIntegrity.issues.map((issue: string, index: number) => (
                        <li key={index} style={{ fontSize: '0.875rem', color: '#ef4444' }}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {flowIntegrity.recommendations.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>Recommendations:</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {flowIntegrity.recommendations.map((rec: string, index: number) => (
                        <li key={index} style={{ fontSize: '0.875rem', color: '#f59e0b' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Checking flow integrity...</p>
            )}
          </Section>
        </div>
      </Grid>
    </Container>
  );
};

export default FlowContextDemo;