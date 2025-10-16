// src/services/flowStateService.ts
// Comprehensive Flow State Management Service

import { logger } from '../utils/logger';

export interface FlowStep {
	stepId: string;
	stepName: string;
	stepType:
		| 'authentication'
		| 'device_selection'
		| 'device_registration'
		| 'challenge'
		| 'verification'
		| 'completion';
	status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'skipped';
	startedAt?: Date;
	completedAt?: Date;
	duration?: number;
	data?: Record<string, any>;
	error?: string;
	retryCount?: number;
}

export interface FlowState {
	flowId: string;
	userId: string;
	flowType: string;
	status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
	currentStepId?: string;
	steps: FlowStep[];
	startedAt: Date;
	completedAt?: Date;
	totalDuration?: number;
	metadata: Record<string, any>;
	configuration: Record<string, any>;
	results: Record<string, any>;
}

export interface FlowTransition {
	fromStepId: string;
	toStepId: string;
	timestamp: Date;
	reason: string;
	data?: Record<string, any>;
}

class FlowStateService {
	private static flows = new Map<string, FlowState>();
	private static transitions = new Map<string, FlowTransition[]>();

	/**
	 * Generate structured metadata for flow steps from config definitions
	 */
	static createStepMetadata(
		stepConfigs: Array<{ title: string; subtitle?: string; description?: string }>
	) {
		return stepConfigs.map((config, index) => ({
			stepNumber: index,
			title: config.title,
			subtitle: config.subtitle ?? '',
			description: config.description ?? '',
		}));
	}

	/**
	 * Create a consistent set of intro section keys for flow summary panels
	 */
	static createIntroSectionKeys(flowType: string): string[] {
		const baseKeys = [
			'overview',
			'flowDiagram',
			'credentials',
			'results',
			'flowSummary',
		];

		const flowSpecificKeys: Record<string, string[]> = {
			authorization: ['pkceOverview', 'authRequestOverview', 'authResponseOverview'],
			oauth: ['tokenExchangeOverview', 'introspectionOverview'],
			oidc: ['tokenExchangeOverview', 'introspectionOverview', 'securityOverview'],
			default: ['securityOverview'],
		};

		const normalizedType = flowType.toLowerCase();
		const additionalKeys =
			flowSpecificKeys[normalizedType as keyof typeof flowSpecificKeys] ?? flowSpecificKeys.default;

		return Array.from(new Set([...baseKeys, ...additionalKeys]));
	}

	/**
	 * Initialize a new flow with default configuration
	 */
	static initializeFlow(
		userId: string,
		flowType: string,
		configuration: Partial<FlowState['configuration']> = {}
	): FlowState {
		const flowId = this.generateFlowId();

		const flow: FlowState = {
			flowId,
			userId,
			flowType,
			status: 'not_started',
			steps: [],
			startedAt: new Date(),
			metadata: {
				sessionId: this.generateSessionId(),
			},
			configuration: { ...configuration },
			results: {},
		};

		this.flows.set(flowId, flow);
		this.transitions.set(flowId, []);
		logger.info('FlowStateService', 'Flow initialized', { flowId, flowType });
		return flow;
	}

	static getFlow(flowId: string): FlowState | undefined {
		return this.flows.get(flowId);
	}

	static updateFlow(flowId: string, updates: Partial<FlowState>): FlowState | undefined {
		const existing = this.flows.get(flowId);
		if (!existing) {
			return undefined;
		}

		const updated: FlowState = {
			...existing,
			...updates,
			metadata: {
				...existing.metadata,
				...(updates.metadata ?? {}),
			},
			configuration: {
				...existing.configuration,
				...(updates.configuration ?? {}),
			},
			results: {
				...existing.results,
				...(updates.results ?? {}),
			},
		};

		this.flows.set(flowId, updated);
		return updated;
	}

	static recordTransition(
		flowId: string,
		fromStepId: string,
		toStepId: string,
		reason: string,
		data?: Record<string, any>
	) {
		const transition: FlowTransition = {
			fromStepId,
			toStepId,
			timestamp: new Date(),
			reason,
			data: data ?? {},
		};

		const existing = this.transitions.get(flowId) ?? [];
		existing.push(transition);
		this.transitions.set(flowId, existing);
	}

	private static generateFlowId(): string {
		return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}

	private static generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}
}

export default FlowStateService;