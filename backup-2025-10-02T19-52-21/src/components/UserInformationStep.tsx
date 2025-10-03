import React, { useCallback, useState } from 'react';
import {
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiUser,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Styled Components
const CollapsibleSection = styled.div`
	margin-bottom: 1.5rem;
`;

const CollapsibleHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.hover};
		border-color: ${({ theme }) => theme.colors.primary};
	}
`;

const CollapsibleTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
`;

const CollapsibleToggleIcon = styled.div<{ $collapsed: boolean }>`
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	transition: transform 0.2s ease;
`;

const CollapsibleContent = styled.div`
	padding: 1rem;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
	background: ${({ theme }) => theme.colors.background};
`;

const ExplanationSection = styled.div`
	margin-bottom: 1.5rem;
`;

const ExplanationHeading = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0 0 0.5rem 0;
	color: ${({ theme }) => theme.colors.text};
	font-size: 1.1rem;
	font-weight: 600;
`;

const InfoText = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors.textSecondary};
	line-height: 1.5;
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	justify-content: center;
	margin: 1.5rem 0;
`;

const HighlightedActionButton = styled.button<{ $priority: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: ${({ $priority, theme }) =>
		$priority === 'primary' ? theme.colors.primary : theme.colors.secondary};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const SectionDivider = styled.hr`
	border: none;
	height: 1px;
	background: ${({ theme }) => theme.colors.border};
	margin: 1.5rem 0;
`;

const ResultsSection = styled.div`
	margin-top: 1.5rem;
`;

const ResultsHeading = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0 0 0.5rem 0;
	color: ${({ theme }) => theme.colors.text};
	font-size: 1.1rem;
	font-weight: 600;
`;

const HelperText = styled.p`
	margin: 0 0 1rem 0;
	color: ${({ theme }) => theme.colors.textSecondary};
	font-size: 0.9rem;
	line-height: 1.4;
`;

const GeneratedContentBox = styled.div`
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 0.5rem;
	overflow: hidden;
	position: relative;
`;

const GeneratedLabel = styled.div`
	background: ${({ theme }) => theme.colors.primary};
	color: white;
	padding: 0.5rem 1rem;
	font-size: 0.8rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

const CodeBlock = styled.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	margin: 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.85rem;
	line-height: 1.4;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-word;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: ${({ $variant, theme }) =>
		$variant === 'primary' ? theme.colors.primary : theme.colors.secondary};
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
`;

// Types
interface UserInformationStepProps {
	userInfo: any;
	onFetchUserInfo: () => void;
	onNavigateToTokenManagement: () => void;
	hasAccessToken: boolean;
	flowType?: 'oauth' | 'oidc' | 'worker';
	tokens?: any;
	credentials?: any;
}

const UserInformationStep: React.FC<UserInformationStepProps> = ({
	userInfo,
	onFetchUserInfo,
	onNavigateToTokenManagement,
	hasAccessToken,
	flowType = 'oauth',
	tokens,
	credentials,
}) => {
	const { primaryColor, secondaryColor } = useUISettings();
	const [collapsedSections, setCollapsedSections] = useState({
		userInfoOverview: false,
		userInfoDetails: false,
	});

	const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	}, []);

	const handleNavigateToTokenManagement = useCallback(() => {
		// Store flow context in sessionStorage for Token Management page
		if (tokens && credentials) {
			const flowContext = {
				flow:
					flowType === 'oauth'
						? 'authorization-code-v5'
						: flowType === 'oidc'
							? 'oidc-authorization-code-v5'
							: 'worker-token-v5',
				tokens,
				credentials,
				timestamp: Date.now(),
			};

			sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));
		}

		onNavigateToTokenManagement();
	}, [tokens, credentials, flowType, onNavigateToTokenManagement]);

	const getFlowSpecificText = () => {
		switch (flowType) {
			case 'oidc':
				return {
					title: 'Inspect ID token claims and user info',
					description:
						'Use the access token to request the PingOne UserInfo endpoint and review granted claims from both the ID token and UserInfo response.',
					buttonText: 'Fetch User Info',
					noTokenMessage: 'Exchange the authorization code first, then fetch user info.',
				};
			case 'worker':
				return {
					title: 'Inspect user information',
					description:
						'Use the access token to request user information and review granted claims.',
					buttonText: 'Fetch User Info',
					noTokenMessage: 'Request an access token first, then fetch user info.',
				};
			default: // oauth
				return {
					title: 'Inspect user information',
					description:
						'Use the access token to request the PingOne UserInfo endpoint and review granted claims.',
					buttonText: 'Fetch User Info',
					noTokenMessage: 'Exchange the authorization code first, then fetch user info.',
				};
		}
	};

	const flowText = getFlowSpecificText();

	return (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('userInfoOverview')}
					aria-expanded={!collapsedSections.userInfoOverview}
				>
					<CollapsibleTitle>
						<FiEye /> User Information Overview
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.userInfoOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.userInfoOverview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiEye /> {flowText.title}
							</ExplanationHeading>
							<InfoText>{flowText.description}</InfoText>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('userInfoDetails')}
					aria-expanded={!collapsedSections.userInfoDetails}
				>
					<CollapsibleTitle>
						<FiUser /> User Information Details
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.userInfoDetails}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.userInfoDetails && (
					<CollapsibleContent>
						<ActionRow style={{ justifyContent: 'center' }}>
							<HighlightedActionButton
								onClick={onFetchUserInfo}
								$priority="primary"
								disabled={!hasAccessToken}
								style={{
									backgroundColor: primaryColor,
									borderColor: primaryColor,
								}}
							>
								<FiEye /> {flowText.buttonText}
							</HighlightedActionButton>
						</ActionRow>

						<SectionDivider />

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> UserInfo Response
							</ResultsHeading>
							<HelperText>
								Copy the claims or open the token management tools for deeper inspection.
							</HelperText>
							{userInfo ? (
								<GeneratedContentBox>
									<GeneratedLabel style={{ backgroundColor: primaryColor }}>
										User Info
									</GeneratedLabel>
									<CodeBlock>{JSON.stringify(userInfo, null, 2)}</CodeBlock>
									<ActionRow>
										<Button
											onClick={() => handleCopy(JSON.stringify(userInfo, null, 2), 'User Info')}
											$variant="primary"
											style={{
												backgroundColor: '#3b82f6',
												borderColor: '#3b82f6',
												color: '#ffffff',
												fontWeight: '600',
											}}
										>
											<FiCopy /> Copy User Info
										</Button>
										<Button
											onClick={handleNavigateToTokenManagement}
											$variant="primary"
											style={{
												backgroundColor: secondaryColor,
												borderColor: secondaryColor,
											}}
										>
											<FiExternalLink /> Inspect Tokens
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							) : (
								<HelperText>{flowText.noTokenMessage}</HelperText>
							)}
						</ResultsSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);
};

export default UserInformationStep;
