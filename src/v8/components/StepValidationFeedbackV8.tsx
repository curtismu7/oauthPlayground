/**
 * @file StepValidationFeedbackV8.tsx
 * @module v8/components
 * @description Displays validation errors and warnings for current step
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Error display with icons
 * - Warning display with icons
 * - Collapsible sections
 * - Accessibility support
 *
 * @example
 * <StepValidationFeedbackV8
 *   errors={['Environment ID is required', 'Client ID is required']}
 *   warnings={['Using HTTP for non-localhost is insecure']}
 *   showErrors={true}
 *   showWarnings={true}
 * />
 */

import React, { useId, useState } from 'react';
import { StepValidationFeedbackProps } from '@/v8/types/stepNavigation';

const MODULE_TAG = '[⚠️ VALIDATION-FEEDBACK-V8]';
const ENABLE_VALIDATION_DEBUG_LOGGING = false;

/**
 * StepValidationFeedbackV8 Component
 *
 * Displays validation feedback with:
 * - Error messages with icons
 * - Warning messages with icons
 * - Collapsible sections
 * - Clear visual hierarchy
 */
export const StepValidationFeedbackV8: React.FC<StepValidationFeedbackProps> = ({
	errors = [],
	warnings = [],
	showErrors = true,
	showWarnings = true,
	className = '',
}) => {
	const [expandedErrors, setExpandedErrors] = useState(true);
	const [expandedWarnings, setExpandedWarnings] = useState(true);
	const errorsId = useId();
	const warningsId = useId();

	const hasErrors = errors.length > 0;
	const hasWarnings = warnings.length > 0;

	if (!hasErrors && !hasWarnings) {
		return null;
	}

	if (ENABLE_VALIDATION_DEBUG_LOGGING) {
		console.log(`${MODULE_TAG} Rendering feedback`, {
			errorCount: errors.length,
			warningCount: warnings.length,
		});
	}

	return (
		<div className={`step-validation-feedback-v8 ${className}`}>
			{/* Errors Section */}
			{hasErrors && showErrors && (
				<div className="feedback-section errors-section">
					<button
						type="button"
						className="section-header"
						onClick={() => setExpandedErrors(!expandedErrors)}
						aria-expanded={expandedErrors}
						aria-controls={`${errorsId}-content`}
					>
						<span className="section-icon">🚨</span>
						<span className="section-title">
							{errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
						</span>
						<span className="section-toggle">{expandedErrors ? '▼' : '▶'}</span>
					</button>

					{expandedErrors && (
						<div id={`${errorsId}-content`} className="section-content">
							<ul className="error-list">
								{errors.map((error, index) => (
									<li key={index}>
										<span className="error-icon">✗</span>
										<span className="error-text">{error}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* Warnings Section */}
			{hasWarnings && showWarnings && (
				<div className="feedback-section warnings-section">
					<button
						type="button"
						className="section-header"
						onClick={() => setExpandedWarnings(!expandedWarnings)}
						aria-expanded={expandedWarnings}
						aria-controls={`${warningsId}-content`}
					>
						<span className="section-icon">⚠️</span>
						<span className="section-title">
							{warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
						</span>
						<span className="section-toggle">{expandedWarnings ? '▼' : '▶'}</span>
					</button>

					{expandedWarnings && (
						<div id={`${warningsId}-content`} className="section-content">
							<ul className="warning-list">
								{warnings.map((warning, index) => (
									<li key={index}>
										<span className="warning-icon">!</span>
										<span className="warning-text">{warning}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			<style>{`
				.step-validation-feedback-v8 {
					display: flex;
					flex-direction: column;
					gap: 12px;
					margin-bottom: 16px;
				}

				.feedback-section {
					border-radius: 6px;
					overflow: hidden;
					border: 1px solid #ddd;
				}

				.errors-section {
					background: #ffebee;
					border-color: #ef5350;
				}

				.warnings-section {
					background: #fff3e0;
					border-color: #ffa726;
				}

				.section-header {
					display: flex;
					align-items: center;
					gap: 12px;
					width: 100%;
					padding: 12px 16px;
					background: transparent;
					border: none;
					cursor: pointer;
					font-size: 14px;
					font-weight: 600;
					text-align: left;
					transition: background 0.2s ease;
				}

				.errors-section .section-header {
					color: #c62828;
				}

				.errors-section .section-header:hover {
					background: rgba(239, 83, 80, 0.1);
				}

				.warnings-section .section-header {
					color: #e65100;
				}

				.warnings-section .section-header:hover {
					background: rgba(255, 167, 38, 0.1);
				}

				.section-header:focus-visible {
					outline: 2px solid #2196f3;
					outline-offset: -2px;
				}

				.section-icon {
					display: inline-block;
					font-size: 16px;
				}

				.section-title {
					flex: 1;
				}

				.section-toggle {
					display: inline-block;
					font-size: 12px;
					transition: transform 0.2s ease;
				}

				.section-content {
					padding: 12px 16px;
					border-top: 1px solid;
				}

				.errors-section .section-content {
					border-top-color: #ef5350;
				}

				.warnings-section .section-content {
					border-top-color: #ffa726;
				}

				.error-list,
				.warning-list {
					list-style: none;
					margin: 0;
					padding: 0;
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.error-list li,
				.warning-list li {
					display: flex;
					align-items: flex-start;
					gap: 8px;
					font-size: 13px;
					line-height: 1.4;
				}

				.errors-section li {
					color: #c62828;
				}

				.warnings-section li {
					color: #e65100;
				}

				.error-icon,
				.warning-icon {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 20px;
					height: 20px;
					flex-shrink: 0;
					font-size: 12px;
					font-weight: bold;
				}

				.error-icon {
					background: #ef5350;
					color: white;
					border-radius: 50%;
				}

				.warning-icon {
					background: #ffa726;
					color: white;
					border-radius: 50%;
				}

				.error-text,
				.warning-text {
					flex: 1;
				}

				/* Mobile responsive */
				@media (max-width: 600px) {
					.section-header {
						padding: 10px 12px;
						font-size: 13px;
					}

					.section-content {
						padding: 10px 12px;
					}

					.error-list li,
					.warning-list li {
						font-size: 12px;
					}
				}
			`}</style>
		</div>
	);
};

export default StepValidationFeedbackV8;
