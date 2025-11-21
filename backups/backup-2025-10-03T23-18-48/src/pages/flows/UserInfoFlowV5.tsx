// src/pages/flows/UserInfoFlowV5.tsx
// V5.0.0 User Info Flow - Full V5 Implementation with Enhanced FlowInfoService

import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiInfo, FiRefreshCw, FiUser } from 'react-icons/fi';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useUserInfoFlowController } from '../../hooks/useUserInfoFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand User Info Flow and configure credentials',
	},
	{
		title: 'Step 1: User Info Request',
		subtitle: 'Request user information using access token',
	},
	{ title: 'Step 2: User Info Response', subtitle: 'Review the received user information' },
	{ title: 'Step 3: Flow Complete', subtitle: 'Review results and next steps' },
] as const;

type StepIndex = 0 | 1 | 2 | 3;

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const ContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
`;

const StepHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const StepHeaderTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	opacity: 0.9;
	margin: 0;
`;

const StepHeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const StepNumber = styled.span`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.5rem;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
`;

const StepTotal = styled.span`
	opacity: 0.8;
	font-size: 0.875rem;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const FormSection = styled.div`
	background: #f9fafb;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const FormTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TextArea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	min-height: 100px;
	resize: vertical;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border: none;

	${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover:not(:disabled) {
						background: #2563eb;
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover:not(:disabled) {
						background: #e5e7eb;
					}
				`;
			case 'success':
				return `
					background: #10b981;
					color: white;
					&:hover:not(:disabled) {
						background: #059669;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ResultsContainer = styled.div`
	background: #f9fafb;
	border-radius: 8px;
	padding: 1.5rem;
	margin-top: 1rem;
`;

const SuccessMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #059669;
	font-weight: 500;
	margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #dc2626;
	font-weight: 500;
	margin-bottom: 1rem;
`;

const UserInfo = styled.div`
	background: white;
	border-radius: 6px;
	padding: 1rem;
	margin-bottom: 1rem;
	border-left: 4px solid #3b82f6;
`;

const UserInfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const UserInfoLabel = styled.span`
	font-weight: 500;
	color: #374151;
`;

const UserInfoValue = styled.span`
	color: #1f2937;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

const UserInfoFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState<StepIndex>(0);
	const [isRequesting, setIsRequesting] = useState(false);
	const [userInfoResult, setUserInfoResult] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);

	usePageScroll();

	const { credentials, userInfo, fetchUserInfo, clearResults, updateCredentials } =
		useUserInfoFlowController();

	const handleNext = useCallback(() => {
		if (currentStep < 3) {
			setCurrentStep((prev) => (prev + 1) as StepIndex);
		}
	}, [currentStep]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => (prev - 1) as StepIndex);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setUserInfoResult(null);
		setError(null);
		clearResults();
	}, [clearResults]);

	const handleRequestUserInfo = useCallback(async () => {
		if (!credentials.accessToken || !credentials.userInfoEndpoint) {
			setError('Please provide access token and user info endpoint');
			return;
		}

		setIsRequesting(true);
		setError(null);

		try {
			const result = await fetchUserInfo();
			setUserInfoResult(result);
			v4ToastManager.showSuccess('User info requested successfully!');
			handleNext();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to request user info';
			setError(errorMessage);
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsRequesting(false);
		}
	}, [credentials, fetchUserInfo, handleNext]);

	const canNavigateNext = currentStep === 0 || (currentStep === 1 && !!userInfoResult);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>
								<FiUser /> User Info Flow
							</ExplanationHeading>
							<p>
								The User Info Flow allows clients to retrieve user information using an access
								token. This is commonly used in OIDC flows to get additional user details after
								authentication.
							</p>
						</ExplanationSection>

						<EnhancedFlowWalkthrough flowId="user-info" />
						<FlowSequenceDisplay flowType="user-info" />
					</>
				);

			case 1:
				return (
					<>
						<FormSection>
							<FormTitle>
								<FiUser /> Request User Information
							</FormTitle>
							<FormGroup>
								<Label>Access Token</Label>
								<TextArea
									placeholder="Enter access token..."
									value={credentials.accessToken || ''}
									onChange={(e) => updateCredentials({ accessToken: e.target.value })}
								/>
							</FormGroup>
							<FormGroup>
								<Label>User Info Endpoint</Label>
								<Input
									placeholder="Enter user info endpoint URL..."
									value={credentials.userInfoEndpoint || ''}
									onChange={(e) => updateCredentials({ userInfoEndpoint: e.target.value })}
								/>
							</FormGroup>
							<Button
								variant="success"
								onClick={handleRequestUserInfo}
								disabled={isRequesting || !credentials.accessToken || !credentials.userInfoEndpoint}
							>
								{isRequesting ? <FiRefreshCw className="animate-spin" /> : <FiUser />}
								{isRequesting ? 'Requesting...' : 'Request User Information'}
							</Button>
						</FormSection>

						{error && (
							<ErrorMessage>
								<FiInfo />
								{error}
							</ErrorMessage>
						)}

						{userInfoResult && (
							<ResultsContainer>
								<SuccessMessage>
									<FiCheckCircle />
									User information requested successfully!
								</SuccessMessage>

								<UserInfo>
									{userInfo?.sub && (
										<UserInfoRow>
											<UserInfoLabel>Subject ID:</UserInfoLabel>
											<UserInfoValue>{userInfo.sub}</UserInfoValue>
										</UserInfoRow>
									)}
									{userInfo?.name && (
										<UserInfoRow>
											<UserInfoLabel>Name:</UserInfoLabel>
											<UserInfoValue>{userInfo.name}</UserInfoValue>
										</UserInfoRow>
									)}
									{userInfo?.email && (
										<UserInfoRow>
											<UserInfoLabel>Email:</UserInfoLabel>
											<UserInfoValue>{userInfo.email}</UserInfoValue>
										</UserInfoRow>
									)}
									{userInfo?.preferred_username && (
										<UserInfoRow>
											<UserInfoLabel>Preferred Username:</UserInfoLabel>
											<UserInfoValue>{userInfo.preferred_username}</UserInfoValue>
										</UserInfoRow>
									)}
									{userInfo?.given_name && (
										<UserInfoRow>
											<UserInfoLabel>Given Name:</UserInfoLabel>
											<UserInfoValue>{userInfo.given_name}</UserInfoValue>
										</UserInfoRow>
									)}
									{userInfo?.family_name && (
										<UserInfoRow>
											<UserInfoLabel>Family Name:</UserInfoLabel>
											<UserInfoValue>{userInfo.family_name}</UserInfoValue>
										</UserInfoRow>
									)}
								</UserInfo>

								<ResultsSection>
									<ResultsHeading>Full User Info Response</ResultsHeading>
									<pre
										style={{
											background: '#f3f4f6',
											padding: '1rem',
											borderRadius: '6px',
											overflow: 'auto',
										}}
									>
										{JSON.stringify(userInfoResult, null, 2)}
									</pre>
								</ResultsSection>
							</ResultsContainer>
						)}
					</>
				);

			case 2:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>User Info Request Complete</ResultsHeading>
							<p>
								The user information has been successfully retrieved. You now have access to user
								details and claims that can be used for personalization and authorization.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Key Information</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>
									<strong>Subject ID:</strong> {userInfo?.sub || 'Not available'}
								</li>
								<li>
									<strong>Name:</strong> {userInfo?.name || 'Not available'}
								</li>
								<li>
									<strong>Email:</strong> {userInfo?.email || 'Not available'}
								</li>
								<li>
									<strong>Preferred Username:</strong>{' '}
									{userInfo?.preferred_username || 'Not available'}
								</li>
								<li>
									<strong>Given Name:</strong> {userInfo?.given_name || 'Not available'}
								</li>
								<li>
									<strong>Family Name:</strong> {userInfo?.family_name || 'Not available'}
								</li>
							</ul>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Next Steps</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>Use user information for personalization</li>
								<li>Implement user profile display</li>
								<li>Handle user information updates</li>
								<li>Consider caching user information for performance</li>
							</ul>
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Flow Complete</ResultsHeading>
							<p>
								You have successfully completed the User Info Flow V5. This flow demonstrates how to
								retrieve user information using access tokens for personalization and authorization.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>What You Learned</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>How to use User Info Flow for user information retrieval</li>
								<li>Access token validation for user info requests</li>
								<li>User information and claims handling</li>
								<li>Personalization and authorization patterns</li>
							</ul>
						</ResultsSection>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="user-info-v5" />

				<EnhancedFlowInfoCard
					flowType="user-info"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>User Info Flow · V5</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{currentStep + 1}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContent>{renderStepContent()}</StepContent>
				</MainCard>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrevious}
				onReset={handleReset}
				onNext={handleNext}
				canNavigateNext={canNavigateNext}
				isFirstStep={currentStep === 0}
				nextButtonText={canNavigateNext ? 'Next' : 'Complete above action'}
				disabledMessage="Complete the action above to continue"
			/>
		</Container>
	);
};

export default UserInfoFlowV5;
