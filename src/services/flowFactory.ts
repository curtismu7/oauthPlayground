// src/services/flowFactory.ts
// FlowFactory - Centralized flow creation and management

import React from 'react';
import { FlowAnalyticsService } from './flowAnalyticsService';
import { FlowConfig, FlowConfigService } from './flowConfigService';
import { FlowControllerConfig } from './flowControllerService';
import FlowStateService from './flowStateService';
import { StepConfig } from './flowStepService';

export interface FlowFactoryConfig {
	flowType: string;
	customConfig?: Partial<FlowConfig>;
	enableAnalytics?: boolean;
	enableDebugger?: boolean;
	theme?: string;
}

export interface FlowFactoryResult {
	flowComponent: React.ComponentType;
	flowConfig: FlowConfig;
	flowController: FlowControllerConfig;
	analytics: typeof FlowAnalyticsService;
}

export class FlowFactory {
	private static flowRegistry: Map<string, React.ComponentType> = new Map();

	/**
	 * Create a flow component from flow type
	 */
	static createFlow(config: FlowFactoryConfig): FlowFactoryResult {
		const { flowType, customConfig, enableAnalytics = true, enableDebugger = true, theme } = config;

		// Get or create flow configuration
		const flowConfig = FlowConfigService.getFlowConfig(flowType);
		if (!flowConfig) {
			throw new Error(
				`Flow type '${flowType}' not found. Available flows: ${Array.from(FlowConfigService.getAllFlowConfigs().map((f) => f.flowType)).join(', ')}`
			);
		}

		// Merge custom configuration
		const mergedConfig = { ...flowConfig, ...customConfig };
		if (theme) {
			mergedConfig.flowTheme = theme;
		}
		if (enableDebugger !== undefined) {
			mergedConfig.enableDebugger = enableDebugger;
		}

		// Create flow controller configuration
		const flowController: FlowControllerConfig = {
			flowType: mergedConfig.flowType,
			flowKey: mergedConfig.flowKey,
			defaultFlowVariant: mergedConfig.flowVariant,
			enableDebugger: mergedConfig.enableDebugger,
		};

		// Create flow component
		const flowComponent = FlowFactory.createFlowComponent(
			mergedConfig,
			flowController,
			enableAnalytics
		);

		return {
			flowComponent,
			flowConfig: mergedConfig,
			flowController,
			analytics: FlowAnalyticsService,
		};
	}

	/**
	 * Create a flow component from template
	 */
	static createFlowFromTemplate(template: FlowConfig): FlowFactoryResult {
		return FlowFactory.createFlow({
			flowType: template.flowType,
			customConfig: template,
		});
	}

	/**
	 * Create a custom flow component
	 */
	static createCustomFlow(config: FlowConfig): FlowFactoryResult {
		return FlowFactory.createFlow({
			flowType: config.flowType,
			customConfig: config,
		});
	}

	/**
	 * Register a flow component
	 */
	static registerFlow(flowType: string, component: React.ComponentType): void {
		FlowFactory.flowRegistry.set(flowType, component);
	}

	/**
	 * Get a registered flow component
	 */
	static getFlow(flowType: string): React.ComponentType | undefined {
		return FlowFactory.flowRegistry.get(flowType);
	}

	/**
	 * Get all registered flows
	 */
	static getAllFlows(): Array<{ flowType: string; component: React.ComponentType }> {
		return Array.from(FlowFactory.flowRegistry.entries()).map(([flowType, component]) => ({
			flowType,
			component,
		}));
	}

	/**
	 * Create a flow component
	 */
	private static createFlowComponent(
		flowConfig: FlowConfig,
		_flowController: FlowControllerConfig,
		_enableAnalytics: boolean
	): React.ComponentType {
		return () => {
			// This would be the actual flow component implementation
			// For now, we'll return a placeholder that demonstrates the structure
			return React.createElement('div', {
				'data-flow-type': flowConfig.flowType,
				'data-flow-key': flowConfig.flowKey,
				'data-flow-theme': flowConfig.flowTheme,
				children: `Flow Component: ${flowConfig.flowName}`,
			});
		};
	}

	/**
	 * Create a flow hook for use in React components
	 */
	static createFlowHook(flowType: string, customConfig?: Partial<FlowConfig>) {
		return () => {
			const flowConfig = FlowConfigService.getFlowConfig(flowType);
			if (!flowConfig) {
				throw new Error(`Flow type '${flowType}' not found`);
			}

			const mergedConfig = { ...flowConfig, ...customConfig };
			const stepMetadata = FlowStateService.createStepMetadata(
				mergedConfig.stepConfigs.map((step) => ({
					title: step.title,
					subtitle: step.subtitle,
				}))
			);
			const introSectionKeys = FlowStateService.createIntroSectionKeys(flowType);
			const defaultCollapsedSections =
				FlowStateService.createDefaultCollapsedSections(introSectionKeys);

			return {
				flowConfig: mergedConfig,
				stepMetadata,
				introSectionKeys,
				defaultCollapsedSections,
				analytics: FlowAnalyticsService,
			};
		};
	}

	/**
	 * Create a flow template
	 */
	static createFlowTemplate(flowType: string): FlowConfig {
		const baseConfig = FlowConfigService.getFlowConfig(flowType);
		if (!baseConfig) {
			throw new Error(`Flow type '${flowType}' not found`);
		}

		return { ...baseConfig };
	}

	/**
	 * Validate a flow configuration
	 */
	static validateFlowConfig(config: FlowConfig): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!config.flowType) {
			errors.push('flowType is required');
		}
		if (!config.flowName) {
			errors.push('flowName is required');
		}
		if (!config.flowVersion) {
			errors.push('flowVersion is required');
		}
		if (!config.flowTheme) {
			errors.push('flowTheme is required');
		}
		if (!config.flowKey) {
			errors.push('flowKey is required');
		}
		if (!config.flowVariant) {
			errors.push('flowVariant is required');
		}
		if (!config.stepConfigs || config.stepConfigs.length === 0) {
			errors.push('stepConfigs is required and must not be empty');
		}
		if (!config.introSectionKeys || config.introSectionKeys.length === 0) {
			errors.push('introSectionKeys is required and must not be empty');
		}
		if (!config.validationRules) {
			errors.push('validationRules is required');
		}
		if (!config.requirements) {
			errors.push('requirements is required');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get flow statistics
	 */
	static getFlowStatistics(): {
		totalFlows: number;
		flowsByCategory: Record<string, number>;
		flowsByVariant: Record<string, number>;
		flowsByTheme: Record<string, number>;
	} {
		const flows = FlowConfigService.getAllFlowConfigs();

		const flowsByCategory = flows.reduce(
			(acc, flow) => {
				acc[flow.category] = (acc[flow.category] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const flowsByVariant = flows.reduce(
			(acc, flow) => {
				acc[flow.flowVariant] = (acc[flow.flowVariant] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const flowsByTheme = flows.reduce(
			(acc, flow) => {
				acc[flow.flowTheme] = (acc[flow.flowTheme] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		return {
			totalFlows: flows.length,
			flowsByCategory,
			flowsByVariant,
			flowsByTheme,
		};
	}

	/**
	 * Get available flow types
	 */
	static getAvailableFlowTypes(): string[] {
		return FlowConfigService.getAllFlowConfigs().map((flow) => flow.flowType);
	}

	/**
	 * Get flows by category
	 */
	static getFlowsByCategory(category: string): FlowConfig[] {
		return FlowConfigService.getFlowsByCategory(category);
	}

	/**
	 * Get flows by variant
	 */
	static getFlowsByVariant(variant: 'oauth' | 'oidc' | 'pingone'): FlowConfig[] {
		return FlowConfigService.getFlowsByVariant(variant);
	}

	/**
	 * Create a flow builder for custom flows
	 */
	static createFlowBuilder(): FlowBuilder {
		return new FlowBuilder();
	}
}

/**
 * FlowBuilder - Builder pattern for creating custom flows
 */
export class FlowBuilder {
	private config: Partial<FlowConfig> = {};

	/**
	 * Set flow type
	 */
	setFlowType(flowType: string): this {
		this.config.flowType = flowType;
		return this;
	}

	/**
	 * Set flow name
	 */
	setFlowName(flowName: string): this {
		this.config.flowName = flowName;
		return this;
	}

	/**
	 * Set flow version
	 */
	setFlowVersion(flowVersion: string): this {
		this.config.flowVersion = flowVersion;
		return this;
	}

	/**
	 * Set flow theme
	 */
	setFlowTheme(flowTheme: string): this {
		this.config.flowTheme = flowTheme;
		return this;
	}

	/**
	 * Set flow key
	 */
	setFlowKey(flowKey: string): this {
		this.config.flowKey = flowKey;
		return this;
	}

	/**
	 * Set flow variant
	 */
	setFlowVariant(flowVariant: 'oauth' | 'oidc' | 'pingone'): this {
		this.config.flowVariant = flowVariant;
		return this;
	}

	/**
	 * Set category
	 */
	setCategory(category: 'standard' | 'experimental' | 'deprecated' | 'pingone'): this {
		this.config.category = category;
		return this;
	}

	/**
	 * Add step configuration
	 */
	addStep(step: StepConfig): this {
		if (!this.config.stepConfigs) {
			this.config.stepConfigs = [];
		}
		this.config.stepConfigs.push(step);
		return this;
	}

	/**
	 * Add intro section key
	 */
	addIntroSectionKey(key: string): this {
		if (!this.config.introSectionKeys) {
			this.config.introSectionKeys = [];
		}
		this.config.introSectionKeys.push(key);
		return this;
	}

	/**
	 * Set requirements
	 */
	setRequirements(requirements: FlowConfig['requirements']): this {
		this.config.requirements = requirements;
		return this;
	}

	/**
	 * Set enable debugger
	 */
	setEnableDebugger(enableDebugger: boolean): this {
		this.config.enableDebugger = enableDebugger;
		return this;
	}

	/**
	 * Build the flow configuration
	 */
	build(): FlowConfig {
		if (!this.config.flowType) {
			throw new Error('flowType is required');
		}

		// Set defaults
		const config: FlowConfig = {
			flowType: this.config.flowType,
			flowName: this.config.flowName || `Custom Flow: ${this.config.flowType}`,
			flowVersion: this.config.flowVersion || 'V5',
			flowTheme: this.config.flowTheme || 'blue',
			flowKey: this.config.flowKey || `${this.config.flowType}-v5`,
			flowVariant: this.config.flowVariant || 'oauth',
			category: this.config.category || 'experimental',
			stepConfigs: this.config.stepConfigs || [],
			introSectionKeys: this.config.introSectionKeys || [],
			validationRules: this.config.validationRules || [],
			requirements: this.config.requirements || FlowConfigService.createFlowRequirements(),
			enableDebugger: this.config.enableDebugger ?? true,
		};

		return config;
	}

	/**
	 * Create flow from builder
	 */
	createFlow(): FlowFactoryResult {
		const config = this.build();
		return FlowFactory.createFlow({
			flowType: config.flowType,
			customConfig: config,
		});
	}
}

export default FlowFactory;
