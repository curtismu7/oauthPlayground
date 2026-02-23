/**
 * @file useViewMode.ts
 * @description Custom hook for managing view mode (Full/Hidden) across pages
 * @version 1.0.0
 */

import { useCallback, useState } from 'react';
import { feedbackService } from '../services/feedback/feedbackService';

export type ViewMode = 'full' | 'hidden';

export interface ViewModeConfig {
	sections: Record<string, boolean>;
	onExpandAll?: () => void;
	onCollapseAll?: () => void;
}

export const useViewMode = (initialSections: Record<string, boolean>) => {
	const [viewMode, setViewMode] = useState<ViewMode>('full');
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(initialSections);

	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const expandAllSections = useCallback(() => {
		console.log('🔼 Expanding all sections');
		const expandedSections = Object.keys(collapsedSections).reduce((acc, key) => {
			acc[key] = false;
			return acc;
		}, {} as Record<string, boolean>);
		
		setCollapsedSections(expandedSections);
		setViewMode('full');
		
		// Show feedback message
		const feedbackElement = feedbackService.showSuccessSnackbar('All sections expanded');
		
		return { expandedSections, feedbackElement };
	}, [collapsedSections]);

	const collapseAllSections = useCallback(() => {
		console.log('🔽 Collapsing all sections');
		const collapsedAllSections = Object.keys(collapsedSections).reduce((acc, key) => {
			acc[key] = true;
			return acc;
		}, {} as Record<string, boolean>);
		
		setCollapsedSections(collapsedAllSections);
		setViewMode('hidden');
		
		// Show feedback message
		const feedbackElement = feedbackService.showInfoSnackbar('All sections collapsed');
		
		return { collapsedAllSections, feedbackElement };
	}, [collapsedSections]);

	const resetSections = useCallback((newSections: Record<string, boolean>) => {
		setCollapsedSections(newSections);
	}, []);

	return {
		viewMode,
		collapsedSections,
		setCollapsedSections,
		toggleSection,
		expandAllSections,
		collapseAllSections,
		resetSections,
	};
};
