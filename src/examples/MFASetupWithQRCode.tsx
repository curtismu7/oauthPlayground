// src/examples/MFASetupWithQRCode.tsx
// Example MFA setup flow using QRCodeService

import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiCopy, FiRefreshCw, FiSmartphone } from '@icons';
import styled from 'styled-components';
import QRCodeService, { type QRCodeResult } from '../services/qrCodeService';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
`;

const StepCard = styled.div<{ active: boolean }>`
  border: 1px solid ${(props) => (props.active ? '#3b82f6' : '#e5e7eb')};
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 1rem;
  background: ${(props) => (props.active ? '#eff6ff' : 'white')};
  opacity: ${(props) => (props.active ? 1 : 0.7)};
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StepNumber = styled.div<{ completed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => (props.completed ? '#10b981' : '#3b82f6')};
  color: white;
  font-weight: 600;
`;

const StepTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const QRCodeDisplay = styled.div`
  text-align: center;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  margin-bottom: 1.5rem;
`;

const QRCodeImage = styled.img`
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const ManualEntry = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const ManualEntryKey = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.1em;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  text-align: center;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 0.2em;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
			case 'success':
				return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
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

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;

  ${(props) => {
		switch (props.type) {
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

const InstructionList = styled.ol`
  margin: 1rem 0;
  padding-left: 1.5rem;
  
  li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
`;

export const MFASetupWithQRCode: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(1);
	const [qrResult, setQrResult] = useState<QRCodeResult | null>(null);
	const [verificationCode, setVerificationCode] = useState('');
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleStartSetup = useCallback(async () => {
		setIsLoading(true);
		try {
			// Generate TOTP secret and QR code
			const secret = QRCodeService.generateTOTPSecret();
			const config = {
				secret,
				issuer: 'OAuth Playground',
				accountName: 'user@example.com',
				algorithm: 'SHA1' as const,
				digits: 6 as const,
				period: 30,
			};

			const result = await QRCodeService.generateTOTPQRCode(config);
			setQrResult(result);
			setCurrentStep(2);
			setStatus({
				type: 'success',
				message: 'QR code generated! Scan it with your authenticator app.',
			});
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleVerifyCode = useCallback(() => {
		if (!qrResult || !verificationCode) {
			setStatus({ type: 'error', message: 'Please enter a verification code' });
			return;
		}

		try {
			// Extract secret from TOTP URI for validation
			const secretMatch = qrResult.totpUri.match(/secret=([A-Z2-7]+)/);
			if (!secretMatch) {
				throw new Error('Could not extract secret from TOTP URI');
			}

			const secret = secretMatch[1];
			const result = QRCodeService.validateTOTPCode(secret, verificationCode);

			if (result.valid) {
				setCurrentStep(3);
				setStatus({ type: 'success', message: 'MFA setup completed successfully!' });
			} else {
				setStatus({ type: 'error', message: result.error || 'Invalid verification code' });
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	}, [qrResult, verificationCode]);

	const handleCopySecret = useCallback(async () => {
		if (!qrResult) return;

		try {
			await navigator.clipboard.writeText(qrResult.manualEntryKey);
			setStatus({ type: 'success', message: 'Secret key copied to clipboard!' });
		} catch (_error) {
			setStatus({ type: 'error', message: 'Failed to copy to clipboard' });
		}
	}, [qrResult]);

	const handleReset = useCallback(() => {
		setCurrentStep(1);
		setQrResult(null);
		setVerificationCode('');
		setStatus(null);
	}, []);

	return (
		<Container>
			<h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>MFA Setup with QR Code</h1>

			{status && (
				<StatusMessage type={status.type}>
					{status.type === 'success' && <FiCheckCircle size={16} />}
					{status.message}
				</StatusMessage>
			)}

			{/* Step 1: Introduction */}
			<StepCard active={currentStep === 1}>
				<StepHeader>
					<StepNumber completed={currentStep > 1}>
						{currentStep > 1 ? <FiCheckCircle size={20} /> : '1'}
					</StepNumber>
					<StepTitle>Set Up Two-Factor Authentication</StepTitle>
				</StepHeader>

				<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
					Enhance your account security by setting up two-factor authentication (2FA) using an
					authenticator app.
				</p>

				<InstructionList>
					<li>
						Download an authenticator app like Google Authenticator, Authy, or Microsoft
						Authenticator
					</li>
					<li>Click "Start Setup" to generate your unique QR code</li>
					<li>Scan the QR code with your authenticator app</li>
					<li>Enter the verification code to complete setup</li>
				</InstructionList>

				{currentStep === 1 && (
					<Button variant="primary" onClick={handleStartSetup} disabled={isLoading}>
						<FiSmartphone size={16} />
						{isLoading ? 'Generating...' : 'Start Setup'}
					</Button>
				)}
			</StepCard>

			{/* Step 2: QR Code Scanning */}
			{qrResult && (
				<StepCard active={currentStep === 2}>
					<StepHeader>
						<StepNumber completed={currentStep > 2}>
							{currentStep > 2 ? <FiCheckCircle size={20} /> : '2'}
						</StepNumber>
						<StepTitle>Scan QR Code</StepTitle>
					</StepHeader>

					<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
						Scan this QR code with your authenticator app, or enter the secret key manually.
					</p>

					<QRCodeDisplay>
						<QRCodeImage src={qrResult.qrCodeDataUrl} alt="TOTP QR Code" />
						<p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
							Scan with your authenticator app
						</p>
					</QRCodeDisplay>

					<ManualEntry>
						<p
							style={{
								margin: '0 0 0.5rem 0',
								fontSize: '0.875rem',
								fontWeight: '500',
								color: '#374151',
							}}
						>
							Can't scan? Enter this key manually:
						</p>
						<ManualEntryKey>{qrResult.manualEntryKey}</ManualEntryKey>
						<Button onClick={handleCopySecret}>
							<FiCopy size={14} />
							Copy Secret Key
						</Button>
					</ManualEntry>

					{currentStep === 2 && (
						<>
							<p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#374151' }}>
								Enter the 6-digit code from your authenticator app:
							</p>
							<Input
								type="text"
								value={verificationCode}
								onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
								placeholder="000000"
								maxLength={6}
							/>
							<Button
								variant="success"
								onClick={handleVerifyCode}
								disabled={verificationCode.length !== 6}
							>
								<FiCheckCircle size={16} />
								Verify & Complete Setup
							</Button>
						</>
					)}
				</StepCard>
			)}

			{/* Step 3: Completion */}
			{currentStep === 3 && (
				<StepCard active={true}>
					<StepHeader>
						<StepNumber completed={true}>
							<FiCheckCircle size={20} />
						</StepNumber>
						<StepTitle>Setup Complete!</StepTitle>
					</StepHeader>

					<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
						Two-factor authentication has been successfully enabled for your account. Your account
						is now more secure!
					</p>

					{qrResult?.backupCodes && (
						<div style={{ marginBottom: '1.5rem' }}>
							<h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
								Backup Codes
							</h3>
							<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
								Save these backup codes in a secure location. Each can be used once if you lose
								access to your authenticator.
							</p>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(2, 1fr)',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								{qrResult.backupCodes.map((code, index) => (
									<div
										key={index}
										style={{
											background: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '4px',
											padding: '0.5rem',
											textAlign: 'center',
											fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
											fontSize: '0.875rem',
										}}
									>
										{code}
									</div>
								))}
							</div>
						</div>
					)}

					<Button onClick={handleReset}>
						<FiRefreshCw size={16} />
						Set Up Another Account
					</Button>
				</StepCard>
			)}
		</Container>
	);
};

export default MFASetupWithQRCode;
