import React from 'react';
import { UI_STANDARDS } from '@/v8/constants/uiStandardsV8';

interface StepIndicatorProps {
	currentStep: number;
	totalSteps: number;
	stepLabels?: string[];
	className?: string;
}

export const StepIndicatorV8: React.FC<StepIndicatorProps> = ({
	currentStep,
	totalSteps,
	stepLabels = [],
	className = '',
}) => {
	return (
		<div className={`step-indicator-v8 ${className}`}>
			<div className="step-indicator-bar">
				<div 
					className="step-progress" 
					style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }} 
				/>
			</div>
			<div className="step-numbers">
				{Array.from({ length: totalSteps }, (_, index) => {
					const stepNumber = index + 1;
					const isActive = stepNumber === currentStep;
					const isCompleted = stepNumber < currentStep;
					const label = stepLabels[index] || `Step ${stepNumber}`;

					return (
						<div
							key={stepNumber}
							className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
						>
							<div className="step-circle">
								{isCompleted ? '✓' : stepNumber}
							</div>
							<span className="step-label">{label}</span>
						</div>
					);
				})}
			</div>

			<style>{`
				.step-indicator-v8 {
					margin-bottom: ${UI_STANDARDS.spacing.lg};
					padding: ${UI_STANDARDS.spacing.md};
				}

				.step-indicator-bar {
					position: relative;
					height: 4px;
					background: ${UI_STANDARDS.colors.default};
					border-radius: 2px;
					margin-bottom: ${UI_STANDARDS.spacing.md};
				}

				.step-progress {
					height: 100%;
					background: ${UI_STANDARDS.colors.focus};
					border-radius: 2px;
					transition: width 0.3s ease;
				}

				.step-numbers {
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: ${UI_STANDARDS.spacing.sm};
				}

				.step-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					flex: 1;
					position: relative;
				}

				.step-circle {
					width: 32px;
					height: 32px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					font-weight: ${UI_STANDARDS.typography.fontWeights.medium};
					background: white;
					border: 2px solid ${UI_STANDARDS.colors.default};
					color: ${UI_STANDARDS.colors.hover};
					transition: all 0.3s ease;
				}

				.step-item.active .step-circle {
					background: ${UI_STANDARDS.colors.focus};
					border-color: ${UI_STANDARDS.colors.focus};
					color: white;
					transform: scale(1.1);
				}

				.step-item.completed .step-circle {
					background: ${UI_STANDARDS.messageColors.success.border};
					border-color: ${UI_STANDARDS.messageColors.success.border};
					color: white;
				}

				.step-label {
					margin-top: ${UI_STANDARDS.spacing.xs};
					font-size: ${UI_STANDARDS.typography.fontSizes.xs};
					color: ${UI_STANDARDS.colors.hover};
					text-align: center;
					font-weight: ${UI_STANDARDS.typography.fontWeights.medium};
				}

				.step-item.active .step-label {
					color: ${UI_STANDARDS.colors.focus};
					font-weight: ${UI_STANDARDS.typography.fontWeights.semibold};
				}

				.step-item.completed .step-label {
					color: ${UI_STANDARDS.messageColors.success.border};
				}

				@media (max-width: 768px) {
					.step-label {
						font-size: 10px;
					}
					
					.step-circle {
						width: 28px;
						height: 28px;
						font-size: 12px;
					}
				}
			`}</style>
		</div>
	);
};

export default StepIndicatorV8;
