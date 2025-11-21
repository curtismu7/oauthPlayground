// src/examples/V7ServicesIntegrationExample.tsx
/**
 * V7 Services Integration Example
 *
 * Demonstrates all four options (A, B, C, D) for V7 services integration:
 * A. Integrate V7SharedService into existing V7 flows
 * B. Create OAuth vs OIDC variants using templates
 * C. Add specification education to V7 templates
 * D. Create comprehensive tests for V7 services
 */

import React, { useState } from 'react';
import { FlowUIService } from '../services/flowUIService';
import { V7EducationalContentService } from '../services/v7EducationalContentService';
import { V7SharedService } from '../services/v7SharedService';
import { V7FlowVariantSelector } from '../templates/V7FlowVariants';
import { V7ServicesTestSuite } from '../tests/v7ServicesTestSuite';

// Get shared UI components
const {
	InfoBox,
	InfoTitle,
	InfoText,
	InfoList,
	FormGroup,
	Label,
	Input,
	Button,
	CodeBlock,
	GeneratedContentBox,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	HelperText,
	SectionDivider,
	CollapsibleSection,
	CollapsibleHeaderButton,
	CollapsibleTitle,
	CollapsibleContent,
} = FlowUIService.getFlowUIComponents();

export const V7ServicesIntegrationExample: React.FC = () => {
	const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
	const [testResults, setTestResults] = useState<any>(null);
	const [complianceStatus, setComplianceStatus] = useState<any>(null);
	const [educationalContent, setEducationalContent] = useState<any>(null);

	// Option A: V7 Services Integration
	const renderOptionA = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>Option A: V7 Services Integration</InfoTitle>
				<InfoText>
					Demonstrates how to integrate V7SharedService into existing V7 flows with comprehensive
					compliance features.
				</InfoText>
			</InfoBox>

			<CollapsibleSection>
				<CollapsibleHeaderButton>
					<CollapsibleTitle>V7 Services Integration Example</CollapsibleTitle>
					<CollapsibleContent>
						<CodeBlock>
							{`// Initialize V7 compliance features
const flowName: V7FlowName = 'oauth-authorization-code-v7';
const v7FlowConfig = V7SharedService.initializeFlow(flowName, {
  enableIDTokenValidation: false, // OAuth flow
  enableParameterValidation: true,
  enableErrorHandling: true,
  enableSecurityHeaders: true
});

// Validate parameters
const validation = V7SharedService.ParameterValidation.validateFlowParameters(
  flowName,
  parameters
);

// Handle errors
const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(error, {
  flowName,
  step: 'authorization_request',
  operation: 'parameter_validation',
  timestamp: Date.now()
});

// Get security headers
const securityHeaders = V7SharedService.SecurityHeaders.getSecurityHeaders(flowName);`}
						</CodeBlock>
					</CollapsibleContent>
				</CollapsibleHeaderButton>
			</CollapsibleSection>

			<Button
				onClick={() => {
					const compliance = V7SharedService.SpecificationCompliance.checkFlowCompliance(
						'oauth-authorization-code-v7'
					);
					setComplianceStatus(compliance);
				}}
			>
				Check Compliance Status
			</Button>

			{complianceStatus && (
				<GeneratedContentBox>
					<InfoTitle>Compliance Status</InfoTitle>
					<ParameterGrid>
						<ParameterLabel>Compliance Score</ParameterLabel>
						<ParameterValue>{complianceStatus.complianceScore}%</ParameterValue>
						<ParameterLabel>Is Compliant</ParameterLabel>
						<ParameterValue>{complianceStatus.isCompliant ? 'Yes' : 'No'}</ParameterValue>
						<ParameterLabel>Missing Features</ParameterLabel>
						<ParameterValue>{complianceStatus.missingFeatures.length}</ParameterValue>
					</ParameterGrid>
				</GeneratedContentBox>
			)}
		</>
	);

	// Option B: V7 Flow Variants
	const renderOptionB = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>Option B: V7 Flow Variants</InfoTitle>
				<InfoText>
					Demonstrates OAuth vs OIDC variants using V7 templates with built-in compliance
					architecture.
				</InfoText>
			</InfoBox>

			<V7FlowVariantSelector
				baseFlowName="oauth-authorization-code-v7"
				onVariantChange={(variant) => {
					console.log('Variant changed to:', variant);
				}}
			/>
		</>
	);

	// Option C: Enhanced Educational Content
	const renderOptionC = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>Option C: Enhanced Educational Content</InfoTitle>
				<InfoText>
					Demonstrates comprehensive specification education for V7 flows with interactive learning
					components.
				</InfoText>
			</InfoBox>

			<Button
				onClick={() => {
					const content = V7EducationalContentService.getEducationalContent(
						'oauth-authorization-code-v7'
					);
					setEducationalContent(content);
				}}
			>
				Load Educational Content
			</Button>

			{educationalContent && (
				<>
					<GeneratedContentBox>
						<InfoTitle>Specification Information</InfoTitle>
						<ParameterGrid>
							<ParameterLabel>Specification</ParameterLabel>
							<ParameterValue>{educationalContent.specification.name}</ParameterValue>
							<ParameterLabel>Version</ParameterLabel>
							<ParameterValue>{educationalContent.specification.version}</ParameterValue>
							<ParameterLabel>URL</ParameterLabel>
							<ParameterValue>{educationalContent.specification.url}</ParameterValue>
						</ParameterGrid>
					</GeneratedContentBox>

					<GeneratedContentBox>
						<InfoTitle>Overview</InfoTitle>
						<InfoText>{educationalContent.overview.description}</InfoText>
						<InfoList>
							<InfoText>Key Concepts:</InfoText>
							{educationalContent.overview.keyConcepts.map((concept, index) => (
								<li key={index}>{concept}</li>
							))}
						</InfoList>
					</GeneratedContentBox>

					<GeneratedContentBox>
						<InfoTitle>Interactive Learning</InfoTitle>
						<InfoText>Quizzes: {educationalContent.interactiveLearning.quizzes.length}</InfoText>
						<InfoText>
							Scenarios: {educationalContent.interactiveLearning.scenarios.length}
						</InfoText>
					</GeneratedContentBox>

					<GeneratedContentBox>
						<InfoTitle>Compliance Rules</InfoTitle>
						<InfoText>
							Validation Rules: {educationalContent.complianceChecking.validationRules.length}
						</InfoText>
						<InfoText>
							Best Practices: {educationalContent.complianceChecking.bestPractices.length}
						</InfoText>
					</GeneratedContentBox>
				</>
			)}
		</>
	);

	// Option D: Testing and Validation
	const renderOptionD = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>Option D: Testing and Validation</InfoTitle>
				<InfoText>
					Demonstrates comprehensive testing framework for V7 services with automated compliance
					testing.
				</InfoText>
			</InfoBox>

			<Button
				onClick={async () => {
					const results = await V7ServicesTestSuite.runAllTests();
					setTestResults(results);
				}}
			>
				Run V7 Services Test Suite
			</Button>

			{testResults && (
				<>
					<GeneratedContentBox>
						<InfoTitle>Test Results</InfoTitle>
						<ParameterGrid>
							<ParameterLabel>Total Tests</ParameterLabel>
							<ParameterValue>{testResults.totalTests}</ParameterValue>
							<ParameterLabel>Passed Tests</ParameterLabel>
							<ParameterValue>{testResults.passedTests}</ParameterValue>
							<ParameterLabel>Failed Tests</ParameterLabel>
							<ParameterValue>{testResults.failedTests}</ParameterValue>
							<ParameterLabel>Duration</ParameterLabel>
							<ParameterValue>{testResults.duration}ms</ParameterValue>
						</ParameterGrid>
					</GeneratedContentBox>

					<GeneratedContentBox>
						<InfoTitle>Test Details</InfoTitle>
						<InfoList>
							{testResults.tests.map((test, index) => (
								<li key={index}>
									{test.passed ? '✅' : '❌'} {test.testName} ({test.duration}ms)
									{!test.passed && (
										<div style={{ color: 'red', fontSize: '0.875rem' }}>{test.message}</div>
									)}
								</li>
							))}
						</InfoList>
					</GeneratedContentBox>
				</>
			)}
		</>
	);

	// Main render
	return (
		<>
			<InfoBox $variant="info">
				<InfoTitle>V7 Services Integration Example</InfoTitle>
				<InfoText>
					This example demonstrates all four options for V7 services integration: A. V7 Services
					Integration, B. V7 Flow Variants, C. Enhanced Educational Content, D. Testing and
					Validation
				</InfoText>
			</InfoBox>

			<SectionDivider />

			<FormGroup>
				<Label>Select Option to Demonstrate</Label>
				<ParameterGrid>
					<ParameterLabel>Option A</ParameterLabel>
					<ParameterValue>
						<Button
							onClick={() => setSelectedOption('A')}
							style={{
								backgroundColor: selectedOption === 'A' ? '#16a34a' : '#e5e7eb',
								color: selectedOption === 'A' ? 'white' : 'black',
							}}
						>
							V7 Services Integration
						</Button>
					</ParameterValue>
					<ParameterLabel>Option B</ParameterLabel>
					<ParameterValue>
						<Button
							onClick={() => setSelectedOption('B')}
							style={{
								backgroundColor: selectedOption === 'B' ? '#3b82f6' : '#e5e7eb',
								color: selectedOption === 'B' ? 'white' : 'black',
							}}
						>
							V7 Flow Variants
						</Button>
					</ParameterValue>
					<ParameterLabel>Option C</ParameterLabel>
					<ParameterValue>
						<Button
							onClick={() => setSelectedOption('C')}
							style={{
								backgroundColor: selectedOption === 'C' ? '#f59e0b' : '#e5e7eb',
								color: selectedOption === 'C' ? 'white' : 'black',
							}}
						>
							Enhanced Educational Content
						</Button>
					</ParameterValue>
					<ParameterLabel>Option D</ParameterLabel>
					<ParameterValue>
						<Button
							onClick={() => setSelectedOption('D')}
							style={{
								backgroundColor: selectedOption === 'D' ? '#dc2626' : '#e5e7eb',
								color: selectedOption === 'D' ? 'white' : 'black',
							}}
						>
							Testing and Validation
						</Button>
					</ParameterValue>
				</ParameterGrid>
			</FormGroup>

			<SectionDivider />

			{selectedOption === 'A' && renderOptionA()}
			{selectedOption === 'B' && renderOptionB()}
			{selectedOption === 'C' && renderOptionC()}
			{selectedOption === 'D' && renderOptionD()}
		</>
	);
};

export default V7ServicesIntegrationExample;
