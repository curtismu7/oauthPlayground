// src/components/JWKSConverter.tsx
import type React from 'react';
import { useId, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiCopy, FiDownload, FiRefreshCw } from 'react-icons/fi';
import styled from 'styled-components';
import { showGlobalError, showGlobalSuccess } from '../hooks/useNotifications';
import { convertPrivateKeyToJWKS, formatJWKS, isPrivateKey } from '../utils/jwksConverter';

const Container = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ variant = 'primary' }) =>
		variant === 'primary'
			? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
    
    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `
			: `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #e5e7eb;
    }
  `}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  color: #dc2626;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.375rem;
  color: #16a34a;
  font-size: 0.875rem;
`;

const HelpText = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const JWKSConverter: React.FC = () => {
	const [privateKey, setPrivateKey] = useState('');
	const [keyId, setKeyId] = useState('default');
	const [jwksOutput, setJwksOutput] = useState('');
	const [isConverting, setIsConverting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const privateKeyId = useId();
	const keyIdInputId = useId();

	const handleConvert = async () => {
		if (!privateKey.trim()) {
			setError('Please enter a private key');
			return;
		}

		if (!isPrivateKey(privateKey)) {
			setError(
				'The input does not appear to be a valid private key. Please ensure it starts with "-----BEGIN PRIVATE KEY-----" or "-----BEGIN RSA PRIVATE KEY-----"'
			);
			return;
		}

		setIsConverting(true);
		setError(null);
		setSuccess(null);

		try {
			const jwks = await convertPrivateKeyToJWKS(privateKey, keyId);
			const formattedJWKS = formatJWKS(jwks);
			setJwksOutput(formattedJWKS);
			setSuccess('Private key successfully converted to JWKS format!');
			showGlobalSuccess(' Private key converted to JWKS format');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to convert private key';
			setError(errorMessage);
			showGlobalError(`Failed to convert private key: ${errorMessage}`);
		} finally {
			setIsConverting(false);
		}
	};

	const handleCopyJWKS = async () => {
		try {
			await navigator.clipboard.writeText(jwksOutput);
			showGlobalSuccess(' JWKS copied to clipboard');
		} catch (_err) {
			showGlobalError('Failed to copy JWKS to clipboard');
		}
	};

	const handleDownloadJWKS = () => {
		const blob = new Blob([jwksOutput], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `jwks-${keyId}-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showGlobalSuccess(' JWKS downloaded');
	};

	const handleClear = () => {
		setPrivateKey('');
		setJwksOutput('');
		setError(null);
		setSuccess(null);
	};

	return (
		<Container>
			<Title> Private Key to JWKS Converter</Title>

			<FormGroup>
				<Label htmlFor={privateKeyId}>Private Key *</Label>
				<TextArea
					id={privateKeyId}
					value={privateKey}
					onChange={(e) => setPrivateKey(e.target.value)}
					placeholder="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----"
					className={error && !isPrivateKey(privateKey) ? 'error' : ''}
				/>
				<HelpText>
					Paste your RSA private key in PEM format. The key should start with "-----BEGIN PRIVATE
					KEY-----" or "-----BEGIN RSA PRIVATE KEY-----"
				</HelpText>
			</FormGroup>

			<FormGroup>
				<Label htmlFor={keyIdInputId}>Key ID</Label>
				<Input
					id={keyIdInputId}
					type="text"
					value={keyId}
					onChange={(e) => setKeyId(e.target.value)}
					placeholder="default"
				/>
				<HelpText>
					The key ID (kid) that will be used in the JWKS. This should match the kid in your JWT
					header.
				</HelpText>
			</FormGroup>

			<ButtonGroup>
				<Button onClick={handleConvert} disabled={isConverting || !privateKey.trim()}>
					{isConverting ? (
						<>
							<FiRefreshCw className="animate-spin" />
							Converting...
						</>
					) : (
						<>
							<FiRefreshCw />
							Convert to JWKS
						</>
					)}
				</Button>

				<Button variant="secondary" onClick={handleClear}>
					Clear
				</Button>
			</ButtonGroup>

			{error && (
				<ErrorMessage>
					<FiAlertCircle />
					{error}
				</ErrorMessage>
			)}

			{success && (
				<SuccessMessage>
					<FiCheckCircle />
					{success}
				</SuccessMessage>
			)}

			{jwksOutput && (
				<FormGroup>
					<Label>Generated JWKS</Label>
					<TextArea value={jwksOutput} readOnly style={{ minHeight: '200px' }} />
					<ButtonGroup>
						<Button variant="secondary" onClick={handleCopyJWKS}>
							<FiCopy />
							Copy JWKS
						</Button>
						<Button variant="secondary" onClick={handleDownloadJWKS}>
							<FiDownload />
							Download JWKS
						</Button>
					</ButtonGroup>
					<HelpText>
						Copy this JWKS and paste it into your PingOne application's JWKS field. Make sure to set
						the "Token Endpoint Authentication Method" to "Private Key JWT" in PingOne.
					</HelpText>
				</FormGroup>
			)}
		</Container>
	);
};

export default JWKSConverter;
