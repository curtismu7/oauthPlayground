/**
 * @file useGlobalEducationMode.ts
 * @module hooks
 * @description Global hook for education mode state management across all pages
 * @version 1.0.0
 * @since 2024-11-16
 *
 * This hook provides a centralized way to manage education mode state
 * across all pages and components, ensuring consistent behavior.
 */

import { useCallback, useEffect, useState } from 'react';
import {
	type EducationMode,
	EducationPreferenceService,
} from '../services/educationPreferenceService';

/**
 * Global education mode state hook
 * Ensures all components using this hook stay in sync
 */
export const useGlobalEducationMode = () => {
	const [currentMode, setCurrentMode] = useState<EducationMode>(
		EducationPreferenceService.getEducationMode()
	);

	// Listen for changes from other components
	useEffect(() => {
		const handleStorageChange = () => {
			const newMode = EducationPreferenceService.getEducationMode();
			setCurrentMode(newMode);
		};

		const handleCustomChange = (event: CustomEvent) => {
			setCurrentMode(event.detail.mode);
		};

		// Listen for both storage events and custom events
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('educationModeChanged', handleCustomChange as EventListener);

		// Cleanup listeners
		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('educationModeChanged', handleCustomChange as EventListener);
		};
	}, []);

	// Function to change mode globally
	const setMode = useCallback((mode: EducationMode) => {
		EducationPreferenceService.setEducationMode(mode);
	}, []);

	return {
		currentMode,
		setMode,
		isHidden: currentMode === 'hidden',
		isCompact: currentMode === 'compact',
		isFull: currentMode === 'full',
	};
};

export default useGlobalEducationMode;
