/**
 * @file AuthenticationStepCounterV8.tsx
 * @module v8/components
 * @description Step counter component for Authentication flows
 * @version 8.0.0
 * @since 2026-02-06
 *
 * Purpose: Provide a dedicated step counter for Authentication flows that:
 * - Shows 4 steps including Device Selection
 * - Displays correct step numbers for Authentication flow
 * - Provides visual progress indication
 */

import React from 'react';

const MODULE_TAG = '[🔐 AUTHENTICATION-STEP-COUNTER-V8]';

export interface AuthenticationStepCounterV8Props {
	/** Current step number (0-based) */
	currentStep: number;
	/** Total number of steps */
	totalSteps: number;
	/** Step labels for display */
	stepLabels: string[];
	/** Custom className for styling */
	className?: string;
}

export const AuthenticationStepCounterV8: React.FC<AuthenticationStepCounterV8Props> = ({
	currentStep,
	totalSteps,
	stepLabels,
	className = '',
}) => {
	return (
		<div className={`authentication-step-counter-v8 ${className}`}>
			<div className="step-progress" style={{ marginBottom: '24px' }}>
				{stepLabels.map((label, idx) => {
					const isCompleted = idx < currentStep;
					const isCurrent = idx === currentStep;

					return (
						<div
							key={idx}
							className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								marginRight: '16px',
								padding: '8px 12px',
								borderRadius: '6px',
								backgroundColor: isCurrent ? '#e5e7eb' : isCompleted ? '#d1fae5' : '#f9fafb',
								border: isCurrent ? '1px solid #9ca3af' : '1px solid #e5e7eb',
								transition: 'all 0.2s ease',
							}}
						>
							{/* Step indicator */}
							<div
								style={{
									width: '24px',
									height: '24px',
									borderRadius: '50%',
									backgroundColor: isCurrent ? '#10b981' : isCompleted ? '#10b981' : '#e5e7eb',
									color: isCurrent || isCompleted ? 'white' : '#6b7280',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '12px',
									fontWeight: '600',
									marginRight: '8px',
								}}
							>
								{idx + 1}
							</div>

							{/* Step label */}
							<span style={{ fontWeight: isCurrent ? '600' : '400', fontSize: '14px' }}>
								{label}
							</span>

							{/* Arrow for non-last steps */}
							{idx < stepLabels.length - 1 && (
								<span style={{ marginLeft: '8px', color: '#9ca3af' }}>→</span>
							)}
						</div>
					);
				})}
			</div>

			{/* Progress indicator */}
			<div style={{ marginBottom: '16px' }}>
				<div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
					Authentication Progress: Step {currentStep + 1} of {totalSteps}
				</div>
				<div
					style={{
						width: '100%',
						height: '8px',
						backgroundColor: '#e5e7eb',
						borderRadius: '4px',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							width: `${((currentStep + 1) / totalSteps) * 100}%`,
							height: '100%',
							backgroundColor: '#10b981',
							transition: 'width 0.3s ease',
						}}
					/>
				</div>
			</div>

			{/* Debug info */}
			{process.env.NODE_ENV === 'development' && (
				<div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
					{MODULE_TAG} Current: {currentStep}, Total: {totalSteps}
				</div>
			)}
		</div>
	);
};
