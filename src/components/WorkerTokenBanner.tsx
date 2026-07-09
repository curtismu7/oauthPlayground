import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { globalWorkerTokenService } from '../mfa/services/globalWorkerTokenService';

const BannerContainer = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  animation: slideIn 200ms ease;
  font-size: 13px;
  color: #92400e;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const IconContainer = styled.span`
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1;
`;

const MessageContainer = styled.div`
  flex: 1;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const GetTokenButton = styled.button`
  padding: 6px 12px;
  background: #f59e0b;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms ease;

  &:hover {
    background: #d97706;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #92400e;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 1;
  }
`;

interface WorkerTokenBannerProps {
  onTokenAcquired?: () => void;
  message?: string;
}

export function WorkerTokenBanner({
  onTokenAcquired,
  message = 'Worker token required to run this flow',
}: WorkerTokenBannerProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkConfiguration = async () => {
      const isConfigured = await globalWorkerTokenService.isConfigured();
      setVisible(!isConfigured && !dismissed);
    };

    checkConfiguration();
  }, [dismissed]);

  const handleGetToken = () => {
    window.dispatchEvent(new CustomEvent('open-worker-token-modal'));
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  // Listen for token acquisition
  useEffect(() => {
    const handleTokenAcquired = async () => {
      setDismissed(false);
      const isConfigured = await globalWorkerTokenService.isConfigured();
      setVisible(!isConfigured && !dismissed);
      onTokenAcquired?.();
    };

    window.addEventListener('worker-token-acquired', handleTokenAcquired);
    return () => window.removeEventListener('worker-token-acquired', handleTokenAcquired);
  }, [onTokenAcquired, dismissed]);

  return (
    <BannerContainer $visible={visible}>
      <IconContainer>⚠</IconContainer>
      <MessageContainer>{message}</MessageContainer>
      <ButtonGroup>
        <GetTokenButton onClick={handleGetToken}>Get Token</GetTokenButton>
        <DismissButton onClick={handleDismiss} title="Dismiss">×</DismissButton>
      </ButtonGroup>
    </BannerContainer>
  );
}
