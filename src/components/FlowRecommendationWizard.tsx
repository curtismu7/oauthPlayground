import React, { useState } from 'react';
import {
	FiArrowLeft,
	FiArrowRight,
	FiCheckCircle,
	FiClock,
	FiCode,
	FiShield,
	FiStar,
	FiUser,
	FiX,
} from '@icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from './Card';

interface WizardStep {
	id: string;
	title: string;
	question: string;
	options: WizardOption[];
}

interface WizardOption {
	id: string;
	label: string;
	description: string;
	icon: React.ReactNode;
	value: string;
}

interface FlowRecommendation {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	security: 'high' | 'medium' | 'low';
	complexity: 'low' | 'medium' | 'high';
	implementationTime: string;
	route: string;
	reason: string;
}

const WizardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const WizardHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.125rem;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.gray200};
  border-radius: 2px;
  margin-bottom: 2rem;
  overflow: hidden;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #22c55e);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`;

const StepCard = styled(Card)`
  margin-bottom: 2rem;
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const OptionCard = styled.div<{ $selected: boolean }>`
  padding: 1.5rem;
  border: 2px solid ${({ $selected, theme }) =>
		$selected ? theme.colors.primary : theme.colors.gray200};
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${({ $selected, theme }) =>
		$selected ? `${theme.colors.primary}05` : 'white'};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .option-icon {
    font-size: 2rem;
    color: ${({ $selected, theme }) => ($selected ? theme.colors.primary : theme.colors.gray400)};
    margin-bottom: 1rem;
  }
  
  .option-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  .option-description {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .nav-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    
    &.primary {
      background-color: ${({ theme }) => theme.colors.primary};
      color: white;
      
      &:hover {
        background-color: ${({ theme }) => theme.colors.primaryDark};
      }
    }
    
    &.secondary {
      background-color: transparent;
      color: ${({ theme }) => theme.colors.gray600};
      border: 1px solid ${({ theme }) => theme.colors.gray300};
      
      &:hover {
        background-color: ${({ theme }) => theme.colors.gray50};
      }
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const ResultsCard = styled(Card)`
  text-align: center;
  
  .results-icon {
    font-size: 4rem;
    color: ${({ theme }) => theme.colors.success};
    margin-bottom: 1rem;
  }
  
  .results-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 1rem;
  }
  
  .results-description {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
`;

const RecommendationCard = styled(Card)`
  margin-bottom: 1.5rem;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  
  .recommendation-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .recommendation-icon {
      font-size: 2rem;
      color: ${({ theme }) => theme.colors.primary};
    }
    
    .recommendation-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray900};
      margin: 0;
    }
  }
  
  .recommendation-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: ${({ theme }) => theme.colors.gray600};
    }
  }
  
  .recommendation-reason {
    color: ${({ theme }) => theme.colors.gray700};
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  
  .recommendation-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryDark};
      transform: translateY(-1px);
    }
  }
`;

const wizardSteps: WizardStep[] = [
	{
		id: 'app-type',
		title: 'Application Type',
		question: 'What type of application are you building?',
		options: [
			{
				id: 'web-app',
				label: 'Web Application',
				description: 'Traditional web app with server-side rendering',
				icon: <FiCode />,
				value: 'web-app',
			},
			{
				id: 'spa',
				label: 'Single Page App',
				description: 'Client-side JavaScript application (React, Vue, Angular)',
				icon: <FiCode />,
				value: 'spa',
			},
			{
				id: 'mobile-app',
				label: 'Mobile Application',
				description: 'Native mobile app (iOS, Android)',
				icon: <FiUser />,
				value: 'mobile-app',
			},
			{
				id: 'server-app',
				label: 'Server Application',
				description: 'Backend service or API',
				icon: <FiShield />,
				value: 'server-app',
			},
		],
	},
	{
		id: 'backend',
		title: 'Backend Support',
		question: 'Does your application have a secure backend?',
		options: [
			{
				id: 'has-backend',
				label: 'Yes, I have a backend',
				description: 'My app can securely store client secrets',
				icon: <FiShield />,
				value: 'has-backend',
			},
			{
				id: 'no-backend',
				label: 'No backend',
				description: 'Client-side only or public application',
				icon: <FiCode />,
				value: 'no-backend',
			},
		],
	},
	{
		id: 'security',
		title: 'Security Requirements',
		question: 'What level of security do you need?',
		options: [
			{
				id: 'standard',
				label: 'Standard Security',
				description: 'Good security for most applications',
				icon: <FiShield />,
				value: 'standard',
			},
			{
				id: 'high',
				label: 'High Security',
				description: 'Maximum security for sensitive applications',
				icon: <FiShield />,
				value: 'high',
			},
		],
	},
	{
		id: 'user-interaction',
		title: 'User Interaction',
		question: 'Will users interact with your application?',
		options: [
			{
				id: 'user-interaction',
				label: 'Yes, users will log in',
				description: 'Users need to authenticate and access their data',
				icon: <FiUser />,
				value: 'user-interaction',
			},
			{
				id: 'no-user-interaction',
				label: 'No user interaction',
				description: 'Machine-to-machine or automated service',
				icon: <FiShield />,
				value: 'no-user-interaction',
			},
		],
	},
];

const getRecommendations = (answers: Record<string, string>): FlowRecommendation[] => {
	const recommendations: FlowRecommendation[] = [];

	// Primary recommendation logic
	if (answers['no-user-interaction'] === 'no-user-interaction') {
		recommendations.push({
			id: 'client-credentials',
			title: 'Client Credentials Flow',
			description: 'Perfect for machine-to-machine authentication without user interaction',
			icon: <FiShield />,
			security: 'high',
			complexity: 'low',
			implementationTime: '1-2 hours',
			route: '/flows/client-credentials',
			reason:
				"Since your application doesn't require user interaction, Client Credentials is the most appropriate flow for machine-to-machine authentication.",
		});
	} else if (answers['app-type'] === 'mobile-app' || answers['no-backend'] === 'no-backend') {
		recommendations.push({
			id: 'pkce',
			title: 'PKCE Flow',
			description: 'Authorization Code flow with enhanced security for public clients',
			icon: <FiShield />,
			security: 'high',
			complexity: 'medium',
			implementationTime: '2-4 hours',
			route: '/flows/pkce',
			reason:
				'PKCE provides the best security for mobile apps and applications without a secure backend.',
		});
	} else if (answers['app-type'] === 'web-app' && answers['has-backend'] === 'has-backend') {
		recommendations.push({
			id: 'authorization-code',
			title: 'Authorization Code Flow',
			description: 'The most secure and widely supported OAuth flow',
			icon: <FiCode />,
			security: 'high',
			complexity: 'medium',
			implementationTime: '2-4 hours',
			route: '/flows/authorization-code',
			reason:
				'Authorization Code flow is the gold standard for web applications with a secure backend.',
		});
	} else {
		recommendations.push({
			id: 'authorization-code',
			title: 'Authorization Code Flow',
			description: 'The most secure and widely supported OAuth flow',
			icon: <FiCode />,
			security: 'high',
			complexity: 'medium',
			implementationTime: '2-4 hours',
			route: '/flows/authorization-code',
			reason:
				'Authorization Code flow is the most versatile and secure option for most applications.',
		});
	}

	// Add alternative recommendations
	if (answers['app-type'] === 'spa' && answers['no-backend'] === 'no-backend') {
		recommendations.push({
			id: 'implicit',
			title: 'Implicit Grant Flow',
			description: 'Simplified flow for client-side applications (deprecated)',
			icon: <FiCode />,
			security: 'low',
			complexity: 'low',
			implementationTime: '1-2 hours',
			route: '/flows/implicit',
			reason:
				'While deprecated, this flow is still used in some legacy SPAs. Consider migrating to PKCE.',
		});
	}

	return recommendations;
};

const FlowRecommendationWizard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [recommendations, setRecommendations] = useState<FlowRecommendation[]>([]);

	const handleOptionSelect = (stepId: string, value: string) => {
		setAnswers((prev) => ({ ...prev, [stepId]: value }));
	};

	const handleNext = () => {
		if (currentStep < wizardSteps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			// Generate recommendations
			const recs = getRecommendations(answers);
			setRecommendations(recs);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleRestart = () => {
		setCurrentStep(0);
		setAnswers({});
		setRecommendations([]);
	};

	const currentStepData = wizardSteps[currentStep];
	const progress = ((currentStep + 1) / wizardSteps.length) * 100;
	const canProceed = answers[currentStepData.id] !== undefined;

	if (recommendations.length > 0) {
		return (
			<WizardContainer>
				<WizardHeader>
					<h1>Flow Recommendations</h1>
					<p>Based on your answers, here are the best OAuth flows for your application:</p>
				</WizardHeader>

				<ResultsCard>
					<CardBody>
						<div className="results-icon">
							<FiCheckCircle />
						</div>
						<h2 className="results-title">Perfect Match!</h2>
						<p className="results-description">
							We've analyzed your requirements and found the ideal OAuth flow for your application.
						</p>

						{recommendations.map((rec, _index) => (
							<RecommendationCard key={rec.id}>
								<CardBody>
									<div className="recommendation-header">
										<div className="recommendation-icon">{rec.icon}</div>
										<h3 className="recommendation-title">{rec.title}</h3>
									</div>

									<p style={{ color: '#6b7280', marginBottom: '1rem' }}>{rec.description}</p>

									<div className="recommendation-meta">
										<div className="meta-item">
											<FiShield />
											{rec.security} security
										</div>
										<div className="meta-item">
											<FiClock />
											{rec.implementationTime}
										</div>
										<div className="meta-item">
											<FiStar />
											{rec.complexity} complexity
										</div>
									</div>

									<p className="recommendation-reason">
										<strong>Why this flow:</strong> {rec.reason}
									</p>

									<Link to={rec.route} className="recommendation-button">
										<FiArrowRight />
										Try {rec.title}
									</Link>
								</CardBody>
							</RecommendationCard>
						))}

						<NavigationButtons>
							<button className="nav-button secondary" onClick={handleRestart}>
								<FiArrowLeft />
								Start Over
							</button>
							{onClose && (
								<button className="nav-button secondary" onClick={onClose}>
									<FiX />
									Close
								</button>
							)}
						</NavigationButtons>
					</CardBody>
				</ResultsCard>
			</WizardContainer>
		);
	}

	return (
		<WizardContainer>
			<WizardHeader>
				<h1>Find Your OAuth Flow</h1>
				<p>Answer a few questions to get personalized recommendations for your application</p>
			</WizardHeader>

			<ProgressBar>
				<div className="progress-fill" style={{ width: `${progress}%` }} />
			</ProgressBar>

			<StepCard>
				<CardHeader>
					<StepHeader>
						<h2>{currentStepData.title}</h2>
						<p>{currentStepData.question}</p>
					</StepHeader>
				</CardHeader>

				<CardBody>
					<OptionsGrid>
						{currentStepData.options.map((option) => (
							<OptionCard
								key={option.id}
								$selected={answers[currentStepData.id] === option.value}
								onClick={() => handleOptionSelect(currentStepData.id, option.value)}
							>
								<div className="option-icon">{option.icon}</div>
								<h3 className="option-title">{option.label}</h3>
								<p className="option-description">{option.description}</p>
							</OptionCard>
						))}
					</OptionsGrid>

					<NavigationButtons>
						<button
							className="nav-button secondary"
							onClick={handlePrevious}
							disabled={currentStep === 0}
						>
							<FiArrowLeft />
							Previous
						</button>

						<span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
							Step {currentStep + 1} of {wizardSteps.length}
						</span>

						<button className="nav-button primary" onClick={handleNext} disabled={!canProceed}>
							{currentStep === wizardSteps.length - 1 ? 'Get Recommendations' : 'Next'}
							<FiArrowRight />
						</button>
					</NavigationButtons>
				</CardBody>
			</StepCard>
		</WizardContainer>
	);
};

export default FlowRecommendationWizard;
