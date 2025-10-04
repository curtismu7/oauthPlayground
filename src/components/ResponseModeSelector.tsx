// src/components/ResponseModeSelector.tsx
// Reusable response mode selector component for OAuth/OIDC flows

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiInfo, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';
import {
	ResponseModeService,
	ResponseMode,
	ResponseModeInfo,
} from '../services/responseModeService';

interface ResponseModeSelectorProps {
	selectedMode: ResponseMode;
	onModeChange: (mode: ResponseMode) => void;
	responseType?: string;
	clientType?: 'confidential' | 'public';
	platform?: 'web' | 'mobile' | 'desktop' | 'iot';
	disabled?: boolean;
	showRecommendations?: boolean;
	showUrlExamples?: boolean;
	baseUrl?: string;
	className?: string;
}

const Container = styled.div<{ $disabled?: boolean }>`
	opacity: ${(props) => (props.$disabled ? 0.6 : 1)};
	pointer-events: ${(props) => (props.$disabled ? 'none' : 'auto')};
`;

const SelectorWrapper = styled.div`
	position: relative;
	width: 100%;
`;

const SelectButton = styled.button<{ $isOpen: boolean; $hasError?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 0.75rem 1rem;
	background: white;
	border: 2px solid ${(props) => (props.$hasError ? '#ef4444' : props.$isOpen ? '#3b82f6' : '#e5e7eb')};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${(props) => (props.$hasError ? '#dc2626' : '#3b82f6')};
	}

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const SelectedMode = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ModeIcon = styled.span<{ $color: string }>`
	font-size: 1.125rem;
	color: ${(props) => props.$color};
`;

const ModeName = styled.span`
	font-weight: 600;
`;

const ChevronIcon = styled(FiChevronDown)<{ $isOpen: boolean }>`
	transition: transform 0.2s ease;
	transform: ${(props) => (props.$isOpen ? 'rotate(0deg)' : 'rotate(-90deg)')};
	color: #6b7280;
`;

const Dropdown = styled.div<{ $isOpen: boolean }>`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	z-index: 50;
	margin-top: 0.25rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	overflow: hidden;
	opacity: ${(props) => (props.$isOpen ? 1 : 0)};
	visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
	transform: ${(props) => (props.$isOpen ? 'translateY(0)' : 'translateY(-10px)')};
	transition: all 0.2s ease;
`;

const Option = styled.button<{ $isSelected: boolean; $isRecommended?: boolean }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	width: 100%;
	padding: 1rem;
	background: ${(props) => (props.$isSelected ? '#f3f4f6' : 'white')};
	border: none;
	text-align: left;
	cursor: pointer;
	transition: background-color 0.2s ease;
	position: relative;

	&:hover {
		background: #f9fafb;
	}

	&:focus {
		outline: none;
		background: #f3f4f6;
	}
`;

const OptionIcon = styled.span<{ $color: string }>`
	font-size: 1.25rem;
	color: ${(props) => props.$color};
	margin-top: 0.125rem;
`;

const OptionContent = styled.div`
	flex: 1;
`;

const OptionName = styled.div<{ $isSelected: boolean }>`
	font-weight: ${(props) => (props.$isSelected ? 600 : 500)};
	color: #111827;
	margin-bottom: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const OptionDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
	margin-bottom: 0.5rem;
`;

const OptionUseCase = styled.div`
	font-size: 0.75rem;
	color: #059669;
	font-weight: 500;
`;

const RecommendationBadge = styled.span`
	background: #10b981;
	color: white;
	font-size: 0.625rem;
	font-weight: 600;
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	text-transform: uppercase;
	letter-spacing: 0.025em;
`;

const CompatibilityWarning = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 0.5rem;
	padding: 0.5rem;
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	color: #92400e;
`;

const InfoSection = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`;

const InfoTitle = styled.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.p`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
	margin-bottom: 0.75rem;
`;

const SecurityNotes = styled.ul`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
	margin: 0;
	padding-left: 1rem;
`;

const UrlExampleSection = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`;

const UrlExampleTitle = styled.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin: 0 0 0.75rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const UrlExample = styled.div`
	background: #1e293b;
	border-radius: 0.375rem;
	padding: 0.75rem;
	margin-bottom: 0.75rem;
	overflow-x: auto;
`;

const UrlText = styled.code`
	color: #1e293b;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	line-height: 1.4;
	word-break: break-all;
	background: #f8fafc;
	padding: 0.5rem;
	border-radius: 0.375rem;
	border: 1px solid #e2e8f0;
`;

const HighlightedParam = styled.span`
	background: #f59e0b;
	color: #1e293b;
	padding: 0.125rem 0.25rem;
	border-radius: 0.25rem;
	font-weight: 600;
`;

const ResponseExample = styled.div`
	background: white;
	border: 1px solid #f1f5f9;
	border-radius: 0.375rem;
	padding: 0.75rem;
	overflow-x: auto;
`;

const ResponseText = styled.pre`
	color: #1e293b;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	line-height: 1.4;
	margin: 0;
	white-space: pre-wrap;
	background: #f8fafc;
	padding: 0.5rem;
	border-radius: 0.375rem;
	border: 1px solid #e2e8f0;
`;

const CopyButton = styled.button`
	background: #374151;
	color: white;
	border: none;
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	font-size: 0.625rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;
	margin-top: 0.5rem;

	&:hover {
		background: #4b5563;
	}
`;

const ResponseModeSelector: React.FC<ResponseModeSelectorProps> = ({
	selectedMode,
	onModeChange,
	responseType = 'code',
	clientType = 'confidential',
	platform = 'web',
	disabled = false,
	showRecommendations = true,
	showUrlExamples = true,
	baseUrl = 'https://auth.pingone.com/{envID}/as/authorize',
	className,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [compatibilityIssues, setCompatibilityIssues] = useState<string[]>([]);

	const allModes = ResponseModeService.getAllModes();
	const selectedModeInfo = ResponseModeService.getModeInfo(selectedMode);
	const recommendedMode = showRecommendations
		? ResponseModeService.getRecommendedMode({ platform, clientType, responseType })
		: null;

	// Check compatibility when mode changes
	useEffect(() => {
		const validation = ResponseModeService.validateCompatibility(
			selectedMode,
			responseType,
			clientType
		);
		// Only update if the issues actually changed
		setCompatibilityIssues(prevIssues => {
			const newIssues = validation.issues;
			if (prevIssues.length !== newIssues.length || 
				!prevIssues.every((issue, index) => issue === newIssues[index])) {
				return newIssues;
			}
			return prevIssues;
		});
	}, [selectedMode, responseType, clientType]);

	const handleModeSelect = (mode: ResponseMode) => {
		onModeChange(mode);
		setIsOpen(false);
	};

	const hasCompatibilityIssues = compatibilityIssues.length > 0;

	// Generate URL example with highlighted response_mode parameter
	const generateUrlExample = () => {
		const params = new URLSearchParams({
			response_type: responseType,
			response_mode: selectedMode,
			client_id: '{clientID}',
			redirect_uri: '{redirectURI}',
			scope: 'openid profile email',
			state: '{state}',
			nonce: '{nonce}',
		});

		const url = `${baseUrl}?${params.toString()}`;
		return url;
	};

	// Generate response example based on selected mode
	const generateResponseExample = () => {
		const modeInfo = ResponseModeService.getModeInfo(selectedMode);
		if (!modeInfo) return '';

		switch (selectedMode) {
			case 'query':
				return `https://yourapp.com/callback?code=abc123&state=xyz789&scope=openid+profile+email`;
			case 'fragment':
				return `https://yourapp.com/callback#access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&token_type=Bearer&expires_in=3600&scope=openid+profile+email&state=xyz789`;
			case 'form_post':
				return `HTTP POST to: https://yourapp.com/callback
Content-Type: application/x-www-form-urlencoded

code=abc123&state=xyz789&scope=openid+profile+email`;
			case 'pi.flow':
				return `{
  "flow": {
    "id": "flow_123456789",
    "type": "authorization_code",
    "state": "active",
    "expires_at": "2024-01-01T12:00:00Z"
  },
  "ui": {
    "title": "Sign in to your account",
    "description": "Please authenticate to continue"
  },
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}`;
			default:
				return '';
		}
	};

	const handleCopyUrl = () => {
		navigator.clipboard.writeText(generateUrlExample());
	};

	const handleCopyResponse = () => {
		navigator.clipboard.writeText(generateResponseExample());
	};

	return (
		<Container $disabled={disabled} className={className}>
			<SelectorWrapper>
				<SelectButton
					$isOpen={isOpen}
					$hasError={hasCompatibilityIssues}
					onClick={() => setIsOpen(!isOpen)}
					disabled={disabled}
				>
					<SelectedMode>
						{selectedModeInfo && (
							<>
								<ModeIcon $color={ResponseModeService.getDisplayInfo(selectedMode).color}>
									{ResponseModeService.getDisplayInfo(selectedMode).icon}
								</ModeIcon>
								<ModeName>{selectedModeInfo.name}</ModeName>
							</>
						)}
					</SelectedMode>
					<ChevronIcon $isOpen={isOpen} />
				</SelectButton>

				<Dropdown $isOpen={isOpen}>
					{allModes.map((modeInfo) => {
						const isSelected = modeInfo.mode === selectedMode;
						const isRecommended = recommendedMode === modeInfo.mode;
						const validation = ResponseModeService.validateCompatibility(
							modeInfo.mode,
							responseType,
							clientType
						);
						const hasIssues = !validation.valid;

						return (
							<Option
								key={modeInfo.mode}
								$isSelected={isSelected}
								$isRecommended={isRecommended}
								onClick={() => handleModeSelect(modeInfo.mode)}
							>
								<OptionIcon $color={ResponseModeService.getDisplayInfo(modeInfo.mode).color}>
									{ResponseModeService.getDisplayInfo(modeInfo.mode).icon}
								</OptionIcon>
								<OptionContent>
									<OptionName $isSelected={isSelected}>
										{modeInfo.name}
										{isRecommended && <RecommendationBadge>Recommended</RecommendationBadge>}
									</OptionName>
									<OptionDescription>{modeInfo.description}</OptionDescription>
									<OptionUseCase>Best for: {modeInfo.useCase}</OptionUseCase>
									{hasIssues && (
										<CompatibilityWarning>
											<FiAlertTriangle size={12} />
											{validation.issues[0]}
										</CompatibilityWarning>
									)}
								</OptionContent>
							</Option>
						);
					})}
				</Dropdown>
			</SelectorWrapper>

			{selectedModeInfo && (
				<InfoSection>
					<InfoTitle>
						<FiInfo size={16} />
						{selectedModeInfo.name} Details
					</InfoTitle>
					<InfoText>{selectedModeInfo.description}</InfoText>
					<InfoText>
						<strong>Implementation:</strong> {selectedModeInfo.implementation.handlingMethod}
					</InfoText>
					<SecurityNotes>
						{selectedModeInfo.securityNotes.map((note, index) => (
							<li key={index}>{note}</li>
						))}
					</SecurityNotes>
				</InfoSection>
			)}

			{hasCompatibilityIssues && (
				<CompatibilityWarning>
					<FiAlertTriangle size={16} />
					<div>
						<strong>Compatibility Issues:</strong>
						<ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
							{compatibilityIssues.map((issue, index) => (
								<li key={index}>{issue}</li>
							))}
						</ul>
					</div>
				</CompatibilityWarning>
			)}

			{showUrlExamples && selectedModeInfo && (
				<UrlExampleSection>
					<UrlExampleTitle>
						<FiInfo size={16} />
						Live Examples for {selectedModeInfo.name}
					</UrlExampleTitle>

					<div>
						<strong>Authorization URL:</strong>
						<UrlExample>
							<UrlText>
								{generateUrlExample()
									.split('&')
									.map((param, index) => {
										if (param.startsWith('response_mode=')) {
											return (
												<React.Fragment key={index}>
													{index > 0 && '&'}
													<HighlightedParam>{param}</HighlightedParam>
												</React.Fragment>
											);
										}
										return (
											<React.Fragment key={index}>
												{index > 0 && '&'}
												{param}
											</React.Fragment>
										);
									})}
							</UrlText>
							<CopyButton onClick={handleCopyUrl}>Copy URL</CopyButton>
						</UrlExample>
					</div>

					<div>
						<strong>Response Format:</strong>
						<ResponseExample>
							<ResponseText>{generateResponseExample()}</ResponseText>
							<CopyButton onClick={handleCopyResponse}>Copy Response</CopyButton>
						</ResponseExample>
					</div>
				</UrlExampleSection>
			)}
		</Container>
	);
};

export default ResponseModeSelector;
