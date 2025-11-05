// src/hooks/useCibaFlowV7.ts
// V7.0.0 OIDC Client Initiated Backchannel Authentication (CIBA) Flow - Enhanced Service Architecture

import { useCallback, useEffect, useRef, useState } from 'react';
import { v4ToastManager } from '../utils/v4ToastMessages';

export type CibaAuthMethod = 'client_secret_post' | 'client_secret_basic';

export interface CibaConfig {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	scope: string;
	loginHint: string;
	bindingMessage?: string;
	authMethod: CibaAuthMethod;
	requestContext?: string;
}

export interface CibaAuthRequest {
	auth_req_id: string; // RFC 9436: auth_req_id from backchannel response
	stateId: string; // Internal tracking ID
	status: 'pending' | 'approved' | 'denied';
	interval: number; // Polling interval in seconds
	expiresIn: number; // Expiration time in seconds
	launchMode: 'poll';
	bindingMessage?: string;
	userCode?: string; // May not be present in CIBA
	expiresAt: number; // Timestamp when request expires
	requestContext?: string;
}

export interface CibaTokens {
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	client_id?: string;
	sub?: string;
	aud?: string | string[];
	iss?: string;
	iat?: number;
	exp?: number;
	issued_at?: number;
	server_timestamp?: string;
}

type CibaStage =
	| 'idle'
	| 'initiating'
	| 'awaiting-approval'
	| 'polling'
	| 'completed'
	| 'failed'
	| 'expired';

interface CibaFlowV7Options {
	flowKey: string;
	flowVersion?: string;
	enableAdvancedFeatures?: boolean;
	enableSecurityFeatures?: boolean;
	enableEducationalContent?: boolean;
}

export const useCibaFlowV7 = (options: CibaFlowV7Options) => {
	const {
		flowKey = 'ciba-v7',
		flowVersion = 'V7',
		enableAdvancedFeatures = true,
		enableSecurityFeatures = true,
		enableEducationalContent = true,
	} = options;

	// Core state
	const [stage, setStage] = useState<CibaStage>('idle');
	const [config, setConfig] = useState<CibaConfig | null>(null);
	const [authRequest, setAuthRequest] = useState<CibaAuthRequest | null>(null);
	const [tokens, setTokens] = useState<CibaTokens | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// V7 Enhanced features
	const [currentStep, setCurrentStep] = useState(0);
	const [totalSteps] = useState(4);
	const [stepTitles] = useState([
		'Configure CIBA Parameters',
		'Initiate Authentication Request',
		'User Approval Process',
		'Token Exchange & Results'
	]);

	// Refs for cleanup
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// V7 Enhanced step management
	const stepManager = {
		currentStep,
		totalSteps,
		stepTitles,
		setStep: (step: number, reason?: string) => {
			console.log(`[CIBA-V7] Step change: ${currentStep} → ${step}${reason ? ` (${reason})` : ''}`);
			setCurrentStep(step);
		},
		next: () => {
			if (currentStep < totalSteps - 1) {
				stepManager.setStep(currentStep + 1, 'next');
			}
		},
		previous: () => {
			if (currentStep > 0) {
				stepManager.setStep(currentStep - 1, 'previous');
			}
		},
		reset: () => {
			stepManager.setStep(0, 'reset');
		}
	};

	// V7 Enhanced configuration validation
	const validateConfig = useCallback((config: Partial<CibaConfig>): string[] => {
		const errors: string[] = [];
		
		if (!config.environmentId?.trim()) {
			errors.push('Environment ID is required');
		}
		
		if (!config.clientId?.trim()) {
			errors.push('Client ID is required');
		}
		
		if (!config.scope?.trim()) {
			errors.push('Scope is required');
		}
		
		if (!config.loginHint?.trim()) {
			errors.push('Login hint is required');
		}
		
		if (!config.authMethod) {
			errors.push('Authentication method is required');
		}
		
		// V7 Enhanced validation
		if (config.scope && !config.scope.includes('openid')) {
			errors.push('Scope must include "openid" for OIDC CIBA flow');
		}
		
		if (config.bindingMessage && config.bindingMessage.length > 255) {
			errors.push('Binding message must be 255 characters or less');
		}
		
		return errors;
	}, []);

	// V7 Enhanced configuration update
	const updateConfig = useCallback((updates: Partial<CibaConfig>) => {
		setConfig(prev => {
			// Prevent unnecessary updates if values haven't actually changed
			const newConfig = { ...prev, ...updates } as CibaConfig;
			
			// Check if anything actually changed to prevent infinite loops
			if (prev && 
				prev.environmentId === newConfig.environmentId &&
				prev.clientId === newConfig.clientId &&
				prev.clientSecret === newConfig.clientSecret &&
				prev.scope === newConfig.scope &&
				prev.loginHint === newConfig.loginHint &&
				prev.bindingMessage === newConfig.bindingMessage &&
				prev.requestContext === newConfig.requestContext &&
				prev.authMethod === newConfig.authMethod) {
				// Nothing changed, return previous config
				return prev;
			}
			
			const errors = validateConfig(newConfig);
			
			if (errors.length === 0) {
				setError(null);
				// Don't show toast on every config update - only on explicit save
				// v4ToastManager.showSuccess('Configuration updated successfully');
			} else {
				setError(errors.join(', '));
				// Only show error toast if it's a real error (not just incomplete form)
				// v4ToastManager.showError(`Configuration errors: ${errors.join(', ')}`);
			}
			
			return newConfig;
		});
	}, [validateConfig]);

	// V7 Enhanced authentication request initiation - Real API call
	const initiateAuthRequest = useCallback(async (config: CibaConfig) => {
		if (isLoading) return;
		
		setIsLoading(true);
		setError(null);
		setStage('initiating');
		
		try {
			console.log('[CIBA-V7] Initiating CIBA backchannel authentication request...');
			console.log('[CIBA-V7] Config:', {
				environmentId: config.environmentId,
				clientId: config.clientId,
				hasClientSecret: !!config.clientSecret,
				scope: config.scope,
				loginHint: config.loginHint,
				hasBindingMessage: !!config.bindingMessage,
				hasRequestContext: !!config.requestContext,
				authMethod: config.authMethod,
			});
			
			// Call real backend endpoint
			const response = await fetch('/api/ciba-backchannel', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environment_id: config.environmentId,
					client_id: config.clientId,
					client_secret: config.clientSecret,
					scope: config.scope,
					login_hint: config.loginHint,
					binding_message: config.bindingMessage,
					requested_context: config.requestContext ? (typeof config.requestContext === 'string' ? JSON.parse(config.requestContext) : config.requestContext) : undefined,
					auth_method: config.authMethod,
				}),
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				const errorMsg = data.error_description || data.error || 'Failed to initiate CIBA request';
				console.error('[CIBA-V7] Backchannel request failed:', data);
				setError(errorMsg);
				setStage('failed');
				v4ToastManager.showError(errorMsg);
				return;
			}
			
			// Extract auth_req_id and other response data (RFC 9436)
			const auth_req_id = data.auth_req_id;
			const expires_in = data.expires_in || 300; // Default 5 minutes
			const interval = data.interval || 2; // Default 2 seconds
			
			if (!auth_req_id) {
				throw new Error('Missing auth_req_id in backchannel response');
			}
			
			console.log('[CIBA-V7] Backchannel request successful:', {
				auth_req_id: auth_req_id.substring(0, 20) + '...',
				expires_in,
				interval,
			});
			
			// Create auth request object for tracking
			const authRequest: CibaAuthRequest = {
				auth_req_id, // RFC 9436: required for polling
				stateId: `ciba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Internal tracking
				status: 'pending',
				interval,
				expiresIn: expires_in,
				launchMode: 'poll',
				bindingMessage: data.binding_message || config.bindingMessage,
				expiresAt: Date.now() + (expires_in * 1000),
				requestContext: config.requestContext,
			};
			
			setAuthRequest(authRequest);
			setStage('awaiting-approval');
			stepManager.next();
			
			v4ToastManager.showSuccess('CIBA authentication request initiated successfully');
			
			// Start real polling
			startPolling(authRequest, config);
			
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to initiate CIBA request';
			console.error('[CIBA-V7] Error initiating request:', err);
			setError(errorMessage);
			setStage('failed');
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [isLoading, stepManager]);

	// V7 Enhanced polling - Real API calls with proper error handling (RFC 9436)
	const startPolling = useCallback((authRequest: CibaAuthRequest, config: CibaConfig) => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
		}
		
		setStage('polling');
		let currentInterval = authRequest.interval; // Track current polling interval
		
		const pollForTokens = async () => {
			const now = Date.now();
			const timeRemaining = authRequest.expiresAt - now;
			
			// Check if request expired
			if (timeRemaining <= 0) {
				if (pollingIntervalRef.current) {
					clearInterval(pollingIntervalRef.current);
					pollingIntervalRef.current = null;
				}
				setStage('expired');
				setError('CIBA authentication request expired');
				v4ToastManager.showError('CIBA request expired. Please initiate again.');
				return;
			}
			
			try {
				console.log('[CIBA-V7] Polling for tokens with auth_req_id:', authRequest.auth_req_id.substring(0, 20) + '...');
				
				// Call real token endpoint with CIBA grant type
				const response = await fetch('/api/ciba-token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environment_id: config.environmentId,
						client_id: config.clientId,
						client_secret: config.clientSecret,
						auth_req_id: authRequest.auth_req_id,
						auth_method: config.authMethod,
					}),
				});
				
				const data = await response.json();
				
				// Handle CIBA-specific errors (RFC 9436)
				if (!response.ok) {
					const errorCode = data.error;
					
					if (errorCode === 'authorization_pending') {
						// User hasn't approved yet - continue polling
						const recommendedInterval = data.interval || authRequest.interval;
						console.log(`[CIBA-V7] Authorization pending, continue polling with interval: ${recommendedInterval}s`);
						currentInterval = recommendedInterval;
						// Update interval and reschedule
						if (pollingIntervalRef.current) {
							clearInterval(pollingIntervalRef.current);
						}
						pollingIntervalRef.current = setInterval(pollForTokens, currentInterval * 1000);
						return;
					}
					
					if (errorCode === 'slow_down') {
						// Polling too fast - increase interval
						const newInterval = (data.interval || currentInterval) + 5;
						console.log(`[CIBA-V7] Slow down - increasing interval to ${newInterval}s`);
						currentInterval = newInterval;
						if (pollingIntervalRef.current) {
							clearInterval(pollingIntervalRef.current);
						}
						pollingIntervalRef.current = setInterval(pollForTokens, currentInterval * 1000);
						return;
					}
					
					if (errorCode === 'expired_token') {
						// Request expired
						console.error('[CIBA-V7] Request expired');
						if (pollingIntervalRef.current) {
							clearInterval(pollingIntervalRef.current);
							pollingIntervalRef.current = null;
						}
						setStage('expired');
						setError(data.error_description || 'CIBA authentication request expired');
						v4ToastManager.showError('CIBA request expired. Please initiate again.');
						return;
					}
					
					if (errorCode === 'access_denied') {
						// User denied the request
						console.error('[CIBA-V7] Access denied by user');
						if (pollingIntervalRef.current) {
							clearInterval(pollingIntervalRef.current);
							pollingIntervalRef.current = null;
						}
						setStage('failed');
						setError(data.error_description || 'User denied the authentication request');
						v4ToastManager.showError('User denied the authentication request.');
						setAuthRequest(prev => prev ? { ...prev, status: 'denied' } : null);
						return;
					}
					
					// Other errors
					console.error('[CIBA-V7] Token polling error:', data);
					const errorMsg = data.error_description || data.error || 'Token polling failed';
					if (pollingIntervalRef.current) {
						clearInterval(pollingIntervalRef.current);
						pollingIntervalRef.current = null;
					}
					setStage('failed');
					setError(errorMsg);
					v4ToastManager.showError(errorMsg);
					return;
				}
				
				// Success - tokens received!
				console.log('[CIBA-V7] Tokens received successfully');
				if (pollingIntervalRef.current) {
					clearInterval(pollingIntervalRef.current);
					pollingIntervalRef.current = null;
				}
				
				const tokens: CibaTokens = {
					access_token: data.access_token,
					refresh_token: data.refresh_token,
					id_token: data.id_token,
					token_type: data.token_type || 'Bearer',
					expires_in: data.expires_in,
					scope: data.scope,
					client_id: config.clientId,
					sub: data.sub,
					aud: data.aud,
					iss: data.iss,
					iat: data.iat,
					exp: data.exp,
					issued_at: Date.now(),
					server_timestamp: data.server_timestamp,
				};
				
				setTokens(tokens);
				setAuthRequest(prev => prev ? { ...prev, status: 'approved' } : null);
				setStage('completed');
				stepManager.next();
				v4ToastManager.showSuccess('CIBA authentication successful! Tokens received.');
				
			} catch (err) {
				console.error('[CIBA-V7] Polling error:', err);
				// Don't stop polling on network errors - retry next interval
				const errorMsg = err instanceof Error ? err.message : 'Polling error';
				console.warn(`[CIBA-V7] Polling error (will retry): ${errorMsg}`);
			}
		};
		
		// Start polling immediately, then at intervals
		pollForTokens();
		pollingIntervalRef.current = setInterval(pollForTokens, currentInterval * 1000);
		
		// Set timeout to stop polling if expired
		timeoutRef.current = setTimeout(() => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			if (Date.now() < authRequest.expiresAt) {
				// Not expired yet, but timeout reached - continue polling
				return;
			}
			setStage('expired');
			v4ToastManager.showError('CIBA request expired');
		}, authRequest.expiresIn * 1000);
	}, [stepManager]);

	// V7 Enhanced flow control
	const startFlow = useCallback(async () => {
		if (!config) {
			v4ToastManager.showError('Configuration required to start flow');
			return;
		}
		
		const errors = validateConfig(config);
		if (errors.length > 0) {
			setError(errors.join(', '));
			v4ToastManager.showError(`Configuration errors: ${errors.join(', ')}`);
			return;
		}
		
		await initiateAuthRequest(config);
	}, [config, validateConfig, initiateAuthRequest]);

	const resetFlow = useCallback(() => {
		console.log('[CIBA-V7] Resetting flow...');
		
		// Clear intervals and timeouts
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		
		// Reset state
		setStage('idle');
		setAuthRequest(null);
		setTokens(null);
		setError(null);
		setIsLoading(false);
		stepManager.reset();
		
		v4ToastManager.showInfo('CIBA flow reset');
	}, [stepManager]);

	// V7 Enhanced cleanup
	useEffect(() => {
		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// V7 Enhanced computed values
	const isConfigured = config && validateConfig(config).length === 0;
	const canStart = isConfigured && !isLoading && stage === 'idle';
	const isInProgress = ['initiating', 'awaiting-approval', 'polling'].includes(stage);
	const isCompleted = stage === 'completed' && tokens !== null;
	const isFailed = ['failed', 'expired'].includes(stage);

	const timeRemaining = authRequest ? Math.max(0, Math.floor((authRequest.expiresAt - Date.now()) / 1000)) : 0;
	const progressPercentage = authRequest ? Math.max(0, Math.min(100, ((authRequest.expiresIn * 1000) - (authRequest.expiresAt - Date.now())) / (authRequest.expiresIn * 10))) : 0;

	return {
		// Core state
		stage,
		config,
		authRequest,
		tokens,
		error,
		isLoading,
		
		// V7 Enhanced features
		stepManager,
		currentStep,
		totalSteps,
		stepTitles,
		
		// Actions
		updateConfig,
		startFlow,
		resetFlow,
		
		// Computed values
		isConfigured,
		canStart,
		isInProgress,
		isCompleted,
		isFailed,
		timeRemaining,
		progressPercentage,
		
		// V7 Enhanced options
		flowKey,
		flowVersion,
		enableAdvancedFeatures,
		enableSecurityFeatures,
		enableEducationalContent
	};
};

export default useCibaFlowV7;


