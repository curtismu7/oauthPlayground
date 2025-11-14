// src/pages/flows/PingOneMFAFlowV5.tsx
// V5.1 PingOne MFA Flow with standard V5 structure

import React, { useState } from 'react';
import {
	FiInfo,
	FiKey,
	FiShield,
	FiCheckCircle,
	FiSmartphone,
	FiMail,
	FiLock,
	FiPhone,
	FiChevronDown,
} from 'react-icons/fi';
import styled from 'styled-components';
import { FlowHeader } from '../../services/flowHeaderService';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the PingOne MFA Flow and configure credentials',
	},
	{
		title: 'Step 1: Device Registration',
		subtitle: 'Register device for MFA methods',
	},
	{
		title: 'Step 2: MFA Method Selection',
		subtitle: 'Choose preferred MFA verification method',
	},
	{
		title: 'Step 3: MFA Verification',
		subtitle: 'Complete multi-factor authentication',
	},
	{
		title: 'Step 4: Token Exchange',
		subtitle: 'Exchange authorization code for tokens with MFA context',
	},
	{
		title: 'Step 5: Flow Complete',
		subtitle: 'Review MFA flow results and next steps',
	},
] as const;

type IntroSectionKey = 'overview' | 'credentials' | 'results' | 'mfaOverview' | 'mfaDetails';

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin-bottom: 2rem;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 1.5rem 2rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
`;

const VersionBadge = styled.span`
	align-self: flex-start;
	background: rgba(22, 163, 74, 0.2);
	color: #ffffff;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
`;

const StepHeaderTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0.5rem 0 0 0;
`;

const StepHeaderRight = styled.div`
	text-align: right;
`;

const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
`;

const StepContentWrapper = styled.div`
	padding: 2rem;
	background: #ffffff;
`;

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1rem 1.5rem;
	background: #f8fafc;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	transition: background-color 0.2s ease;

	&:hover {
		background: #f1f5f9;
	}

	&:focus {
		outline: none;
		background: #f1f5f9;
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	transition: transform 0.2s ease;
	transform: ${props => props.$collapsed ? 'rotate(0deg)' : 'rotate(180deg)'};
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	background: ${props => {
		switch (props.$variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#d1fae5';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${props => {
		switch (props.$variant) {
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			default:
				return '#3b82f6';
		}
	}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #111827;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	margin: 0 0 1rem 0;
	line-height: 1.5;
`;

const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #334155;
	margin: 0;
	padding-left: 1.5rem;
`;

const MfaMethodGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const MfaMethodCard = styled.div<{ $selected?: boolean }>`
	border: 2px solid ${props => props.$selected ? '#3b82f6' : '#e5e7eb'};
	border-radius: 0.75rem;
	padding: 1.5rem;
	cursor: pointer;
	transition: all 0.2s ease;
	background: ${props => props.$selected ? '#eff6ff' : 'white'};

	&:hover {
		border-color: #3b82f6;
		background: #f8fafc;
	}
`;

const MfaMethodIcon = styled.div`
	font-size: 2rem;
	color: #3b82f6;
	margin-bottom: 0.75rem;
`;

const MfaMethodTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #111827;
	margin: 0 0 0.5rem 0;
`;

const MfaMethodDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	margin-top: 2rem;
`;

const Button = styled.button<{
	$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
	$disabled?: boolean;
}>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
	transition: all 0.2s ease;
	opacity: ${props => props.$disabled ? 0.6 : 1};

	${props => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					border: 1px solid #3b82f6;
					&:hover:not(:disabled) {
						background: #2563eb;
						border-color: #2563eb;
					}
				`;
			case 'success':
				return `
					background: #10b981;
					color: white;
					border: 1px solid #10b981;
					&:hover:not(:disabled) {
						background: #059669;
						border-color: #059669;
					}
				`;
			case 'outline':
				return `
					background: white;
					color: #374151;
					border: 1px solid #d1d5db;
					&:hover:not(:disabled) {
						background: #f9fafb;
						border-color: #9ca3af;
					}
				`;
			default:
				return `
					background: #6b7280;
					color: white;
					border: 1px solid #6b7280;
					&:hover:not(:disabled) {
						background: #4b5563;
						border-color: #4b5563;
					}
				`;
		}
	}}
`;

const StatusCard = styled.div<{ $status: 'pending' | 'success' | 'error' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	background: ${props => {
		switch (props.$status) {
			case 'success':
				return '#d1fae5';
			case 'error':
				return '#fee2e2';
			default:
				return '#f3f4f6';
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'success':
				return '#065f46';
			case 'error':
				return '#991b1b';
			default:
				return '#374151';
		}
	}};
`;

const PingOneMFAFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [deviceRegistered, setDeviceRegistered] = useState(false);
	const [selectedMfaMethod, setSelectedMfaMethod] = useState('sms');
	const [mfaVerified, setMfaVerified] = useState(false);
	const [tokens, setTokens] = useState<any>(null);
	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>({
		overview: false,
		credentials: false,
		results: false,
		mfaOverview: false,
		mfaDetails: false,
	});

	const mfaMethods = [
		{ id: 'sms', label: 'SMS Verification', icon: <FiSmartphone />, description: 'Receive a code via SMS' },
		{ id: 'email', label: 'Email Verification', icon: <FiMail />, description: 'Receive a code via email' },
		{ id: 'totp', label: 'TOTP Authenticator', icon: <FiLock />, description: 'Use your authenticator app' },
		{ id: 'push', label: 'Push Notification', icon: <FiPhone />, description: 'Approve via mobile app' },
	];

	const handleDeviceRegistration = () => {
		setTimeout(() => {
			setDeviceRegistered(true);
			setCurrentStep(1);
		}, 1000);
	};

	const handleMfaSelection = () => {
		setCurrentStep(2);
	};

	const handleMfaVerification = () => {
		setTimeout(() => {
			setMfaVerified(true);
			setCurrentStep(3);
		}, 1000);
	};

	const handleTokenExchange = () => {
		setTimeout(() => {
			setTokens({
				access_token: 'access_token_' + Date.now(),
				id_token: 'id_token_' + Date.now(),
				token_type: 'Bearer',
				expires_in: 3600,
				mfa_verified: true,
				mfa_method: selectedMfaMethod,
			});
			setCurrentStep(4);
		}, 1000);
	};

	const toggleSection = (sectionKey: IntroSectionKey) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionKey]: !prev[sectionKey]
		}));
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>PingOne MFA Flow Overview</InfoTitle>
								<InfoText>
									This flow demonstrates how to integrate multi-factor authentication with PingOne MFA services.
									You'll learn about device registration, MFA method selection, and token exchange with MFA context.
								</InfoText>
							</div>
						</InfoBox>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('mfaOverview')}
								aria-expanded={!collapsedSections.mfaOverview}
							>
								<CollapsibleTitle>
									<FiShield /> MFA Methods Supported
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.mfaOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.mfaOverview && (
								<CollapsibleContent>
									<MfaMethodGrid>
										{mfaMethods.map((method) => (
											<MfaMethodCard key={method.id}>
												<MfaMethodIcon>{method.icon}</MfaMethodIcon>
												<MfaMethodTitle>{method.label}</MfaMethodTitle>
												<MfaMethodDescription>{method.description}</MfaMethodDescription>
											</MfaMethodCard>
										))}
									</MfaMethodGrid>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<ActionRow>
							<Button $variant="primary" onClick={() => setCurrentStep(1)}>
								<FiKey />
								Start MFA Flow
							</Button>
						</ActionRow>
					</div>
				);

			case 1:
				return (
					<div>
						<InfoBox $variant="info">
							<FiKey size={20} />
							<div>
								<InfoTitle>Device Registration</InfoTitle>
								<InfoText>
									Register your device with PingOne MFA services to enable multi-factor authentication methods.
								</InfoText>
							</div>
						</InfoBox>

						{!deviceRegistered ? (
							<div>
								<StatusCard $status="pending">
									<FiInfo />
									<div>
										<strong>Device Registration Required</strong>
										<p>Click the button below to register your device for MFA.</p>
									</div>
								</StatusCard>
								<ActionRow>
									<Button $variant="outline" onClick={() => setCurrentStep(0)}>Back</Button>
									<Button $variant="primary" onClick={handleDeviceRegistration}>
										<FiKey />
										Register Device
									</Button>
								</ActionRow>
							</div>
						) : (
							<div>
								<StatusCard $status="success">
									<FiCheckCircle />
									<div>
										<strong>Device Registered Successfully</strong>
										<p>Your device is now registered and ready for MFA methods.</p>
									</div>
								</StatusCard>
								<ActionRow>
									<Button $variant="outline" onClick={() => setCurrentStep(0)}>Back</Button>
									<Button $variant="primary" onClick={() => setCurrentStep(2)}>
										<FiShield />
										Continue to MFA Selection
									</Button>
								</ActionRow>
							</div>
						)}
					</div>
				);

			case 2:
				return (
					<div>
						<InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<InfoTitle>Select MFA Method</InfoTitle>
								<InfoText>
									Choose your preferred multi-factor authentication method. You can change this later.
								</InfoText>
							</div>
						</InfoBox>

						<MfaMethodGrid>
							{mfaMethods.map((method) => (
								<MfaMethodCard
									key={method.id}
									$selected={selectedMfaMethod === method.id}
									onClick={() => setSelectedMfaMethod(method.id)}
								>
									<MfaMethodIcon>{method.icon}</MfaMethodIcon>
									<MfaMethodTitle>{method.label}</MfaMethodTitle>
									<MfaMethodDescription>{method.description}</MfaMethodDescription>
								</MfaMethodCard>
							))}
						</MfaMethodGrid>

						<ActionRow>
							<Button $variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
							<Button $variant="primary" onClick={handleMfaSelection}>
								<FiShield />
								Continue with {mfaMethods.find(m => m.id === selectedMfaMethod)?.label}
							</Button>
						</ActionRow>
					</div>
				);

			case 3:
				return (
					<div>
						<InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<InfoTitle>MFA Verification</InfoTitle>
								<InfoText>
									Complete the multi-factor authentication using your selected method.
								</InfoText>
							</div>
						</InfoBox>

						{!mfaVerified ? (
							<div>
								<StatusCard $status="pending">
									<FiInfo />
									<div>
										<strong>Verification Required</strong>
										<p>Complete the MFA verification using {mfaMethods.find(m => m.id === selectedMfaMethod)?.label}.</p>
									</div>
								</StatusCard>
								<ActionRow>
									<Button $variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
									<Button $variant="primary" onClick={handleMfaVerification}>
										<FiShield />
										Verify MFA
									</Button>
								</ActionRow>
							</div>
						) : (
							<div>
								<StatusCard $status="success">
									<FiCheckCircle />
									<div>
										<strong>MFA Verification Successful</strong>
										<p>You have successfully completed multi-factor authentication.</p>
									</div>
								</StatusCard>
								<ActionRow>
									<Button $variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
									<Button $variant="primary" onClick={handleTokenExchange}>
										<FiKey />
										Exchange for Tokens
									</Button>
								</ActionRow>
							</div>
						)}
					</div>
				);

			case 4:
				return (
					<div>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Tokens Received</InfoTitle>
								<InfoText>
									You have successfully completed the PingOne MFA flow and received tokens with MFA context.
								</InfoText>
							</div>
						</InfoBox>

						{tokens && (
							<div>
								<StatusCard $status="success">
									<FiCheckCircle />
									<div>
										<strong>MFA Flow Complete</strong>
										<p>Access token includes MFA verification status and method used.</p>
									</div>
								</StatusCard>
								<ActionRow>
									<Button $variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
									<Button $variant="primary" onClick={() => setCurrentStep(5)}>
										<FiCheckCircle />
										View Results
									</Button>
								</ActionRow>
							</div>
						)}
					</div>
				);

			case 5:
				return (
					<div>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>MFA Flow Complete</InfoTitle>
								<InfoText>
									Congratulations! You have successfully completed the PingOne MFA flow demonstration.
								</InfoText>
							</div>
						</InfoBox>

						<ActionRow>
							<Button $variant="outline" onClick={() => setCurrentStep(0)}>
								<FiKey />
								Start Over
							</Button>
						</ActionRow>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="pingone-mfa-v5" />
				<FlowInfoCard flowInfo={getFlowInfo('pingone-mfa')!} />
				<FlowSequenceDisplay flowType="worker-token" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V5</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep]?.title || 'Unknown Step'}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep]?.subtitle || 'No description available'}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{currentStep + 1}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>
						{renderStepContent()}
					</StepContentWrapper>
				</MainCard>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
				onNext={() => setCurrentStep(Math.min(STEP_METADATA.length - 1, currentStep + 1))}
				onReset={() => setCurrentStep(0)}
			/>
		</Container>
	);
};

export default PingOneMFAFlowV5;