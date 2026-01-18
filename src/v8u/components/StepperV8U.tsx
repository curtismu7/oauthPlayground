/**
 * @file StepperV8U.tsx
 * @module v8u/components
 * @description V7-style stepper with navigation buttons for V8U flows
 * @version 8.0.0
 * @since 2024-11-17
 */

import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { type FlowType } from '@/v8/services/specVersionServiceV8';

const MODULE_TAG = '[📊 STEPPER-V8U]';

export interface StepperV8UProps {
	currentStep: number;
	totalSteps: number;
	flowType: FlowType;
	completedSteps: number[];
	onStepClick: (step: number) => void;
	onNext?: () => void;
	onPrevious?: () => void;
	onReset?: () => void;
	canGoNext?: boolean;
	canGoPrevious?: boolean;
	validationErrors?: string[];
	validationWarnings?: string[];
}

const getStepLabel = (step: number, flowType: FlowType): string => {
	switch (flowType) {
		case 'oauth-authz':
			return (
				['Configure', 'PKCE Setup', 'Authorization', 'Callback', 'Tokens'][step] ||
				`Step ${step + 1}`
			);
		case 'implicit':
			return ['Configure', 'Authorization', 'Fragment', 'Tokens'][step] || `Step ${step + 1}`;
		case 'client-credentials':
			return ['Configure', 'Token Request', 'Tokens'][step] || `Step ${step + 1}`;
		case 'device-code':
			return ['Configure', 'Device Auth', 'Poll', 'Tokens'][step] || `Step ${step + 1}`;
		case 'ropc':
			return ['Configure', 'Credentials', 'Tokens'][step] || `Step ${step + 1}`;
		case 'hybrid':
			return (
				['Configure', 'PKCE Setup', 'Authorization', 'Callback', 'Tokens'][step] ||
				`Step ${step + 1}`
			);
		default:
			return `Step ${step + 1}`;
	}
};

export const StepperV8U: React.FC<StepperV8UProps> = ({
	currentStep,
	totalSteps,
	flowType,
	completedSteps,
	onStepClick,
	onNext,
	onPrevious,
	onReset,
	canGoNext = true,
	canGoPrevious = true,
	validationErrors = [],
	validationWarnings = [],
}) => {
	console.log(`${MODULE_TAG} Rendering stepper`, { currentStep, totalSteps, flowType });

	return (
		<div
			style={{
				background: '#ffffff',
				borderRadius: '8px',
				padding: '24px',
				marginBottom: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				border: '1px solid #e5e7eb',
			}}
		>
			{/* Step indicators */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: '24px',
					position: 'relative',
				}}
			>
				{/* Progress line */}
				<div
					style={{
						position: 'absolute',
						top: '20px',
						left: '40px',
						right: '40px',
						height: '2px',
						background: '#e5e7eb',
						zIndex: 0,
					}}
				>
					<div
						style={{
							height: '100%',
							background: '#3b82f6',
							width: `${(currentStep / (totalSteps - 1)) * 100}%`,
							transition: 'width 0.3s ease',
						}}
					/>
				</div>

				{/* Step circles */}
				{Array.from({ length: totalSteps }).map((_, index) => {
					const isCompleted = completedSteps.includes(index);
					const isCurrent = index === currentStep;
					const isClickable = index <= currentStep || isCompleted;

					return (
						<div
							key={index}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								flex: 1,
								position: 'relative',
								zIndex: 1,
							}}
						>
							<button
								type="button"
								onClick={() => isClickable && onStepClick(index)}
								disabled={!isClickable}
								style={{
									width: '40px',
									height: '40px',
									borderRadius: '50%',
									border: isCurrent
										? '3px solid #3b82f6'
										: isCompleted
											? '2px solid #10b981'
											: '2px solid #d1d5db',
									background: isCurrent ? '#3b82f6' : isCompleted ? '#10b981' : '#ffffff',
									color: isCurrent || isCompleted ? '#ffffff' : '#6b7280',
									fontSize: '16px',
									fontWeight: '600',
									cursor: isClickable ? 'pointer' : 'not-allowed',
									transition: 'all 0.2s ease',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: '8px',
									opacity: isClickable ? 1 : 0.5,
								}}
								onMouseEnter={(e) => {
									if (isClickable && !isCurrent) {
										e.currentTarget.style.transform = 'scale(1.1)';
										e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
									}
								}}
								onMouseLeave={(e) => {
									if (isClickable && !isCurrent) {
										e.currentTarget.style.transform = 'scale(1)';
										e.currentTarget.style.boxShadow = 'none';
									}
								}}
								title={getStepLabel(index, flowType)}
							>
								{isCompleted ? '✓' : index + 1}
							</button>
							<span
								style={{
									fontSize: '12px',
									fontWeight: isCurrent ? '600' : '500',
									color: isCurrent ? '#3b82f6' : isCompleted ? '#10b981' : '#6b7280',
									textAlign: 'center',
									maxWidth: '80px',
									lineHeight: '1.2',
								}}
							>
								{getStepLabel(index, flowType)}
							</span>
						</div>
					);
				})}
			</div>

			{/* Validation warnings (orange background - non-blocking) */}
			{validationWarnings.length > 0 && (
				<div
					style={{
						padding: '12px',
						background: '#fff7ed',
						border: '1px solid #fb923c',
						borderRadius: '6px',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
						<span style={{ fontSize: '16px' }}>⚠️</span>
						<strong style={{ color: '#c2410c', fontSize: '14px' }}>Validation Warnings</strong>
					</div>
					<ul style={{ margin: 0, paddingLeft: '24px', color: '#9a3412', fontSize: '13px' }}>
						{validationWarnings.map((warning, idx) => (
							<li key={idx}>{warning}</li>
						))}
					</ul>
				</div>
			)}

			{/* Validation errors (red background - blocking) */}
			{validationErrors.length > 0 && (
				<div
					style={{
						padding: '12px',
						background: '#fee2e2',
						border: '1px solid #fca5a5',
						borderRadius: '6px',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
						<span style={{ fontSize: '16px' }}>❌</span>
						<strong style={{ color: '#dc2626', fontSize: '14px' }}>Validation Errors</strong>
					</div>
					<ul style={{ margin: 0, paddingLeft: '24px', color: '#991b1b', fontSize: '13px' }}>
						{validationErrors.map((error, idx) => (
							<li key={idx}>{error}</li>
						))}
					</ul>
				</div>
			)}

			{/* Navigation buttons */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '12px',
				}}
			>
				{/* Previous button */}
				<button
					type="button"
					onClick={onPrevious}
					disabled={!canGoPrevious || currentStep === 0}
					style={{
						padding: '10px 20px',
						fontSize: '14px',
						fontWeight: '600',
						borderRadius: '6px',
						border: '1px solid #d1d5db',
						background: '#ffffff',
						color: '#374151',
						cursor: canGoPrevious && currentStep > 0 ? 'pointer' : 'not-allowed',
						opacity: canGoPrevious && currentStep > 0 ? 1 : 0.5,
						transition: 'all 0.2s ease',
						minWidth: '120px',
					}}
					onMouseEnter={(e) => {
						if (canGoPrevious && currentStep > 0) {
							e.currentTarget.style.background = '#f9fafb';
							e.currentTarget.style.borderColor = '#9ca3af';
						}
					}}
					onMouseLeave={(e) => {
						if (canGoPrevious && currentStep > 0) {
							e.currentTarget.style.background = '#ffffff';
							e.currentTarget.style.borderColor = '#d1d5db';
						}
					}}
				>
					← Previous
				</button>

				{/* Reset button (center) */}
				<button
					type="button"
					onClick={onReset}
					style={{
						padding: '10px 20px',
						fontSize: '14px',
						fontWeight: '600',
						borderRadius: '6px',
						border: '1px solid #fca5a5',
						background: '#ffffff',
						color: '#dc2626',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
						minWidth: '120px',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#fee2e2';
						e.currentTarget.style.borderColor = '#f87171';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = '#ffffff';
						e.currentTarget.style.borderColor = '#fca5a5';
					}}
				>
					🔄 Restart Flow
				</button>

				{/* Next button - Green with white text and arrow */}
				<button
					type="button"
					className="btn btn-next"
					onClick={onNext}
					disabled={!canGoNext || currentStep === totalSteps - 1}
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '8px',
						minWidth: '120px',
					}}
				>
					<span>Next Step</span>
					<FiArrowRight size={16} style={{ marginLeft: '4px' }} />
				</button>
			</div>
		</div>
	);
};
