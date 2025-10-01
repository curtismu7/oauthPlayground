import { logger } from './logger';

// Flow analysis types
export interface FlowMetrics {
	security: number;
	complexity: number;
	performance: number;
	usability: number;
	scalability: number;
	maintainability: number;
}

export interface FlowRecommendation {
	flowType: string;
	score: number;
	reasons: string[];
	useCases: string[];
	warnings: string[];
}

export interface FlowComparisonResult {
	flows: Array<{
		type: string;
		name: string;
		metrics: FlowMetrics;
		recommendation: FlowRecommendation;
	}>;
	bestOverall: string;
	bestSecurity: string;
	bestPerformance: string;
	bestUsability: string;
	summary: string;
}

// Flow analysis data
const flowAnalysisData = {
	'authorization-code': {
		name: 'Authorization Code',
		metrics: {
			security: 9,
			complexity: 7,
			performance: 8,
			usability: 6,
			scalability: 9,
			maintainability: 8,
		},
		features: {
			pkce: true,
			refreshTokens: true,
			stateParameter: true,
			nonce: true,
			backendRequired: true,
			userInteraction: true,
		},
		useCases: ['Web Applications', 'Mobile Apps', 'SPAs with Backend'],
		pros: ['Most Secure', 'Refresh Token Support', 'PKCE Compatible', 'Industry Standard'],
		cons: ['Requires Backend', 'Multiple Requests', 'Complex Implementation', 'Redirect Required'],
	},
	implicit: {
		name: 'Implicit Grant',
		metrics: {
			security: 4,
			complexity: 3,
			performance: 9,
			usability: 9,
			scalability: 5,
			maintainability: 6,
		},
		features: {
			pkce: false,
			refreshTokens: false,
			stateParameter: true,
			nonce: false,
			backendRequired: false,
			userInteraction: true,
		},
		useCases: ['Legacy SPAs', 'Simple Applications', 'Prototyping'],
		pros: ['Simple', 'No Backend', 'Fast', 'Direct Token'],
		cons: ['Less Secure', 'No Refresh Tokens', 'Deprecated', 'Token Exposure'],
	},
	'client-credentials': {
		name: 'Client Credentials',
		metrics: {
			security: 8,
			complexity: 4,
			performance: 9,
			usability: 8,
			scalability: 9,
			maintainability: 9,
		},
		features: {
			pkce: false,
			refreshTokens: false,
			stateParameter: false,
			nonce: false,
			backendRequired: true,
			userInteraction: false,
		},
		useCases: ['API Services', 'Microservices', 'Background Jobs', 'Service Accounts'],
		pros: ['No User Required', 'Simple', 'Fast', 'Service Authentication'],
		cons: ['No User Context', 'Limited Scopes', 'Service Only', 'No User Data'],
	},
	'device-code': {
		name: 'Device Code',
		metrics: {
			security: 7,
			complexity: 6,
			performance: 5,
			usability: 7,
			scalability: 7,
			maintainability: 6,
		},
		features: {
			pkce: false,
			refreshTokens: true,
			stateParameter: false,
			nonce: false,
			backendRequired: true,
			userInteraction: true,
		},
		useCases: ['Smart TVs', 'IoT Devices', 'CLI Tools', 'Limited Input Devices'],
		pros: ['Device Friendly', 'Secure', 'User Control', 'No Input Required'],
		cons: ['Polling Required', 'Complex UX', 'Timeout Issues', 'Slow Process'],
	},
	password: {
		name: 'Password Grant',
		metrics: {
			security: 3,
			complexity: 2,
			performance: 9,
			usability: 9,
			scalability: 4,
			maintainability: 5,
		},
		features: {
			pkce: false,
			refreshTokens: true,
			stateParameter: false,
			nonce: false,
			backendRequired: true,
			userInteraction: true,
		},
		useCases: ['Legacy Systems', 'Internal Tools', 'Testing', 'Migration'],
		pros: ['Very Simple', 'No Redirects', 'Direct', 'Fast'],
		cons: ['Least Secure', 'Password Exposure', 'Not Recommended', 'Deprecated'],
	},
};

// Flow analysis utility class
export class FlowAnalyzer {
	private static instance: FlowAnalyzer;

	private constructor() {}

	public static getInstance(): FlowAnalyzer {
		if (!FlowAnalyzer.instance) {
			FlowAnalyzer.instance = new FlowAnalyzer();
		}
		return FlowAnalyzer.instance;
	}

	// Analyze a single flow
	public analyzeFlow(flowType: string): FlowRecommendation {
		const flowData = flowAnalysisData[flowType as keyof typeof flowAnalysisData];

		if (!flowData) {
			logger.error(`Unknown flow type: ${flowType}`);
			throw new Error(`Unknown flow type: ${flowType}`);
		}

		const metrics = flowData.metrics;
		const score = this.calculateOverallScore(metrics);

		const reasons = this.generateReasons(flowType, metrics, flowData);
		const warnings = this.generateWarnings(flowType, flowData);

		return {
			flowType,
			score,
			reasons,
			useCases: flowData.useCases,
			warnings,
		};
	}

	// Compare multiple flows
	public compareFlows(flowTypes: string[]): FlowComparisonResult {
		const flows = flowTypes.map((flowType) => {
			const flowData = flowAnalysisData[flowType as keyof typeof flowAnalysisData];
			const recommendation = this.analyzeFlow(flowType);

			return {
				type: flowType,
				name: flowData.name,
				metrics: flowData.metrics,
				recommendation,
			};
		});

		const bestOverall = this.findBestFlow(flows, 'overall');
		const bestSecurity = this.findBestFlow(flows, 'security');
		const bestPerformance = this.findBestFlow(flows, 'performance');
		const bestUsability = this.findBestFlow(flows, 'usability');

		const summary = this.generateComparisonSummary(flows, {
			bestOverall,
			bestSecurity,
			bestPerformance,
			bestUsability,
		});

		return {
			flows,
			bestOverall,
			bestSecurity,
			bestPerformance,
			bestUsability,
			summary,
		};
	}

	// Get flow recommendations based on requirements
	public getRecommendations(requirements: {
		securityLevel?: 'low' | 'medium' | 'high' | 'critical';
		complexity?: 'simple' | 'moderate' | 'complex';
		performance?: 'low' | 'medium' | 'high';
		backendAvailable?: boolean;
		userInteraction?: boolean;
		deviceType?: 'web' | 'mobile' | 'desktop' | 'iot' | 'cli';
	}): FlowRecommendation[] {
		const allFlows = Object.keys(flowAnalysisData);
		const recommendations: FlowRecommendation[] = [];

		for (const flowType of allFlows) {
			const _flowData = flowAnalysisData[flowType as keyof typeof flowAnalysisData];
			const recommendation = this.analyzeFlow(flowType);

			if (this.matchesRequirements(flowType, requirements)) {
				recommendations.push(recommendation);
			}
		}

		return recommendations.sort((a, b) => b.score - a.score);
	}

	// Calculate overall score for a flow
	private calculateOverallScore(metrics: FlowMetrics): number {
		const weights = {
			security: 0.3,
			complexity: 0.15,
			performance: 0.2,
			usability: 0.15,
			scalability: 0.1,
			maintainability: 0.1,
		};

		return Math.round(
			metrics.security * weights.security +
				(10 - metrics.complexity) * weights.complexity +
				metrics.performance * weights.performance +
				metrics.usability * weights.usability +
				metrics.scalability * weights.scalability +
				metrics.maintainability * weights.maintainability
		);
	}

	// Generate reasons for recommendation
	private generateReasons(_flowType: string, metrics: FlowMetrics, flowData: any): string[] {
		const reasons: string[] = [];

		if (metrics.security >= 8) {
			reasons.push('High security rating');
		}
		if (metrics.performance >= 8) {
			reasons.push('Excellent performance');
		}
		if (metrics.usability >= 8) {
			reasons.push('User-friendly implementation');
		}
		if (flowData.features.pkce) {
			reasons.push('PKCE support for enhanced security');
		}
		if (flowData.features.refreshTokens) {
			reasons.push('Refresh token support');
		}
		if (metrics.scalability >= 8) {
			reasons.push('Highly scalable');
		}

		return reasons;
	}

	// Generate warnings for a flow
	private generateWarnings(flowType: string, flowData: any): string[] {
		const warnings: string[] = [];

		if (flowType === 'implicit') {
			warnings.push('Deprecated by OAuth 2.1 - consider Authorization Code with PKCE');
		}
		if (flowType === 'password') {
			warnings.push('Not recommended for production - security risks');
		}
		if (flowData.metrics.security < 6) {
			warnings.push('Low security rating - consider alternatives');
		}
		if (flowData.metrics.complexity > 7) {
			warnings.push('High complexity - may require expert implementation');
		}
		if (!flowData.features.refreshTokens) {
			warnings.push('No refresh token support - limited session management');
		}

		return warnings;
	}

	// Find best flow for a specific metric
	private findBestFlow(flows: any[], metric: string): string {
		if (flows.length === 0) return '';

		return flows.reduce((best, current) => {
			if (metric === 'overall') {
				return current.recommendation.score > best.recommendation.score ? current : best;
			}
			return current.metrics[metric] > best.metrics[metric] ? current : best;
		}).type;
	}

	// Generate comparison summary
	private generateComparisonSummary(flows: any[], bestFlows: any): string {
		const totalFlows = flows.length;
		const bestOverallFlow = flows.find((f) => f.type === bestFlows.bestOverall);

		let summary = `Analyzed ${totalFlows} OAuth flows. `;
		summary += `Overall best: ${bestOverallFlow?.name} (${bestOverallFlow?.recommendation.score}/10). `;

		if (bestFlows.bestSecurity !== bestFlows.bestOverall) {
			const bestSecurityFlow = flows.find((f) => f.type === bestFlows.bestSecurity);
			summary += `Most secure: ${bestSecurityFlow?.name}. `;
		}

		if (bestFlows.bestPerformance !== bestFlows.bestOverall) {
			const bestPerformanceFlow = flows.find((f) => f.type === bestFlows.bestPerformance);
			summary += `Best performance: ${bestPerformanceFlow?.name}. `;
		}

		return summary.trim();
	}

	// Check if flow matches requirements
	private matchesRequirements(flowType: string, requirements: any): boolean {
		const flowData = flowAnalysisData[flowType as keyof typeof flowAnalysisData];

		if (requirements.securityLevel) {
			const securityThresholds = { low: 4, medium: 6, high: 8, critical: 9 };
			if (flowData.metrics.security < securityThresholds[requirements.securityLevel]) {
				return false;
			}
		}

		if (requirements.complexity) {
			const complexityThresholds = { simple: 3, moderate: 6, complex: 8 };
			if (flowData.metrics.complexity > complexityThresholds[requirements.complexity]) {
				return false;
			}
		}

		if (requirements.performance) {
			const performanceThresholds = { low: 4, medium: 6, high: 8 };
			if (flowData.metrics.performance < performanceThresholds[requirements.performance]) {
				return false;
			}
		}

		if (requirements.backendAvailable !== undefined) {
			if (flowData.features.backendRequired && !requirements.backendAvailable) {
				return false;
			}
		}

		if (requirements.userInteraction !== undefined) {
			if (flowData.features.userInteraction !== requirements.userInteraction) {
				return false;
			}
		}

		if (requirements.deviceType) {
			const deviceCompatibility = {
				web: ['authorization-code', 'implicit'],
				mobile: ['authorization-code', 'implicit'],
				desktop: ['authorization-code', 'implicit', 'client-credentials'],
				iot: ['device-code', 'client-credentials'],
				cli: ['device-code', 'client-credentials', 'password'],
			};

			if (!deviceCompatibility[requirements.deviceType]?.includes(flowType)) {
				return false;
			}
		}

		return true;
	}

	// Get all available flows
	public getAllFlows(): string[] {
		return Object.keys(flowAnalysisData);
	}

	// Get flow details
	public getFlowDetails(flowType: string): any {
		return flowAnalysisData[flowType as keyof typeof flowAnalysisData];
	}
}

// Export singleton instance
export const flowAnalyzer = FlowAnalyzer.getInstance();

// Utility functions
export const analyzeFlow = (flowType: string): FlowRecommendation => {
	return flowAnalyzer.analyzeFlow(flowType);
};

export const compareFlows = (flowTypes: string[]): FlowComparisonResult => {
	return flowAnalyzer.compareFlows(flowTypes);
};

export const getFlowRecommendations = (requirements: any): FlowRecommendation[] => {
	return flowAnalyzer.getRecommendations(requirements);
};

export const getAllFlows = (): string[] => {
	return flowAnalyzer.getAllFlows();
};

export const getFlowDetails = (flowType: string): any => {
	return flowAnalyzer.getFlowDetails(flowType);
};

export default flowAnalyzer;
