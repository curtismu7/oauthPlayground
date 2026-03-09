import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { createModuleLogger } from '../utils/consoleMigrationHelper';
import JSONHighlighter from './JSONHighlighter';

const DeviceFlowContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const DeviceFlowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const DeviceFlowTitle = styled.h3`
  margin: 0;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.div<{ $status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${({ $status }) => {
		switch ($status) {
			case 'pending':
				return `
          background-color: V9_COLORS.BG.WARNING;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
        `;
			case 'authorized':
				return `
          background-color: V9_COLORS.BG.SUCCESS;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'denied':
				return `
          background-color: V9_COLORS.BG.ERROR_BORDER;
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			case 'expired':
				return `
          background-color: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_MEDIUM;
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_MEDIUM;
        `;
		}
	}}
`;

const UserCodeSection = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const UserCodeLabel = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const UserCodeValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
`;

const VerificationSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const VerificationItem = styled.div`
  background: #f9fafb;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  padding: 1rem;
`;

const VerificationLabel = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const VerificationValue = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
  margin-bottom: 0.5rem;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: V9_COLORS.PRIMARY.BLUE;
          color: white;
          &:hover { background-color: V9_COLORS.PRIMARY.BLUE_DARK; }
        `;
			case 'secondary':
				return `
          background-color: V9_COLORS.TEXT.GRAY_MEDIUM;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: V9_COLORS.PRIMARY.GREEN;
          color: white;
          &:hover { background-color: V9_COLORS.PRIMARY.GREEN_DARK; }
        `;
			case 'danger':
				return `
          background-color: V9_COLORS.PRIMARY.RED;
          color: white;
          &:hover { background-color: V9_COLORS.PRIMARY.RED_DARK; }
        `;
		}
	}}
`;

const StatusSection = styled.div`
  background: #f9fafb;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.5rem;
`;

const StatusDetails = styled.div`
  font-size: 0.75rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
`;

const StatusDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatusLabel = styled.span`
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const StatusValue = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const QRCodeSection = styled.div`
  background: #f9fafb;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const QRCodePlaceholder = styled.div`
  width: 200px;
  height: 200px;
  background: V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 0.875rem;
`;

const Alert = styled.div<{ $type: 'info' | 'success' | 'warning' | 'error' }>`
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  
  ${({ $type }) => {
		switch ($type) {
			case 'info':
				return `
          background-color: #dbeafe;
          color: V9_COLORS.PRIMARY.BLUE_DARK;
          border: 1px solid #93c5fd;
        `;
			case 'success':
				return `
          background-color: V9_COLORS.BG.SUCCESS;
          color: V9_COLORS.PRIMARY.GREEN;
          border: 1px solid #86efac;
        `;
			case 'warning':
				return `
          background-color: V9_COLORS.BG.WARNING;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
          border: 1px solid V9_COLORS.BG.WARNING_BORDER;
        `;
			case 'error':
				return `
          background-color: V9_COLORS.BG.ERROR_BORDER;
          color: V9_COLORS.PRIMARY.RED_DARK;
          border: 1px solid #fca5a5;
        `;
		}
	}}
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #f3f4f6;
  border-radius: 50%;
  border-top-color: V9_COLORS.PRIMARY.BLUE;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface DeviceFlowDisplayProps {
	state: DeviceFlowState;
	onStateUpdate?: (state: DeviceFlowState) => void;
	onComplete?: (tokens: Record<string, unknown>) => void;
}

const DeviceFlowDisplay: React.FC<DeviceFlowDisplayProps> = ({
	state,
	onStateUpdate,
	onComplete,
}) => {
	const [isPolling, setIsPolling] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState(0);

	useEffect(() => {
		// Update time remaining every second
		const interval = setInterval(() => {
			const remaining = deviceFlowService.getTimeRemaining(state);
			setTimeRemaining(remaining);

			if (remaining <= 0 && state.status === 'pending') {
				state.status = 'expired';
				onStateUpdate?.(state);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [state, onStateUpdate]);

	const handleCopyUserCode = async () => {
		try {
			await navigator.clipboard.writeText(state.userCode);
			log.info('DeviceFlowDisplay', 'User code copied to clipboard');
		} catch (error) {
			log.error('DeviceFlowDisplay', 'Failed to copy user code', error);
		}
	};

	const handleCopyVerificationUri = async () => {
		try {
			await navigator.clipboard.writeText(state.verificationUri);
			log.info('DeviceFlowDisplay', 'Verification URI copied to clipboard');
		} catch (error) {
			log.error('DeviceFlowDisplay', 'Failed to copy verification URI', error);
		}
	};

	const handleOpenVerificationUri = () => {
		// Use verificationUriComplete if available, otherwise construct it from verificationUri + userCode
		const uriToOpen =
			state.verificationUriComplete ||
			(state.verificationUri && state.userCode
				? `${state.verificationUri}?user_code=${state.userCode}`
				: state.verificationUri);

		if (!uriToOpen) {
			log.error('DeviceFlowDisplay', 'No verification URI available to open');
			return;
		}

		window.open(uriToOpen, '_blank');
		log.info('DeviceFlowDisplay', 'Verification URI opened in new tab', { uri: uriToOpen });
	};

	const handleStartPolling = () => {
		if (isPolling) return;

		setIsPolling(true);
		log.info('DeviceFlowDisplay', 'Starting device flow polling');

		// Note: In a real implementation, you would need the environment ID and client credentials
		// For demo purposes, we'll simulate the polling
		setTimeout(() => {
			setIsPolling(false);
			// Simulate successful authorization
			const mockTokens = {
				access_token: `mock_access_token_${Date.now()}`,
				id_token: `mock_id_token_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
			};

			state.status = 'authorized';
			state.tokens = mockTokens;
			onStateUpdate?.(state);
			onComplete?.(mockTokens);
		}, 5000); // Simulate 5 second delay
	};

	const handleClearState = () => {
		deviceFlowService.clearDeviceFlowState();
		onStateUpdate?.(state);
	};

	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	const getAlertType = (): 'info' | 'success' | 'warning' | 'error' => {
		switch (state.status) {
			case 'pending':
				return 'info';
			case 'authorized':
				return 'success';
			case 'denied':
				return 'error';
			case 'expired':
				return 'warning';
			default:
				return 'info';
		}
	};

	return (
		<DeviceFlowContainer>
			<DeviceFlowHeader>
				<DeviceFlowTitle>
					<span>❓</span>
					Device Authorization
				</DeviceFlowTitle>
				<StatusBadge $status={state.status}>{state.status}</StatusBadge>
			</DeviceFlowHeader>

			<Alert $type={getAlertType()}>{deviceFlowService.getStatusMessage(state)}</Alert>

			{state.status === 'pending' && (
				<>
					<UserCodeSection>
						<UserCodeLabel>Enter this code on your device:</UserCodeLabel>
						<UserCodeValue>{deviceFlowService.formatUserCode(state.userCode)}</UserCodeValue>
						<Button $variant="secondary" onClick={handleCopyUserCode}>
							<span>📋</span>
							Copy Code
						</Button>
					</UserCodeSection>

					<VerificationSection>
						<VerificationItem>
							<VerificationLabel>Verification URI</VerificationLabel>
							<VerificationValue>{state.verificationUri}</VerificationValue>
							<Button $variant="secondary" onClick={handleCopyVerificationUri}>
								<span>📋</span>
								Copy URI
							</Button>
						</VerificationItem>
						<VerificationItem>
							<VerificationLabel>Complete URI</VerificationLabel>
							<VerificationValue>{state.verificationUriComplete}</VerificationValue>
							<Button $variant="primary" onClick={handleOpenVerificationUri}>
								<span>🔗</span>
								Open
							</Button>
						</VerificationItem>
					</VerificationSection>

					<QRCodeSection>
						<div>QR Code (for mobile apps)</div>
						<QRCodePlaceholder>
							QR Code would be displayed here
							<br />
							<small>URI: {state.verificationUriComplete}</small>
						</QRCodePlaceholder>
					</QRCodeSection>
				</>
			)}

			{state.status === 'authorized' && state.tokens && (
				<div>
					<h4>Authorization Successful!</h4>
					<div
						style={{
							background: '#f0fdf4',
							padding: '1rem',
							borderRadius: '0.375rem',
							marginBottom: '1rem',
						}}
					>
						<JSONHighlighter data={state.tokens} />
					</div>
				</div>
			)}

			<StatusSection>
				<StatusMessage>
					{state.status === 'pending' && isPolling && (
						<>
							<LoadingSpinner style={{ marginRight: '0.5rem' }} />
							Polling for authorization...
						</>
					)}
					{state.status === 'pending' && !isPolling && 'Ready to poll for authorization'}
					{state.status === 'authorized' && 'Authorization completed successfully'}
					{state.status === 'denied' && 'Authorization was denied'}
					{state.status === 'expired' && 'Device code has expired'}
				</StatusMessage>

				<StatusDetails>
					<StatusDetail>
						<StatusLabel>Status</StatusLabel>
						<StatusValue>{state.status}</StatusValue>
					</StatusDetail>
					<StatusDetail>
						<StatusLabel>Time Remaining</StatusLabel>
						<StatusValue>{formatTime(timeRemaining)}</StatusValue>
					</StatusDetail>
					<StatusDetail>
						<StatusLabel>Poll Count</StatusLabel>
						<StatusValue>{state.pollCount}</StatusValue>
					</StatusDetail>
					<StatusDetail>
						<StatusLabel>Last Polled</StatusLabel>
						<StatusValue>
							{state.lastPolled ? state.lastPolled.toLocaleTimeString() : 'Never'}
						</StatusValue>
					</StatusDetail>
				</StatusDetails>
			</StatusSection>

			<div>
				{state.status === 'pending' && !isPolling && (
					<Button $variant="primary" onClick={handleStartPolling}>
						<span>🔄</span>
						Start Polling
					</Button>
				)}

				{state.status === 'pending' && isPolling && (
					<Button $variant="secondary" disabled>
						<LoadingSpinner />
						Polling...
					</Button>
				)}

				<Button $variant="danger" onClick={handleClearState}>
					<span>❌</span>
					Clear State
				</Button>
			</div>
		</DeviceFlowContainer>
	);
};

export default DeviceFlowDisplay;
