// src/pages/PingOneWebhookViewer.tsx
// PingOne Webhook Viewer - Real-time webhook event monitoring and subscription management

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiActivity,
	FiAlertCircle,
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiDownload,
	FiEdit,
	FiExternalLink,
	FiFilter,
	FiGlobe,
	FiPlus,
	FiRefreshCw,
	FiServer,
	FiTag,
	FiTrash,
	FiTrash2,
	FiX
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import ApiCallList from '../components/ApiCallList';
import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';
import { apiCallTrackerService } from '../services/apiCallTrackerService';
import { secureLog } from '../utils/secureLogging';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { getAnyWorkerToken } from '../utils/workerTokenDetection';
import { SuperSimpleApiDisplayV8 } from '../v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';
import { isWebhookPopout, openWebhookViewerPopout } from '../v8/utils/webhookViewerPopoutHelper';

const styles = {
	container: {
		width: '100%',
		maxWidth: '100%',
		padding: '2rem',
		boxSizing: 'border-box' as const,
		overflowX: 'auto' as const,
		minWidth: 0,
	} as React.CSSProperties,
	pageContainer: {
		maxWidth: '90rem',
		margin: '0 auto',
		padding: '2rem 1.5rem 4rem',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '1.75rem',
	} as React.CSSProperties,
	headerCard: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '1rem',
		padding: '1.75rem',
		borderRadius: '1rem',
		background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
		border: 'none',
	} as React.CSSProperties,
	titleRow: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '0.75rem',
		color: 'white',
	} as React.CSSProperties,
	titleLeft: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
	} as React.CSSProperties,
	title: {
		margin: 0,
		fontSize: '1.75rem',
		fontWeight: 700,
		color: 'white',
	} as React.CSSProperties,
	subtitle: {
		margin: 0,
		color: 'rgba(255, 255, 255, 0.85)',
		maxWidth: '720px',
		lineHeight: 1.6,
	} as React.CSSProperties,
	header: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '2rem',
	} as React.CSSProperties,
	actionButtons: {
		display: 'flex',
		gap: '0.75rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	button: (variant: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties => {
		const base: React.CSSProperties = {
			display: 'flex',
			alignItems: 'center',
			gap: '0.5rem',
			padding: '0.75rem 1.5rem',
			border: 'none',
			borderRadius: '0.5rem',
			fontSize: '0.875rem',
			fontWeight: 600,
			cursor: 'pointer',
		};
		if (variant === 'primary') return { ...base, background: '#3b82f6', color: 'white' };
		if (variant === 'danger') return { ...base, background: '#ef4444', color: 'white' };
		return { ...base, background: '#f1f5f9', color: '#475569' };
	},
	tabsContainer: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '2rem',
		borderBottom: '2px solid #e2e8f0',
	} as React.CSSProperties,
	tab: (active: boolean): React.CSSProperties => ({
		padding: '0.75rem 1.5rem',
		border: 'none',
		background: 'none',
		fontSize: '0.875rem',
		fontWeight: 600,
		color: active ? '#3b82f6' : '#64748b',
		cursor: 'pointer',
		borderBottom: `2px solid ${active ? '#3b82f6' : 'transparent'}`,
		marginBottom: '-2px',
	}),
	sectionCard: {
		background: 'white',
		border: '1px solid #e2e8f0',
		borderRadius: '0.75rem',
		padding: '1.5rem',
		marginBottom: '2rem',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	} as React.CSSProperties,
	sectionHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '1.5rem',
	} as React.CSSProperties,
	sectionTitle: {
		fontSize: '1.25rem',
		fontWeight: 600,
		color: '#1e293b',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		margin: 0,
	} as React.CSSProperties,
	inputGroup: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.5rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	labelText: {
		fontSize: '0.875rem',
		fontWeight: 600,
		color: '#475569',
	} as React.CSSProperties,
	input: {
		padding: '0.75rem',
		border: '1px solid #cbd5e1',
		borderRadius: '0.375rem',
		fontSize: '0.875rem',
		color: '#1e293b',
	} as React.CSSProperties,
	checkbox: {
		width: '1.25rem',
		height: '1.25rem',
		cursor: 'pointer',
	} as React.CSSProperties,
	subscriptionList: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '1rem',
	} as React.CSSProperties,
	subscriptionCard: {
		background: '#f8fafc',
		border: '1px solid #e2e8f0',
		borderRadius: '0.5rem',
		padding: '1.25rem',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: '1rem',
	} as React.CSSProperties,
	subscriptionInfo: {
		flex: 1,
	} as React.CSSProperties,
	subscriptionName: {
		fontSize: '1rem',
		fontWeight: 600,
		color: '#1e293b',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	subscriptionMeta: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '1rem',
		fontSize: '0.875rem',
		color: '#64748b',
	} as React.CSSProperties,
	subscriptionActions: {
		display: 'flex',
		gap: '0.5rem',
	} as React.CSSProperties,
	statusBadge: (enabled: boolean): React.CSSProperties => ({
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		padding: '0.25rem 0.75rem',
		borderRadius: '0.375rem',
		fontSize: '0.75rem',
		fontWeight: 600,
		background: enabled ? '#dcfce7' : '#fee2e2',
		color: enabled ? '#166534' : '#991b1b',
	}),
	webhookContainer: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '1rem',
		marginTop: '2rem',
	} as React.CSSProperties,
	webhookCard: {
		background: 'white',
		border: '1px solid #e2e8f0',
		borderRadius: '0.75rem',
		padding: '1.5rem',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	} as React.CSSProperties,
	webhookHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '1rem',
	} as React.CSSProperties,
	webhookTitle: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		fontSize: '1.125rem',
		fontWeight: 600,
		color: '#1e293b',
	} as React.CSSProperties,
	webhookMeta: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		fontSize: '0.875rem',
		color: '#64748b',
	} as React.CSSProperties,
	webhookBody: {
		background: '#f8fafc',
		border: '1px solid #e2e8f0',
		borderRadius: '0.5rem',
		padding: '1rem',
		fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
		fontSize: '0.875rem',
		overflowX: 'auto' as const,
	} as React.CSSProperties,
	eventStatusBadge: (status?: string): React.CSSProperties => {
		const base: React.CSSProperties = {
			display: 'inline-flex',
			alignItems: 'center',
			gap: '0.25rem',
			padding: '0.25rem 0.75rem',
			borderRadius: '0.375rem',
			fontSize: '0.75rem',
			fontWeight: 600,
		};
		if (status === 'success') return { ...base, background: '#dcfce7', color: '#166534' };
		if (status === 'error') return { ...base, background: '#fee2e2', color: '#991b1b' };
		if (status === 'pending') return { ...base, background: '#fef3c7', color: '#92400e' };
		return { ...base, background: '#f1f5f9', color: '#475569' };
	},
	emptyState: {
		textAlign: 'center' as const,
		padding: '4rem 2rem',
		color: '#64748b',
	} as React.CSSProperties,
	filterBar: {
		display: 'flex',
		gap: '1rem',
		alignItems: 'center',
		padding: '1rem',
		background: '#f8fafc',
		borderRadius: '0.5rem',
		marginBottom: '1.5rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	filterSelect: {
		padding: '0.5rem 1rem',
		border: '1px solid #cbd5e1',
		borderRadius: '0.375rem',
		background: 'white',
		fontSize: '0.875rem',
		color: '#1e293b',
		minWidth: '150px',
	} as React.CSSProperties,
	filterLabel: {
		fontSize: '0.875rem',
		fontWeight: 600,
		color: '#475569',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties,
	clearFiltersButton: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.5rem 1rem',
		border: '1px solid #cbd5e1',
		borderRadius: '0.375rem',
		background: 'white',
		fontSize: '0.875rem',
		color: '#64748b',
		cursor: 'pointer',
	} as React.CSSProperties,
};

interface WebhookEvent {
	id: string;
	timestamp: Date;
	type: string;
	event: string;
	data: Record<string, unknown>;
	status: 'success' | 'error' | 'pending';
	source: string;
}

interface WebhookSubscription {
	id: string;
	name: string;
	enabled: boolean;
	/** PingOne API field */
	httpEndpoint?: {
		url: string;
		headers?: Record<string, string>;
	};
	/** Legacy compat — some responses may still have this */
	destination?: {
		url: string;
	};
	format?: string;
	filterOptions?: {
		includedActionTypes?: string[];
	};
	/** Legacy compat */
	topics?: string[];
	protocol?: string;
	verifyTlsCertificates?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

const PingOneWebhookViewer: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'subscriptions' | 'events'>('events');
	const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
	const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
	const [filter, setFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [timeFilter, setTimeFilter] = useState<string>('all');
	const [displayFormat, setDisplayFormat] = useState<
		'json' | 'splunk' | 'ping-activity' | 'new-relic'
	>('json');
	const [isActive, setIsActive] = useState(false);
	const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
	const [workerToken, setWorkerToken] = useState<string | null>(() => getAnyWorkerToken());
	const [environmentId, setEnvironmentId] = useState<string>(() => readBestEnvironmentId());
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingSubscription, setEditingSubscription] = useState<WebhookSubscription | null>(null);
	const [selectedRegion, setSelectedRegion] = useState<string>(() => {
		try {
			const stored = localStorage.getItem('unified_worker_token');
			if (stored) {
				const data = JSON.parse(stored);
				const r = data.credentials?.region || 'us';
				if (r === 'eu') return 'eu';
				if (r === 'ap') return 'ap';
			}
		} catch {}
		return 'na';
	});
	const [formData, setFormData] = useState({
		name: 'PingOne Webhook Viewer',
		enabled: true,
		httpEndpointUrl: `${window.location.origin}/api/webhooks/pingone`,
		format: 'ACTIVITY',
		includedActionTypes:
			'AUTHENTICATION.LOGIN.SUCCESS,USER.PROVISIONED.CREATED,USER.PROVISIONED.UPDATED,USER.PROVISIONED.DELETED',
		verifyTlsCertificates: false,
	});

	// Ensure URL is correct when component mounts
	useEffect(() => {
		if (location.pathname !== '/pingone-webhook-viewer') {
			navigate('/pingone-webhook-viewer', { replace: true });
		}
	}, [location.pathname, navigate]);

	// Update environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = () => {
			try {
				const stored = localStorage.getItem('unified_worker_token');
				if (stored) {
					const data = JSON.parse(stored);
					if (data.credentials?.environmentId && !environmentId) {
						setEnvironmentId(data.credentials.environmentId);
						localStorage.setItem('environmentId', data.credentials.environmentId);
					}
				}
			} catch (error) {
				console.log('Failed to update environment ID from worker token:', error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [environmentId]);

	// Load worker token and environment ID, and listen for changes
	useEffect(() => {
		// Initial check
		const token = getAnyWorkerToken();
		if (token !== workerToken) {
			setWorkerToken(token);
		}

		const envId = localStorage.getItem('environmentId') || '';
		if (envId !== environmentId) {
			console.log('[Webhook Viewer] Environment ID changed in storage:', {
				old: environmentId,
				new: envId,
			});
			setEnvironmentId(envId);
		}

		// Listen for storage changes (cross-tab)
		const handleStorageChange = (e: StorageEvent) => {
			if (
				e.key?.startsWith('worker_token') ||
				e.key?.startsWith('pingone_worker_token') ||
				e.key === 'environmentId'
			) {
				const newToken = getAnyWorkerToken();
				if (newToken !== workerToken) {
					setWorkerToken(newToken);
				}
				if (e.key === 'environmentId') {
					setEnvironmentId(e.newValue || '');
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);

		// Poll for token changes in same tab (since storage event only fires cross-tab)
		const interval = setInterval(() => {
			const newToken = getAnyWorkerToken();
			if (newToken !== workerToken) {
				setWorkerToken(newToken);
			}
			const newEnvId = localStorage.getItem('environmentId') || '';
			if (newEnvId !== environmentId) {
				console.log('[Webhook Viewer] Environment ID polling update:', {
					old: environmentId,
					new: newEnvId,
				});
				setEnvironmentId(newEnvId);
			}
		}, 1000);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			clearInterval(interval);
		};
	}, [environmentId, workerToken]);

	// Validate worker token and provide helpful feedback
	const _validateWorkerToken = async (token: string, envId: string) => {
		try {
			// Test basic environment access
			const testResponse = await fetch(
				`/api/pingone/subscriptions?environmentId=${envId}&workerToken=${token}&region=${selectedRegion}`,
				{
					method: 'GET',
				}
			);

			if (testResponse.ok) {
				return { valid: true, message: 'Token is valid' };
			}

			const errorText = await testResponse.text();
			if (errorText.includes('<html>')) {
				if (errorText.includes('Error. Page cannot be displayed')) {
					return {
						valid: false,
						message:
							'Token lacks webhook permissions or environment access. Please ensure your Worker App has p1:read:webhooks and p1:write:webhooks scopes.',
					};
				}
				return {
					valid: false,
					message: 'Token authentication failed. The token may be expired or invalid.',
				};
			}

			return {
				valid: false,
				message: `API returned ${testResponse.status}: ${testResponse.statusText}`,
			};
		} catch (error) {
			return {
				valid: false,
				message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	};

	// Format conversion functions for different display formats
	const formatAsSplunk = useCallback((event: WebhookEvent): string => {
		const timestamp = event.timestamp.toISOString();
		const eventType = event.type || 'unknown';
		const eventData = event.data || {};

		// Splunk format: timestamp, log_level, source, event_type, message
		return `${timestamp} INFO pingone-webhook ${eventType} ${JSON.stringify(eventData)}`;
	}, []);

	const formatAsPingActivity = useCallback(
		(event: WebhookEvent): string => {
			// Ping Activity JSON format
			const activity = {
				timestamp: event.timestamp.toISOString(),
				eventId: event.id,
				eventType: event.type || 'unknown',
				source: 'pingone-api',
				actor: event.data?.actor || {},
				action: event.data?.action || {},
				resource: event.data?.resource || {},
				result: event.data?.result || {},
				metadata: {
					environmentId: environmentId,
					webhookId: event.id,
					receivedAt: event.timestamp.toISOString(),
				},
			};

			return JSON.stringify(activity, null, 2);
		},
		[environmentId]
	);

	const formatAsNewRelic = useCallback(
		(event: WebhookEvent): string => {
			// New Relic format for application monitoring
			const newRelicEvent = {
				eventType: 'PingOneWebhook',
				timestamp: event.timestamp.getTime(),
				attributes: {
					eventId: event.id,
					eventType: event.type || 'unknown',
					source: 'pingone-api',
					environmentId: environmentId,
					actor:
						((event.data as Record<string, unknown> | undefined)?.['actor'] as string) || 'unknown',
					action:
						((event.data as Record<string, unknown> | undefined)?.['action'] as string) ||
						'unknown',
					resourceType:
						((event.data as Record<string, unknown> | undefined)?.['resource'] as string) ||
						'unknown',
					result:
						((event.data as Record<string, unknown> | undefined)?.['result'] as string) ||
						'unknown',
					userAgent:
						((event.data as Record<string, unknown> | undefined)?.['userAgent'] as string) ||
						'unknown',
					ipAddress:
						((event.data as Record<string, unknown> | undefined)?.['ipAddress'] as string) ||
						'unknown',
				},
			};

			return JSON.stringify(newRelicEvent, null, 2);
		},
		[environmentId]
	);

	const formatEventForDisplay = useCallback(
		(event: WebhookEvent, format: string) => {
			switch (format) {
				case 'splunk':
					return formatAsSplunk(event);
				case 'ping-activity':
					return formatAsPingActivity(event);
				case 'new-relic':
					return formatAsNewRelic(event);
				default:
					return JSON.stringify(event.data, null, 2);
			}
		},
		[formatAsNewRelic, formatAsPingActivity, formatAsSplunk]
	);

	// Fetch webhook subscriptions
	const fetchSubscriptions = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken();
		if (!effectiveWorkerToken || !environmentId) {
			return;
		}

		try {
			setIsLoadingSubscriptions(true);
			let callId: string | null = null;

			const url = `/api/pingone/subscriptions?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=${selectedRegion}`;

			callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url,
				headers: {
					Authorization: 'Bearer ***',
				},
			});

			const response = await fetch(url);

			const responseData = await response.json().catch(() => ({}));

			if (callId) {
				apiCallTrackerService.updateApiCallResponse(callId, {
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: responseData,
				});
			}

			if (!response.ok) {
				// Provide helpful error message for 404 (server might need restart)
				if (response.status === 404) {
					console.warn(
						'[Webhook Viewer] Subscriptions endpoint not found (404). Backend server may need restart.'
					);
					throw new Error(
						'Subscriptions endpoint not found. Please ensure the backend server is running and has been restarted to register the new routes.'
					);
				}
				// Provide helpful error message for 403 (permissions issue)
				if (response.status === 403) {
					console.warn(
						'[Webhook Viewer] Permission denied (403). Worker token may lack required scopes.'
					);
					throw new Error(
						'Permission denied. Your worker token may lack the required scopes. Ensure your Worker App has the "p1:read:webhooks" and "p1:write:webhooks" scopes.'
					);
				}
				// Check for HTML response (indicates auth error)
				if (typeof responseData === 'string' && responseData.includes('<html>')) {
					console.warn('[Webhook Viewer] Received HTML response - likely authentication error');
					if (responseData.includes('Error. Page cannot be displayed')) {
						throw new Error(
							'PingOne API access denied. This usually means:\n\n' +
								'1. Your worker token lacks the required scopes (p1:read:webhooks, p1:write:webhooks)\n' +
								'2. The environment ID is not accessible with this token\n' +
								'3. Your PingOne account may not have webhook subscription permissions\n\n' +
								'Please generate a new worker token with the proper webhook scopes and try again.'
						);
					}
					throw new Error(
						'Authentication failed. Your worker token may be expired or invalid. Please generate a new worker token with the required scopes: p1:read:webhooks, p1:write:webhooks'
					);
				}
				throw new Error(
					responseData.error_description || `Failed to fetch subscriptions (${response.status})`
				);
			}

			const subscriptionsList = responseData._embedded?.subscriptions || [];
			setSubscriptions(subscriptionsList);
			console.log(`[Webhook Viewer] Loaded ${subscriptionsList.length} subscriptions`);
			v4ToastManager.showSuccess(`Loaded ${subscriptionsList.length} webhook subscriptions`);
		} catch (error) {
			console.error('[Webhook Viewer] Error fetching subscriptions:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to load webhook subscriptions'
			);
		} finally {
			setIsLoadingSubscriptions(false);
		}
	}, [environmentId, selectedRegion]);

	// Fetch webhook events from backend
	const fetchWebhookEvents = useCallback(async () => {
		try {
			const response = await fetch('/api/webhooks/events?limit=1000');
			if (!response.ok) {
				// Don't show error for 404 if endpoint doesn't exist yet (server might need restart)
				if (response.status === 404) {
					console.warn(
						'[Webhook Viewer] Events endpoint not found (404). Server may need restart.'
					);
					return;
				}
				throw new Error(`Failed to fetch webhook events (${response.status})`);
			}
			const data = await response.json();

			const transformedEvents: WebhookEvent[] = (data.events || []).map(
				(event: {
					id?: string;
					timestamp?: string | number;
					type?: string;
					event?: string;
					data?: Record<string, unknown>;
					rawBody?: Record<string, unknown>;
					status?: 'success' | 'error' | 'pending';
					source?: string;
				}) => ({
					id: event.id || `event-${Date.now()}-${Math.random()}`,
					timestamp: new Date(event.timestamp || Date.now()),
					type: event.type || event.event || 'unknown',
					event: event.event || 'webhook.event',
					data: event.data || event.rawBody || {},
					status: event.status || 'success',
					source: event.source || 'pingone-api',
				})
			);

			setWebhooks(transformedEvents);
			console.log(`[Webhook Viewer] Loaded ${transformedEvents.length} webhook events`);
		} catch (error) {
			// Only log error, don't show toast for 404s (endpoint might not be available)
			if (error instanceof Error && error.message.includes('404')) {
				console.warn('[Webhook Viewer] Events endpoint not available:', error.message);
			} else {
				console.error('[Webhook Viewer] Error fetching events:', error);
				v4ToastManager.showError('Failed to load webhook events');
			}
		}
	}, []);

	// Load subscriptions when worker token and environment ID are available
	useEffect(() => {
		const token = getAnyWorkerToken();
		if (token && environmentId && activeTab === 'subscriptions') {
			fetchSubscriptions();
		}
	}, [environmentId, activeTab, fetchSubscriptions]);

	// Load webhook events on mount
	useEffect(() => {
		if (activeTab === 'events') {
			fetchWebhookEvents();
		}
	}, [activeTab, fetchWebhookEvents]);

	// Poll for new webhook events when monitoring is active
	useEffect(() => {
		if (!isActive || activeTab !== 'events') return;

		const interval = setInterval(() => {
			fetchWebhookEvents();
		}, 3000);

		return () => clearInterval(interval);
	}, [isActive, activeTab, fetchWebhookEvents]);

	const handleStartMonitoring = useCallback(() => {
		setIsActive(true);
		fetchWebhookEvents();
		v4ToastManager.showSuccess(
			'Webhook monitoring started - polling for new events every 3 seconds'
		);
		secureLog('PingOneWebhookViewer', 'Started webhook monitoring');
	}, [fetchWebhookEvents]);

	const handleStopMonitoring = useCallback(() => {
		setIsActive(false);
		v4ToastManager.showSuccess('Webhook monitoring stopped');
		secureLog('PingOneWebhookViewer', 'Stopped webhook monitoring');
	}, []);

	const handleClearWebhooks = useCallback(async () => {
		try {
			const response = await fetch('/api/webhooks/events', {
				method: 'DELETE',
			});
			if (!response.ok) {
				throw new Error('Failed to clear webhook events');
			}
			setWebhooks([]);
			v4ToastManager.showSuccess('Webhook history cleared');
			secureLog('PingOneWebhookViewer', 'Cleared webhook history');
		} catch (error) {
			console.error('[Webhook Viewer] Error clearing events:', error);
			v4ToastManager.showError('Failed to clear webhook events');
		}
	}, []);

	const handleExportWebhooks = useCallback(() => {
		const dataStr = JSON.stringify(webhooks, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `pingone-webhooks-${new Date().toISOString()}.json`;
		link.click();
		v4ToastManager.showSuccess('Webhooks exported');
	}, [webhooks]);

	const handleCreateSubscription = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken();
		if (!effectiveWorkerToken || !environmentId) {
			v4ToastManager.showError('Worker token and environment ID are required');
			return;
		}

		try {
			setIsLoadingSubscriptions(true);
			let callId: string | null = null;

			const subscriptionData = {
				name: formData.name,
				enabled: formData.enabled,
				protocol: 'HTTPS',
				format: formData.format,
				httpEndpoint: {
					url: formData.httpEndpointUrl,
					headers: {},
				},
				filterOptions: {
					includedActionTypes: formData.includedActionTypes
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean),
				},
				verifyTlsCertificates: formData.verifyTlsCertificates,
			};

			const url = `/api/pingone/subscriptions?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=${selectedRegion}`;

			callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url,
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ***',
				},
				body: subscriptionData,
			});

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(subscriptionData),
			});

			const responseData = await response.json().catch(() => ({}));

			if (callId) {
				apiCallTrackerService.updateApiCallResponse(callId, {
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: responseData,
				});
			}

			if (!response.ok) {
				throw new Error(
					responseData.error_description || `Failed to create subscription (${response.status})`
				);
			}

			v4ToastManager.showSuccess('Webhook subscription created successfully');
			setShowCreateModal(false);
			setFormData({
				name: '',
				enabled: true,
				httpEndpointUrl: '',
				format: 'ACTIVITY',
				includedActionTypes: '',
				verifyTlsCertificates: false,
			});
			await fetchSubscriptions();
		} catch (error) {
			console.error('[Webhook Viewer] Error creating subscription:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to create webhook subscription'
			);
		} finally {
			setIsLoadingSubscriptions(false);
		}
	}, [environmentId, formData, fetchSubscriptions, selectedRegion]);

	const handleUpdateSubscription = useCallback(
		async (subscription: WebhookSubscription) => {
			const effectiveWorkerToken = getAnyWorkerToken();
			if (!effectiveWorkerToken || !environmentId) {
				v4ToastManager.showError('Worker token and environment ID are required');
				return;
			}

			try {
				setIsLoadingSubscriptions(true);
				let callId: string | null = null;

				const subscriptionData = {
					name: formData.name,
					enabled: formData.enabled,
					protocol: 'HTTPS',
					format: formData.format,
					httpEndpoint: {
						url: formData.httpEndpointUrl,
						headers: {},
					},
					filterOptions: {
						includedActionTypes: formData.includedActionTypes
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean),
					},
					verifyTlsCertificates: formData.verifyTlsCertificates,
				};

				const url = `/api/pingone/subscriptions/${subscription.id}?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=${selectedRegion}`;

				callId = apiCallTrackerService.trackApiCall({
					method: 'PUT',
					url,
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer ***',
					},
					body: subscriptionData,
				});

				const response = await fetch(url, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(subscriptionData),
				});

				const responseData = await response.json().catch(() => ({}));

				if (callId) {
					apiCallTrackerService.updateApiCallResponse(callId, {
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						data: responseData,
					});
				}

				if (!response.ok) {
					throw new Error(
						responseData.error_description || `Failed to update subscription (${response.status})`
					);
				}

				v4ToastManager.showSuccess('Webhook subscription updated successfully');
				setEditingSubscription(null);
				setFormData({
					name: '',
					enabled: true,
					httpEndpointUrl: '',
					format: 'ACTIVITY',
					includedActionTypes: '',
					verifyTlsCertificates: false,
				});
				await fetchSubscriptions();
			} catch (error) {
				console.error('[Webhook Viewer] Error updating subscription:', error);
				v4ToastManager.showError(
					error instanceof Error ? error.message : 'Failed to update webhook subscription'
				);
			} finally {
				setIsLoadingSubscriptions(false);
			}
		},
		[environmentId, formData, fetchSubscriptions, selectedRegion]
	);

	const handleDeleteSubscription = useCallback(
		async (subscriptionId: string) => {
			const effectiveWorkerToken = getAnyWorkerToken();
			if (!effectiveWorkerToken || !environmentId) {
				v4ToastManager.showError('Worker token and environment ID are required');
				return;
			}

			if (!confirm('Are you sure you want to delete this webhook subscription?')) {
				return;
			}

			try {
				setIsLoadingSubscriptions(true);
				let callId: string | null = null;

				const url = `/api/pingone/subscriptions/${subscriptionId}?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=${selectedRegion}`;

				callId = apiCallTrackerService.trackApiCall({
					method: 'DELETE',
					url,
					headers: {
						Authorization: 'Bearer ***',
					},
				});

				const response = await fetch(url, {
					method: 'DELETE',
				});

				const responseData = response.status === 204 ? {} : await response.json().catch(() => ({}));

				if (callId) {
					apiCallTrackerService.updateApiCallResponse(callId, {
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						data: responseData,
					});
				}

				if (!response.ok) {
					throw new Error(`Failed to delete subscription (${response.status})`);
				}

				v4ToastManager.showSuccess('Webhook subscription deleted successfully');
				await fetchSubscriptions();
			} catch (error) {
				console.error('[Webhook Viewer] Error deleting subscription:', error);
				v4ToastManager.showError(
					error instanceof Error ? error.message : 'Failed to delete webhook subscription'
				);
			} finally {
				setIsLoadingSubscriptions(false);
			}
		},
		[environmentId, fetchSubscriptions, selectedRegion]
	);

	const handleEditSubscription = useCallback((subscription: WebhookSubscription) => {
		setEditingSubscription(subscription);
		setFormData({
			name: subscription.name,
			enabled: subscription.enabled,
			httpEndpointUrl: subscription.httpEndpoint?.url || subscription.destination?.url || '',
			format: subscription.format || 'ACTIVITY',
			includedActionTypes: (
				subscription.filterOptions?.includedActionTypes ||
				subscription.topics ||
				[]
			).join(', '),
			verifyTlsCertificates: subscription.verifyTlsCertificates ?? false,
		});
		setShowCreateModal(true);
	}, []);

	const handleCancelEdit = useCallback(() => {
		setEditingSubscription(null);
		setShowCreateModal(false);
		setFormData({
			name: '',
			enabled: true,
			httpEndpointUrl: '',
			format: 'ACTIVITY',
			includedActionTypes: '',
			verifyTlsCertificates: false,
		});
	}, []);

	// Get unique event types from webhooks
	const eventTypes = useMemo(() => {
		const types = new Set(webhooks.map((w) => w.type));
		return Array.from(types).sort();
	}, [webhooks]);

	// Calculate time filter cutoff
	const getTimeCutoff = useCallback(() => {
		const now = Date.now();
		switch (timeFilter) {
			case '1h':
				return now - 60 * 60 * 1000;
			case '24h':
				return now - 24 * 60 * 60 * 1000;
			case '7d':
				return now - 7 * 24 * 60 * 60 * 1000;
			case '30d':
				return now - 30 * 24 * 60 * 60 * 1000;
			default:
				return 0;
		}
	}, [timeFilter]);

	// Apply all filters
	const filteredWebhooks = useMemo(() => {
		let filtered = webhooks;

		if (filter !== 'all') {
			filtered = filtered.filter((w) => w.status === filter);
		}

		if (typeFilter !== 'all') {
			filtered = filtered.filter((w) => w.type === typeFilter);
		}

		if (timeFilter !== 'all') {
			const cutoff = getTimeCutoff();
			filtered = filtered.filter((w) => w.timestamp.getTime() >= cutoff);
		}

		return filtered;
	}, [webhooks, filter, typeFilter, timeFilter, getTimeCutoff]);

	const handleClearFilters = useCallback(() => {
		setFilter('all');
		setTypeFilter('all');
		setTimeFilter('all');
	}, []);

	const formatTimestamp = (timestamp: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'medium',
		}).format(timestamp);
	};

	const formatData = (_data: Record<string, unknown>, webhook: WebhookEvent) => {
		return formatEventForDisplay(webhook, displayFormat);
	};

	// Check for global token - use state for re-renders, but also check directly for accuracy
	const currentToken = getAnyWorkerToken() || workerToken || '';
	const hasWorkerToken = !!currentToken;

	return (
		<div style={styles.container}>
			<div style={styles.pageContainer}>
				<div style={styles.headerCard}>
					<div style={styles.titleRow}>
						<div style={styles.titleLeft}>
							<FiServer size={28} />
							<h1 style={styles.title}>PingOne Webhook Management</h1>
						</div>
						{!isWebhookPopout() && (
							<button
								type="button"
								onClick={openWebhookViewerPopout}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.4rem',
									paddingInline: '0.85rem',
									paddingBlock: '0.45rem',
									borderRadius: '0.5rem',
									border: '1px solid rgba(255,255,255,0.4)',
									background: 'rgba(255,255,255,0.15)',
									color: 'white',
									fontSize: '0.8rem',
									fontWeight: 600,
									cursor: 'pointer',
									whiteSpace: 'nowrap',
									transition: 'background 0.15s',
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLButtonElement).style.background =
										'rgba(255,255,255,0.25)';
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLButtonElement).style.background =
										'rgba(255,255,255,0.15)';
								}}
								title="Open in popout window to monitor while using the app"
							>
								<FiExternalLink size={14} />
								Popout
							</button>
						)}
					</div>
					<p style={styles.subtitle}>
						Manage webhook subscriptions and monitor webhook events in real-time. Create, update,
						and delete webhook subscriptions using the PingOne Management API. Requires
						p1:read:subscriptions and p1:write:subscriptions scopes.
					</p>
				</div>

				<WorkerTokenSectionV8
					environmentId={environmentId}
					onTokenUpdated={(token) => {
						setWorkerToken(token);
						try {
							const stored = localStorage.getItem('unified_worker_token');
							if (stored) {
								const data = JSON.parse(stored);
								if (data.credentials?.environmentId) {
									setEnvironmentId(data.credentials.environmentId);
									localStorage.setItem('environmentId', data.credentials.environmentId);
								}
								if (data.credentials?.region) {
									setSelectedRegion(
										data.credentials.region === 'eu'
											? 'eu'
											: data.credentials.region === 'ap'
												? 'ap'
												: data.credentials.region === 'ca'
													? 'ca'
													: 'na'
									);
								}
							}
						} catch {}
					}}
					compact={false}
					showSettings={false}
				/>

				<div style={{ ...styles.sectionCard, marginBottom: '1rem' }}>
					<label
						htmlFor="webhook-env-id"
						style={{
							fontWeight: 600,
							fontSize: '0.875rem',
							color: '#334155',
							display: 'block',
							marginBottom: '0.5rem',
						}}
					>
						Environment ID
					</label>
					<input
						id="webhook-env-id"
						type="text"
						value={environmentId}
						onChange={(e) => {
							setEnvironmentId(e.target.value);
							localStorage.setItem('environmentId', e.target.value);
						}}
						placeholder="12345678-1234-1234-1234-123456789abc"
						style={{
							width: '100%',
							padding: '0.6rem 0.85rem',
							borderRadius: '0.5rem',
							border: `1px solid ${!environmentId.trim() ? '#f59e0b' : '#cbd5e1'}`,
							background: !environmentId.trim() ? '#fffbeb' : '#f8fafc',
							fontSize: '0.875rem',
							fontFamily: "'Monaco', 'Menlo', monospace",
						}}
					/>
					{!environmentId.trim() && (
						<p
							style={{
								margin: '0.4rem 0 0',
								fontSize: '0.78rem',
								color: '#d97706',
								fontWeight: 600,
							}}
						>
							⚠️ Environment ID required to manage subscriptions.
						</p>
					)}
				</div>

				<div style={styles.header}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
						<FiServer size={24} />
						<h1 style={{ ...styles.title, fontSize: '1.5rem', margin: 0 }}>Webhook Management</h1>
					</div>
					<div style={styles.actionButtons}>
						{activeTab === 'subscriptions' && (
							<>
								<button
									type="button"
									style={styles.button('primary')}
									onClick={() => {
										setEditingSubscription(null);
										setFormData({
											name: '',
											enabled: true,
											httpEndpointUrl: `${window.location.origin}/api/webhooks/pingone`,
											format: 'ACTIVITY',
											includedActionTypes: 'AUTHENTICATION.LOGIN.SUCCESS,USER.PROVISIONED.CREATED',
											verifyTlsCertificates: false,
										});
										setShowCreateModal(true);
									}}
									disabled={!hasWorkerToken || !environmentId}
								>
									<FiPlus />
									Create Subscription
								</button>
								<button
									type="button"
									style={styles.button('secondary')}
									onClick={fetchSubscriptions}
									disabled={!hasWorkerToken || !environmentId || isLoadingSubscriptions}
								>
									<FiRefreshCw />
									Refresh
								</button>
							</>
						)}
						{activeTab === 'events' && (
							<>
								{!isActive ? (
									<button
										type="button"
										style={styles.button('primary')}
										onClick={handleStartMonitoring}
									>
										<FiActivity />
										Start Monitoring
									</button>
								) : (
									<button
										type="button"
										style={styles.button('danger')}
										onClick={handleStopMonitoring}
									>
										<FiActivity />
										Stop Monitoring
									</button>
								)}
								<button
									type="button"
									style={styles.button('secondary')}
									onClick={handleClearWebhooks}
									disabled={webhooks.length === 0}
								>
									<FiTrash2 />
									Clear History
								</button>
								<button
									type="button"
									style={styles.button('secondary')}
									onClick={handleExportWebhooks}
									disabled={webhooks.length === 0}
								>
									<FiDownload />
									Export
								</button>
							</>
						)}
					</div>
				</div>

				<div style={styles.tabsContainer}>
					<button
						type="button"
						style={styles.tab(activeTab === 'subscriptions')}
						onClick={() => setActiveTab('subscriptions')}
					>
						Subscriptions ({subscriptions.length})
					</button>
					<button
						type="button"
						style={styles.tab(activeTab === 'events')}
						onClick={() => setActiveTab('events')}
					>
						Events ({webhooks.length})
					</button>
				</div>

				{activeTab === 'subscriptions' && (
					<>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.75rem',
								marginBottom: '1rem',
								padding: '0.75rem 1rem',
								background: '#f8fafc',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<FiGlobe size={16} style={{ color: '#64748b' }} />
							<span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
								PingOne Region:
							</span>
							<select
								style={{
									...styles.filterSelect,
									fontSize: '0.875rem',
									padding: '0.25rem 0.5rem',
									minWidth: 220,
								}}
								value={selectedRegion}
								onChange={(e) => setSelectedRegion(e.target.value)}
							>
								<option value="na">North America (.us)</option>
								<option value="eu">Europe (.eu)</option>
								<option value="ap">Asia Pacific (.asia)</option>
								<option value="ca">Canada (.ca)</option>
							</select>
							<span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
								API: api.pingone.
								{selectedRegion === 'na' ? 'us' : selectedRegion === 'ap' ? 'asia' : selectedRegion}
							</span>
						</div>

						{showCreateModal && (
							<div style={styles.sectionCard}>
								<div style={styles.sectionHeader}>
									<h2 style={styles.sectionTitle}>
										{editingSubscription ? 'Edit Subscription' : 'Create Subscription'}
									</h2>
									<button
										type="button"
										style={styles.button('secondary')}
										onClick={handleCancelEdit}
									>
										<FiX />
										Cancel
									</button>
								</div>
								<div style={styles.inputGroup}>
									<label htmlFor="webhook-name" style={styles.labelText}>
										Name *
									</label>
									<input
										id="webhook-name"
										style={styles.input}
										type="text"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										placeholder="My Webhook Subscription"
									/>
								</div>
								<div style={styles.inputGroup}>
									<label htmlFor="webhook-region" style={styles.labelText}>
										PingOne Region
									</label>
									<select
										id="webhook-region"
										style={styles.filterSelect}
										value={selectedRegion}
										onChange={(e) => setSelectedRegion(e.target.value)}
									>
										<option value="na">North America (api.pingone.com / .us)</option>
										<option value="eu">Europe (api.pingone.eu)</option>
										<option value="ap">Asia Pacific (api.pingone.asia)</option>
										<option value="ca">Canada (api.pingone.ca)</option>
									</select>
								</div>
								<div style={styles.inputGroup}>
									<label htmlFor="webhook-url" style={styles.labelText}>
										Webhook Endpoint URL (httpEndpoint.url) *
									</label>
									<input
										id="webhook-url"
										style={styles.input}
										type="url"
										value={formData.httpEndpointUrl}
										onChange={(e) => setFormData({ ...formData, httpEndpointUrl: e.target.value })}
										placeholder={`${window.location.origin}/api/webhooks/pingone`}
									/>
									<small style={{ color: '#64748b', fontSize: '0.78rem' }}>
										PingOne will POST events to this HTTPS URL.
									</small>
								</div>
								<div style={styles.inputGroup}>
									<label htmlFor="webhook-format" style={styles.labelText}>
										Format
									</label>
									<select
										id="webhook-format"
										style={styles.filterSelect}
										value={formData.format}
										onChange={(e) => setFormData({ ...formData, format: e.target.value })}
									>
										<option value="ACTIVITY">ACTIVITY — Generic Ping JSON</option>
										<option value="SPLUNK">SPLUNK — Splunk-friendly</option>
										<option value="NEWRELIC">NEWRELIC — New Relic-friendly</option>
									</select>
								</div>
								<div style={styles.inputGroup}>
									<label htmlFor="webhook-action-types" style={styles.labelText}>
										Event Types — filterOptions.includedActionTypes (comma-separated)
									</label>
									<input
										id="webhook-action-types"
										style={styles.input}
										type="text"
										value={formData.includedActionTypes}
										onChange={(e) =>
											setFormData({ ...formData, includedActionTypes: e.target.value })
										}
										placeholder="AUTHENTICATION.LOGIN.SUCCESS,USER.PROVISIONED.CREATED"
									/>
									<small style={{ color: '#64748b', fontSize: '0.78rem' }}>
										See Audit Reporting Events docs for valid values.
									</small>
								</div>
								<div style={styles.inputGroup}>
									<label
										style={{
											...styles.labelText,
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
										}}
									>
										<input
											style={styles.checkbox}
											type="checkbox"
											checked={formData.verifyTlsCertificates}
											onChange={(e) =>
												setFormData({ ...formData, verifyTlsCertificates: e.target.checked })
											}
										/>
										Verify TLS Certificates
									</label>
									<small style={{ color: '#64748b', fontSize: '0.78rem' }}>
										Set false for self-signed certs / local dev.
									</small>
								</div>
								<div style={styles.inputGroup}>
									<label
										style={{
											...styles.labelText,
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
										}}
									>
										<input
											style={styles.checkbox}
											type="checkbox"
											checked={formData.enabled}
											onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
										/>
										Enabled
									</label>
								</div>
								<div style={styles.actionButtons}>
									<button
										type="button"
										style={styles.button('primary')}
										onClick={
											editingSubscription
												? () => handleUpdateSubscription(editingSubscription)
												: handleCreateSubscription
										}
										disabled={!formData.name || !formData.httpEndpointUrl || isLoadingSubscriptions}
									>
										{editingSubscription ? 'Update' : 'Create'} Subscription
									</button>
									<button
										type="button"
										style={styles.button('secondary')}
										onClick={handleCancelEdit}
									>
										Cancel
									</button>
								</div>
							</div>
						)}

						{hasWorkerToken && environmentId && (
							<div style={styles.sectionCard}>
								<div style={styles.sectionHeader}>
									<h2 style={styles.sectionTitle}>Webhook Subscriptions</h2>
								</div>
								{isLoadingSubscriptions ? (
									<p style={{ color: '#64748b' }}>Loading subscriptions...</p>
								) : subscriptions.length === 0 ? (
									<div style={styles.emptyState}>
										<FiServer size={48} />
										<h3>No webhook subscriptions</h3>
										<p>Create your first webhook subscription to start receiving events.</p>
									</div>
								) : (
									<div style={styles.subscriptionList}>
										{subscriptions.map((subscription) => (
											<div style={styles.subscriptionCard} key={subscription.id}>
												<div style={styles.subscriptionInfo}>
													<div style={styles.subscriptionName}>{subscription.name}</div>
													<div style={styles.subscriptionMeta}>
														<span style={styles.statusBadge(subscription.enabled)}>
															{subscription.enabled ? <FiCheckCircle /> : <FiX />}
															{subscription.enabled ? 'Enabled' : 'Disabled'}
														</span>
														<span>
															URL:{' '}
															{subscription.httpEndpoint?.url ||
																subscription.destination?.url ||
																'N/A'}
														</span>
														{subscription.format && <span>Format: {subscription.format}</span>}
														{((subscription.filterOptions?.includedActionTypes?.length ?? 0) > 0 ||
															(subscription.topics?.length ?? 0) > 0) && (
															<span style={{ fontSize: '0.78rem', color: '#64748b' }}>
																Events:{' '}
																{(
																	subscription.filterOptions?.includedActionTypes ||
																	subscription.topics ||
																	[]
																).join(', ')}
															</span>
														)}
													</div>
												</div>
												<div style={styles.subscriptionActions}>
													<button
														type="button"
														style={styles.button('secondary')}
														onClick={() => handleEditSubscription(subscription)}
													>
														<FiEdit />
													</button>
													<button
														type="button"
														style={styles.button('danger')}
														onClick={() => handleDeleteSubscription(subscription.id)}
													>
														<FiTrash2 />
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</>
				)}

				{activeTab === 'events' && (
					<>
						<div
							style={{
								background: '#fef3c7',
								border: '2px solid #f59e0b',
								borderRadius: '0.5rem',
								padding: '1.5rem',
								marginBottom: '2rem',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiAlertCircle color="#f59e0b" size={20} />
								<strong style={{ color: '#92400e', fontSize: '1rem' }}>
									Webhook Configuration URL
								</strong>
							</div>
							<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
								<div
									style={{
										background: 'white',
										border: '1px solid #f59e0b',
										borderRadius: '0.375rem',
										padding: '0.75rem 1rem',
										flex: 1,
										fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
										fontSize: '0.875rem',
										wordBreak: 'break-all',
									}}
								>
									{window.location.origin}/api/webhooks/pingone
								</div>
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/pingone`);
										v4ToastManager.showSuccess('Webhook URL copied to clipboard');
									}}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.75rem 1.5rem',
										background: '#f59e0b',
										color: 'white',
										border: 'none',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
										fontWeight: 600,
										cursor: 'pointer',
									}}
								>
									<FiCopy />
									Copy URL
								</button>
							</div>
							<p style={{ color: '#92400e', fontSize: '0.875rem', margin: '1rem 0 0 0' }}>
								Copy this URL and paste it into the "Destination URL" field in your PingOne webhook
								configuration.
							</p>
						</div>

						<div style={{ marginBottom: '1rem' }}>
							<p style={{ color: '#64748b', fontSize: '0.875rem' }}>
								Monitor PingOne webhook events in real-time. Configure the webhook URL above in
								PingOne, then start monitoring to see events as they arrive.
							</p>
							{isActive && (
								<p
									style={{
										color: '#10b981',
										fontSize: '0.875rem',
										marginTop: '0.5rem',
										fontWeight: 500,
									}}
								>
									✓ Monitoring active - Polling for new events every 3 seconds
								</p>
							)}
						</div>

						{webhooks.length > 0 && (
							<div style={styles.filterBar}>
								<FiFilter size={20} color="#64748b" />
								<label style={styles.filterLabel}>
									Status:
									<select
										style={styles.filterSelect}
										value={filter}
										onChange={(e) => setFilter(e.target.value)}
									>
										<option value="all">All ({webhooks.length})</option>
										<option value="success">
											Success ({webhooks.filter((w) => w.status === 'success').length})
										</option>
										<option value="error">
											Errors ({webhooks.filter((w) => w.status === 'error').length})
										</option>
										<option value="pending">
											Pending ({webhooks.filter((w) => w.status === 'pending').length})
										</option>
									</select>
								</label>
								<label style={styles.filterLabel}>
									<FiCalendar />
									Time:
									<select
										style={styles.filterSelect}
										value={timeFilter}
										onChange={(e) => setTimeFilter(e.target.value)}
									>
										<option value="all">All Time</option>
										<option value="1h">Last Hour</option>
										<option value="24h">Last 24 Hours</option>
										<option value="7d">Last 7 Days</option>
										<option value="30d">Last 30 Days</option>
									</select>
								</label>
								<label style={styles.filterLabel}>
									<FiTag />
									Type:
									<select
										style={styles.filterSelect}
										value={typeFilter}
										onChange={(e) => setTypeFilter(e.target.value)}
									>
										<option value="all">All Types ({eventTypes.length})</option>
										{eventTypes.map((type) => (
											<option key={type} value={type}>
												{type} ({webhooks.filter((w) => w.type === type).length})
											</option>
										))}
									</select>
								</label>
								<label style={styles.filterLabel}>
									<FiTag />
									Display Format:
									<select
										style={styles.filterSelect}
										value={displayFormat}
										onChange={(e) =>
											setDisplayFormat(e.target.value as 'json' | 'splunk' | 'new_relic')
										}
									>
										<option value="json">Raw JSON</option>
										<option value="splunk">Splunk Format</option>
										<option value="ping-activity">Ping Activity JSON</option>
										<option value="new-relic">New Relic Format</option>
									</select>
								</label>
								{(filter !== 'all' || typeFilter !== 'all' || timeFilter !== 'all') && (
									<button
										type="button"
										style={styles.clearFiltersButton}
										onClick={handleClearFilters}
									>
										<FiX />
										Clear Filters
									</button>
								)}
							</div>
						)}

						<div style={styles.webhookContainer}>
							{filteredWebhooks.length === 0 ? (
								<div style={styles.emptyState}>
									<FiServer size={48} />
									<h3>
										{webhooks.length === 0 ? 'No webhooks yet' : 'No webhooks match your filters'}
									</h3>
									<p>
										{webhooks.length === 0
											? isActive
												? 'Waiting for webhook events...'
												: 'Click "Start Monitoring" to begin receiving webhook events.'
											: 'Try adjusting your filters to see more results.'}
									</p>
								</div>
							) : (
								filteredWebhooks.map((webhook) => (
									<div key={webhook.id} style={styles.webhookCard}>
										<div style={styles.webhookHeader}>
											<div style={styles.webhookTitle}>
												<span style={styles.eventStatusBadge(webhook.status)}>
													{webhook.status === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
													{webhook.status}
												</span>
												<span>{webhook.type}</span>
											</div>
											<div style={styles.webhookMeta}>
												<FiClock size={16} />
												{formatTimestamp(webhook.timestamp)}
												<FiTag size={16} />
												{webhook.source}
											</div>
										</div>
										<div style={styles.webhookBody}>
											<pre>{formatData(webhook.data, webhook)}</pre>
										</div>
									</div>
								))
							)}
						</div>
					</>
				)}

				<SuperSimpleApiDisplayV8 flowFilter="all" reserveSpace={true} />
				<ApiCallList title="API Calls to PingOne" showLegend={true} />
			</div>
		</div>
	);
};

export default PingOneWebhookViewer;
