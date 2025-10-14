// src/components/DPoPConfiguration.tsx
/**
 * DPoP Configuration Component
 * Provides UI for configuring and managing DPoP (Demonstration of Proof of Possession)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiShield, FiKey, FiInfo, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import styled from 'styled-components';
import { DPoPService, DPoPStatus, type DPoPConfig } from '../services/dpopService';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface DPoPConfigurationProps {
	enabled: boolean;
	onEnabledChange: (enabled: boolean) => void;
	config?: Partial<DPoPConfig>;
	onConfigChange?: (config: DPoPConfig) => void;
	className?: string;
}

const Container = styled.div`
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	padding: 1.5rem;
	background: ${({ theme }) => theme.colors.background};
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.p`
	margin: 0 0 1.5rem 0;
	color: ${({ theme }) => theme.colors.textSecondary};
	font-size: 0.875rem;
	line-height: 1.5;
`;

const CheckboxContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
`;

const Checkbox = styled.input`
	width: 1rem;
	height: 1rem;
`;

const CheckboxLabel = styled.label`
	font-weight: 500;
	color: ${({ theme }) => theme.colors.text};
	cursor: pointer;
`;

const ConfigSection = styled.div`
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.text};
`;

const Select = styled.select`
	width: 100%;
	padding: 0.5rem;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 4px;
	background: ${({ theme }) => theme.colors.background};
	color: ${({ theme }) => theme.colors.text};
	font-size: 0.875rem;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
	}
`;

const StatusSection = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: ${({ theme }) => theme.colors.backgroundSecondary};
	border-radius: 6px;
`;

const StatusItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const StatusLabel = styled.span`
	font-weight: 500;
	color: ${({ theme }) => theme.colors.text};
`;

const StatusValue = styled.span`
	color: ${({ theme }) => theme.colors.textSecondary};
`;

const Button = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: ${({ theme }) => theme.colors.primary};
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background: ${({ theme }) => theme.colors.primaryDark};
	}

	&:disabled {
		background: ${({ theme }) => theme.colors.gray300};
		cursor: not-allowed;
	}
`;

const InfoBox = styled.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 6px;
	margin-top: 1rem;
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
	color: #1e40af;
	font-size: 0.875rem;
	line-height: 1.4;
`;

const DPoPConfiguration: React.FC<DPoPConfigurationProps> = ({
	enabled,
	onEnabledChange,
	config = {},
	onConfigChange,
	className
}) => {
	const [status, setStatus] = useState(DPoPStatus.getStatus());
	const [isGenerating, setIsGenerating] = useState(false);

	const refreshStatus = useCallback(() => {
		setStatus(DPoPStatus.getStatus());
	}, []);

	useEffect(() => {
		refreshStatus();
	}, [refreshStatus, enabled]);

	const handleEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		onEnabledChange(e.target.checked);
	}, [onEnabledChange]);

	const handleAlgorithmChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
		const newConfig: DPoPConfig = {
			algorithm: e.target.value as 'ES256' | 'RS256',
			...(e.target.value === 'ES256' ? { namedCurve: 'P-256' } : { keySize: 2048 })
		};
		onConfigChange?.(newConfig);
	}, [onConfigChange]);

	const handleGenerateKeyPair = useCallback(async () => {
		if (!status.supported) {
			v4ToastManager.showError('DPoP is not supported in this browser');
			return;
		}

		setIsGenerating(true);
		try {
			await DPoPService.generateKeyPair(config);
			refreshStatus();
			v4ToastManager.showSuccess('DPoP key pair generated successfully');
		} catch (error) {
			console.error('Failed to generate DPoP key pair:', error);
			v4ToastManager.showError('Failed to generate DPoP key pair');
		} finally {
			setIsGenerating(false);
		}
	}, [config, refreshStatus, status.supported]);

	if (!status.supported) {
		return (
			<Container className={className}>
				<Header>
					<FiAlertCircle color="#ef4444" />
					<Title>DPoP Not Supported</Title>
				</Header>
				<Description>
					DPoP (Demonstration of Proof of Possession) requires modern browser support for Web Crypto API.
					Please use a recent version of Chrome, Firefox, Safari, or Edge.
				</Description>
			</Container>
		);
	}

	return (
		<Container className={className}>
			<Header>
				<FiShield color="#10b981" />
				<Title>DPoP (Demonstration of Proof of Possession)</Title>
			</Header>
			
			<Description>
				DPoP provides cryptographic proof that the client possesses the private key corresponding to the public key.
				This prevents token replay attacks and enhances security for OAuth flows.
			</Description>

			<CheckboxContainer>
				<Checkbox
					type="checkbox"
					id="dpop-enabled"
					checked={enabled}
					onChange={handleEnabledChange}
				/>
				<CheckboxLabel htmlFor="dpop-enabled">
					Enable DPoP for this flow
				</CheckboxLabel>
			</CheckboxContainer>

			{enabled && (
				<ConfigSection>
					<FormGroup>
						<Label htmlFor="dpop-algorithm">Signature Algorithm</Label>
						<Select
							id="dpop-algorithm"
							value={config.algorithm || 'ES256'}
							onChange={handleAlgorithmChange}
						>
							<option value="ES256">ES256 (Elliptic Curve - Recommended)</option>
							<option value="RS256">RS256 (RSA)</option>
						</Select>
					</FormGroup>

					<StatusSection>
						<StatusItem>
							<StatusLabel>Browser Support:</StatusLabel>
							<StatusValue>
								{status.supported ? (
									<span style={{ color: '#10b981' }}>✓ Supported</span>
								) : (
									<span style={{ color: '#ef4444' }}>✗ Not Supported</span>
								)}
							</StatusValue>
						</StatusItem>
						
						<StatusItem>
							<StatusLabel>Key Pair:</StatusLabel>
							<StatusValue>
								{status.hasKeyPair ? (
									<span style={{ color: '#10b981' }}>✓ Generated</span>
								) : (
									<span style={{ color: '#f59e0b' }}>⚠ Not Generated</span>
								)}
							</StatusValue>
						</StatusItem>
						
						{status.hasKeyPair && (
							<StatusItem>
								<StatusLabel>Algorithm:</StatusLabel>
								<StatusValue>{status.algorithm}</StatusValue>
							</StatusItem>
						)}
					</StatusSection>

					{!status.hasKeyPair && (
						<div style={{ marginTop: '1rem' }}>
							<Button onClick={handleGenerateKeyPair} disabled={isGenerating}>
								{isGenerating ? (
									<>
										<FiRefreshCw className="animate-spin" />
										Generating...
									</>
								) : (
									<>
										<FiKey />
										Generate Key Pair
									</>
								)}
							</Button>
						</div>
					)}

					<InfoBox>
						<FiInfo color="#1e40af" size={20} />
						<InfoContent>
							<InfoTitle>How DPoP Works</InfoTitle>
							<InfoText>
								DPoP creates a cryptographic proof for each HTTP request using a private key.
								The authorization server can verify this proof to ensure the request comes from
								the legitimate client, preventing token theft and replay attacks.
							</InfoText>
						</InfoContent>
					</InfoBox>
				</ConfigSection>
			)}
		</Container>
	);
};

export default DPoPConfiguration;