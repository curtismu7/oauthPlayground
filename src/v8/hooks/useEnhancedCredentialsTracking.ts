/**
 * @file useEnhancedCredentialsTracking.ts
 * @module v8/hooks
 * @description React hook for tracking user interactions with enhanced credentials
 * @version 1.0.0
 * @since 2026-02-15
 *
 * Provides comprehensive tracking of user interactions including:
 * - Form field modifications and validation
 * - Dropdown selections and choices
 * - Session information and timing
 * - Performance metrics
 * - Storage backend usage
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	EnhancedCredentialsServiceV8,
	type UserInteractionData,
} from '../services/enhancedCredentialsServiceV8';

const MODULE_TAG = '[📊 CREDENTIALS-TRACKING]';

interface UseEnhancedCredentialsTrackingOptions {
	/** Environment ID for the credentials */
	environmentId: string;
	/** Application/flow name */
	appName: string;
	/** Flow type */
	flowType: string;
	/** Client ID */
	clientId: string;
	/** Whether to auto-save on changes */
	autoSave?: boolean;
	/** Debounce delay for auto-save (ms) */
	autoSaveDelay?: number;
	/** Enable performance tracking */
	trackPerformance?: boolean;
}

interface FieldInteraction {
	/** Field name */
	field: string;
	/** Timestamp of interaction */
	timestamp: number;
	/** Type of interaction */
	type: 'focus' | 'blur' | 'change' | 'validate' | 'error';
	/** Value at time of interaction */
	value?: string;
	/** Validation result if applicable */
	validationResult?: 'valid' | 'invalid' | 'pending';
}

interface DropdownSelection {
	/** Dropdown identifier */
	dropdownId: string;
	/** Selected value */
	value: string;
	/** Display text */
	text: string;
	/** Timestamp of selection */
	timestamp: number;
	/** Additional context */
	context?: Record<string, string>;
}

interface TrackingSession {
	/** Session start time */
	startTime: number;
	/** Current step */
	currentStep: string;
	/** Total time spent */
	totalTime: number;
	/** Field interactions */
	fieldInteractions: FieldInteraction[];
	/** Dropdown selections */
	selections: DropdownSelection[];
	/** Modified fields */
	modifiedFields: Set<string>;
	/** Validated fields */
	validatedFields: Set<string>;
	/** Error fields */
	errorFields: Set<string>;
	/** Performance metrics */
	performance: {
		/** Field interaction times */
		fieldTimes: Record<string, number>;
		/** Validation times */
		validationTimes: Record<string, number>;
		/** Save times */
		saveTimes: number[];
		/** Load times */
		loadTimes: number[];
	};
}

/**
 * Hook for enhanced credentials tracking
 */
export function useEnhancedCredentialsTracking(options: UseEnhancedCredentialsTrackingOptions) {
	const {
		environmentId,
		appName,
		flowType,
		clientId,
		autoSave = true,
		autoSaveDelay = 1000,
		trackPerformance = true,
	} = options;

	// State management
	const [session, setSession] = useState<TrackingSession>(() => ({
		startTime: Date.now(),
		currentStep: 'initialization',
		totalTime: 0,
		fieldInteractions: [],
		selections: [],
		modifiedFields: new Set(),
		validatedFields: new Set(),
		errorFields: new Set(),
		performance: {
			fieldTimes: {},
			validationTimes: {},
			saveTimes: [],
			loadTimes: [],
		},
	}));

	const [isLoading, setIsLoading] = useState(false);
	const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Refs for debouncing and performance tracking
	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const fieldStartTimesRef = useRef<Record<string, number>>({});
	const sessionStartTimeRef = useRef<number>(Date.now());

	/**
	 * Track field interaction
	 */
	const trackFieldInteraction = useCallback(
		(
			fieldName: string,
			interactionType: FieldInteraction['type'],
			value?: string,
			validationResult?: FieldInteraction['validationResult']
		) => {
			const timestamp = Date.now();

			// Record performance timing
			if (trackPerformance) {
				if (interactionType === 'focus') {
					fieldStartTimesRef.current[fieldName] = timestamp;
				} else if (interactionType === 'blur' && fieldStartTimesRef.current[fieldName]) {
					const fieldTime = timestamp - fieldStartTimesRef.current[fieldName];
					session.performance.fieldTimes[fieldName] =
						(session.performance.fieldTimes[fieldName] || 0) + fieldTime;
					delete fieldStartTimesRef.current[fieldName];
				}
			}

			// Create interaction record
			const interaction: FieldInteraction = {
				field: fieldName,
				timestamp,
				type: interactionType,
				value,
				validationResult,
			};

			// Update session state
			setSession((prev) => {
				const newSession = { ...prev };

				// Add interaction
				newSession.fieldInteractions.push(interaction);

				// Update field tracking sets
				if (interactionType === 'change') {
					newSession.modifiedFields.add(fieldName);
				}
				if (interactionType === 'validate') {
					if (validationResult === 'valid') {
						newSession.validatedFields.add(fieldName);
						newSession.errorFields.delete(fieldName);
					} else if (validationResult === 'invalid') {
						newSession.errorFields.add(fieldName);
						newSession.validatedFields.delete(fieldName);
					}
				}
				if (interactionType === 'error') {
					newSession.errorFields.add(fieldName);
				}

				return newSession;
			});

			console.log(`${MODULE_TAG} Field interaction tracked:`, {
				fieldName,
				interactionType,
				value,
			});
		},
		[trackPerformance, session.performance.fieldTimes]
	);

	/**
	 * Track dropdown selection
	 */
	const trackDropdownSelection = useCallback(
		(dropdownId: string, value: string, text: string, context?: Record<string, string>) => {
			const selection: DropdownSelection = {
				dropdownId,
				value,
				text,
				timestamp: Date.now(),
				context,
			};

			setSession((prev) => ({
				...prev,
				selections: [...prev.selections, selection],
			}));

			console.log(`${MODULE_TAG} Dropdown selection tracked:`, { dropdownId, value, text });
		},
		[]
	);

	/**
	 * Track form validation
	 */
	const trackValidation = useCallback(
		(fieldName: string, isValid: boolean, errorMessage?: string) => {
			const validationResult: FieldInteraction['validationResult'] = isValid ? 'valid' : 'invalid';
			trackFieldInteraction(fieldName, 'validate', undefined, validationResult);

			if (!isValid && errorMessage) {
				console.warn(`${MODULE_TAG} Validation error:`, { fieldName, errorMessage });
			}
		},
		[trackFieldInteraction]
	);

	/**
	 * Track step change
	 */
	const trackStepChange = useCallback(
		(newStep: string) => {
			setSession((prev) => ({
				...prev,
				currentStep: newStep,
				totalTime: Date.now() - prev.startTime,
			}));

			console.log(`${MODULE_TAG} Step changed:`, { from: session.currentStep, to: newStep });
		},
		[session.currentStep]
	);

	/**
	 * Get current interaction data for saving
	 */
	const getCurrentInteractionData = useCallback((): Partial<UserInteractionData> => {
		const currentTime = Date.now();
		const sessionDuration = currentTime - sessionStartTimeRef.current;

		// Convert Sets to arrays
		const modifiedFields = Array.from(session.modifiedFields);
		const validatedFields = Array.from(session.validatedFields);
		const errorFields = Array.from(session.errorFields);

		// Calculate field time spent
		const fieldTimeSpent: Record<string, number> = {};
		Object.entries(session.performance.fieldTimes).forEach(([field, time]) => {
			fieldTimeSpent[field] = time;
		});

		// Prepare selections object
		const selections: Record<string, string> = {};
		session.selections.forEach((selection) => {
			selections[selection.dropdownId] = selection.value;
		});

		return {
			timestamp: new Date().toISOString(),
			appName,
			flowType,
			environmentId,
			clientId,
			selections: {
				app: appName,
				flow: flowType,
				environment: environmentId,
				...selections,
			},
			fieldInteractions: {
				modifiedFields,
				validatedFields,
				errorFields,
				fieldTimeSpent,
			},
			sessionInfo: {
				sessionStart: new Date(sessionStartTimeRef.current).toISOString(),
				currentStep: session.currentStep,
				sessionDuration,
				userAgent: navigator.userAgent,
				pageUrl: window.location.href,
			},
			performance: {
				loadTime:
					session.performance.loadTimes.reduce((a, b) => a + b, 0) /
					Math.max(session.performance.loadTimes.length, 1),
				saveTime:
					session.performance.saveTimes.reduce((a, b) => a + b, 0) /
					Math.max(session.performance.saveTimes.length, 1),
				storageBackend: 'indexeddb' as const, // Will be updated by the service
				cacheHit: false,
			},
		};
	}, [appName, flowType, environmentId, clientId, session]);

	/**
	 * Save credentials with interaction tracking
	 */
	const saveCredentials = useCallback(
		async (credentials: Record<string, any>, interactionData?: Partial<UserInteractionData>) => {
			setIsLoading(true);
			setSaveError(null);

			const startTime = performance.now();

			try {
				const finalInteractionData = interactionData || getCurrentInteractionData();

				const result = await EnhancedCredentialsServiceV8.save(
					environmentId,
					credentials,
					finalInteractionData
				);

				if (result.success) {
					setLastSaveTime(Date.now());

					// Update performance metrics
					if (trackPerformance) {
						const saveTime = performance.now() - startTime;
						setSession((prev) => ({
							...prev,
							performance: {
								...prev.performance,
								saveTimes: [...prev.performance.saveTimes, saveTime],
							},
						}));
					}

					console.log(`${MODULE_TAG} Credentials saved successfully:`, result.backend);
				} else {
					setSaveError(result.error || 'Unknown error');
					console.error(`${MODULE_TAG} Save failed:`, result.error);
				}

				return result;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				setSaveError(errorMessage);
				console.error(`${MODULE_TAG} Save error:`, error);
				return { success: false, backend: 'none', error: errorMessage };
			} finally {
				setIsLoading(false);
			}
		},
		[environmentId, getCurrentInteractionData, trackPerformance]
	);

	/**
	 * Load credentials with performance tracking
	 */
	const loadCredentials = useCallback(async () => {
		setIsLoading(true);

		const startTime = performance.now();

		try {
			const credentials = await EnhancedCredentialsServiceV8.load(environmentId);

			// Update performance metrics
			if (trackPerformance && credentials) {
				const loadTime = performance.now() - startTime;
				setSession((prev) => ({
					...prev,
					performance: {
						...prev.performance,
						loadTimes: [...prev.performance.loadTimes, loadTime],
					},
				}));
			}

			console.log(`${MODULE_TAG} Credentials loaded:`, credentials ? 'success' : 'not found');
			return credentials;
		} catch (error) {
			console.error(`${MODULE_TAG} Load error:`, error);
			return null;
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, trackPerformance]);

	/**
	 * Auto-save functionality
	 */
	const triggerAutoSave = useCallback(() => {
		if (!autoSave) return;

		if (autoSaveTimeoutRef.current) {
			clearTimeout(autoSaveTimeoutRef.current);
		}

		autoSaveTimeoutRef.current = setTimeout(() => {
			// This would be called with actual credentials data
			// Implementation depends on how credentials are managed in the consuming component
			console.log(`${MODULE_TAG} Auto-save triggered`);
		}, autoSaveDelay);
	}, [autoSave, autoSaveDelay]);

	/**
	 * Get session statistics
	 */
	const getSessionStats = useCallback(() => {
		const currentTime = Date.now();
		const totalSessionTime = currentTime - sessionStartTimeRef.current;

		return {
			sessionDuration: totalSessionTime,
			currentStep: session.currentStep,
			fieldInteractions: session.fieldInteractions.length,
			dropdownSelections: session.selections.length,
			modifiedFields: session.modifiedFields.size,
			validatedFields: session.validatedFields.size,
			errorFields: session.errorFields.size,
			averageFieldTime:
				Object.values(session.performance.fieldTimes).reduce((a, b) => a + b, 0) /
				Math.max(Object.keys(session.performance.fieldTimes).length, 1),
			averageSaveTime:
				session.performance.saveTimes.reduce((a, b) => a + b, 0) /
				Math.max(session.performance.saveTimes.length, 1),
			averageLoadTime:
				session.performance.loadTimes.reduce((a, b) => a + b, 0) /
				Math.max(session.performance.loadTimes.length, 1),
			lastSaveTime,
		};
	}, [session, lastSaveTime]);

	/**
	 * Reset session tracking
	 */
	const resetSession = useCallback(() => {
		sessionStartTimeRef.current = Date.now();
		fieldStartTimesRef.current = {};

		setSession({
			startTime: Date.now(),
			currentStep: 'initialization',
			totalTime: 0,
			fieldInteractions: [],
			selections: [],
			modifiedFields: new Set(),
			validatedFields: new Set(),
			errorFields: new Set(),
			performance: {
				fieldTimes: {},
				validationTimes: {},
				saveTimes: [],
				loadTimes: [],
			},
		});

		setLastSaveTime(null);
		setSaveError(null);

		console.log(`${MODULE_TAG} Session reset`);
	}, []);

	// Auto-save trigger when fields are modified
	useEffect(() => {
		if (session.modifiedFields.size > 0) {
			triggerAutoSave();
		}
	}, [session.modifiedFields.size, triggerAutoSave]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current);
			}
		};
	}, []);

	return {
		// State
		isLoading,
		saveError,
		lastSaveTime,
		sessionStats: getSessionStats(),

		// Tracking methods
		trackFieldInteraction,
		trackDropdownSelection,
		trackValidation,
		trackStepChange,

		// Credentials operations
		saveCredentials,
		loadCredentials,

		// Session management
		resetSession,
		triggerAutoSave,

		// Raw session data for advanced usage
		session,
	};
}

export default useEnhancedCredentialsTracking;
