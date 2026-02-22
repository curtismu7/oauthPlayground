import React from 'react';
import { UI_STANDARDS } from '@/v8/constants/uiStandardsV8';

interface FlowStep {
	id: number;
	label: string;
	status: 'pending' | 'active' | 'completed' | 'error';
	description?: string;
	icon?: string;
	estimatedTime?: string;
}

interface FlowProgressTrackerV8Props {
	steps: FlowStep[];
	currentStep: number;
	showProgress?: boolean;
	showTimeEstimates?: boolean;
	variant?: 'horizontal' | 'vertical' | 'compact';
	className?: string;
	onStepClick?: (stepId: number) => void;
}

export const FlowProgressTrackerV8: React.FC<FlowProgressTrackerV8Props> = ({
	steps,
	currentStep,
	showProgress = true,
	showTimeEstimates = false,
	variant = 'horizontal',
	className = '',
	onStepClick,
}) => {
	const getStepColor = (status: FlowStep['status']) => {
		switch (status) {
			case 'completed':
				return UI_STANDARDS.messageColors.success.border;
			case 'active':
				return UI_STANDARDS.colors.focus;
			case 'error':
				return UI_STANDARDS.messageColors.error.border;
			default:
				return UI_STANDARDS.colors.default;
		}
	};

	const getStepIcon = (status: FlowStep['status'], customIcon?: string) => {
		if (customIcon) return customIcon;

		switch (status) {
			case 'completed':
				return '✓';
			case 'active':
				return '⚡';
			case 'error':
				return '⚠';
			default:
				return '○';
		}
	};

	const getProgressPercentage = () => {
		const completedSteps = steps.filter((step) => step.status === 'completed').length;
		return (completedSteps / steps.length) * 100;
	};

	const handleStepClick = (stepId: number) => {
		if (onStepClick && stepId <= currentStep) {
			onStepClick(stepId);
		}
	};

	const renderHorizontalStep = (step: FlowStep, index: number) => {
		const isActive = step.id === currentStep;
		const isClickable = onStepClick && step.id <= currentStep;

		return (
			<div
				role="button"
				tabIndex={0}
				key={step.id}
				className={`flow-step ${isActive ? 'active' : ''} ${isClickable ? 'clickable' : ''}`}
				onClick={() => handleStepClick(step.id)}
			>
				<div className="step-indicator" style={{ backgroundColor: getStepColor(step.status) }}>
					<span className="step-icon">{getStepIcon(step.status, step.icon)}</span>
				</div>
				<div className="step-content">
					<div className="step-label">{step.label}</div>
					{step.description && <div className="step-description">{step.description}</div>}
					{showTimeEstimates && step.estimatedTime && (
						<div className="step-time">{step.estimatedTime}</div>
					)}
				</div>
				{index < steps.length - 1 && (
					<div className={`step-connector ${step.status === 'completed' ? 'completed' : ''}`} />
				)}
			</div>
		);
	};

	const renderVerticalStep = (step: FlowStep, index: number) => {
		const isActive = step.id === currentStep;
		const isClickable = onStepClick && step.id <= currentStep;

		return (
			<div
				role="button"
				tabIndex={0}
				key={step.id}
				className={`flow-step vertical ${isActive ? 'active' : ''} ${isClickable ? 'clickable' : ''}`}
				onClick={() => handleStepClick(step.id)}
			>
				<div className="step-indicator" style={{ backgroundColor: getStepColor(step.status) }}>
					<span className="step-icon">{getStepIcon(step.status, step.icon)}</span>
				</div>
				<div className="step-content">
					<div className="step-label">{step.label}</div>
					{step.description && <div className="step-description">{step.description}</div>}
					{showTimeEstimates && step.estimatedTime && (
						<div className="step-time">{step.estimatedTime}</div>
					)}
				</div>
				{index < steps.length - 1 && (
					<div
						className={`step-connector vertical ${step.status === 'completed' ? 'completed' : ''}`}
					/>
				)}
			</div>
		);
	};

	const renderCompactStep = (step: FlowStep) => {
		const isActive = step.id === currentStep;
		const isClickable = onStepClick && step.id <= currentStep;

		return (
			<div
				role="button"
				tabIndex={0}
				key={step.id}
				className={`flow-step compact ${isActive ? 'active' : ''} ${isClickable ? 'clickable' : ''}`}
				onClick={() => handleStepClick(step.id)}
				title={`${step.label}${step.description ? `: ${step.description}` : ''}`}
			>
				<div className="step-dot" style={{ backgroundColor: getStepColor(step.status) }}>
					<span className="step-icon">{getStepIcon(step.status, step.icon)}</span>
				</div>
			</div>
		);
	};

	return (
		<div className={`flow-progress-tracker-v8 ${variant} ${className}`}>
			{showProgress && (
				<div className="progress-header">
					<div className="progress-bar">
						<div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }} />
					</div>
					<div className="progress-text">{Math.round(getProgressPercentage())}% Complete</div>
				</div>
			)}

			<div className={`steps-container ${variant}`}>
				{variant === 'horizontal' && steps.map(renderHorizontalStep)}
				{variant === 'vertical' && steps.map(renderVerticalStep)}
				{variant === 'compact' && steps.map(renderCompactStep)}
			</div>

			<style>{`
				.flow-progress-tracker-v8 {
					background: white;
					border: 1px solid ${UI_STANDARDS.colors.default};
					border-radius: ${UI_STANDARDS.borders.radius.md};
					padding: ${UI_STANDARDS.spacing.lg};
					box-shadow: ${UI_STANDARDS.shadows.sm};
					transition: all ${UI_STANDARDS.animations.duration.normal} ${UI_STANDARDS.animations.easing.default};
				}

				.flow-progress-tracker-v8:hover {
					box-shadow: ${UI_STANDARDS.shadows.md};
				}

				.progress-header {
					display: flex;
					align-items: center;
					gap: ${UI_STANDARDS.spacing.md};
					margin-bottom: ${UI_STANDARDS.spacing.lg};
				}

				.progress-bar {
					flex: 1;
					height: 8px;
					background: ${UI_STANDARDS.colors.default};
					border-radius: 4px;
					overflow: hidden;
				}

				.progress-fill {
					height: 100%;
					background: ${UI_STANDARDS.colors.focus};
					transition: width ${UI_STANDARDS.animations.duration.normal} ${UI_STANDARDS.animations.easing.default};
				}

				.progress-text {
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					font-weight: ${UI_STANDARDS.typography.fontWeights.semibold};
					color: ${UI_STANDARDS.colors.hover};
					white-space: nowrap;
				}

				.steps-container.horizontal {
					display: flex;
					align-items: flex-start;
					gap: ${UI_STANDARDS.spacing.md};
				}

				.steps-container.vertical {
					display: flex;
					flex-direction: column;
					gap: ${UI_STANDARDS.spacing.md};
				}

				.steps-container.compact {
					display: flex;
					align-items: center;
					gap: ${UI_STANDARDS.spacing.sm};
					justify-content: center;
				}

				.flow-step {
					display: flex;
					align-items: flex-start;
					gap: ${UI_STANDARDS.spacing.sm};
					position: relative;
				}

				.flow-step.clickable {
					cursor: pointer;
				}

				.flow-step.clickable:hover {
					transform: translateY(-1px);
				}

				.flow-step.active .step-label {
					color: ${UI_STANDARDS.colors.focus};
					font-weight: ${UI_STANDARDS.typography.fontWeights.semibold};
				}

				.step-indicator {
					width: 32px;
					height: 32px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					font-weight: ${UI_STANDARDS.typography.fontWeights.semibold};
					color: white;
					transition: all ${UI_STANDARDS.animations.duration.fast} ${UI_STANDARDS.animations.easing.default};
					flex-shrink: 0;
				}

				.step-icon {
					font-size: 14px;
				}

				.step-content {
					flex: 1;
					min-width: 0;
				}

				.step-label {
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					font-weight: ${UI_STANDARDS.typography.fontWeights.medium};
					color: ${UI_STANDARDS.colors.hover};
					line-height: ${UI_STANDARDS.typography.lineHeights.tight};
					margin-bottom: ${UI_STANDARDS.spacing.xs};
				}

				.step-description {
					font-size: ${UI_STANDARDS.typography.fontSizes.xs};
					color: ${UI_STANDARDS.colors.default};
					line-height: ${UI_STANDARDS.typography.lineHeights.normal};
				}

				.step-time {
					font-size: ${UI_STANDARDS.typography.fontSizes.xs};
					color: ${UI_STANDARDS.colors.focus};
					margin-top: ${UI_STANDARDS.spacing.xs};
				}

				.step-connector {
					position: absolute;
					background: ${UI_STANDARDS.colors.default};
					transition: all ${UI_STANDARDS.animations.duration.fast} ${UI_STANDARDS.animations.easing.default};
				}

				.step-connector:not(.vertical) {
					top: 16px;
					left: 32px;
					width: ${UI_STANDARDS.spacing.md};
					height: 2px;
				}

				.step-connector.vertical {
					top: 32px;
					left: 16px;
					width: 2px;
					height: ${UI_STANDARDS.spacing.md};
				}

				.step-connector.completed {
					background: ${UI_STANDARDS.messageColors.success.border};
				}

				.flow-step.vertical {
					flex-direction: column;
					align-items: flex-start;
				}

				.flow-step.compact {
					align-items: center;
					flex-direction: column;
				}

				.step-dot {
					width: 12px;
					height: 12px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 8px;
					color: white;
					transition: all ${UI_STANDARDS.animations.duration.fast} ${UI_STANDARDS.animations.easing.default};
				}

				.flow-step.compact .step-icon {
					font-size: 8px;
				}

				.flow-progress-tracker-v8.compact {
					padding: ${UI_STANDARDS.spacing.md};
				}

				.flow-progress-tracker-v8.vertical {
					min-width: 200px;
				}

				@media (max-width: 768px) {
					.steps-container.horizontal {
						flex-direction: column;
						align-items: flex-start;
					}

					.step-connector:not(.vertical) {
						top: 32px;
						left: 16px;
						width: 2px;
						height: ${UI_STANDARDS.spacing.md};
					}

					.flow-step:not(.compact) {
						flex-direction: column;
						align-items: flex-start;
					}

					.progress-header {
						flex-direction: column;
						align-items: flex-start;
						gap: ${UI_STANDARDS.spacing.sm};
					}
				}
			`}</style>
		</div>
	);
};

export default FlowProgressTrackerV8;
