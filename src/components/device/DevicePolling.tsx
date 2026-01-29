// Device polling component for OIDC Device Code flow

import React, { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiLoader, FiXCircle } from 'react-icons/fi';
import styled from 'styled-components';
import { DeviceCodeTokens } from '../../types/deviceCode';
import { pollTokenEndpoint } from '../../utils/deviceCode';
import { logger } from '../../utils/logger';
import { createSmartPoller, formatPollingStatus, PollingOptions } from '../../utils/polling';

interface DevicePollingProps {
	deviceCode: string;
	clientId: string;
	tokenEndpoint: string;
	interval: number;
	onSuccess: (tokens: DeviceCodeTokens) => void;
	onError: (error: Error) => void;
	onProgress: (attempt: number, status: string) => void;
}

const PollingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusIcon = styled.div<{ status: 'polling' | 'success' | 'error' | 'expired' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${(props) => {
		switch (props.status) {
			case 'success':
				return '#dcfce7';
			case 'error':
				return '#fef2f2';
			case 'expired':
				return '#fef3c7';
			default:
				return '#eff6ff';
		}
	}};
  color: ${(props) => {
		switch (props.status) {
			case 'success':
				return '#16a34a';
			case 'error':
				return '#dc2626';
			case 'expired':
				return '#d97706';
			default:
				return '#3b82f6';
		}
	}};
`;

const StatusContent = styled.div`
  flex: 1;
`;

const StatusTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const StatusDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
`;

const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${(props) => props.progress}%;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
`;

const PollingDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
`;

const DetailLabel = styled.span`
  color: #6b7280;
`;

const DetailValue = styled.span`
  color: #1f2937;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 0.875rem;
`;

const ExpiredMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #d97706;
  font-size: 0.875rem;
`;

const DevicePolling: React.FC<DevicePollingProps> = ({
	deviceCode,
	clientId,
	tokenEndpoint,
	interval,
	onSuccess,
	onError,
	onProgress,
}) => {
	const [pollingStatus, setPollingStatus] = useState<'polling' | 'success' | 'error' | 'expired'>(
		'polling'
	);
	const [currentAttempt, setCurrentAttempt] = useState(0);
	const [currentStatus, setCurrentStatus] = useState('Starting polling...');
	const [progress, setProgress] = useState(0);
	const [startTime] = useState(Date.now());
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [_tokens, setTokens] = useState<DeviceCodeTokens | null>(null);

	const pollFn = useCallback(async () => {
		return await pollTokenEndpoint(tokenEndpoint, deviceCode, clientId, interval);
	}, [tokenEndpoint, deviceCode, clientId, interval]);

	useEffect(() => {
		const options: PollingOptions = {
			interval,
			maxAttempts: 120, // 10 minutes with 5-second intervals
			maxDuration: 600000, // 10 minutes
			onProgress: (attempt, totalAttempts, status) => {
				setCurrentAttempt(attempt);
				setCurrentStatus(status);
				setProgress((attempt / (totalAttempts || 120)) * 100);
				onProgress(attempt, status);
				logger.info('DevicePolling', 'Polling progress', { attempt, status });
			},
			onSuccess: (response) => {
				setPollingStatus('success');
				setCurrentStatus('Authorization successful!');
				setProgress(100);
				setTokens(response as DeviceCodeTokens);
				onSuccess(response as DeviceCodeTokens);
				logger.success('DevicePolling', 'Polling completed successfully', { tokens: response });
			},
			onError: (error) => {
				setPollingStatus('error');
				setErrorMessage(error.message);
				setCurrentStatus('Authorization failed');
				onError(error);
				logger.error('DevicePolling', 'Polling failed', error);
			},
			onSlowDown: (newInterval) => {
				logger.info('DevicePolling', 'Polling slowed down', { newInterval });
			},
		};

		const poller = createSmartPoller(pollFn, options);

		// Start polling
		poller
			.start()
			.then((result) => {
				if (!result.success) {
					if (result.reason === 'timeout' || result.reason === 'max-attempts') {
						setPollingStatus('expired');
						setCurrentStatus('Authorization timed out');
						setErrorMessage('The authorization request has expired. Please try again.');
						onError(new Error('Authorization timed out'));
					} else if (result.error) {
						setPollingStatus('error');
						setCurrentStatus('Authorization failed');
						setErrorMessage(result.error.message);
						onError(result.error);
					}
				}
			})
			.catch((error) => {
				setPollingStatus('error');
				setCurrentStatus('Authorization failed');
				setErrorMessage(error.message);
				onError(error);
				logger.error('DevicePolling', 'Polling start failed', error);
			});

		return () => {
			poller.stop();
		};
	}, [pollFn, onSuccess, onError, onProgress, interval]);

	const getStatusIcon = () => {
		switch (pollingStatus) {
			case 'success':
				return <FiCheckCircle size={24} />;
			case 'error':
				return <FiXCircle size={24} />;
			case 'expired':
				return <FiClock size={24} />;
			default:
				return <FiLoader size={24} className="animate-spin" />;
		}
	};

	const getStatusMessage = () => {
		switch (pollingStatus) {
			case 'success':
				return (
					<SuccessMessage>
						<FiCheckCircle size={16} />
						<div>
							<div style={{ fontWeight: '500' }}>Authorization successful!</div>
							<div>Access token received and stored.</div>
						</div>
					</SuccessMessage>
				);
			case 'error':
				return (
					<ErrorMessage>
						<FiXCircle size={16} />
						<div>
							<div style={{ fontWeight: '500' }}>Authorization failed</div>
							<div>{errorMessage}</div>
						</div>
					</ErrorMessage>
				);
			case 'expired':
				return (
					<ExpiredMessage>
						<FiClock size={16} />
						<div>
							<div style={{ fontWeight: '500' }}>Authorization expired</div>
							<div>The user code has expired. Please restart the device code flow.</div>
						</div>
					</ExpiredMessage>
				);
			default:
				return null;
		}
	};

	return (
		<PollingContainer>
			<Header>
				<StatusIcon status={pollingStatus}>{getStatusIcon()}</StatusIcon>
				<StatusContent>
					<StatusTitle>{formatPollingStatus(currentStatus, currentAttempt)}</StatusTitle>
					<StatusDescription>
						{pollingStatus === 'polling' &&
							'Waiting for you to complete authorization on your device...'}
						{pollingStatus === 'success' && 'Your device has been successfully authorized!'}
						{pollingStatus === 'error' && 'There was an error during authorization.'}
						{pollingStatus === 'expired' && 'The authorization request has expired.'}
					</StatusDescription>
				</StatusContent>
			</Header>

			{pollingStatus === 'polling' && (
				<ProgressSection>
					<ProgressBar>
						<ProgressFill progress={progress} />
					</ProgressBar>
					<ProgressInfo>
						<span>Attempt {currentAttempt}</span>
						<span>{Math.round(progress)}% complete</span>
					</ProgressInfo>
				</ProgressSection>
			)}

			<PollingDetails>
				<DetailRow>
					<DetailLabel>Device Code:</DetailLabel>
					<DetailValue>{deviceCode.substring(0, 8)}...</DetailValue>
				</DetailRow>
				<DetailRow>
					<DetailLabel>Client ID:</DetailLabel>
					<DetailValue>{clientId.substring(0, 8)}...</DetailValue>
				</DetailRow>
				<DetailRow>
					<DetailLabel>Polling Interval:</DetailLabel>
					<DetailValue>{interval}ms</DetailValue>
				</DetailRow>
				<DetailRow>
					<DetailLabel>Attempts:</DetailLabel>
					<DetailValue>{currentAttempt}</DetailValue>
				</DetailRow>
				<DetailRow>
					<DetailLabel>Duration:</DetailLabel>
					<DetailValue>{Math.round((Date.now() - startTime) / 1000)}s</DetailValue>
				</DetailRow>
			</PollingDetails>

			{getStatusMessage()}
		</PollingContainer>
	);
};

export default DevicePolling;
