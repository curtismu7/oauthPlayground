// src/services/pkceService.tsx
import React, { useCallback, useState } from 'react';
import {
	FiCheck,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import ColoredUrlDisplay from '../components/ColoredUrlDisplay';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';
import { FeatureFlagService } from './featureFlagService';
import { PkceManager } from './pkceManager';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { CopyButtonVariants } from './copyButtonService';

export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}

export interface PKCEServiceProps {
	value: PKCECodes;
	onChange: (codes: PKCECodes) => void;
	onGenerate?: () => Promise<void>;
	isGenerating?: boolean;
	showDetails?: boolean;
	title?: string;
	subtitle?: string;
	authUrl?: string;
}

// Modern styled components
const PKCEContainer = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	padding: 2.5rem;
	margin: 2rem 0;
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 5px;
		background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #10b981);
		border-radius: 20px 20px 0 0;
	}
`;

const PKCEHeader = styled.div`
	margin-bottom: 2.5rem;
`;

const PKCEHeaderLeft = styled.div`
	text-align: center;
`;

const PKCETitle = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 800;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	background: linear-gradient(135deg, #3b82f6, #8b5cf6);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
`;

const PKCESubtitle = styled.p`
	margin: 0.75rem 0 0 0;
	font-size: 1rem;
	color: #6b7280;
	line-height: 1.6;
`;

const GenerateButton = styled.button<{ $isGenerating: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem 1.5rem;
	background: ${({ $isGenerating }) =>
		$isGenerating
			? 'linear-gradient(135deg, #6b7280, #4b5563)'
			: 'linear-gradient(135deg, #3b82f6, #2563eb)'};
	color: white;
	border: none;
	border-radius: 12px;
	font-size: 0.9375rem;
	font-weight: 700;
	cursor: ${({ $isGenerating }) => ($isGenerating ? 'not-allowed' : 'pointer')};
	transition: all 0.3s ease;
	box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.3);
	position: relative;
	overflow: hidden;
	white-space: nowrap;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transition: left 0.6s ease;
	}

	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 12px 20px -4px rgba(59, 130, 246, 0.4);
		
		&::before {
			left: 100%;
		}
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}
`;

const EducationalSection = styled.div`
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	border: 1px solid #93c5fd;
	border-radius: 16px;
	padding: 2rem;
	margin-bottom: 2rem;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #3b82f6, #06b6d4);
		border-radius: 16px 16px 0 0;
	}
`;

const EducationalTitle = styled.h4`
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #1e40af;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const EducationalContent = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const EducationalCard = styled.div`
	background: rgba(255, 255, 255, 0.7);
	border-radius: 12px;
	padding: 1.5rem;
`;

const EducationalCardTitle = styled.h5`
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #1e40af;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const EducationalText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #1e40af;
	line-height: 1.6;
`;

const PKCEFieldsContainer = styled.div`
	background: #ffffff;
	border: 2px solid #e5e7eb;
	border-radius: 16px;
	padding: 2rem;
	margin-top: 2rem;
	margin-bottom: 2rem;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #3b82f6, #8b5cf6);
		border-radius: 16px 16px 0 0;
	}

	&:hover {
		border-color: #93c5fd;
		box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}
`;

const PKCEField = styled.div`
	margin-bottom: 1.5rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const PKCELabel = styled.label<{ $isSecret: boolean }>`
	display: block;
	font-size: 1rem;
	font-weight: 700;
	color: #374151;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PKCEValueContainer = styled.div`
	display: flex;
	align-items: stretch;
	gap: 1rem;
`;

const PKCEValue = styled.div`
	flex: 1;
	background: #f9fafb;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	padding: 1rem;
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	font-size: 0.875rem;
	color: #1f2937;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	min-height: 2.5rem;
	display: flex;
	align-items: center;
	transition: all 0.3s ease;

	&:focus-within {
		background: #ffffff;
		border-color: #3b82f6;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
	}
`;

const ToggleButton = styled.button<{ $isVisible: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.75rem;
	background: ${({ $isVisible }) => ($isVisible ? '#f3f4f6' : '#ffffff')};
	border: 2px solid #d1d5db;
	border-radius: 12px;
	color: #6b7280;
	cursor: pointer;
	transition: all 0.3s ease;
	min-width: 44px;
	min-height: 44px;

	&:hover {
		background: #f9fafb;
		color: #374151;
		border-color: #9ca3af;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
	}
`;

const Badge = styled.div<{ $variant: 'secret' | 'public' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	background: ${({ $variant }) =>
		$variant === 'secret'
			? 'linear-gradient(135deg, #fef2f2, #fecaca)'
			: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'};
	color: ${({ $variant }) => ($variant === 'secret' ? '#991b1b' : '#1e40af')};
	padding: 0.375rem 0.75rem;
	border-radius: 8px;
	font-size: 0.8125rem;
	font-weight: 600;
	border: 1px solid ${({ $variant }) => ($variant === 'secret' ? '#f87171' : '#60a5fa')};
`;

const SecurityInfo = styled.div`
	background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
	border: 1px solid #f87171;
	border-radius: 16px;
	padding: 2rem;
	margin-top: 2rem;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #ef4444, #dc2626);
		border-radius: 16px 16px 0 0;
	}
`;

const SecurityTitle = styled.h4`
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #92400e;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SecurityList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	color: #92400e;
`;

const SecurityItem = styled.li`
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const URLSection = styled.div`
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid #e5e7eb;
`;

const URLTitle = styled.h4`
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PKCEButtonSection = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid #e5e7eb;
`;

// Main PKCE Service Component
export const PKCEService: React.FC<PKCEServiceProps> = ({
	value,
	onChange,
	onGenerate,
	isGenerating = false,
	showDetails = true,
	title = 'Generate PKCE Codes',
	subtitle = 'Create secure code verifier and challenge for authorization',
	authUrl,
}) => {
	const [showCodeVerifier, setShowCodeVerifier] = useState(false);
	const [isLocalGenerating, setIsLocalGenerating] = useState(false);

	const handleGenerate = useCallback(async () => {
		if (isLocalGenerating || isGenerating) return;

		setIsLocalGenerating(true);
		try {
			let codeVerifier: string;
			let codeChallenge: string;

			const useNewOidcCore = FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE');

			if (useNewOidcCore) {
				// Use Phase 2 PkceManager
				console.log('🔐 [PKCE Service] Using Phase 2 PkceManager');
				const pkce = await PkceManager.generateAsync();
				codeVerifier = pkce.codeVerifier;
				codeChallenge = pkce.codeChallenge;
			} else {
				// Fallback to old method
				console.log('🔐 [PKCE Service] Using old PKCE generation');
				codeVerifier = generateCodeVerifier();
				codeChallenge = await generateCodeChallenge(codeVerifier);
			}

			const newCodes: PKCECodes = {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256',
			};

			onChange(newCodes);
			onGenerate?.();

			v4ToastManager.showSuccess('PKCE codes generated successfully!');
		} catch (error) {
			console.error('PKCE generation failed:', error);
			v4ToastManager.showError('Failed to generate PKCE codes');
		} finally {
			setIsLocalGenerating(false);
		}
	}, [onChange, onGenerate, isLocalGenerating, isGenerating]);

	const isGeneratingState = isLocalGenerating || isGenerating;

	// Generate authorization URL with PKCE parameters
	const getAuthorizationUrl = useCallback(() => {
		if (!authUrl || !value.codeChallenge) return authUrl;

		const url = new URL(authUrl);
		url.searchParams.set('code_challenge', value.codeChallenge);
		url.searchParams.set('code_challenge_method', value.codeChallengeMethod);
		return url.toString();
	}, [authUrl, value.codeChallenge, value.codeChallengeMethod]);

	return (
		<PKCEContainer>
			<PKCEHeader>
				<PKCEHeaderLeft>
					<PKCETitle>
						<FiShield />
						{title}
					</PKCETitle>
					{subtitle && <PKCESubtitle>{subtitle}</PKCESubtitle>}
				</PKCEHeaderLeft>
			</PKCEHeader>

			{showDetails && (
				<EducationalSection>
					<EducationalTitle>
						<FiInfo />
						What is PKCE?
					</EducationalTitle>
					<EducationalContent>
						<EducationalCard>
							<EducationalCardTitle>
								<FiShield />
								Security Protection
							</EducationalCardTitle>
							<EducationalText>
								PKCE (Proof Key for Code Exchange) protects against authorization code interception
								attacks by requiring a secret code verifier that only your application knows.
							</EducationalText>
						</EducationalCard>
						<EducationalCard>
							<EducationalCardTitle>
								<FiKey />
								How It Works
							</EducationalCardTitle>
							<EducationalText>
								Your app generates a secret code verifier, creates a challenge from it, sends the
								challenge publicly, but keeps the verifier secret until token exchange.
							</EducationalText>
						</EducationalCard>
					</EducationalContent>
				</EducationalSection>
			)}

			{/* PKCE Generation Button Section */}
			<PKCEButtonSection>
				<GenerateButton
					onClick={handleGenerate}
					disabled={isGeneratingState}
					$isGenerating={isGeneratingState}
				>
					{isGeneratingState ? (
						<>
							<div
								style={{
									width: '18px',
									height: '18px',
									border: '2px solid #ffffff',
									borderTop: '2px solid transparent',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}}
							/>
							Generating...
						</>
					) : (
						<>
							<FiRefreshCw />
							{value.codeVerifier && value.codeChallenge
								? 'Regenerate PKCE Codes'
								: 'Generate PKCE Codes'}
						</>
					)}
				</GenerateButton>
			</PKCEButtonSection>

			{value.codeVerifier && value.codeChallenge && (
				<>
					<PKCEFieldsContainer>
						<PKCEField $isSecret={true}>
							<PKCELabel $isSecret={true}>
								<Badge $variant="secret">
									<FiKey />
									Secret
								</Badge>
								Code Verifier
							</PKCELabel>
							<PKCEValueContainer>
								<PKCEValue>
									{showCodeVerifier
										? value.codeVerifier
										: '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
								</PKCEValue>
								<ToggleButton
									onClick={() => setShowCodeVerifier(!showCodeVerifier)}
									$isVisible={showCodeVerifier}
									title={showCodeVerifier ? 'Hide code verifier' : 'Show code verifier'}
								>
									{showCodeVerifier ? <FiEyeOff /> : <FiEye />}
								</ToggleButton>
								{CopyButtonVariants.identifier(value.codeVerifier, 'Code Verifier')}
							</PKCEValueContainer>
						</PKCEField>

						<PKCEField $isSecret={false}>
							<PKCELabel $isSecret={false}>
								<Badge $variant="public">
									<FiCheck />
									Public
								</Badge>
								Code Challenge
							</PKCELabel>
							<PKCEValueContainer>
								<PKCEValue>{value.codeChallenge}</PKCEValue>
								{CopyButtonVariants.identifier(value.codeChallenge, 'Code Challenge')}
							</PKCEValueContainer>
						</PKCEField>
					</PKCEFieldsContainer>

					<SecurityInfo>
						<SecurityTitle>
							<FiShield />
							Security Features
						</SecurityTitle>
						<SecurityList>
							<SecurityItem>
								<strong>Code Verifier:</strong> 43-128 character secret generated by your
								application
							</SecurityItem>
							<SecurityItem>
								<strong>Code Challenge:</strong> SHA256 hash of the verifier, sent in authorization
								request
							</SecurityItem>
							<SecurityItem>
								<strong>Method:</strong> S256 (SHA256) - the recommended and most secure method
							</SecurityItem>
							<SecurityItem>
								<strong>Protection:</strong> Prevents authorization code interception attacks
							</SecurityItem>
						</SecurityList>
					</SecurityInfo>

					{authUrl && (
						<URLSection>
							<URLTitle>
								<FiExternalLink />
								Authorization URL with PKCE
							</URLTitle>
							<ColoredUrlDisplay
								url={getAuthorizationUrl()}
								title="Authorization URL with PKCE Parameters"
								showCopyButton={true}
								showExplanationButton={true}
							/>
						</URLSection>
					)}
				</>
			)}
		</PKCEContainer>
	);
};

export default PKCEService;

// Utility functions
export const PKCEServiceUtils = {
	generateCodes: async (): Promise<PKCECodes> => {
		const useNewOidcCore = FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE');

		if (useNewOidcCore) {
			// Use Phase 2 PkceManager
			console.log('🔐 [PKCE Utils] Using Phase 2 PkceManager');
			const pkce = await PkceManager.generateAsync();
			return {
				codeVerifier: pkce.codeVerifier,
				codeChallenge: pkce.codeChallenge,
				codeChallengeMethod: 'S256',
			};
		} else {
			// Fallback to old method
			console.log('🔐 [PKCE Utils] Using old PKCE generation');
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			return {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256',
			};
		};
	},

	validateCodes: (codes: PKCECodes): boolean => {
		return !!(codes.codeVerifier && codes.codeChallenge && codes.codeChallengeMethod === 'S256');
	},
};
