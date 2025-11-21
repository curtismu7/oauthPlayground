// src/templates/V7FlowTemplate.tsx
/**
 * V7 Flow Template - Standardized V7 Flow with Compliance Architecture
 *
 * This template provides a standardized structure for all V7 flows with
 * built-in compliance features, error handling, and validation.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import { usePageScroll } from '../hooks/usePageScroll';
import { FlowHeader } from '../services/flowHeaderService';
import { FlowUIService } from '../services/flowUIService';
import type { V7FlowName } from '../services/v7SharedService';

// Import V7 Shared Service
import { V7SharedService } from '../services/v7SharedService';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Get shared UI components
const {
	Container,
	ContentWrapper,
	MainCard,
	StepHeader,
	StepHeaderLeft,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepHeaderRight,
	StepNumber,
	StepTotal,
	VersionBadge,
	CollapsibleSection,
	CollapsibleHeaderButton,
	CollapsibleTitle,
	CollapsibleContent,
	InfoBox,
	InfoTitle,
	InfoText,
	InfoList,
	ActionRow,
	Button,
	HighlightedActionButton,
	CodeBlock,
	GeneratedContentBox,
	GeneratedLabel,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	HelperText,
	SectionDivider,
	ResultsSection,
	ResultsHeading,
} = FlowUIService.getFlowUIComponents();

export interface V7FlowTemplateProps {
	flowName: V7FlowName;
	flowTitle: string;
	flowSubtitle: string;
	stepMetadata: Array<{
		title: string;
		subtitle: string;
		description?: string;
	}>;
	renderStepContent: (step: number) => React.ReactNode;
	onStepChange?: (step: number) => void;
	onReset?: () => void;
	onStartOver?: () => void;
	canNavigateNext?: (step: number) => boolean;
	complianceFeatures?: {
		enableIDTokenValidation?: boolean;
		enableParameterValidation?: boolean;
		enableErrorHandling?: boolean;
		enableSecurityHeaders?: boolean;
	};
}

export const V7FlowTemplate: React.FC<V7FlowTemplateProps> = ({
	flowName,
	flowTitle,
	flowSubtitle,
	stepMetadata,
	renderStepContent,
	onStepChange,
	onReset,
	onStartOver,
	canNavigateNext,
	complianceFeatures = {
		enableIDTokenValidation: true,
		enableParameterValidation: true,
		enableErrorHandling: true,
		enableSecurityHeaders: true,
	},
}) => {
	// Initialize V7 compliance features
	const v7FlowConfig = V7SharedService.initializeFlow(flowName, complianceFeatures);

	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [_collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
	const [complianceStatus, setComplianceStatus] = useState(v7FlowConfig.compliance);
	const [validationResults, setValidationResults] = useState<any>(null);
	const [errorStats, setErrorStats] = useState(V7SharedService.ErrorHandling.getErrorStatistics());

	// Page scroll management
	usePageScroll({ pageName: flowTitle, force: true });

	// V7 compliance functions
	const _validateParameters = useCallback(
		(parameters: Record<string, any>) => {
			const validation = V7SharedService.ParameterValidation.validateFlowParameters(
				flowName,
				parameters
			);
			setValidationResults(validation);

			if (!validation.isValid) {
				const errorResponse = V7SharedService.ErrorHandling.createScenarioError('invalid_request', {
					flowName,
					step: 'parameter_validation',
					operation: 'validation',
					timestamp: Date.now(),
				});
				v4ToastManager.showError(`Parameter validation failed: ${validation.errors.join(', ')}`);
				return { success: false, error: errorResponse };
			}

			v4ToastManager.showSuccess('Parameter validation successful');
			return { success: true, validation };
		},
		[flowName]
	);

	const _validateIDToken = useCallback(
		async (
			idToken: string,
			expectedIssuer: string,
			expectedAudience: string,
			expectedNonce?: string
		) => {
			try {
				const validation = await V7SharedService.IDTokenValidation.validateIDToken(
					idToken,
					expectedIssuer,
					expectedAudience,
					expectedNonce,
					undefined, // jwksUri - would be provided in real implementation
					flowName
				);

				if (!validation.isValid) {
					const errorResponse = V7SharedService.ErrorHandling.createScenarioError('invalid_token', {
						flowName,
						step: 'id_token_validation',
						operation: 'token_validation',
						timestamp: Date.now(),
					});
					v4ToastManager.showError(`ID token validation failed: ${validation.errors.join(', ')}`);
					return { success: false, error: errorResponse, validation };
				}

				v4ToastManager.showSuccess('ID token validation successful');
				return { success: true, validation };
			} catch (error) {
				const errorResponse = V7SharedService.ErrorHandling.handleOIDCError(error, {
					flowName,
					step: 'id_token_validation',
					operation: 'token_validation',
					timestamp: Date.now(),
				});
				v4ToastManager.showError(`ID token validation error: ${errorResponse.error_description}`);
				return { success: false, error: errorResponse };
			}
		},
		[flowName]
	);

	const _handleError = useCallback(
		(error: any, context?: any) => {
			const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(error, {
				flowName,
				step: context?.step || 'unknown',
				operation: context?.operation || 'unknown',
				timestamp: Date.now(),
			});
			v4ToastManager.showError(`Error: ${errorResponse.error_description}`);
			return errorResponse;
		},
		[flowName]
	);

	const _getSecurityHeaders = useCallback(() => {
		return V7SharedService.SecurityHeaders.getSecurityHeaders(flowName);
	}, [flowName]);

	const getComplianceScore = useCallback(() => {
		return V7SharedService.SpecificationCompliance.checkFlowCompliance(flowName);
	}, [flowName]);

	// Navigation handlers
	const handleNextStep = useCallback(() => {
		const nextStep = currentStep + 1;
		setCurrentStep(nextStep);
		onStepChange?.(nextStep);
	}, [currentStep, onStepChange]);

	const handlePreviousStep = useCallback(() => {
		const prevStep = currentStep - 1;
		setCurrentStep(prevStep);
		onStepChange?.(prevStep);
	}, [currentStep, onStepChange]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setValidationResults(null);
		onReset?.();
	}, [onReset]);

	const handleStartOver = useCallback(() => {
		setCurrentStep(0);
		setValidationResults(null);
		onStartOver?.();
	}, [onStartOver]);

	// Section toggle handler
	const toggleSection = useCallback((sectionId: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[sectionId]: !prev[sectionId],
		}));
	}, []);

	// Update compliance status
	useEffect(() => {
		const compliance = getComplianceScore();
		setComplianceStatus(compliance);
	}, [getComplianceScore]);

	// Update error statistics
	useEffect(() => {
		const stats = V7SharedService.ErrorHandling.getErrorStatistics();
		setErrorStats(stats);
	}, []);

	// Render compliance status
	const renderComplianceStatus = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('compliance')}>
				<CollapsibleTitle>🔧 V7 Compliance Status</CollapsibleTitle>
				<CollapsibleContent>
					<InfoBox $variant={complianceStatus.isCompliant ? 'success' : 'warning'}>
						<InfoTitle>Compliance Score: {complianceStatus.complianceScore}%</InfoTitle>
						<InfoText>
							{complianceStatus.isCompliant ? '✅ Flow is compliant' : '⚠️ Flow needs attention'}
						</InfoText>
						{complianceStatus.missingFeatures.length > 0 && (
							<InfoList>
								<InfoText>Missing features:</InfoText>
								{complianceStatus.missingFeatures.map((feature, index) => (
									<li key={index}>{feature}</li>
								))}
							</InfoList>
						)}
						{complianceStatus.recommendations.length > 0 && (
							<InfoList>
								<InfoText>Recommendations:</InfoText>
								{complianceStatus.recommendations.map((rec, index) => (
									<li key={index}>{rec}</li>
								))}
							</InfoList>
						)}
					</InfoBox>
				</CollapsibleContent>
			</CollapsibleHeaderButton>
		</CollapsibleSection>
	);

	// Render validation results
	const renderValidationResults = () => {
		if (!validationResults) return null;

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton onClick={() => toggleSection('validation')}>
					<CollapsibleTitle>✅ Parameter Validation Results</CollapsibleTitle>
					<CollapsibleContent>
						<InfoBox $variant={validationResults.isValid ? 'success' : 'error'}>
							<InfoTitle>
								{validationResults.isValid ? 'Validation Successful' : 'Validation Failed'}
							</InfoTitle>
							<InfoText>
								{V7SharedService.ParameterValidation.getValidationSummary(validationResults)}
							</InfoText>
							{validationResults.errors.length > 0 && (
								<InfoList>
									<InfoText>Errors:</InfoText>
									{validationResults.errors.map((error: string, index: number) => (
										<li key={index}>{error}</li>
									))}
								</InfoList>
							)}
							{validationResults.warnings.length > 0 && (
								<InfoList>
									<InfoText>Warnings:</InfoText>
									{validationResults.warnings.map((warning: string, index: number) => (
										<li key={index}>{warning}</li>
									))}
								</InfoList>
							)}
						</InfoBox>
					</CollapsibleContent>
				</CollapsibleHeaderButton>
			</CollapsibleSection>
		);
	};

	// Render error statistics
	const renderErrorStatistics = () => {
		if (errorStats.totalErrors === 0) return null;

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton onClick={() => toggleSection('errors')}>
					<CollapsibleTitle>📊 Error Statistics</CollapsibleTitle>
					<CollapsibleContent>
						<InfoBox $variant="info">
							<InfoTitle>Total Errors: {errorStats.totalErrors}</InfoTitle>
							<InfoText>Errors by Code:</InfoText>
							<InfoList>
								{Object.entries(errorStats.errorsByCode).map(([code, count]) => (
									<li key={code}>
										{code}: {count}
									</li>
								))}
							</InfoList>
						</InfoBox>
					</CollapsibleContent>
				</CollapsibleHeaderButton>
			</CollapsibleSection>
		);
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId={flowName} />

				{/* V7 Compliance Features */}
				{renderComplianceStatus()}
				{renderValidationResults()}
				{renderErrorStatistics()}

				<SectionDivider />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V7</VersionBadge>
							<StepHeaderTitle>{stepMetadata[currentStep]?.title || 'Step'}</StepHeaderTitle>
							<StepHeaderSubtitle>{stepMetadata[currentStep]?.subtitle || ''}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {stepMetadata.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					{renderStepContent(currentStep)}
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={stepMetadata.length}
					onPrevious={handlePreviousStep}
					onNext={handleNextStep}
					onReset={handleReset}
					onStartOver={handleStartOver}
					canNavigateNext={canNavigateNext?.(currentStep) ?? true}
					isFirstStep={currentStep === 0}
					nextButtonText="Next"
					stepRequirements={stepMetadata.map((s) => s.description ?? '')}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default V7FlowTemplate;
