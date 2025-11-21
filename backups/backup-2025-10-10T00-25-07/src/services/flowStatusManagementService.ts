// src/services/flowStatusManagementService.ts
// ⭐ V6 SERVICE - Flow status management with progress tracking
// Used in: OAuthAuthorizationCodeFlowV6
// Purpose: Track flow progress, step timing, and error recovery

import React from 'react';

export interface FlowStep {
	id: string;
	name: string;
	description: string;
	status: 'idle' | 'running' | 'completed' | 'error';
	order: number;
	required: boolean;
	estimatedDuration?: number;
	actualDuration?: number;
	startTime?: Date;
	endTime?: Date;
	data?: Record<string, unknown>;
	errors?: string[];
	warnings?: string[];
}

export interface FlowState {
	id: string;
	flowType: 'oauth' | 'oidc' | 'pingone';
	status: 'idle' | 'running' | 'completed' | 'error';
	currentStep: string;
	steps: FlowStep[];
	startTime?: Date;
	endTime?: Date;
	totalDuration?: number;
	completionPercentage: number;
	metadata?: Record<string, unknown>;
	errors?: string[];
	warnings?: string[];
}

export interface FlowStatusConfig {
	flowType: 'oauth' | 'oidc' | 'pingone';
	enableProgressTracking?: boolean;
	enableStepTiming?: boolean;
	enableErrorRecovery?: boolean;
	showStepDetails?: boolean;
}

export class FlowStatusManagementService {
	// Create a status manager instance
	static createStatusManager(config: FlowStatusConfig) {
		return {
			config,
			currentState: null as FlowState | null,

			// Initialize flow
			initializeFlow(flowId: string, steps: Omit<FlowStep, 'status'>[]) {
				this.currentState = {
					id: flowId,
					flowType: config.flowType,
					status: 'idle',
					currentStep: steps[0]?.id || '',
					steps: steps.map((step) => ({ ...step, status: 'idle' as const })),
					startTime: new Date(),
					completionPercentage: 0,
				};
				return this.currentState;
			},

			// Start a step
			startStep(stepId: string) {
				if (!this.currentState) return;

				this.currentState.steps = this.currentState.steps.map((step) =>
					step.id === stepId ? { ...step, status: 'running' as const, startTime: new Date() } : step
				);
				this.currentState.currentStep = stepId;
				this.currentState.status = 'running';
				this.updateProgress();
			},

			// Complete a step
			completeStep(stepId: string, data?: Record<string, unknown>) {
				if (!this.currentState) return;

				this.currentState.steps = this.currentState.steps.map((step) => {
					if (step.id === stepId) {
						const endTime = new Date();
						const actualDuration = step.startTime
							? (endTime.getTime() - step.startTime.getTime()) / 1000
							: undefined;

						return {
							...step,
							status: 'completed' as const,
							endTime,
							actualDuration,
							data: { ...step.data, ...data },
						};
					}
					return step;
				});

				this.updateProgress();

				// Check if all steps completed
				const allCompleted = this.currentState.steps.every((s) => s.status === 'completed');
				if (allCompleted) {
					this.currentState.status = 'completed';
					this.currentState.endTime = new Date();
					if (this.currentState.startTime) {
						this.currentState.totalDuration =
							(this.currentState.endTime.getTime() - this.currentState.startTime.getTime()) / 1000;
					}
				}
			},

			// Mark step as error
			errorStep(stepId: string, error: string) {
				if (!this.currentState) return;

				this.currentState.steps = this.currentState.steps.map((step) =>
					step.id === stepId
						? { ...step, status: 'error' as const, errors: [...(step.errors || []), error] }
						: step
				);
				this.currentState.status = 'error';
				this.currentState.errors = [...(this.currentState.errors || []), error];
			},

			// Update progress percentage
			updateProgress() {
				if (!this.currentState) return;

				const completedSteps = this.currentState.steps.filter(
					(s) => s.status === 'completed'
				).length;
				const totalSteps = this.currentState.steps.length;
				this.currentState.completionPercentage =
					totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
			},

			// Get current state
			getState() {
				return this.currentState;
			},

			// Reset flow
			reset() {
				if (!this.currentState) return;

				this.currentState.status = 'idle';
				this.currentState.currentStep = this.currentState.steps[0]?.id || '';
				this.currentState.steps = this.currentState.steps.map((step) => ({
					...step,
					status: 'idle' as const,
					startTime: undefined,
					endTime: undefined,
					actualDuration: undefined,
					data: {},
					errors: [],
					warnings: [],
				}));
				this.currentState.completionPercentage = 0;
				this.currentState.startTime = new Date();
				this.currentState.endTime = undefined;
				this.currentState.totalDuration = undefined;
				this.currentState.errors = [];
				this.currentState.warnings = [];
			},
		};
	}
}

// React component for displaying flow progress
export const FlowProgress: React.FC<{ flowState: FlowState }> = ({ flowState }) => {
	return React.createElement(
		'div',
		{
			style: {
				background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
				border: '1px solid #bfdbfe',
				borderRadius: '0.75rem',
				padding: '1.5rem',
				marginBottom: '1.5rem',
			},
		},
		[
			React.createElement(
				'div',
				{
					key: 'progress-bar',
					style: {
						marginBottom: '1rem',
					},
				},
				[
					React.createElement(
						'div',
						{
							key: 'label',
							style: {
								display: 'flex',
								justifyContent: 'space-between',
								marginBottom: '0.5rem',
								fontSize: '0.875rem',
								fontWeight: '600',
								color: '#1e40af',
							},
						},
						[
							React.createElement('span', { key: 'text' }, 'Flow Progress'),
							React.createElement('span', { key: 'percent' }, `${flowState.completionPercentage}%`),
						]
					),
					React.createElement(
						'div',
						{
							key: 'bar-bg',
							style: {
								width: '100%',
								height: '8px',
								background: '#e5e7eb',
								borderRadius: '4px',
								overflow: 'hidden',
							},
						},
						[
							React.createElement('div', {
								key: 'bar-fill',
								style: {
									width: `${flowState.completionPercentage}%`,
									height: '100%',
									background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
									transition: 'width 0.3s ease',
									borderRadius: '4px',
								},
							}),
						]
					),
				]
			),
			React.createElement(
				'div',
				{
					key: 'stats',
					style: {
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
						gap: '1rem',
						fontSize: '0.8125rem',
						color: '#1e40af',
					},
				},
				[
					React.createElement('div', { key: 'current' }, [
						React.createElement(
							'div',
							{ key: 'label', style: { fontWeight: '600' } },
							'Current Step:'
						),
						React.createElement('div', { key: 'value' }, flowState.currentStep),
					]),
					React.createElement('div', { key: 'completed' }, [
						React.createElement(
							'div',
							{ key: 'label', style: { fontWeight: '600' } },
							'Completed:'
						),
						React.createElement(
							'div',
							{ key: 'value' },
							`${flowState.steps.filter((s) => s.status === 'completed').length}/${flowState.steps.length}`
						),
					]),
					React.createElement('div', { key: 'status' }, [
						React.createElement('div', { key: 'label', style: { fontWeight: '600' } }, 'Status:'),
						React.createElement(
							'div',
							{ key: 'value', style: { textTransform: 'capitalize' } },
							flowState.status
						),
					]),
				]
			),
		]
	);
};

export default FlowStatusManagementService;
