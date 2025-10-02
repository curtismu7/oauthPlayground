// src/hooks/useFlowInfo.ts - Hook for accessing flow information in V5 flows

import { useMemo } from 'react';
import { FlowInfoService, DetailedFlowInfo, FlowInfoCardData } from '../services/FlowInfoService';
import { FlowInfoGenerator, FlowInfoTemplate } from '../utils/FlowInfoGenerator';

export interface UseFlowInfoOptions {
	showAdditionalInfo?: boolean;
	showDocumentation?: boolean;
	showCommonIssues?: boolean;
	showImplementationNotes?: boolean;
}

export interface UseFlowInfoReturn {
	flowInfo: DetailedFlowInfo | null;
	flowInfoCard: FlowInfoCardData | null;
	isLoading: boolean;
	error: string | null;
	relatedFlows: string[];
	commonIssues: Array<{ issue: string; solution: string }>;
	implementationNotes: string[];
	documentationLinks: Array<{ title: string; url: string }>;
}

/**
 * Hook to access flow information for V5 flows
 */
export const useFlowInfo = (
	flowType: string,
	options: UseFlowInfoOptions = {}
): UseFlowInfoReturn => {
	const {
		showAdditionalInfo = true,
		showDocumentation = true,
		showCommonIssues = false,
		showImplementationNotes = false,
	} = options;

	return useMemo(() => {
		try {
			const flowInfo = FlowInfoService.getFlowInfo(flowType);
			const flowInfoCard = FlowInfoService.generateFlowInfoCard(flowType);
			const relatedFlows = FlowInfoService.getRelatedFlows(flowType);
			const commonIssues = FlowInfoService.getCommonIssues(flowType);
			const implementationNotes = FlowInfoService.getImplementationNotes(flowType);
			const documentationLinks = FlowInfoService.getDocumentationLinks(flowType);

			return {
				flowInfo,
				flowInfoCard,
				isLoading: false,
				error: null,
				relatedFlows,
				commonIssues,
				implementationNotes,
				documentationLinks,
			};
		} catch (error) {
			return {
				flowInfo: null,
				flowInfoCard: null,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				relatedFlows: [],
				commonIssues: [],
				implementationNotes: [],
				documentationLinks: [],
			};
		}
	}, [flowType, showAdditionalInfo, showDocumentation, showCommonIssues, showImplementationNotes]);
};

/**
 * Hook to create custom flow information
 */
export const useCustomFlowInfo = (
	template: FlowInfoTemplate,
	options: UseFlowInfoOptions = {}
): UseFlowInfoReturn => {
	const {
		showAdditionalInfo = true,
		showDocumentation = true,
		showCommonIssues = false,
		showImplementationNotes = false,
	} = options;

	return useMemo(() => {
		try {
			const flowInfo = FlowInfoGenerator.generateFromTemplate(template);
			const flowInfoCard = FlowInfoGenerator.generateCardData(flowInfo);

			return {
				flowInfo,
				flowInfoCard,
				isLoading: false,
				error: null,
				relatedFlows: flowInfo.relatedFlows,
				commonIssues: flowInfo.commonIssues,
				implementationNotes: flowInfo.implementationNotes,
				documentationLinks: flowInfo.documentationLinks,
			};
		} catch (error) {
			return {
				flowInfo: null,
				flowInfoCard: null,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				relatedFlows: [],
				commonIssues: [],
				implementationNotes: [],
				documentationLinks: [],
			};
		}
	}, [template, showAdditionalInfo, showDocumentation, showCommonIssues, showImplementationNotes]);
};

/**
 * Hook to search flows by criteria
 */
export const useFlowSearch = (criteria: {
	category?: 'standard' | 'experimental' | 'deprecated' | 'pingone-specific';
	complexity?: 'simple' | 'moderate' | 'complex';
	securityLevel?: 'high' | 'medium' | 'low';
	userInteraction?: 'required' | 'optional' | 'none';
	backendRequired?: boolean;
	refreshTokenSupport?: boolean;
	idTokenSupport?: boolean;
}) => {
	return useMemo(() => {
		return FlowInfoService.searchFlows(criteria);
	}, [criteria]);
};

/**
 * Hook to get flows by category
 */
export const useFlowsByCategory = (category: 'standard' | 'experimental' | 'deprecated' | 'pingone-specific') => {
	return useMemo(() => {
		return FlowInfoService.getFlowsByCategory(category);
	}, [category]);
};

/**
 * Hook to get flows by complexity
 */
export const useFlowsByComplexity = (complexity: 'simple' | 'moderate' | 'complex') => {
	return useMemo(() => {
		return FlowInfoService.getFlowsByComplexity(complexity);
	}, [complexity]);
};

/**
 * Hook to get flows by security level
 */
export const useFlowsBySecurityLevel = (securityLevel: 'high' | 'medium' | 'low') => {
	return useMemo(() => {
		return FlowInfoService.getFlowsBySecurityLevel(securityLevel);
	}, [securityLevel]);
};

export default useFlowInfo;
