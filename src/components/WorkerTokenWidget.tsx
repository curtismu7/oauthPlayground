import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { globalWorkerTokenService } from '../mfa/services/globalWorkerTokenService';

const WidgetContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--oauth-authz-bg-secondary, #ffffff);
  border: 1px solid var(--oauth-authz-border-color, #e5e7eb);
  font-size: 12px;
  font-weight: 500;
  color: var(--oauth-authz-text-primary, #1d2e3f);
`;

const StatusDot = styled.span<{ status: 'active' | 'expired' | 'unconfigured' }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'active':
        return '#22c55e';
      case 'expired':
      case 'unconfigured':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  }};

  ${props => props.status === 'active' && `
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `}
`;

const PulseOnExpiry = styled(StatusDot)<{ timeLeft?: number }>`
  ${props => props.timeLeft && props.timeLeft < 600 && `
    animation: urgentPulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;

    @keyframes urgentPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.3;
      }
    }
  `}
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 500;
  user-select: none;
`;

const Status = styled.span`
  font-size: 12px;
  color: var(--oauth-authz-text-primary, #1d2e3f);
  opacity: 0.7;
`;

const Action = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-left: 4px;
  color: var(--oauth-authz-accent, #1d4ed8);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Separator = styled.span`
  opacity: 0.3;
`;

interface WorkerTokenWidgetProps {
  compact?: boolean;
  className?: string;
}

interface TokenStatus {
  configured: boolean;
  valid: boolean;
  expiresAt?: number;
}

export function WorkerTokenWidget({ compact = false, className }: WorkerTokenWidgetProps) {
  const [status, setStatus] = useState<TokenStatus>({
    configured: false,
    valid: false,
  });

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Poll token status every 10 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const tokenStatus = await globalWorkerTokenService.getStatus();
        setStatus({
          configured: tokenStatus.hasCredentials,
          valid: tokenStatus.tokenValid,
          expiresAt: tokenStatus.expiresAt,
        });
      } catch (err) {
        console.error('Failed to check worker token status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  // Update time left every second
  useEffect(() => {
    if (!status.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, status.expiresAt! - now);

      if (remaining === 0) {
        setTimeLeft(null);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes % 60}m left`);
        } else {
          setTimeLeft(`${minutes}m left`);
        }
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [status.expiresAt]);

  // Listen for token acquisition
  useEffect(() => {
    const handleTokenAcquired = async () => {
      const tokenStatus = await globalWorkerTokenService.getStatus();
      setStatus({
        configured: tokenStatus.hasCredentials,
        valid: tokenStatus.tokenValid,
        expiresAt: tokenStatus.expiresAt,
      });
    };

    window.addEventListener('worker-token-acquired', handleTokenAcquired);
    return () => window.removeEventListener('worker-token-acquired', handleTokenAcquired);
  }, []);

  const handleSetup = () => {
    window.dispatchEvent(new CustomEvent('open-worker-token-modal'));
  };

  const handleRefresh = async () => {
    try {
      await globalWorkerTokenService.getToken();
      const tokenStatus = await globalWorkerTokenService.getStatus();
      setStatus({
        configured: tokenStatus.hasCredentials,
        valid: tokenStatus.tokenValid,
        expiresAt: tokenStatus.expiresAt,
      });
    } catch (err) {
      console.error('Failed to refresh worker token:', err);
    }
  };

  // Not configured state
  if (!status.configured) {
    return (
      <WidgetContainer className={className}>
        <StatusDot status="unconfigured" />
        {!compact && <Label>Worker Token</Label>}
        <Status>Not configured</Status>
        <Separator>·</Separator>
        <Action onClick={handleSetup}>Setup →</Action>
      </WidgetContainer>
    );
  }

  // Expired state
  if (!status.valid) {
    return (
      <WidgetContainer className={className}>
        <StatusDot status="expired" />
        {!compact && <Label>Worker Token</Label>}
        <Status>Expired</Status>
        <Separator>·</Separator>
        <Action onClick={handleSetup}>Renew →</Action>
      </WidgetContainer>
    );
  }

  // Active state
  return (
    <WidgetContainer className={className}>
      <PulseOnExpiry status="active" timeLeft={status.expiresAt ? status.expiresAt - Date.now() : undefined} />
      {!compact && <Label>Worker Token</Label>}
      <Status>Active</Status>
      {timeLeft && (
        <>
          <Separator>·</Separator>
          <Status>{timeLeft}</Status>
        </>
      )}
      <Separator>·</Separator>
      <Action onClick={handleRefresh}>↺ Refresh</Action>
    </WidgetContainer>
  );
}
