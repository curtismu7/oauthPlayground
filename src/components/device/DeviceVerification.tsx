// Device verification component for OIDC Device Code flow

import React, { useCallback, useEffect, useState } from 'react';
import { FiClock, FiCopy, FiExternalLink, FiMonitor, FiSmartphone } from 'react-icons/fi';
import styled from 'styled-components';
import { formatUserCode } from '../../utils/deviceCode';
import { logger } from '../../utils/logger';
import { calculateRemainingTime, formatTimeRemaining } from '../../utils/polling';
import {
	formatUrlForQRCode,
	generateQRCode,
	getQRCodeAltText,
	validateQRCodeUrl,
} from '../../utils/qrCode';

interface DeviceVerificationProps {
	userCode: string;
	verificationUri: string;
	verificationUriComplete?: string;
	expiresIn: number;
	startTime: number;
	onCopyUserCode: () => void;
	onCopyVerificationUri: () => void;
}

const VerificationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
`;

const VerificationSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const QRCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const QRCodeContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
`;

const QRCodeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
`;

const QRCodeFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
`;

const QRCodeLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
`;

const UserCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UserCodeDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const UserCodeLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
`;

const UserCodeValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  letter-spacing: 0.1em;
  padding: 1rem;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  user-select: all;
`;

const InstructionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const InstructionStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
`;

const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const StepDescription = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${(props) => (props.variant === 'primary' ? '#3b82f6' : '#f3f4f6')};
  color: ${(props) => (props.variant === 'primary' ? 'white' : '#374151')};
  border: 1px solid ${(props) => (props.variant === 'primary' ? '#3b82f6' : '#d1d5db')};
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.variant === 'primary' ? '#2563eb' : '#e5e7eb')};
    border-color: ${(props) => (props.variant === 'primary' ? '#2563eb' : '#9ca3af')};
  }

  &:active {
    transform: translateY(1px);
  }
`;

const TimerSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-weight: 500;
`;

const VerificationUrlSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const VerificationUrl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #374151;
  word-break: break-all;
`;

const DeviceVerification: React.FC<DeviceVerificationProps> = ({
	userCode,
	verificationUri,
	verificationUriComplete,
	expiresIn,
	startTime,
	onCopyUserCode,
	onCopyVerificationUri,
}) => {
	const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [copiedUserCode, setCopiedUserCode] = useState(false);
	const [copiedVerificationUri, setCopiedVerificationUri] = useState(false);

	// Generate QR code
	useEffect(() => {
		const generateQR = async () => {
			try {
				const urlToUse = verificationUriComplete || verificationUri;

				if (validateQRCodeUrl(urlToUse)) {
					const qrDataUrl = await generateQRCode(urlToUse, { size: 200 });
					setQrCodeUrl(qrDataUrl);
				} else {
					logger.warn('DeviceVerification', 'Invalid URL for QR code generation', {
						url: urlToUse,
					});
				}
			} catch (error) {
				logger.error('DeviceVerification', 'Failed to generate QR code', error);
			}
		};

		generateQR();
	}, [verificationUri, verificationUriComplete]);

	// Update timer
	useEffect(() => {
		const updateTimer = () => {
			const remaining = calculateRemainingTime(expiresIn, startTime);
			setTimeRemaining(remaining);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [expiresIn, startTime]);

	const handleCopyUserCode = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(formatUserCode(userCode));
			setCopiedUserCode(true);
			onCopyUserCode();
			setTimeout(() => setCopiedUserCode(false), 2000);
			logger.info('DeviceVerification', 'User code copied to clipboard');
		} catch (error) {
			logger.error('DeviceVerification', 'Failed to copy user code', error);
		}
	}, [userCode, onCopyUserCode]);

	const handleCopyVerificationUri = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(verificationUri);
			setCopiedVerificationUri(true);
			onCopyVerificationUri();
			setTimeout(() => setCopiedVerificationUri(false), 2000);
			logger.info('DeviceVerification', 'Verification URI copied to clipboard');
		} catch (error) {
			logger.error('DeviceVerification', 'Failed to copy verification URI', error);
		}
	}, [verificationUri, onCopyVerificationUri]);

	const handleOpenVerificationUri = useCallback(() => {
		window.open(verificationUri, '_blank', 'noopener,noreferrer');
		logger.info('DeviceVerification', 'Opened verification URI in new tab');
	}, [verificationUri]);

	return (
		<VerificationContainer>
			<Header>
				<Title>Complete Device Verification</Title>
				<Subtitle>Use your phone or computer to authorize this device</Subtitle>
			</Header>

			<TimerSection>
				<FiClock size={16} />
				<span>Code expires in {formatTimeRemaining(timeRemaining)}</span>
			</TimerSection>

			<VerificationSection>
				<QRCodeSection>
					<QRCodeLabel>
						<FiSmartphone size={16} />
						Scan with your phone
					</QRCodeLabel>

					<QRCodeContainer>
						{qrCodeUrl ? (
							<QRCodeImage
								src={qrCodeUrl}
								alt={getQRCodeAltText(verificationUriComplete || verificationUri)}
							/>
						) : (
							<QRCodeFallback>
								<FiMonitor size={32} />
								<div>QR Code</div>
								<div style={{ fontSize: '0.75rem' }}>
									{formatUrlForQRCode(verificationUriComplete || verificationUri)}
								</div>
							</QRCodeFallback>
						)}
					</QRCodeContainer>

					<ActionButton variant="primary" onClick={handleOpenVerificationUri}>
						<FiExternalLink size={16} />
						Open in Browser
					</ActionButton>
				</QRCodeSection>

				<UserCodeSection>
					<UserCodeLabel>
						<FiMonitor size={16} />
						Enter this code manually
					</UserCodeLabel>

					<UserCodeDisplay>
						<UserCodeValue>{formatUserCode(userCode)}</UserCodeValue>

						<ActionButtons>
							<ActionButton onClick={handleCopyUserCode}>
								<FiCopy size={16} />
								{copiedUserCode ? 'Copied!' : 'Copy Code'}
							</ActionButton>
						</ActionButtons>
					</UserCodeDisplay>

					<VerificationUrlSection>
						<div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
							Verification URL:
						</div>
						<VerificationUrl>{formatUrlForQRCode(verificationUri)}</VerificationUrl>
						<ActionButton onClick={handleCopyVerificationUri}>
							<FiCopy size={16} />
							{copiedVerificationUri ? 'Copied!' : 'Copy URL'}
						</ActionButton>
					</VerificationUrlSection>
				</UserCodeSection>
			</VerificationSection>

			<InstructionsSection>
				<InstructionStep>
					<StepNumber>1</StepNumber>
					<StepContent>
						<StepTitle>Open the verification page</StepTitle>
						<StepDescription>
							Scan the QR code with your phone or open the verification URL in your browser
						</StepDescription>
					</StepContent>
				</InstructionStep>

				<InstructionStep>
					<StepNumber>2</StepNumber>
					<StepContent>
						<StepTitle>Enter the user code</StepTitle>
						<StepDescription>
							Type or paste the user code: <strong>{formatUserCode(userCode)}</strong>
						</StepDescription>
					</StepContent>
				</InstructionStep>

				<InstructionStep>
					<StepNumber>3</StepNumber>
					<StepContent>
						<StepTitle>Sign in and authorize</StepTitle>
						<StepDescription>
							Complete the sign-in process and authorize this device to access your account
						</StepDescription>
					</StepContent>
				</InstructionStep>
			</InstructionsSection>
		</VerificationContainer>
	);
};

export default DeviceVerification;
