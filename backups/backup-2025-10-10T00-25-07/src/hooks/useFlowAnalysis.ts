import { useCallback, useEffect, useState } from 'react';
import { FlowComparisonResult, FlowRecommendation, flowAnalyzer } from '../utils/flowAnalysis';
import { logger } from '../utils/logger';

// Hook configuration interface
export interface UseFlowAnalysisConfig {
	initialFlows?: string[];
	autoAnalyze?: boolean;
	onAnalysisComplete?: (result: FlowComparisonResult) => void;
}

// Flow analysis state interface
export interface FlowAnalysisState {
	selectedFlows: string[];
	analysisResult: FlowComparisonResult | null;
	isLoading: boolean;
	error: Error | null;
	recommendations: FlowRecommendation[];
}

// useFlowAnalysis hook
export const useFlowAnalysis = (config: UseFlowAnalysisConfig = {}) => {
	const {
		initialFlows = ['authorization-code', 'implicit'],
		autoAnalyze = true,
		onAnalysisComplete,
	} = config;

	const [state, setState] = useState<FlowAnalysisState>({
		selectedFlows: initialFlows,
		analysisResult: null,
		isLoading: false,
		error: null,
		recommendations: [],
	});

	// Analyze selected flows
	const analyzeFlows = useCallback(
		async (flowTypes: string[]) => {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const result = flowAnalyzer.compareFlows(flowTypes);

				setState((prev) => ({
					...prev,
					analysisResult: result,
					isLoading: false,
				}));

				onAnalysisComplete?.(result);
				logger.info('[useFlowAnalysis] Flow analysis completed', { flowTypes, result });
			} catch (error) {
				const err = error as Error;
				setState((prev) => ({
					...prev,
					error: err,
					isLoading: false,
				}));
				logger.error('[useFlowAnalysis] Flow analysis failed:', err);
			}
		},
		[onAnalysisComplete]
	);

	// Get recommendations based on requirements
	const getRecommendations = useCallback(
		async (requirements: {
			securityLevel?: 'low' | 'medium' | 'high' | 'critical';
			complexity?: 'simple' | 'moderate' | 'complex';
			performance?: 'low' | 'medium' | 'high';
			backendAvailable?: boolean;
			userInteraction?: boolean;
			deviceType?: 'web' | 'mobile' | 'desktop' | 'iot' | 'cli';
		}) => {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const recommendations = flowAnalyzer.getRecommendations(requirements);

				setState((prev) => ({
					...prev,
					recommendations,
					isLoading: false,
				}));

				logger.info('[useFlowAnalysis] Recommendations generated', {
					requirements,
					recommendations,
				});
			} catch (error) {
				const err = error as Error;
				setState((prev) => ({
					...prev,
					error: err,
					isLoading: false,
				}));
				logger.error('[useFlowAnalysis] Recommendations generation failed:', err);
			}
		},
		[]
	);

	// Add flow to analysis
	const addFlow = useCallback((flowType: string) => {
		setState((prev) => {
			if (prev.selectedFlows.includes(flowType) || prev.selectedFlows.length >= 4) {
				return prev;
			}

			const newFlows = [...prev.selectedFlows, flowType];
			return { ...prev, selectedFlows: newFlows };
		});
	}, []);

	// Remove flow from analysis
	const removeFlow = useCallback((flowType: string) => {
		setState((prev) => ({
			...prev,
			selectedFlows: prev.selectedFlows.filter((f) => f !== flowType),
		}));
	}, []);

	// Toggle flow in analysis
	const toggleFlow = useCallback((flowType: string) => {
		setState((prev) => {
			if (prev.selectedFlows.includes(flowType)) {
				return {
					...prev,
					selectedFlows: prev.selectedFlows.filter((f) => f !== flowType),
				};
			} else if (prev.selectedFlows.length < 4) {
				return {
					...prev,
					selectedFlows: [...prev.selectedFlows, flowType],
				};
			}
			return prev;
		});
	}, []);

	// Clear all flows
	const clearFlows = useCallback(() => {
		setState((prev) => ({
			...prev,
			selectedFlows: [],
			analysisResult: null,
			recommendations: [],
		}));
	}, []);

	// Reset to default flows
	const resetToDefault = useCallback(() => {
		setState((prev) => ({
			...prev,
			selectedFlows: initialFlows,
			analysisResult: null,
			recommendations: [],
		}));
	}, [initialFlows]);

	// Get flow details
	const getFlowDetails = useCallback((flowType: string) => {
		try {
			return flowAnalyzer.getFlowDetails(flowType);
		} catch (error) {
			logger.error('[useFlowAnalysis] Failed to get flow details:', error);
			return null;
		}
	}, []);

	// Get all available flows
	const getAllFlows = useCallback(() => {
		return flowAnalyzer.getAllFlows();
	}, []);

	// Analyze single flow
	const analyzeSingleFlow = useCallback(async (flowType: string) => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const recommendation = flowAnalyzer.analyzeFlow(flowType);

			setState((prev) => ({
				...prev,
				isLoading: false,
			}));

			logger.info('[useFlowAnalysis] Single flow analysis completed', { flowType, recommendation });
			return recommendation;
		} catch (error) {
			const err = error as Error;
			setState((prev) => ({
				...prev,
				error: err,
				isLoading: false,
			}));
			logger.error('[useFlowAnalysis] Single flow analysis failed:', err);
			throw err;
		}
	}, []);

	// Export analysis results
	const exportAnalysis = useCallback(() => {
		if (!state.analysisResult) {
			throw new Error('No analysis results to export');
		}

		const exportData = {
			timestamp: new Date().toISOString(),
			selectedFlows: state.selectedFlows,
			analysisResult: state.analysisResult,
			recommendations: state.recommendations,
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `oauth-flow-analysis-${Date.now()}.json`;
		link.click();

		URL.revokeObjectURL(url);
		logger.info('[useFlowAnalysis] Analysis results exported');
	}, [state.analysisResult, state.selectedFlows, state.recommendations]);

	// Share analysis results
	const shareAnalysis = useCallback(async () => {
		if (!state.analysisResult) {
			throw new Error('No analysis results to share');
		}

		const shareData = {
			title: 'OAuth Flow Analysis Results',
			text: `Analysis of ${state.selectedFlows.join(', ')} flows`,
			url: window.location.href,
		};

		if (navigator.share) {
			try {
				await navigator.share(shareData);
				logger.info('[useFlowAnalysis] Analysis results shared');
			} catch (error) {
				logger.error('[useFlowAnalysis] Failed to share analysis:', error);
			}
		} else {
			// Fallback to clipboard
			await navigator.clipboard.writeText(shareData.url);
			logger.info('[useFlowAnalysis] Analysis URL copied to clipboard');
		}
	}, [state.analysisResult, state.selectedFlows]);

	// Auto-analyze when flows change
	useEffect(() => {
		if (autoAnalyze && state.selectedFlows.length > 0) {
			analyzeFlows(state.selectedFlows);
		}
	}, [state.selectedFlows, autoAnalyze, analyzeFlows]);

	return {
		// State
		...state,

		// Actions
		analyzeFlows,
		getRecommendations,
		addFlow,
		removeFlow,
		toggleFlow,
		clearFlows,
		resetToDefault,
		getFlowDetails,
		getAllFlows,
		analyzeSingleFlow,
		exportAnalysis,
		shareAnalysis,

		// Utilities
		canAddMoreFlows: state.selectedFlows.length < 4,
		hasAnalysisResults: !!state.analysisResult,
		hasRecommendations: state.recommendations.length > 0,

		// Computed values
		bestFlow: state.analysisResult?.bestOverall || null,
		mostSecureFlow: state.analysisResult?.bestSecurity || null,
		fastestFlow: state.analysisResult?.bestPerformance || null,
		mostUsableFlow: state.analysisResult?.bestUsability || null,
	};
};

// Hook for flow recommendations
export const useFlowRecommendations = (requirements: {
	securityLevel?: 'low' | 'medium' | 'high' | 'critical';
	complexity?: 'simple' | 'moderate' | 'complex';
	performance?: 'low' | 'medium' | 'high';
	backendAvailable?: boolean;
	userInteraction?: boolean;
	deviceType?: 'web' | 'mobile' | 'desktop' | 'iot' | 'cli';
}) => {
	const [recommendations, setRecommendations] = useState<FlowRecommendation[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const generateRecommendations = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const results = flowAnalyzer.getRecommendations(requirements);
			setRecommendations(results);
			logger.info('[useFlowRecommendations] Recommendations generated', { requirements, results });
		} catch (err) {
			const error = err as Error;
			setError(error);
			logger.error('[useFlowRecommendations] Failed to generate recommendations:', error);
		} finally {
			setIsLoading(false);
		}
	}, [requirements]);

	useEffect(() => {
		generateRecommendations();
	}, [generateRecommendations]);

	return {
		recommendations,
		isLoading,
		error,
		regenerate: generateRecommendations,
		hasRecommendations: recommendations.length > 0,
		topRecommendation: recommendations[0] || null,
	};
};

export default useFlowAnalysis;
