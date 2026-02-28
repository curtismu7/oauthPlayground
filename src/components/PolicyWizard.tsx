// src/components/PolicyWizard.tsx
/**
 * Policy Wizard (PingOne Config Helper)
 * Guides users through selecting PingOne app + policy settings based on risk posture
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronLeft,
	FiChevronRight,
	FiSettings,
	FiShield,
	FiTrendingUp,
	FiUsers,
	FiWifi,
} from '@icons';
import styled from 'styled-components';

type AnswerValue =
	| 'yes'
	| 'no'
	| 'required'
	| 'optional'
	| 'never'
	| 'browser'
	| 'native'
	| 'server';

interface QuestionOption {
	value: AnswerValue;
	label: string;
	description: string;
}

interface Question {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	options: QuestionOption[];
}

interface Recommendation {
	title: string;
	icon: React.ReactNode;
	description: string;
	actions: string[];
	category: 'security' | 'usability' | 'compliance';
}

const QUESTIONS: Question[] = [
	{
		id: 'clientType',
		title: 'What type of application are you configuring?',
		description:
			'Pinpoint the OAuth client profile so we can lock down flows, secrets, and redirect handling.',
		icon: <FiUsers />,
		options: [
			{
				value: 'browser',
				label: 'Single-Page App / JavaScript',
				description: 'Public client running in the browser with no secret storage.',
			},
			{
				value: 'native',
				label: 'Mobile / Desktop Native App',
				description: 'Public native client using custom URI schemes or ASWebAuthentication.',
			},
			{
				value: 'server',
				label: 'Backend Web App / Service',
				description: 'Confidential client with secure server-side secret storage.',
			},
		],
	},
	{
		id: 'dataSensitivity',
		title: 'What sensitivity level best matches the data this app touches?',
		description:
			'Higher sensitivity requires stricter token lifetimes, MFA, and risk-based controls.',
		icon: <FiShield />,
		options: [
			{
				value: 'never',
				label: 'Public / Low',
				description: 'Marketing sites, non-authenticated experiences.',
			},
			{
				value: 'optional',
				label: 'Moderate',
				description: 'General user portals, self-service experiences.',
			},
			{
				value: 'required',
				label: 'High / Regulated',
				description: 'Financial, healthcare, privileged admin consoles.',
			},
		],
	},
	{
		id: 'mfaRequirement',
		title: 'Do you require MFA for sign-in or step-up?',
		description: 'We will map to PingOne MFA policies and factors automatically.',
		icon: <FiWifi />,
		options: [
			{
				value: 'never',
				label: 'No MFA needed',
				description: 'Low-risk apps, rely on single-factor sign-in.',
			},
			{
				value: 'optional',
				label: 'Adaptive MFA',
				description: 'Prompt when risk is elevated or accessing sensitive features.',
			},
			{
				value: 'required',
				label: 'Always require MFA',
				description: 'Admins or regulated data. Enforce on every session.',
			},
		],
	},
	{
		id: 'apiUsage',
		title: 'Will this app call PingOne Management APIs or other resource APIs?',
		description: 'Determines if we issue worker tokens, SCIM access, and refresh semantics.',
		icon: <FiTrendingUp />,
		options: [
			{
				value: 'no',
				label: 'No – front-end only',
				description: 'Only uses ID tokens / UserInfo for identity.',
			},
			{
				value: 'optional',
				label: 'Yes – limited scope',
				description: 'Needs read-only or user-focused API access.',
			},
			{
				value: 'required',
				label: 'Yes – privileged automation',
				description: 'Writes to PingOne APIs or downstream services.',
			},
		],
	},
];

const WizardContainer = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
	border-radius: 1rem;
	padding: 2rem;
	border: 2px solid #1e40af;
	box-shadow: 0 12px 30px rgba(30, 64, 175, 0.18);
`;

const Header = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-bottom: 2rem;
`;

const Title = styled.h2`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 0;
	color: #1e3a8a;
	font-size: 1.75rem;
`;

const Intro = styled.p`
	color: #1f2937;
	margin: 0;
	line-height: 1.6;
	font-size: 1.05rem;
`;

const Stepper = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
	gap: 1.5rem;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const QuestionCard = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	padding: 1.75rem;
	border: 1px solid #c7d2fe;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const QuestionHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #1d4ed8;
	font-weight: 700;
	font-size: 1.1rem;
`;

const QuestionDescription = styled.p`
	margin: 0;
	color: #475569;
	line-height: 1.6;
`;

const OptionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
`;

const OptionButton = styled.button<{ $selected: boolean }>`
	text-align: left;
	padding: 1.25rem;
	border-radius: 0.75rem;
	border: 2px solid ${({ $selected }) => ($selected ? '#2563eb' : '#cbd5f5')};
	background: ${({ $selected }) =>
		$selected
			? 'linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(59, 130, 246, 0.18))'
			: '#ffffff'};
	box-shadow: ${({ $selected }) =>
		$selected ? '0 8px 22px rgba(37, 99, 235, 0.25)' : '0 2px 6px rgba(15, 23, 42, 0.05)'};
	cursor: pointer;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-3px);
	}
`;

const OptionLabel = styled.div`
	font-weight: 700;
	color: #0f172a;
`;

const OptionDescription = styled.div`
	color: #475569;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const NavigationBar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 1.5rem;
	flex-wrap: wrap;
	gap: 1rem;
`;

const StepIndicator = styled.div`
	color: #2563eb;
	font-weight: 600;
	font-size: 0.95rem;
`;

const NavButtons = styled.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
`;

const NavButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: ${({ $variant }) => ($variant === 'secondary' ? '2px solid #2563eb' : 'none')};
	background: ${({ $variant }) =>
		$variant === 'secondary' ? '#ffffff' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'};
	color: ${({ $variant }) => ($variant === 'secondary' ? '#1d4ed8' : '#ffffff')};
	font-weight: 600;
	cursor: pointer;
	box-shadow: ${({ $variant }) =>
		$variant === 'secondary' ? 'none' : '0 6px 18px rgba(37, 99, 235, 0.3)'};
	transition: all 0.2s;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:hover:not(:disabled) {
		transform: translateY(-2px);
	}
`;

const RecommendationsPanel = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	padding: 1.5rem;
	border: 1px solid #cbd5f5;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const RecommendationGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const RecommendationCard = styled.div<{ $category: Recommendation['category'] }>`
	border-left: 4px solid
		${({ $category }) => {
			switch ($category) {
				case 'security':
					return '#0ea5e9';
				case 'usability':
					return '#10b981';
				default:
					return '#f59e0b';
			}
		}};
	background: ${({ $category }) => {
		switch ($category) {
			case 'security':
				return 'rgba(14, 165, 233, 0.12)';
			case 'usability':
				return 'rgba(16, 185, 129, 0.12)';
			default:
				return 'rgba(245, 158, 11, 0.12)';
		}
	}};
	border-radius: 0.5rem;
	padding: 1rem 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	color: #0f172a;
`;

const RecommendationTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 700;
	font-size: 1.05rem;
`;

const RecommendationDescription = styled.div`
	color: #334155;
	line-height: 1.6;
`;

const RecommendationActions = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	color: #1f2937;
`;

const StatusBanner = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem 1.25rem;
	border-radius: 0.75rem;
	background: rgba(16, 185, 129, 0.12);
	border: 1px solid #34d399;
	color: #047857;
	font-weight: 600;
`;

const WarningBanner = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem 1.25rem;
	border-radius: 0.75rem;
	background: rgba(239, 68, 68, 0.12);
	border: 1px solid #ef4444;
	color: #b91c1c;
	font-weight: 600;
`;

const buildRecommendations = (answers: Record<string, AnswerValue | null>): Recommendation[] => {
	const items: Recommendation[] = [];

	if (answers.clientType === 'browser' || answers.clientType === 'native') {
		items.push({
			title: 'Require PKCE & Proof-of-Possession',
			icon: <FiShield />,
			description:
				'Public clients must enable Proof Key for Code Exchange and avoid client secrets. Enable token binding where possible.',
			actions: [
				'PingOne → Applications → Security → Require PKCE for this application.',
				'Disable implicit flow; use Authorization Code + PKCE only.',
				'Store refresh tokens server-side with rotation or use redirectless flow.',
			],
			category: 'security',
		});
	}

	if (answers.clientType === 'server') {
		items.push({
			title: 'Use Mutual TLS or private_key_jwt',
			icon: <FiSettings />,
			description:
				'Backend services can protect client secrets. Harden token exchange with signed client assertions or mTLS.',
			actions: [
				'Configure token endpoint authentication = private_key_jwt.',
				'Rotate signing credentials quarterly and monitor JWKS usage.',
				'Enable PAR to prevent authorization request tampering.',
			],
			category: 'security',
		});
	}

	if (answers.dataSensitivity === 'required') {
		items.push({
			title: 'Tighten Session Controls',
			icon: <FiAlertTriangle />,
			description: 'Shorten token lifetimes and add risk policies to match high-sensitivity data.',
			actions: [
				'Set ID token lifetime ≤ 5 minutes; reduce refresh token TTL to ≤ 1 day.',
				'Enable PingOne Risk policy with device, IP, and geo checks.',
				'Force max_age=300 and re-authentication on step-up operations.',
			],
			category: 'compliance',
		});
	}

	if (answers.mfaRequirement === 'optional' || answers.mfaRequirement === 'required') {
		items.push({
			title: 'PingOne MFA Policy Mapping',
			icon: <FiWifi />,
			description: 'Create dynamic MFA policies to match risk and user experience needs.',
			actions: [
				'Configure PingOne MFA policy with primary factors (Push, TOTP, SMS fallback).',
				'Wire adaptive rules: device reputation, velocity, and impossible travel.',
				'Expose Device Management to end users for self-service factor lifecycle.',
			],
			category: 'security',
		});
	}

	if (answers.apiUsage === 'optional' || answers.apiUsage === 'required') {
		items.push({
			title: 'Scoped Worker Tokens & Least Privilege',
			icon: <FiTrendingUp />,
			description: 'Issue worker tokens with limited scopes and rotate credentials automatically.',
			actions: [
				'Create PingOne worker app and restrict scopes to exact API needs.',
				'Enable scheduled rotation with the Worker Token UI service.',
				'Log all management API calls and push to SIEM for anomaly detection.',
			],
			category: 'usability',
		});
	}

	if (answers.apiUsage === 'required' && answers.dataSensitivity === 'required') {
		items.push({
			title: 'Segregate Duties with Environments',
			icon: <FiUsers />,
			description:
				'Separate automation apps per environment (prod vs. sandbox) and enforce approvals.',
			actions: [
				'Use dedicated PingOne environments for staging vs. production.',
				'Require break-glass approval for production worker token refresh.',
				'Leverage DaVinci or orchestration for approval workflows.',
			],
			category: 'compliance',
		});
	}

	if (items.length === 0) {
		items.push({
			title: 'Baseline Best Practices',
			icon: <FiCheckCircle />,
			description:
				'Even low-risk apps should adopt these security fundamentals to avoid common pitfalls.',
			actions: [
				'Enable PKCE for all Authorization Code requests.',
				'Rotate client secrets or signing keys every 90 days.',
				'Monitor audit logs for anomalous login activity.',
			],
			category: 'security',
		});
	}

	return items;
};

const PolicyWizard: React.FC = () => {
	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<Record<string, AnswerValue | null>>(() =>
		QUESTIONS.reduce<Record<string, AnswerValue | null>>((acc, question) => {
			acc[question.id] = null;
			return acc;
		}, {})
	);

	const currentQuestion = QUESTIONS[step];
	const totalSteps = QUESTIONS.length;

	const handleOptionSelect = useCallback((questionId: string, value: AnswerValue) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
	}, []);

	const recommendations = useMemo(() => buildRecommendations(answers), [answers]);

	const isStepComplete = answers[currentQuestion.id] !== null;
	const isComplete = Object.values(answers).every((value) => value !== null);

	const handleNext = useCallback(() => {
		if (step < totalSteps - 1) {
			setStep((prev) => prev + 1);
		}
	}, [step]);

	const handleBack = useCallback(() => {
		if (step > 0) {
			setStep((prev) => prev - 1);
		}
	}, [step]);

	const handleReset = useCallback(() => {
		setStep(0);
		setAnswers(
			QUESTIONS.reduce<Record<string, AnswerValue | null>>((acc, question) => {
				acc[question.id] = null;
				return acc;
			}, {})
		);
	}, []);

	return (
		<WizardContainer>
			<Header>
				<Title>
					<FiSettings size={28} />
					Policy Wizard: PingOne Config Helper
				</Title>
				<Intro>
					Answer a few quick questions and we will generate a PingOne application checklist, MFA
					policies, and governance recommendations tailored to your risk posture.
				</Intro>
			</Header>

			<Stepper>
				<QuestionCard>
					<QuestionHeader>
						{currentQuestion.icon}
						{currentQuestion.title}
					</QuestionHeader>
					<QuestionDescription>{currentQuestion.description}</QuestionDescription>
					<OptionGrid>
						{currentQuestion.options.map((option) => (
							<OptionButton
								key={option.value}
								type="button"
								$selected={answers[currentQuestion.id] === option.value}
								onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
							>
								<OptionLabel>{option.label}</OptionLabel>
								<OptionDescription>{option.description}</OptionDescription>
							</OptionButton>
						))}
					</OptionGrid>

					<NavigationBar>
						<StepIndicator>
							Step {step + 1} of {totalSteps}
						</StepIndicator>
						<NavButtons>
							<NavButton
								type="button"
								$variant="secondary"
								onClick={handleBack}
								disabled={step === 0}
							>
								<FiChevronLeft />
								Back
							</NavButton>
							{step < totalSteps - 1 ? (
								<NavButton type="button" onClick={handleNext} disabled={!isStepComplete}>
									Next
									<FiChevronRight />
								</NavButton>
							) : (
								<NavButton type="button" onClick={handleReset} disabled={!isComplete}>
									Start Over
								</NavButton>
							)}
						</NavButtons>
					</NavigationBar>

					{!isStepComplete && (
						<WarningBanner>
							<FiAlertTriangle />
							Select an option to continue. Each answer tunes the recommendations.
						</WarningBanner>
					)}
				</QuestionCard>

				<RecommendationsPanel>
					{isComplete ? (
						<>
							<StatusBanner>
								<FiCheckCircle />
								All answers captured. Tailored policy blueprint ready below.
							</StatusBanner>
							<RecommendationGroup>
								{recommendations.map((item) => (
									<RecommendationCard key={item.title} $category={item.category}>
										<RecommendationTitle>
											{item.icon}
											{item.title}
										</RecommendationTitle>
										<RecommendationDescription>{item.description}</RecommendationDescription>
										<RecommendationActions>
											{item.actions.map((action) => (
												<li key={action}>{action}</li>
											))}
										</RecommendationActions>
									</RecommendationCard>
								))}
							</RecommendationGroup>
						</>
					) : (
						<>
							<StatusBanner>
								<FiSettings />
								Answer all questions to unlock your configuration blueprint.
							</StatusBanner>
							<RecommendationDescription>
								This wizard will map your selections to:
							</RecommendationDescription>
							<RecommendationActions>
								<li>OAuth client configuration: redirect URIs, token endpoint auth, PAR.</li>
								<li>Adaptive MFA + risk policies suited to sensitivity.</li>
								<li>Worker token / API access controls and governance reminders.</li>
							</RecommendationActions>
						</>
					)}
				</RecommendationsPanel>
			</Stepper>
		</WizardContainer>
	);
};

export default PolicyWizard;
