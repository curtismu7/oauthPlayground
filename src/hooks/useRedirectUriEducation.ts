// src/hooks/useRedirectUriEducation.ts
// Hook for flows to easily integrate Redirect URI educational service

import React, { useCallback, useState } from 'react';
import { type FlowUriInfo, redirectUriService } from '../services/redirectUriService';
import { logger } from '../utils/logger';

interface UseRedirectUriEducationProps {
	flowKey: string;
}

interface UseRedirectUriEducationReturn {
	flowInfo: FlowUriInfo | null;
	isLoading: boolean;
	error: string | null;
	showEducationalModal: boolean;
	openEducationalModal: () => void;
	closeEducationalModal: () => void;
	generateEducationalSummary: () => string | null;
	getSecuritySummary: () => string[];
	getBestPracticesSummary: () => string[];
}

export const useRedirectUriEducation = ({
	flowKey,
}: UseRedirectUriEducationProps): UseRedirectUriEducationReturn => {
	const [showEducationalModal, setShowEducationalModal] = useState(false);
	const [flowInfo, setFlowInfo] = useState<FlowUriInfo | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load flow information
	const loadFlowInfo = useCallback(async () => {
		if (!flowKey) {
			setError('No flow key provided');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const info = redirectUriService.getFlowUriInfo(flowKey);
			if (!info) {
				setError(`No URI information found for flow: ${flowKey}`);
				logger.warn('useRedirectUriEducation', `No URI information found for flow: ${flowKey}`);
			} else {
				setFlowInfo(info);
				logger.info('useRedirectUriEducation', `Loaded URI information for flow: ${flowKey}`);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			setError(`Failed to load URI information: ${errorMessage}`);
			logger.error('useRedirectUriEducation', 'Error loading URI information', {
				error: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	}, [flowKey]);

	// Modal controls
	const openEducationalModal = useCallback(() => {
		if (!flowInfo) {
			loadFlowInfo();
		}
		setShowEducationalModal(true);
	}, [flowInfo, loadFlowInfo]);

	const closeEducationalModal = useCallback(() => {
		setShowEducationalModal(false);
	}, []);

	// Generate educational summary
	const generateEducationalSummary = useCallback((): string | null => {
		if (!flowInfo) {
			return null;
		}

		return redirectUriService.generateEducationalSummary(flowKey);
	}, [flowInfo, flowKey]);

	// Get security considerations summary
	const getSecuritySummary = useCallback((): string[] => {
		if (!flowInfo) {
			return [];
		}

		const allSecurityConsiderations: string[] = [];

		flowInfo.redirectUris.forEach((uri) => {
			allSecurityConsiderations.push(...uri.securityConsiderations);
		});

		flowInfo.logoutUris.forEach((uri) => {
			allSecurityConsiderations.push(...uri.securityConsiderations);
		});

		return [...new Set(allSecurityConsiderations)]; // Remove duplicates
	}, [flowInfo]);

	// Get best practices summary
	const getBestPracticesSummary = useCallback((): string[] => {
		if (!flowInfo) {
			return [];
		}

		const allBestPractices: string[] = [];

		flowInfo.redirectUris.forEach((uri) => {
			allBestPractices.push(...uri.bestPractices);
		});

		flowInfo.logoutUris.forEach((uri) => {
			allBestPractices.push(...uri.bestPractices);
		});

		return [...new Set(allBestPractices)]; // Remove duplicates
	}, [flowInfo]);

	// Auto-load flow info when hook is used
	React.useEffect(() => {
		loadFlowInfo();
	}, [loadFlowInfo]);

	return {
		flowInfo,
		isLoading,
		error,
		showEducationalModal,
		openEducationalModal,
		closeEducationalModal,
		generateEducationalSummary,
		getSecuritySummary,
		getBestPracticesSummary,
	};
};
