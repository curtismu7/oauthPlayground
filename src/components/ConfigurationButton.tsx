import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSettings } from 'react-icons/fi';
import { FlowConfiguration, type FlowConfig } from './FlowConfiguration';
import { getDefaultConfig } from '../utils/flowConfigDefaults';

interface ConfigurationButtonProps {
  flowType: string;
  currentConfig?: Partial<FlowConfig>;
  onConfigChange?: (config: FlowConfig) => void;
  className?: string;
}

const Button = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  margin-bottom: 1.5rem;

  &:hover {
    background: #4b5563;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ConfigurationButton: React.FC<ConfigurationButtonProps> = ({
  flowType,
  currentConfig,
  onConfigChange,
  className
}) => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState<FlowConfig>(() => {
    const defaultConfig = getDefaultConfig(flowType);
    return { ...defaultConfig, ...currentConfig };
  });

  const handleConfigChange = (newConfig: FlowConfig) => {
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const getFlowSpecificTitle = (flowType: string) => {
    switch (flowType) {
      case 'authorization_code':
        return 'Authorization Code Flow Configuration';
      case 'implicit':
        return 'Implicit Flow Configuration';
      case 'pkce':
        return 'PKCE Flow Configuration';
      case 'device_code':
        return 'Device Code Flow Configuration';
      case 'client_credentials':
        return 'Client Credentials Flow Configuration';
      case 'hybrid':
        return 'Hybrid Flow Configuration';
      case 'id_tokens':
        return 'ID Tokens Flow Configuration';
      case 'userinfo':
        return 'UserInfo Flow Configuration';
      default:
        return 'OAuth Flow Configuration';
    }
  };

  return (
    <>
      <Button 
        className={className}
        onClick={() => setShowModal(true)}
        title={`Configure ${flowType} flow parameters`}
      >
        <FiSettings />
        Show Configuration
      </Button>

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{getFlowSpecificTitle(flowType)}</ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>
                ×
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <FlowConfiguration
                config={config}
                onConfigChange={handleConfigChange}
                flowType={flowType}
              />
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default ConfigurationButton;
