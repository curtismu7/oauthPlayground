// src/services/flowStateService.ts
// Comprehensive Flow State Management Service

export type FlowStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';

export interface FlowStep {
	stepId: string;
	stepName: string;
	stepType: 'authentication' | 'device_selection' | 'device_registration' | 'challenge' | 'verification' | 'completion' | 'generic';
	status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'skipped';
	startedAt?: Date;
	completedAt?: Date;
	data?: Record<string, any>;
	error?: string;
	retryCount?: number;
}

export interface FlowState {
	flowId: string;
	userId: string;
	flowType: string;
	status: FlowStatus;
	currentStepId?: string;
	steps: FlowStep[];
	startedAt: Date;
	completedAt?: Date;
	metadata: Record<string, any>;
	configuration: Record<string, any>;
	results: Record<string, any>;
}

class FlowStateService {
	private static flows = new Map<string, FlowState>();

	// ---------------------------------------------------------------------
	// Metadata helpers used by various flow configs (retained from V6 work)
	// ---------------------------------------------------------------------
	static createStepMetadata(stepConfigs: Array<{ title: string; subtitle?: string; description?: string }>) {
		return stepConfigs.map((config, index) => ({
			stepNumber: index,
			title: config.title,
			subtitle: config.subtitle ?? '',
			description: config.description ?? '',
		}));
	}

	static createIntroSectionKeys(flowType: string): string[] {
		const baseKeys = ['overview', 'flowDiagram', 'credentials', 'results', 'flowSummary'];
		const flowSpecific: Record<string, string[]> = {
			authorization: ['pkceOverview', 'authRequestOverview', 'authResponseOverview'],
			oauth: ['tokenExchangeOverview', 'introspectionOverview'],
			oidc: ['tokenExchangeOverview', 'introspectionOverview', 'securityOverview'],
			default: ['securityOverview'],
		};

		const normalized = flowType.toLowerCase();
		const extra = flowSpecific[normalized as keyof typeof flowSpecific] ?? flowSpecific.default;
		return Array.from(new Set([...baseKeys, ...extra]));
	}

	// ---------------------------------------------------------------------
	// Legacy-compatible Flow State API (used heavily by MFA flow)
	// ---------------------------------------------------------------------
	static initializeFlow(userId: string, flowType: string, configuration: Record<string, any> = {}): FlowState {
		const flow: FlowState = {
			flowId: this.generateFlowId(),
			userId,
			flowType,
			status: 'not_started',
			steps: [],
			startedAt: new Date(),
			metadata: { sessionId: this.generateSessionId() },
			configuration: { ...configuration },
			results: {},
		};

		this.flows.set(flow.flowId, flow);
		return flow;
	}

	static getFlow(flowId: string): FlowState | undefined {
		return this.flows.get(flowId);
	}

	static getFlowState(flowId: string): FlowState | undefined {
		return this.getFlow(flowId);
	}

	static startStep(flowId: string, stepId: string, stepName?: string): void {
		const flow = this.flows.get(flowId);
		if (!flow) {
			return;
		}

		const step = this.ensureStep(flow, stepId, stepName);
		step.status = 'in_progress';
		step.startedAt = new Date();
		if ('completedAt' in step) {
			delete step.completedAt;
		}
		flow.currentStepId = stepId;
		flow.status = 'in_progress';
	}

	static completeStep(flowId: string, stepId: string, data?: Record<string, any>): void {
		const flow = this.flows.get(flowId);
		if (!flow) {
			return;
		}

		const step = this.ensureStep(flow, stepId);
		step.status = 'completed';
		step.completedAt = new Date();
		if (data) {
			step.data = { ...(step.data ?? {}), ...data };
		}
		flow.currentStepId = stepId;
	}

	static failStep(flowId: string, stepId: string, errorMessage: string): void {
		const flow = this.flows.get(flowId);
		if (!flow) {
			return;
		}

		const step = this.ensureStep(flow, stepId);
		step.status = 'failed';
		step.completedAt = new Date();
		step.error = errorMessage;
		flow.status = 'failed';
		flow.currentStepId = stepId;
	}

	static completeFlow(flowId: string): void {
		const flow = this.flows.get(flowId);
		if (!flow) {
			return;
		}

		flow.status = 'completed';
		flow.completedAt = new Date();
	}

	static updateFlow(flowId: string, updates: Partial<FlowState>): FlowState | undefined {
		const flow = this.flows.get(flowId);
		if (!flow) {
			return undefined;
		}

		const merged: FlowState = {
			...flow,
			...updates,
			metadata: { ...flow.metadata, ...(updates.metadata ?? {}) },
			configuration: { ...flow.configuration, ...(updates.configuration ?? {}) },
			results: { ...flow.results, ...(updates.results ?? {}) },
		};

		this.flows.set(flowId, merged);
		return merged;
	}

	// ---------------------------------------------------------------------
	// Internal helpers
	// ---------------------------------------------------------------------
	private static ensureStep(flow: FlowState, stepId: string, stepName?: string): FlowStep {
		let step = flow.steps.find((s) => s.stepId === stepId);
		if (!step) {
			step = {
				stepId,
				stepName: stepName ?? this.formatStepName(stepId),
				stepType: this.inferStepType(stepId),
				status: 'not_started',
			};
			flow.steps.push(step);
		}

		if (stepName) {
			step.stepName = stepName;
		}

		return step;
	}

	private static inferStepType(stepId: string): FlowStep['stepType'] {
		const normalized = stepId.toLowerCase();
		if (normalized.includes('auth') || normalized.includes('login')) return 'authentication';
		if (normalized.includes('device') && normalized.includes('registration')) return 'device_registration';
		if (normalized.includes('device')) return 'device_selection';
		if (normalized.includes('challenge')) return 'challenge';
		if (normalized.includes('verify') || normalized.includes('verification')) return 'verification';
		if (normalized.includes('success') || normalized.includes('complete')) return 'completion';
		return 'generic';
	}

	private static formatStepName(stepId: string): string {
		return stepId
			.replace(/_/g, ' ')
			.replace(/-/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.replace(/\b\w/g, (letter) => letter.toUpperCase());
	}

	private static generateFlowId(): string {
		return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}

	private static generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}
}

export default FlowStateService;