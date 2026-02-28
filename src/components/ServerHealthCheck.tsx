import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiWifiOff } from '@icons';
import styled, { css, keyframes } from 'styled-components';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const HealthCheckContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
`;

const HealthCard = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  background: ${({ $status }) => {
		switch ($status) {
			case 'checking':
				return '#fef3c7';
			case 'online':
				return '#d1fae5';
			case 'offline':
				return '#fee2e2';
			default:
				return '#f3f4f6';
		}
	}};
  border: 2px solid ${({ $status }) => {
		switch ($status) {
			case 'checking':
				return '#f59e0b';
			case 'online':
				return '#10b981';
			case 'offline':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  animation: ${({ $status }) => ($status === 'checking' ? css`${pulse} 2s infinite` : 'none')};
`;

const HealthHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const HealthIcon = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  color: ${({ $status }) => {
		switch ($status) {
			case 'checking':
				return '#f59e0b';
			case 'online':
				return '#10b981';
			case 'offline':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
  font-size: 1.25rem;
  
  ${({ $status }) =>
		$status === 'checking' &&
		css`
    animation: ${spin} 1s linear infinite;
  `}
`;

const HealthTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const HealthMessage = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const HealthActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const HealthButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const DismissButton = styled.button`
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalDialog = styled.div`
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModalBody = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

interface ServerHealthCheckProps {
	onDismiss?: () => void;
}

const ServerHealthCheck: React.FC<ServerHealthCheckProps> = ({ onDismiss }) => {
	const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
	const [isVisible, setIsVisible] = useState(true);
	const [lastCheck, setLastCheck] = useState<Date | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	const checkServerHealth = useCallback(async () => {
		setStatus('checking');
		setLastCheck(new Date());

		try {
			const response = await fetch('/api/health', {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
				// Add timeout
				signal: AbortSignal.timeout(10000),
			});

			if (response.ok) {
				setStatus('online');
				setRetryCount(0);
			} else {
				setStatus('offline');
			}
		} catch (error) {
			console.warn('Server health check failed:', error);
			setStatus('offline');
			setRetryCount((prev) => prev + 1);
		}
	}, []);

	// Initial check with delay to allow backend to start
	useEffect(() => {
		const timer = setTimeout(() => {
			checkServerHealth();
		}, 2000); // 2 second delay

		return () => clearTimeout(timer);
	}, [checkServerHealth]);

	// Periodic checks every 30 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			if (status === 'offline') {
				checkServerHealth();
			}
		}, 30000);

		return () => clearInterval(interval);
	}, [status, checkServerHealth]);

	const handleRetry = () => {
		checkServerHealth();
	};

	const handleDismiss = () => {
		setIsVisible(false);
		onDismiss?.();
	};

	if (!isVisible) {
		return null;
	}

	const getStatusInfo = () => {
		switch (status) {
			case 'checking':
				return {
					icon: <FiRefreshCw />,
					title: 'Checking Server Status...',
					message: 'Verifying connection to backend server...',
				};
			case 'online':
				return {
					icon: <FiCheckCircle />,
					title: 'Backend Server Online',
					message: 'Backend server is running and responding normally.',
				};
			case 'offline':
				return {
					icon: <FiWifiOff />,
					title: 'Server is not running',
					message: `The backend server is not responding. Start it with \`./run.sh\` from the project root to use logs, custom domain, and other API features.${retryCount > 0 ? ` (${retryCount} failed attempts)` : ''}`,
				};
			default:
				return {
					icon: <FiAlertTriangle />,
					title: 'Unknown Status',
					message: 'Unable to determine server status.',
				};
		}
	};

	const statusInfo = getStatusInfo();

	// When server is offline, show a modal so the user clearly sees "Server is not running"
	if (status === 'offline') {
		return (
			<ModalBackdrop role="alertdialog" aria-modal="true" aria-labelledby="server-offline-title">
				<ModalDialog>
					<ModalTitle id="server-offline-title">
						<HealthIcon $status="offline">{statusInfo.icon}</HealthIcon>
						{statusInfo.title}
					</ModalTitle>
					<ModalBody>{statusInfo.message}</ModalBody>
					<ModalActions>
						<HealthButton type="button" onClick={handleRetry}>
							<FiRefreshCw />
							Retry
						</HealthButton>
						<DismissButton type="button" onClick={handleDismiss}>
							Dismiss
						</DismissButton>
					</ModalActions>
				</ModalDialog>
			</ModalBackdrop>
		);
	}

	return (
		<HealthCheckContainer>
			<HealthCard $status={status}>
				<HealthHeader>
					<HealthIcon $status={status}>{statusInfo.icon}</HealthIcon>
					<HealthTitle>{statusInfo.title}</HealthTitle>
				</HealthHeader>
				<HealthMessage>{statusInfo.message}</HealthMessage>
				{lastCheck && (
					<HealthMessage style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
						Last checked: {lastCheck.toLocaleTimeString()}
					</HealthMessage>
				)}
				<HealthActions>
					<HealthButton type="button" onClick={handleRetry} disabled={status === 'checking'}>
						<FiRefreshCw />
						Retry
					</HealthButton>
					{status === 'online' && (
						<DismissButton type="button" onClick={handleDismiss}>
							Dismiss
						</DismissButton>
					)}
				</HealthActions>
			</HealthCard>
		</HealthCheckContainer>
	);
};

export default ServerHealthCheck;
