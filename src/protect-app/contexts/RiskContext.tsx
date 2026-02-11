import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Risk Evaluation Types
export interface RiskScore {
	value: number; // 0-100
	level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
	confidence: number; // 0-100
	factors: RiskFactor[];
	timestamp: Date;
}

export interface RiskFactor {
	id: string;
	name: string;
	description: string;
	weight: number;
	value: number;
	impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
	category: 'BEHAVIORAL' | 'CONTEXTUAL' | 'HISTORICAL' | 'ENVIRONMENTAL';
	enabled: boolean;
}

export interface RiskEvaluation {
	id: string;
	userId: string;
	sessionId: string;
	score: RiskScore;
	signals: RiskSignal[];
	recommendations: Recommendation[];
	evaluationContext: EvaluationContext;
	createdAt: Date;
	updatedAt: Date;
}

export interface RiskSignal {
	id: string;
	type: string;
	name: string;
	description: string;
	value: number | string | boolean;
	severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
	timestamp: Date;
	source: string;
	metadata: Record<string, unknown>;
}

export interface Recommendation {
	id: string;
	type: 'ALLOW' | 'CHALLENGE' | 'BLOCK' | 'MONITOR';
	priority: 'LOW' | 'MEDIUM' | 'HIGH';
	title: string;
	description: string;
	actions: string[];
	automated: boolean;
	enabled: boolean;
}

export interface EvaluationContext {
	ipAddress: string;
	userAgent: string;
	location: {
		country: string;
		city: string;
		coordinates?: {
			latitude: number;
			longitude: number;
		};
	};
	device: {
		type: string;
		os: string;
		browser: string;
		fingerprint: string;
	};
	session: {
		duration: number;
		pageViews: number;
		authenticationMethod: string;
	};
}

export interface RiskState {
	evaluations: RiskEvaluation[];
	currentEvaluation: RiskEvaluation | null;
	isLoading: boolean;
	error: string | null;
	realTimeMonitoring: boolean;
	monitoringSettings: {
		enabled: boolean;
		interval: number; // milliseconds
		thresholds: {
			low: number;
			medium: number;
			high: number;
			critical: number;
		};
	};
	analytics: {
		totalEvaluations: number;
		averageRiskScore: number;
		riskDistribution: Record<string, number>;
		trends: RiskTrend[];
	};
}

export interface RiskTrend {
	date: string;
	averageScore: number;
	evaluationCount: number;
	distribution: Record<string, number>;
}

export interface RiskContextType {
	state: RiskState;
	dispatch: React.Dispatch<RiskAction>;
	// Methods
	evaluateRisk: (userId: string, context: EvaluationContext) => Promise<RiskEvaluation>;
	getCurrentEvaluation: () => RiskEvaluation | null;
	getEvaluationHistory: (userId: string, limit?: number) => Promise<RiskEvaluation[]>;
	updateMonitoringSettings: (settings: Partial<RiskState['monitoringSettings']>) => void;
	toggleRealTimeMonitoring: () => void;
	exportEvaluationData: (format: 'json' | 'csv' | 'pdf') => Promise<Blob>;
	getRiskInsights: () => RiskInsights;
}

export interface RiskInsights {
	topRiskFactors: Array<{
		factor: RiskFactor;
		frequency: number;
		averageImpact: number;
	}>;
	riskTrends: RiskTrend[];
	anomalousPatterns: Array<{
		description: string;
		severity: 'LOW' | 'MEDIUM' | 'HIGH';
		detectedAt: Date;
		affectedUsers: number;
	}>;
	recommendations: Recommendation[];
}

// Action Types
export type RiskAction =
	| { type: 'EVALUATE_RISK_START' }
	| { type: 'EVALUATE_RISK_SUCCESS'; payload: RiskEvaluation }
	| { type: 'EVALUATE_RISK_FAILURE'; payload: string }
	| { type: 'SET_CURRENT_EVALUATION'; payload: RiskEvaluation | null }
	| { type: 'ADD_EVALUATION'; payload: RiskEvaluation }
	| { type: 'UPDATE_EVALUATION'; payload: { id: string; updates: Partial<RiskEvaluation> } }
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'UPDATE_MONITORING_SETTINGS'; payload: Partial<RiskState['monitoringSettings']> }
	| { type: 'TOGGLE_REAL_TIME_MONITORING' }
	| { type: 'UPDATE_ANALYTICS'; payload: Partial<RiskState['analytics']> };

// Initial State
const initialState: RiskState = {
	evaluations: [],
	currentEvaluation: null,
	isLoading: false,
	error: null,
	realTimeMonitoring: true,
	monitoringSettings: {
		enabled: true,
		interval: 30000, // 30 seconds
		thresholds: {
			low: 30,
			medium: 60,
			high: 80,
			critical: 90,
		},
	},
	analytics: {
		totalEvaluations: 0,
		averageRiskScore: 0,
		riskDistribution: {
			LOW: 0,
			MEDIUM: 0,
			HIGH: 0,
			CRITICAL: 0,
		},
		trends: [],
	},
};

// Risk Evaluation Service (Mock - replace with actual PingOne Protect API)
class RiskEvaluationService {
	static async evaluateRisk(userId: string, context: EvaluationContext): Promise<RiskEvaluation> {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1500));

		// Generate mock risk evaluation
		const randomScore = Math.floor(Math.random() * 100);
		const level = this.getRiskLevel(randomScore);

		const evaluation: RiskEvaluation = {
			id: `eval_${Date.now()}`,
			userId,
			sessionId: `session_${Date.now()}`,
			score: {
				value: randomScore,
				level,
				confidence: 85 + Math.floor(Math.random() * 15),
				factors: this.generateRiskFactors(),
				timestamp: new Date(),
			},
			signals: this.generateRiskSignals(context),
			recommendations: this.generateRecommendations(level),
			evaluationContext: context,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		return evaluation;
	}

	private static getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
		if (score < 30) return 'LOW';
		if (score < 60) return 'MEDIUM';
		if (score < 80) return 'HIGH';
		return 'CRITICAL';
	}

	private static generateRiskFactors(): RiskFactor[] {
		return [
			{
				id: 'new_device',
				name: 'New Device',
				description: 'Login from a previously unseen device',
				weight: 0.3,
				value: Math.random() * 100,
				impact: 'NEGATIVE',
				category: 'BEHAVIORAL',
				enabled: true,
			},
			{
				id: 'unusual_location',
				name: 'Unusual Location',
				description: 'Login from an atypical geographic location',
				weight: 0.25,
				value: Math.random() * 100,
				impact: 'NEGATIVE',
				category: 'CONTEXTUAL',
				enabled: true,
			},
			{
				id: 'time_of_day',
				name: 'Time of Day',
				description: 'Login outside normal business hours',
				weight: 0.2,
				value: Math.random() * 100,
				impact: 'NEGATIVE',
				category: 'BEHAVIORAL',
				enabled: true,
			},
			{
				id: 'successful_history',
				name: 'Historical Success',
				description: 'User has successful authentication history',
				weight: 0.25,
				value: Math.random() * 100,
				impact: 'POSITIVE',
				category: 'HISTORICAL',
				enabled: true,
			},
		];
	}

	private static generateRiskSignals(context: EvaluationContext): RiskSignal[] {
		return [
			{
				id: 'ip_reputation',
				type: 'IP_REPUTATION',
				name: 'IP Reputation',
				description: 'Reputation score of the source IP address',
				value: 0.8,
				severity: 'LOW',
				timestamp: new Date(),
				source: 'ip_intelligence_service',
				metadata: { country: context.location.country },
			},
			{
				id: 'device_fingerprint',
				type: 'DEVICE_FINGERPRINT',
				name: 'Device Fingerprint',
				description: 'Unique device identifier consistency',
				value: 'consistent',
				severity: 'LOW',
				timestamp: new Date(),
				source: 'device_analysis',
				metadata: { fingerprint: context.device.fingerprint },
			},
		];
	}

	private static generateRecommendations(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Recommendation[] {
		const baseRecommendations: Recommendation[] = [
			{
				id: 'monitor_session',
				type: 'MONITOR',
				priority: 'LOW',
				title: 'Monitor Session Activity',
				description: 'Continue monitoring the user session for anomalous behavior',
				actions: ['Enable real-time monitoring', 'Log all user actions'],
				automated: true,
				enabled: true,
			},
		];

		if (level === 'MEDIUM' || level === 'HIGH') {
			baseRecommendations.push({
				id: 'additional_verification',
				type: 'CHALLENGE',
				priority: 'MEDIUM',
				title: 'Additional Verification Required',
				description: 'Require additional authentication factors',
				actions: ['Request MFA', 'Verify email/phone'],
				automated: true,
				enabled: true,
			});
		}

		if (level === 'HIGH' || level === 'CRITICAL') {
			baseRecommendations.push({
				id: 'temporary_restriction',
				type: 'CHALLENGE',
				priority: 'HIGH',
				title: 'Temporary Access Restriction',
				description: 'Limit user access until verification is complete',
				actions: ['Restrict sensitive operations', 'Require admin approval'],
				automated: false,
				enabled: true,
			});
		}

		if (level === 'CRITICAL') {
			baseRecommendations.push({
				id: 'block_access',
				type: 'BLOCK',
				priority: 'HIGH',
				title: 'Block Access',
				description: 'Block user access and require manual review',
				actions: ['Terminate session', 'Flag for security review', 'Notify administrator'],
				automated: true,
				enabled: true,
			});
		}

		return baseRecommendations;
	}

	static async getEvaluationHistory(userId: string, limit: number = 50): Promise<RiskEvaluation[]> {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 500));

		// Generate mock history
		const history: RiskEvaluation[] = [];
		for (let i = 0; i < Math.min(limit, 20); i++) {
			const timestamp = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)); // Last 20 days
			const score = Math.floor(Math.random() * 100);
			
			history.push({
				id: `eval_${timestamp.getTime()}`,
				userId,
				sessionId: `session_${timestamp.getTime()}`,
				score: {
					value: score,
					level: this.getRiskLevel(score),
					confidence: 85 + Math.floor(Math.random() * 15),
					factors: this.generateRiskFactors(),
					timestamp,
				},
				signals: this.generateRiskSignals({} as EvaluationContext),
				recommendations: this.generateRecommendations(this.getRiskLevel(score)),
				evaluationContext: {} as EvaluationContext,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		}

		return history;
	}
}

// Reducer
const riskReducer = (state: RiskState, action: RiskAction): RiskState => {
	switch (action.type) {
		case 'EVALUATE_RISK_START':
			return {
				...state,
				isLoading: true,
				error: null,
			};

		case 'EVALUATE_RISK_SUCCESS':
			return {
				...state,
				evaluations: [action.payload, ...state.evaluations].slice(0, 100), // Keep last 100
				currentEvaluation: action.payload,
				isLoading: false,
				error: null,
			};

		case 'EVALUATE_RISK_FAILURE':
			return {
				...state,
				isLoading: false,
				error: action.payload,
			};

		case 'SET_CURRENT_EVALUATION':
			return {
				...state,
				currentEvaluation: action.payload,
			};

		case 'ADD_EVALUATION':
			return {
				...state,
				evaluations: [action.payload, ...state.evaluations].slice(0, 100),
			};

		case 'UPDATE_EVALUATION':
			return {
				...state,
				evaluations: state.evaluations.map(eval =>
					eval.id === action.payload.id
						? { ...eval, ...action.payload.updates, updatedAt: new Date() }
						: eval
				),
				currentEvaluation:
					state.currentEvaluation?.id === action.payload.id
						? { ...state.currentEvaluation, ...action.payload.updates, updatedAt: new Date() }
						: state.currentEvaluation,
			};

		case 'SET_LOADING':
			return {
				...state,
				isLoading: action.payload,
			};

		case 'SET_ERROR':
			return {
				...state,
				error: action.payload,
			};

		case 'UPDATE_MONITORING_SETTINGS':
			return {
				...state,
				monitoringSettings: {
					...state.monitoringSettings,
					...action.payload,
				},
			};

		case 'TOGGLE_REAL_TIME_MONITORING':
			return {
				...state,
				realTimeMonitoring: !state.realTimeMonitoring,
			};

		case 'UPDATE_ANALYTICS':
			return {
				...state,
				analytics: {
					...state.analytics,
					...action.payload,
				},
			};

		default:
			return state;
	}
};

// Context
const RiskContext = createContext<RiskContextType | undefined>(undefined);

// Provider Component
export const RiskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(riskReducer, initialState);

	// Methods
	const evaluateRisk = async (userId: string, context: EvaluationContext): Promise<RiskEvaluation> => {
		dispatch({ type: 'EVALUATE_RISK_START' });

		try {
			const evaluation = await RiskEvaluationService.evaluateRisk(userId, context);
			dispatch({ type: 'EVALUATE_RISK_SUCCESS', payload: evaluation });
			return evaluation;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Risk evaluation failed';
			dispatch({ type: 'EVALUATE_RISK_FAILURE', payload: errorMessage });
			throw error;
		}
	};

	const getCurrentEvaluation = (): RiskEvaluation | null => {
		return state.currentEvaluation;
	};

	const getEvaluationHistory = async (userId: string, limit?: number): Promise<RiskEvaluation[]> => {
		try {
			const history = await RiskEvaluationService.getEvaluationHistory(userId, limit);
			return history;
		} catch (error) {
			console.error('Failed to fetch evaluation history:', error);
			return [];
		}
	};

	const updateMonitoringSettings = (settings: Partial<RiskState['monitoringSettings']>) => {
		dispatch({ type: 'UPDATE_MONITORING_SETTINGS', payload: settings });
	};

	const toggleRealTimeMonitoring = () => {
		dispatch({ type: 'TOGGLE_REAL_TIME_MONITORING' });
	};

	const exportEvaluationData = async (format: 'json' | 'csv' | 'pdf'): Promise<Blob> => {
		// Mock export functionality
		const data = JSON.stringify(state.evaluations, null, 2);
		return new Blob([data], { type: 'application/json' });
	};

	const getRiskInsights = (): RiskInsights => {
		// Generate insights from evaluations
		const factorFrequency = new Map<string, { count: number; totalImpact: number }>();
		
		state.evaluations.forEach(eval => {
			eval.score.factors.forEach(factor => {
				const existing = factorFrequency.get(factor.id) || { count: 0, totalImpact: 0 };
				factorFrequency.set(factor.id, {
					count: existing.count + 1,
					totalImpact: existing.totalImpact + factor.value,
				});
			});
		});

		const topRiskFactors = Array.from(factorFrequency.entries())
			.map(([factorId, data]) => {
				const factor = state.evaluations[0]?.score.factors.find(f => f.id === factorId);
				return factor ? {
					factor,
					frequency: data.count,
					averageImpact: data.totalImpact / data.count,
				} : null;
			})
			.filter(Boolean)
			.sort((a, b) => b!.frequency - a!.frequency)
			.slice(0, 5) as Array<{
				factor: RiskFactor;
				frequency: number;
				averageImpact: number;
			}>;

		return {
			topRiskFactors,
			riskTrends: state.analytics.trends,
			anomalousPatterns: [],
			recommendations: state.evaluations[0]?.recommendations || [],
		};
	};

	const value: RiskContextType = {
		state,
		dispatch,
		evaluateRisk,
		getCurrentEvaluation,
		getEvaluationHistory,
		updateMonitoringSettings,
		toggleRealTimeMonitoring,
		exportEvaluationData,
		getRiskInsights,
	};

	return <RiskContext.Provider value={value}>{children}</RiskContext.Provider>;
};

// Hook
export const useRisk = (): RiskContextType => {
	const context = useContext(RiskContext);
	if (context === undefined) {
		throw new Error('useRisk must be used within a RiskProvider');
	}
	return context;
};
