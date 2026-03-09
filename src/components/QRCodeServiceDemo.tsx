// src/components/QRCodeServiceDemo.tsx
// Demo component showcasing QRCodeService functionality

import React, { useState } from 'react';
import styled from 'styled-components';
import QRCodeService, { type QRCodeResult, type TOTPConfig } from '../services/qrCodeService';

const Container = styled.div`
  max-width: 1000px;
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
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0 0 0.5rem 0;
`;

const Section = styled.div`
  background: white;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
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
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.BLUE;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.BLUE;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: V9_COLORS.PRIMARY.BLUE;
          color: white;
          &:hover { background: V9_COLORS.PRIMARY.BLUE_DARK; }
        `;
			case 'success':
				return `
          background: V9_COLORS.PRIMARY.GREEN;
          color: white;
          &:hover { background: V9_COLORS.PRIMARY.GREEN_DARK; }
        `;
			default:
				return `
          background: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_DARK;
          border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
          &:hover { background: V9_COLORS.TEXT.GRAY_LIGHTER; }
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

  ${(props) => {
		switch (props.status) {
			case 'success':
				return `
          background: #f0fdf4;
          border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'error':
				return `
          background: V9_COLORS.BG.ERROR;
          border: 1px solid V9_COLORS.BG.ERROR_BORDER;
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			default:
				return `
          background: V9_COLORS.BG.GRAY_LIGHT;
          border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
          color: V9_COLORS.PRIMARY.BLUE_DARK;
        `;
		}
	}}
`;

const QRCodeDisplay = styled.div`
  text-align: center;
  padding: 1rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 6px;
  background: #f9fafb;
`;

const QRCodeImage = styled.img`
  max-width: 200px;
  height: auto;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  padding: 1rem;
  background: white;
`;

const CodeBlock = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  margin: 0.5rem 0;
`;

const BackupCodes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
`;

const BackupCode = styled.div`
  background: #f3f4f6;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  padding: 0.5rem;
  text-align: center;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
`;

export const QRCodeServiceDemo: React.FC = () => {
	const [config, setConfig] = useState<TOTPConfig>({
		secret: 'JBSWY3DPEHPK3PXP',
		issuer: 'OAuth Playground',
		accountName: 'demo@example.com',
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
	});

	const [qrResult, setQrResult] = useState<QRCodeResult | null>(null);
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [validationCode, setValidationCode] = useState('');
	const [validationResult, setValidationResult] = useState<any>(null);

	const handleGenerateSecret = () => {
		try {
			const newSecret = QRCodeService.generateTOTPSecret(32);
			setConfig((prev) => ({ ...prev, secret: newSecret }));
			setStatus({ type: 'success', message: 'New TOTP secret generated!' });
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Failed to generate secret: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleGenerateQRCode = async () => {
		try {
			const result = await QRCodeService.generateTOTPQRCode(config);
			setQrResult(result);
			setStatus({ type: 'success', message: 'QR code generated successfully!' });
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleValidateCode = () => {
		try {
			const result = QRCodeService.validateTOTPCode(config.secret, validationCode, {
				algorithm: config.algorithm,
				digits: config.digits,
				period: config.period,
			});

			setValidationResult(result);

			if (result.valid) {
				setStatus({
					type: 'success',
					message: `TOTP code is valid! (Time window: ${result.timeWindow || 0})`,
				});
			} else {
				setStatus({ type: 'error', message: `TOTP code is invalid: ${result.error}` });
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setStatus({ type: 'success', message: 'Copied to clipboard!' });
		} catch (_error) {
			setStatus({ type: 'error', message: 'Failed to copy to clipboard' });
		}
	};

	const capabilities = QRCodeService.getCapabilities();

	return (
		<Container>
			<Header>
				<Title>QR Code Service Demo</Title>
				<p style={{ color: '#6b7280', margin: 0 }}>
					Interactive demonstration of TOTP QR code generation and validation
				</p>
			</Header>

			{status && (
				<StatusDisplay status={status.type}>
					{status.type === 'success' && <span style={{ fontSize: '16px' }}>✅</span>}
					{status.type === 'error' && <span style={{ fontSize: '16px' }}>⚠️</span>}
					{status.type === 'info' && <span style={{ fontSize: '16px' }}>⚙️</span>}
					{status.message}
				</StatusDisplay>
			)}

			<Grid>
				<div>
					<Section>
						<SectionTitle>
							<span style={{ fontSize: '20px' }}>⚙️</span>
							TOTP Configuration
						</SectionTitle>

						<FormGroup>
							<Label>Secret</Label>
							<Input
								value={config.secret}
								onChange={(e) => setConfig((prev) => ({ ...prev, secret: e.target.value }))}
								placeholder="Base32 encoded secret"
							/>
							<Button onClick={handleGenerateSecret}>
								<span style={{ fontSize: '14px' }}>🔄</span>
								Generate New Secret
							</Button>
						</FormGroup>

						<FormGroup>
							<Label>Issuer</Label>
							<Input
								value={config.issuer}
								onChange={(e) => setConfig((prev) => ({ ...prev, issuer: e.target.value }))}
								placeholder="OAuth Playground"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Account Name</Label>
							<Input
								value={config.accountName}
								onChange={(e) => setConfig((prev) => ({ ...prev, accountName: e.target.value }))}
								placeholder="user@example.com"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Algorithm</Label>
							<Select
								value={config.algorithm}
								onChange={(e) =>
									setConfig((prev) => ({ ...prev, algorithm: e.target.value as any }))
								}
							>
								<option value="SHA1">SHA1</option>
								<option value="SHA256">SHA256</option>
								<option value="SHA512">SHA512</option>
							</Select>
						</FormGroup>

						<FormGroup>
							<Label>Digits</Label>
							<Select
								value={config.digits}
								onChange={(e) =>
									setConfig((prev) => ({ ...prev, digits: parseInt(e.target.value, 10) as any }))
								}
							>
								<option value={6}>6</option>
								<option value={8}>8</option>
							</Select>
						</FormGroup>

						<FormGroup>
							<Label>Period (seconds)</Label>
							<Input
								type="number"
								min="15"
								max="300"
								value={config.period}
								onChange={(e) =>
									setConfig((prev) => ({ ...prev, period: parseInt(e.target.value, 10) }))
								}
							/>
						</FormGroup>

						<Button variant="primary" onClick={handleGenerateQRCode}>
							<span style={{ fontSize: '14px' }}>🔑</span>
							Generate QR Code
						</Button>
					</Section>

					<Section>
						<SectionTitle>
							<span style={{ fontSize: '20px' }}>✅</span>
							TOTP Code Validation
						</SectionTitle>

						<FormGroup>
							<Label>Enter TOTP Code</Label>
							<Input
								value={validationCode}
								onChange={(e) => setValidationCode(e.target.value)}
								placeholder="123456"
								maxLength={8}
							/>
						</FormGroup>

						<Button variant="success" onClick={handleValidateCode}>
							<span style={{ fontSize: '14px' }}>✅</span>
							Validate Code
						</Button>

						{validationResult && (
							<div style={{ marginTop: '1rem' }}>
								<h4>Validation Result:</h4>
								<CodeBlock>{JSON.stringify(validationResult, null, 2)}</CodeBlock>
							</div>
						)}
					</Section>
				</div>

				<div>
					{qrResult && (
						<Section>
							<SectionTitle>Generated QR Code</SectionTitle>

							<QRCodeDisplay>
								<QRCodeImage src={qrResult.qrCodeDataUrl} alt="TOTP QR Code" />
								<p
									style={{
										margin: '1rem 0 0 0',
										fontSize: '0.875rem',
										color: '#6b7280',
									}}
								>
									Scan with your authenticator app
								</p>
							</QRCodeDisplay>

							<div style={{ marginTop: '1rem' }}>
								<Label>TOTP URI:</Label>
								<CodeBlock>{qrResult.totpUri}</CodeBlock>
								<Button onClick={() => copyToClipboard(qrResult.totpUri)}>
									<span style={{ fontSize: '14px' }}>📋</span>
									Copy URI
								</Button>
							</div>

							<div style={{ marginTop: '1rem' }}>
								<Label>Manual Entry Key:</Label>
								<CodeBlock>{qrResult.manualEntryKey}</CodeBlock>
								<Button onClick={() => copyToClipboard(qrResult.manualEntryKey)}>
									<span style={{ fontSize: '14px' }}>📋</span>
									Copy Key
								</Button>
							</div>

							{qrResult.backupCodes && (
								<div style={{ marginTop: '1rem' }}>
									<Label>Backup Codes:</Label>
									<BackupCodes>
										{qrResult.backupCodes.map((code, index) => (
											<BackupCode key={index}>{code}</BackupCode>
										))}
									</BackupCodes>
								</div>
							)}
						</Section>
					)}

					<Section>
						<SectionTitle>Service Capabilities</SectionTitle>
						<div>
							<p>
								<strong>QR Code Generation:</strong>{' '}
								{capabilities.qrCodeGeneration ? '✅ Supported' : '❌ Not Supported'}
							</p>
							<p>
								<strong>Manual Entry:</strong>{' '}
								{capabilities.manualEntry ? '✅ Supported' : '❌ Not Supported'}
							</p>
							<p>
								<strong>TOTP Validation:</strong>{' '}
								{capabilities.totpValidation ? '✅ Supported' : '❌ Not Supported'}
							</p>
							<p>
								<strong>Backup Codes:</strong>{' '}
								{capabilities.backupCodes ? '✅ Supported' : '❌ Not Supported'}
							</p>
						</div>
					</Section>
				</div>
			</Grid>
		</Container>
	);
};

export default QRCodeServiceDemo;
