/**
 * @file FloatingStepperExample.tsx
 * @module components
 * @description Example component demonstrating FloatingStepper usage
 * @version 1.0.0
 * @since 2026-02-16
 */

import React, { useState } from 'react';
import {
	FloatingStepper,
	FloatingStepperService,
	type FloatingStepperStep,
} from '../services/FloatingStepperService';

const FloatingStepperExample: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

	// Example steps for OAuth flow
	const oauthSteps: FloatingStepperStep[] = [
		{
			id: 'configuration',
			title: 'Configuration',
			description: 'Configure OAuth settings and credentials',
			completed: completedSteps.has(0),
		},
		{
			id: 'authorization',
			title: 'Authorization',
			description: 'Get authorization code from PingOne',
			completed: completedSteps.has(1),
		},
		{
			id: 'token-exchange',
			title: 'Token Exchange',
			description: 'Exchange authorization code for tokens',
			completed: completedSteps.has(2),
		},
		{
			id: 'introspection',
			title: 'Token Introspection',
			description: 'Validate and inspect token claims',
			completed: completedSteps.has(3),
		},
		{
			id: 'completion',
			title: 'Completion',
			description: 'Flow completed successfully',
			completed: completedSteps.has(4),
		},
	];

	const handleStepChange = (stepIndex: number) => {
		setCurrentStep(stepIndex);
		// Mark previous steps as completed
		const newCompleted = new Set<number>();
		for (let i = 0; i < stepIndex; i++) {
			newCompleted.add(i);
		}
		setCompletedSteps(newCompleted);
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			handleStepChange(currentStep - 1);
		}
	};

	const handleNext = () => {
		if (currentStep < oauthSteps.length - 1) {
			// Mark current step as completed
			const newCompleted = new Set(completedSteps);
			newCompleted.add(currentStep);
			setCompletedSteps(newCompleted);
			handleStepChange(currentStep + 1);
		}
	};

	const handleReset = () => {
		setCurrentStep(0);
		setCompletedSteps(new Set());
	};

	const handleComplete = () => {
		console.log('Flow completed!');
		// Handle completion logic
	};

	return (
		<div style={{ padding: '2rem', minHeight: '100vh', background: '#f9fafb' }}>
			<h1>Floating Stepper Example</h1>
			<p>This demonstrates the reusable FloatingStepper component.</p>

			<div style={{ marginTop: '2rem', padding: '2rem', background: 'white', borderRadius: '8px' }}>
				<h2>Current Step: {oauthSteps[currentStep]?.title}</h2>
				<p>{oauthSteps[currentStep]?.description}</p>
				<p>
					Progress: {currentStep + 1} of {oauthSteps.length}
				</p>
			</div>

			<FloatingStepper
				{...FloatingStepperService.getOAuthConfig(oauthSteps)}
				currentStep={currentStep}
				onStepChange={handleStepChange}
				onPrevious={handlePrevious}
				onNext={handleNext}
				onReset={handleReset}
				onComplete={handleComplete}
			/>
		</div>
	);
};

export default FloatingStepperExample;
