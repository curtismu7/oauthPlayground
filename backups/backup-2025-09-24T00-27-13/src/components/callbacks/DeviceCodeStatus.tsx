import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiInfo, FiXCircle } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { logger } from '../../utils/logger';

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`;

const StatusCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
`;

const StatusIcon = styled.div`
  font-size: 3rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const StatusTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`;

const StatusMessage = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
`;

const InfoTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 0.5rem;
`;

const InfoText = styled.p`
  color: #1e40af;
  font-size: 0.875rem;
  margin: 0;
`;

const DeviceCodeStatus: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [status, setStatus] = useState<'info' | 'pending' | 'success' | 'error'>('info');
	const [message, setMessage] = useState('Device Code Flow Status');

	useEffect(() => {
		const checkStatus = () => {
			logger.info('DeviceCodeStatus', 'Device code status page accessed', { url: location.href });

			// Check if there are any device code parameters in the URL
			const urlParams = new URLSearchParams(location.search);
			const deviceCode = urlParams.get('device_code');
			const userCode = urlParams.get('user_code');
			const verificationUri = urlParams.get('verification_uri');
			const verificationUriComplete = urlParams.get('verification_uri_complete');

			if (deviceCode || userCode) {
				setStatus('pending');
				setMessage('Device code flow in progress...');
				logger.info('DeviceCodeStatus', 'Device code parameters found', {
					hasDeviceCode: !!deviceCode,
					hasUserCode: !!userCode,
					verificationUri,
					verificationUriComplete,
				});
			} else {
				setStatus('info');
				setMessage('Device Code Flow Status');
			}
		};

		checkStatus();
	}, [location.href, location.search]);

	const getStatusIcon = () => {
		switch (status) {
			case 'success':
				return <FiCheckCircle />;
			case 'error':
				return <FiXCircle />;
			case 'pending':
				return <FiClock />;
			default:
				return <FiInfo />;
		}
	};

	return (
		<StatusContainer>
			<StatusCard>
				<StatusIcon>{getStatusIcon()}</StatusIcon>
				<StatusTitle>
					{status === 'info' && 'Device Code Flow Status'}
					{status === 'pending' && 'Device Code Flow in Progress'}
					{status === 'success' && 'Device Code Flow Successful'}
					{status === 'error' && 'Device Code Flow Failed'}
				</StatusTitle>
				<StatusMessage>{message}</StatusMessage>

				<InfoBox>
					<InfoTitle>About Device Code Flow</InfoTitle>
					<InfoText>
						The Device Code flow is designed for devices that don't have a browser or have limited
						input capabilities. This status page is for informational purposes only - there is no
						browser redirect in the Device Code flow specification.
						<br />
						<br />
						The flow works by:
						<br />
						1. Device requests authorization codes
						<br />
						2. User visits a URL on another device
						<br />
						3. User enters a user code
						<br />
						4. Device polls for completion
						<br />
						5. Tokens are exchanged when user completes authorization
					</InfoText>
				</InfoBox>
			</StatusCard>
		</StatusContainer>
	);
};

export default DeviceCodeStatus;
