// src/pages/PingOneAuditActivities.tsx
// Visual explorer for PingOne Audit Activities API
// Cache bust: 2025-02-17-11:32viewer with filtering - matching Identity Metrics page design

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiActivity,
	FiAlertCircle,
	FiBarChart,
	FiBarChart2,
	FiCheck,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiDatabase,
	FiEye,
	FiFilter,
	FiGlobe,
	FiInfo,
	FiRefreshCw,
	FiServer,
	FiShield,
	FiUser,
	FiX
} from 'react-icons/fi';
import ApiCallList from '../components/ApiCallList';
import JSONHighlighter, { type JSONData } from '../components/JSONHighlighter';
import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';
import { apiCallTrackerService } from '../services/apiCallTrackerService';
import { apiRequestModalService } from '../services/apiRequestModalService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

const styles = {
	pageContainer: {
		maxWidth: '90rem',
		margin: '0 auto',
		padding: '2rem 1.5rem 4rem',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1.75rem',
		width: '100%',
	},
	headerCard: {
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1rem',
		padding: '1.75rem',
		borderRadius: '1rem',
		background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		border: '1px solid rgba(220, 38, 38, 0.4)',
	},
	titleRow: {
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.75rem',
		color: '#ffffff',
	},
	title: {
		margin: 0,
		fontSize: '1.75rem',
		fontWeight: 700,
		color: '#ffffff',
	} as React.CSSProperties,
	subtitle: {
		margin: 0,
		color: 'rgba(255, 255, 255, 0.85)',
		maxWidth: '720px',
		lineHeight: 1.6,
	} as React.CSSProperties,
	layoutGrid: {
		display: 'grid' as const,
		gridTemplateColumns: '280px 1fr',
		gap: '2rem',
	},
	card: {
		background: '#ffffff',
		borderRadius: '1rem',
		border: '1px solid #e2e8f0',
		boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
		overflow: 'hidden' as const,
		padding: '1.5rem',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1.25rem',
	},
	sectionTitle: {
		margin: 0,
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		fontSize: '1.1rem',
		fontWeight: 600,
		color: '#0f172a',
	} as React.CSSProperties,
	fieldGroup: {
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '0.5rem',
	},
	label: {
		fontWeight: 600,
		fontSize: '0.85rem',
		color: '#334155',
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.35rem',
	} as React.CSSProperties,
	select: {
		width: '100%',
		padding: '0.75rem 0.85rem',
		borderRadius: '0.75rem',
		border: '1px solid #cbd5f5',
		background: '#f8fafc',
		fontSize: '0.92rem',
		cursor: 'pointer' as const,
	},
	hint: {
		margin: 0,
		fontSize: '0.8rem',
		color: '#64748b',
	} as React.CSSProperties,
	buttonRow: {
		display: 'flex' as const,
		flexWrap: 'wrap' as const,
		gap: '0.75rem',
	},
	primaryButton: (disabled?: boolean): React.CSSProperties => ({
		border: 'none',
		borderRadius: '0.75rem',
		padding: '0.85rem 1.35rem',
		background: disabled ? '#cbd5f5' : '#2563eb',
		color: 'white',
		fontWeight: 600,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		cursor: disabled ? 'not-allowed' : 'pointer',
	}),
	dangerButton: {
		border: 'none',
		borderRadius: '0.75rem',
		padding: '0.85rem 1.35rem',
		background: '#ef4444',
		color: 'white',
		fontWeight: 600,
		display: 'inline-flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		cursor: 'pointer' as const,
	},
	secondaryButton: {
		border: '1px solid #cbd5f5',
		borderRadius: '0.75rem',
		padding: '0.85rem 1.35rem',
		background: 'white',
		color: '#1e293b',
		fontWeight: 600,
		display: 'inline-flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		cursor: 'pointer' as const,
	},
	warningBanner: {
		padding: '1rem',
		background: '#fef3c7',
		border: '1px solid #fbbf24',
		borderRadius: '0.75rem',
		marginBottom: '1rem',
	},
	errorBanner: {
		padding: '1rem',
		background: '#fee2e2',
		border: '1px solid #f87171',
		borderRadius: '0.75rem',
		marginBottom: '1rem',
		display: 'flex' as const,
		alignItems: 'flex-start' as const,
		gap: '0.75rem',
		color: '#dc2626',
		fontSize: '0.875rem',
	},
	resultContainer: {
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1.25rem',
	},
	emptyState: {
		textAlign: 'center' as const,
		padding: '3rem 2rem',
		color: '#6b7280',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		alignItems: 'center' as const,
		gap: '0.75rem',
	},
	activityCard: (clickable?: boolean): React.CSSProperties => ({
		padding: '0.75rem',
		border: '1px solid #e5e7eb',
		borderRadius: '0.5rem',
		background: '#f9fafb',
		cursor: clickable ? 'pointer' : 'default',
	}),
	activityRow: {
		display: 'flex' as const,
		justifyContent: 'space-between' as const,
		alignItems: 'flex-start' as const,
		gap: '1rem',
		marginBottom: '0.5rem',
	},
	activityMain: {
		flex: 1,
	},
	activityMeta: {
		display: 'flex' as const,
		flexDirection: 'column' as const,
		alignItems: 'flex-end' as const,
		gap: '0.25rem',
		fontSize: '0.75rem',
		color: '#6b7280',
	},
	activityDetails: {
		display: 'flex' as const,
		flexWrap: 'wrap' as const,
		gap: '0.75rem',
		marginTop: '0.5rem',
		fontSize: '0.8rem',
	},
	detailBadge: (color?: string): React.CSSProperties => ({
		padding: '0.25rem 0.5rem',
		borderRadius: '0.375rem',
		background: color || '#e5e7eb',
		color:
			color === '#d1fae5'
				? '#065f46'
				: color === '#fee2e2'
					? '#dc2626'
					: color === '#dbeafe'
						? '#1e40af'
						: color === '#e0f2fe'
							? '#0369a1'
							: '#374151',
		fontWeight: 500,
		display: 'inline-flex' as const,
		alignItems: 'center' as const,
		gap: '0.25rem',
	}),
	detailModalOverlay: (isOpen: boolean): React.CSSProperties => ({
		position: 'fixed',
		inset: 0,
		background: 'rgba(15, 23, 42, 0.6)',
		display: isOpen ? 'flex' : 'none',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2000,
		padding: '2rem',
		backdropFilter: 'blur(4px)',
	}),
	detailModalContent: {
		background: 'white',
		borderRadius: '1rem',
		boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)',
		maxWidth: '900px',
		width: '100%',
		maxHeight: '90vh',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		overflow: 'hidden' as const,
	},
	detailModalHeader: {
		padding: '1.5rem',
		borderBottom: '1px solid #e2e8f0',
		display: 'flex' as const,
		justifyContent: 'space-between' as const,
		alignItems: 'flex-start' as const,
		gap: '1rem',
		background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
	},
	detailModalTitle: {
		margin: 0,
		fontSize: '1.25rem',
		fontWeight: 700,
		color: '#1e293b',
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
	} as React.CSSProperties,
	closeButton: {
		background: 'none',
		border: 'none',
		color: '#64748b',
		cursor: 'pointer' as const,
		padding: '0.5rem',
		display: 'flex' as const,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		borderRadius: '0.5rem',
		fontSize: '1.5rem',
		lineHeight: '1',
	},
	detailModalBody: {
		padding: '1.5rem',
		overflowY: 'auto' as const,
		flex: 1,
	},
	detailSection: {
		marginBottom: '1.5rem',
	},
	detailSectionTitle: {
		margin: '0 0 0.75rem 0',
		fontSize: '1rem',
		fontWeight: 600,
		color: '#334155',
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		paddingBottom: '0.5rem',
		borderBottom: '2px solid #e2e8f0',
	} as React.CSSProperties,
	detailGrid: {
		display: 'grid' as const,
		gridTemplateColumns: '140px 1fr',
		gap: '0.75rem',
		fontSize: '0.875rem',
	},
	detailLabel: {
		fontWeight: 600,
		color: '#64748b',
		padding: '0.5rem',
		background: '#f8fafc',
		borderRadius: '0.375rem',
	},
	detailValue: {
		color: '#1e293b',
		padding: '0.5rem',
		wordBreak: 'break-word' as const,
	},
	detailValueCode: {
		color: '#1e293b',
		padding: '0.5rem',
		wordBreak: 'break-word' as const,
		fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
		fontSize: '0.8rem',
		background: '#f8fafc',
		borderRadius: '0.375rem',
		border: '1px solid #e2e8f0',
	},
	detailModalFooter: {
		padding: '1rem 1.5rem',
		borderTop: '1px solid #e2e8f0',
		background: '#f8fafc',
		display: 'flex' as const,
		justifyContent: 'flex-end' as const,
		gap: '0.75rem',
	},
	copyButton: {
		border: '1px solid #cbd5e1',
		borderRadius: '0.5rem',
		padding: '0.5rem 1rem',
		background: 'white',
		color: '#475569',
		fontWeight: 600,
		fontSize: '0.875rem',
		display: 'inline-flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		cursor: 'pointer' as const,
	},
};

interface AuditActivity {
	id: string;
	action: {
		type: string;
		description?: string;
		[key: string]: unknown;
	};
	createdAt: string;
	result?: {
		status?: string;
		description?: string;
		error?: {
			code?: string;
			message?: string;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	actors?: {
		client?: {
			name?: string;
			id?: string;
			type?: string;
			[key: string]: unknown;
		};
		user?: {
			name?: string;
			id?: string;
			username?: string;
			email?: string;
			[key: string]: unknown;
		};
		system?: {
			name?: string;
			id?: string;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	resources?: Array<{
		type?: string;
		name?: string;
		id?: string;
		[key: string]: unknown;
	}>;
	environment?: {
		id?: string;
		name?: string;
		[key: string]: unknown;
	};
	organization?: {
		id?: string;
		name?: string;
		[key: string]: unknown;
	};
	target?: {
		type?: string;
		id?: string;
		name?: string;
		[key: string]: unknown;
	};
	correlationId?: string;
	ipAddress?: string;
	userAgent?: string;
	[key: string]: unknown;
}

interface AuditResponse {
	_embedded: {
		activities: AuditActivity[];
	};
	count?: number;
	_count?: number;
	[key: string]: unknown;
}

const PingOneAuditActivities: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [activities, setActivities] = useState<AuditActivity[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [auditResponse, setAuditResponse] = useState<AuditResponse | null>(null);

	// Read worker token via unifiedWorkerTokenService (dual storage: IndexedDB + SQLite)
	const [workerToken, setWorkerToken] = useState<string>(() => {
		const data = unifiedWorkerTokenService.getTokenDataSync();
		return data?.token ?? '';
	});
	const hasWorkerToken = workerToken.length > 0;

	const [environmentId, setEnvironmentId] = useState<string>(() => readBestEnvironmentId());

	// Filter state
	const [actionType, setActionType] = useState('');
	const [limit, setLimit] = useState('25');
	const [actorId, setActorId] = useState('');
	const [actorType, setActorType] = useState<'user' | 'client'>('user');
	const [correlationId, setCorrelationId] = useState('');

	// View mode: 'list' or 'single'
	const [viewMode, setViewMode] = useState<'list' | 'single'>('list');
	const [singleActivityId, setSingleActivityId] = useState('');

	// Detail modal state
	const [selectedActivity, setSelectedActivity] = useState<AuditActivity | null>(null);
	const [copiedJson, setCopiedJson] = useState(false);

	const handleClearWorkerToken = () => {
		unifiedWorkerTokenService.clearToken();
		setWorkerToken('');
		v4ToastManager.showSuccess('Worker token cleared successfully.');
		// Trigger page reload to reset state
		window.location.reload();
	};

	// Update environment ID and workerToken when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = () => {
			const data = unifiedWorkerTokenService.getTokenDataSync();
			if (data) {
				if (data.credentials?.environmentId && !environmentId) {
					setEnvironmentId(data.credentials.environmentId);
				}
				if (data.token) {
					setWorkerToken(data.token);
				}
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [environmentId]);

	// Execute the actual API call (called after user confirms in modal)
	const executeApiCall = useCallback(async () => {
		// Load region from worker_credentials
		const workerCredsStr = localStorage.getItem('worker_credentials');
		const workerCreds = workerCredsStr ? JSON.parse(workerCredsStr) : null;
		const region = (workerCreds?.region as string) || 'us';
		const effectiveWorkerToken = workerToken || '';

		setLoading(true);
		setError(null);

		console.log('[Audit Activities] 🌍 Making API request with region:', region);
		console.log('[Audit Activities] 📦 Environment ID:', environmentId.trim());

		let callId: string | null = null;

		try {
			// Build filter string
			// Note: PingOne Audit API limitations:
			// - Does not support 'gt' operator for createdAt
			// - Does not support result.status filtering
			// - Does not support actors.user.username or actors.user.email
			// - Does not support resources[id eq ...] syntax
			// We can only filter by: action.type, actors.user.id, actors.client.id, and correlationId
			const filters: string[] = [];

			if (actionType) {
				filters.push(`action.type eq "${actionType}"`);
			}

			// Note: result.status filtering is NOT supported by PingOne Audit API
			// Causes error: "Attribute 'result.status' is not supported in filter"
			// if (resultStatus) {
			// 	filters.push(`result.status eq "${resultStatus}"`);
			// }

			if (actorId) {
				// Filter by the selected actor type (only ID is supported by PingOne API)
				if (actorType === 'user') {
					filters.push(`actors.user.id eq "${actorId}"`);
				} else {
					filters.push(`actors.client.id eq "${actorId}"`);
				}
			}

			// Note: Resource ID filtering is not supported by PingOne API
			// Causes backend error: "Cannot invoke textValue() because getComparisonValue() is null"
			// if (resourceId) {
			// 	filters.push(`resources[id eq "${resourceId}"]`);
			// }

			if (correlationId) {
				filters.push(`correlationId eq "${correlationId}"`);
			}

			const filterParam = filters.length > 0 ? filters.join(' and ') : undefined;

			// Construct region-specific API endpoint
			const regionDomains: Record<string, string> = {
				us: 'api.pingone.com',
				na: 'api.pingone.com',
				eu: 'api.pingone.eu',
				ap: 'api.pingone.asia',
				ca: 'api.pingone.ca',
				asia: 'api.pingone.asia',
			};
			const domain = regionDomains[region.toLowerCase()] || 'api.pingone.com';
			const baseUrl = `https://${domain}/v1`;

			let urlString: string;

			if (viewMode === 'single' && singleActivityId.trim()) {
				// GET single activity by ID
				urlString = `${baseUrl}/environments/${environmentId.trim()}/activities/${singleActivityId.trim()}`;
			} else {
				// GET list of activities with filters
				const url = new URL(`${baseUrl}/environments/${environmentId.trim()}/activities`);
				if (filterParam) url.searchParams.append('filter', filterParam);
				url.searchParams.append('limit', limit);
				url.searchParams.append('order', 'createdAt DESC');
				urlString = url.toString();
			}

			// Track API call
			callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: urlString,
				headers: {
					Authorization: `Bearer ${effectiveWorkerToken.substring(0, 20)}...`,
					'Content-Type': 'application/json',
				},
			});

			const response = await fetch(urlString, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${effectiveWorkerToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				if (response.status === 403) {
					throw new Error('PERMISSIONS_ERROR');
				}
				const problem = await response.json().catch(() => ({}));
				const errorMessage = problem.message || problem.error_description || response.statusText;
				// Check if the error is about unsupported filter attributes
				if (
					errorMessage &&
					typeof errorMessage === 'string' &&
					errorMessage.includes('not supported in filter')
				) {
					throw new Error(`Invalid Filter: ${errorMessage}`);
				}
				throw new Error(errorMessage);
			}

			const data: AuditResponse | AuditActivity = await response.json();

			let retrievedCount = 0;

			// Handle single activity response vs list response
			if (viewMode === 'single' && singleActivityId.trim()) {
				// Single activity response
				const singleActivity = data as AuditActivity;
				setActivities([singleActivity]);
				setTotalCount(1);
				setAuditResponse({
					_embedded: { activities: [singleActivity] },
					count: 1,
					_count: 1,
				});
				retrievedCount = 1;
			} else {
				// List response
				const listData = data as AuditResponse;
				const activitiesList = listData._embedded?.activities || [];
				setActivities(activitiesList);
				// Use _count if available, otherwise use count, or fall back to activities length
				const apiCount = listData._count ?? listData.count;
				setTotalCount(apiCount && apiCount > 0 ? apiCount : activitiesList.length);
				setAuditResponse(listData);
				retrievedCount = activitiesList.length;
			}

			setLastUpdated(new Date().toISOString());

			// Update API call tracking with response
			apiCallTrackerService.updateApiCallResponse(callId, {
				status: response.status,
				statusText: response.statusText,
				data: data,
				headers: Object.fromEntries(response.headers.entries()),
			});

			v4ToastManager.showSuccess(
				`Retrieved ${retrievedCount} audit ${retrievedCount === 1 ? 'activity' : 'activities'}`
			);
		} catch (err) {
			console.error('[Audit Activities] Fetch failed:', err);
			setActivities([]);
			setTotalCount(0);
			setAuditResponse(null);
			setLastUpdated(null);

			// Update API call tracking with error
			if (callId) {
				apiCallTrackerService.updateApiCallResponse(callId, {
					status: err instanceof Error && err.message === 'PERMISSIONS_ERROR' ? 403 : 500,
					statusText: err instanceof Error ? err.message : 'Unknown error',
					error: err instanceof Error ? err.message : 'Unexpected error',
				});
			}

			if (err instanceof Error && err.message === 'PERMISSIONS_ERROR') {
				setError(
					'Worker token lacks required permissions. Ensure your Worker App has the "p1:read:audit" scope.'
				);
			} else {
				setError(err instanceof Error ? err.message : 'Unexpected error querying audit activities');
			}
		} finally {
			setLoading(false);
		}
	}, [
		actionType,
		actorId,
		actorType,
		correlationId,
		limit,
		viewMode,
		singleActivityId,
		environmentId,
		workerToken,
	]);

	// Show educational modal before making the API call
	const handleFetch = useCallback(async () => {
		// Load region from worker_credentials
		const workerCredsStr = localStorage.getItem('worker_credentials');
		const workerCreds = workerCredsStr ? JSON.parse(workerCredsStr) : null;
		const region = (workerCreds?.region as string) || 'us';

		if (!environmentId.trim()) {
			setError(
				'Environment ID is required. Please enter your PingOne Environment ID in the field above, or click "Get Worker Token" to automatically load it from your credentials.'
			);
			return;
		}

		const effectiveWorkerToken = workerToken || undefined;

		console.log('[Audit Activities] 🔍 Using token for API call:', {
			hasToken: !!effectiveWorkerToken,
			tokenPreview: effectiveWorkerToken ? `${effectiveWorkerToken.substring(0, 20)}...` : 'none',
			environmentId: `${environmentId.substring(0, 20)}...`,
		});

		if (!effectiveWorkerToken) {
			setError('Worker token required. Use the Worker Token section to generate one.');
			return;
		}

		// Build API URL for display
		const regionMap: Record<string, string> = {
			us: 'https://api.pingone.com',
			na: 'https://api.pingone.com',
			eu: 'https://api.pingone.eu',
			ca: 'https://api.pingone.ca',
			ap: 'https://api.pingone.asia',
			asia: 'https://api.pingone.asia',
		};
		const baseUrl = regionMap[region.toLowerCase()] || regionMap.na;

		let pingOneApiUrl: string;

		if (viewMode === 'single' && singleActivityId.trim()) {
			// Single activity endpoint
			pingOneApiUrl = `${baseUrl}/v1/environments/${environmentId.trim()}/activities/${singleActivityId.trim()}`;
		} else {
			// Build filter string for list endpoint
			// Note: PingOne Audit API limitations:
			// - Does not support 'gt' operator for createdAt
			// - Does not support result.status filtering
			// - Does not support actors.user.username or actors.user.email
			// - Does not support resources[id eq ...] syntax
			// We can only filter by: action.type, actors.user.id, actors.client.id, and correlationId
			const filters: string[] = [];
			if (actionType) {
				filters.push(`action.type eq "${actionType}"`);
			}
			// Note: result.status filtering is NOT supported by PingOne Audit API
			// if (resultStatus) {
			// 	filters.push(`result.status eq "${resultStatus}"`);
			// }
			if (actorId) {
				if (actorType === 'user') {
					filters.push(`actors.user.id eq "${actorId}"`);
				} else {
					filters.push(`actors.client.id eq "${actorId}"`);
				}
			}
			// Note: Resource ID filtering is not supported by PingOne API
			// if (resourceId) {
			// 	filters.push(`resources[id eq "${resourceId}"]`);
			// }
			if (correlationId) {
				filters.push(`correlationId eq "${correlationId}"`);
			}

			const queryParams = new URLSearchParams();
			if (filters.length > 0) {
				queryParams.append('filter', filters.join(' and '));
			}
			queryParams.append('limit', limit);
			queryParams.append('order', 'createdAt DESC');

			pingOneApiUrl = `${baseUrl}/v1/environments/${environmentId.trim()}/activities?${queryParams.toString()}`;
		}

		const educationalNotes =
			viewMode === 'single' && singleActivityId.trim()
				? [
						'Retrieves a single audit activity by its unique ID',
						'Returns detailed information about the specific activity',
						'Requires p1:read:audit scope in your worker token',
						'Useful for deep-diving into specific audit events',
					]
				: [
						'This endpoint returns audit events from your PingOne environment',
						'Uses OData filtering syntax for action.type, actors.user.id, actors.client.id, and correlationId',
						'Note: PingOne API does NOT support filtering by result.status, actors.user.username, actors.user.email, or resources',
						'Note: Time-based filtering (createdAt gt) is also not supported',
						'Results are ordered by createdAt in descending order (newest first)',
						'Requires p1:read:audit scope in your worker token',
						'Use filters to narrow down activities by action type, actor ID, or correlation ID',
					];

		// Show educational modal
		apiRequestModalService.showModal({
			type: 'data_api_get',
			method: 'GET',
			url: pingOneApiUrl,
			headers: {
				Authorization: `Bearer ${effectiveWorkerToken}`,
				Accept: 'application/json',
			},
			description: 'Retrieve audit activities from your PingOne environment with filtering',
			educationalNotes,
			onProceed: executeApiCall,
		});
	}, [
		actionType,
		actorId,
		actorType,
		correlationId,
		limit,
		viewMode,
		singleActivityId,
		environmentId,
		executeApiCall,
		workerToken,
	]);

	const formattedResponse = useMemo<JSONData | null>(() => {
		if (!auditResponse) return null;
		return JSON.parse(JSON.stringify(auditResponse)) as JSONData;
	}, [auditResponse]);

	// Calculate summary statistics
	const summary = useMemo(() => {
		if (!activities || activities.length === 0) return null;

		const successCount = activities.filter((a) => a.result?.status === 'success').length;
		const failureCount = activities.filter((a) => a.result?.status === 'failure').length;
		const uniqueActionTypes = new Set(activities.map((a) => a.action.type)).size;
		const uniqueUsers = new Set(activities.map((a) => a.actors?.user?.id).filter(Boolean)).size;

		return {
			total: activities.length,
			success: successCount,
			failure: failureCount,
			uniqueActionTypes,
			uniqueUsers,
		};
	}, [activities]);

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	};

	const handleActivityClick = (activity: AuditActivity) => {
		setSelectedActivity(activity);
		setCopiedJson(false);
	};

	const handleCloseDetailModal = () => {
		setSelectedActivity(null);
		setCopiedJson(false);
	};

	const handleCopyJson = () => {
		if (selectedActivity) {
			navigator.clipboard.writeText(JSON.stringify(selectedActivity, null, 2));
			setCopiedJson(true);
			v4ToastManager.showSuccess('Activity JSON copied to clipboard');
			setTimeout(() => setCopiedJson(false), 2000);
		}
	};

	const renderDetailValue = (value: unknown): React.ReactNode => {
		if (value === null || value === undefined) {
			return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not available</span>;
		}
		if (typeof value === 'object' && !Array.isArray(value)) {
			return <div style={styles.detailValueCode}>{JSON.stringify(value, null, 2)}</div>;
		}
		if (Array.isArray(value)) {
			if (value.length === 0) {
				return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Empty array</span>;
			}
			return (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
					{value.map((item, idx) => (
						<div
							key={idx}
							style={{
								padding: '0.5rem',
								background: '#f8fafc',
								borderRadius: '0.375rem',
								border: '1px solid #e2e8f0',
							}}
						>
							{typeof item === 'object' ? (
								<div style={styles.detailValueCode}>{JSON.stringify(item, null, 2)}</div>
							) : (
								<div style={styles.detailValue}>{String(item)}</div>
							)}
						</div>
					))}
				</div>
			);
		}
		return <div style={styles.detailValue}>{String(value)}</div>;
	};

	return (
		<div style={styles.pageContainer}>
			<div style={styles.headerCard}>
				<div style={styles.titleRow}>
					<FiActivity size={24} />
					<h1 style={styles.title}>PingOne Audit Activities</h1>
				</div>
				<p style={styles.subtitle}>
					Query and analyze audit events from your PingOne environment. Retrieve activities by ID,
					filter by action type, status, actor, resource, or correlation ID. Track user actions,
					system events, and security activities. Requires <strong>p1:read:audit</strong> scope.
				</p>
				{!hasWorkerToken && (
					<div style={styles.warningBanner}>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
							<FiAlertCircle size={20} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
							<div style={{ flex: 1 }}>
								<strong>Worker Token Required</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Use the Worker Token section below to generate a token with your PingOne
									credentials.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			<div style={styles.layoutGrid}>
				<div style={styles.card}>
					<h2 style={styles.sectionTitle}>
						<FiShield /> Authentication & Configuration
					</h2>

					<div style={styles.fieldGroup}>
						<label htmlFor="audit-env-id" style={styles.label}>
							Environment ID
						</label>
						<input
							id="audit-env-id"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="Enter PingOne Environment ID (e.g., 12345678-1234-1234-1234-123456789abc)"
							style={{
								width: '100%',
								padding: '0.75rem 0.85rem',
								borderRadius: '0.75rem',
								border: `1px solid ${!environmentId.trim() ? '#f59e0b' : '#cbd5f5'}`,
								background: !environmentId.trim() ? '#fffbeb' : '#f8fafc',
								fontSize: '0.92rem',
								fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
							}}
						/>
						{!environmentId.trim() ? (
							<p style={{ ...styles.hint, color: '#d97706', fontWeight: 600 }}>
								⚠️ Environment ID is required. Enter it manually or use the Worker Token section
								below to auto-fill.
							</p>
						) : (
							<p style={styles.hint}>
								Your PingOne Environment ID (automatically loaded from worker credentials)
							</p>
						)}
					</div>

					<WorkerTokenSectionV8 compact />

					{/* Configuration Checkboxes */}
					<div
						style={{
							marginBottom: '1rem',
							display: 'flex',
							flexDirection: 'column',
							gap: '0.75rem',
						}}
					>
						<SilentApiConfigCheckboxV8 />
						<ShowTokenConfigCheckboxV8 />
					</div>

					<div style={styles.buttonRow}>
						{hasWorkerToken && (
							<button style={styles.dangerButton} onClick={handleClearWorkerToken} type="button">
								<FiX /> Clear Token
							</button>
						)}
					</div>
				</div>

				<div style={styles.card}>
					<h2 style={styles.sectionTitle}>
						<FiFilter /> Query Configuration
					</h2>

					<div style={styles.fieldGroup}>
						<label htmlFor="audit-view-mode" style={styles.label}>
							View Mode
						</label>
						<select
							id="audit-view-mode"
							style={styles.select}
							value={viewMode}
							onChange={(e) => {
								setViewMode(e.target.value as 'list' | 'single');
								// Clear filters when switching modes
								if (e.target.value === 'single') {
									setActionType('');
									setActorId('');
									setActorType('user');
									setCorrelationId('');
								} else {
									setSingleActivityId('');
								}
							}}
						>
							<option value="list">List Activities (with filters)</option>
							<option value="single">Get Single Activity by ID</option>
						</select>
						<p style={styles.hint}>
							Choose whether to list multiple activities or retrieve a specific one by ID
						</p>
					</div>

					{viewMode === 'single' ? (
						<div style={styles.fieldGroup}>
							<label htmlFor="audit-activity-id" style={styles.label}>
								Activity ID
							</label>
							<input
								id="audit-activity-id"
								type="text"
								value={singleActivityId}
								onChange={(e) => setSingleActivityId(e.target.value)}
								placeholder="Enter activity ID (e.g., 12345678-1234-1234-1234-123456789abc)"
								style={{
									width: '100%',
									padding: '0.75rem 0.85rem',
									borderRadius: '0.75rem',
									border: '1px solid #cbd5f5',
									background: '#f8fafc',
									fontSize: '0.92rem',
									fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
								}}
							/>
							<p style={styles.hint}>Enter the unique ID of the activity you want to retrieve</p>
						</div>
					) : (
						<>
							<div style={styles.fieldGroup}>
								<label htmlFor="audit-action-type" style={styles.label}>
									Action Type
								</label>
								<select
									id="audit-action-type"
									style={styles.select}
									value={actionType}
									onChange={(e) => setActionType(e.target.value)}
								>
									<option value="">All Actions</option>
									<optgroup label="User Actions">
										<option value="USER.CREATED">User Created</option>
										<option value="USER.UPDATED">User Updated</option>
										<option value="USER.DELETED">User Deleted</option>
										<option value="USER.ACCESS_ALLOWED">User Access Allowed</option>
										<option value="USER.ACCESS_DENIED">User Access Denied</option>
									</optgroup>
									<optgroup label="Session Actions">
										<option value="SESSION.CREATED">Session Created</option>
										<option value="SESSION.DELETED">Session Deleted</option>
									</optgroup>
									<optgroup label="Application Actions">
										<option value="APPLICATION.CREATED">Application Created</option>
										<option value="APPLICATION.UPDATED">Application Updated</option>
										<option value="APPLICATION.DELETED">Application Deleted</option>
									</optgroup>
									<optgroup label="Token Actions">
										<option value="TOKEN.CREATED">Token Created</option>
										<option value="TOKEN.REVOKED">Token Revoked</option>
									</optgroup>
									<optgroup label="Authentication">
										<option value="AUTHENTICATION.SUCCESS">Authentication Success</option>
										<option value="AUTHENTICATION.FAILURE">Authentication Failure</option>
									</optgroup>
									<optgroup label="Role Actions">
										<option value="ROLE_ASSIGNMENT.CREATED">Role Assignment Created</option>
										<option value="ROLE_ASSIGNMENT.DELETED">Role Assignment Deleted</option>
									</optgroup>
								</select>
								<p style={styles.hint}>
									Filter by specific action type (e.g., USER.CREATED, SESSION.CREATED)
								</p>
							</div>

							<div style={styles.fieldGroup}>
								<label htmlFor="audit-actor-type" style={styles.label}>
									Actor Type
								</label>
								<select
									id="audit-actor-type"
									style={styles.select}
									value={actorType}
									onChange={(e) => setActorType(e.target.value as 'user' | 'client')}
								>
									<option value="user">User</option>
									<option value="client">Client (Application)</option>
								</select>
								<p style={styles.hint}>
									Select whether to filter by user ID or client (application) ID
								</p>
							</div>

							<div style={styles.fieldGroup}>
								<label htmlFor="audit-actor-id" style={styles.label}>
									{actorType === 'user' ? 'User ID' : 'Client ID'}
								</label>
								<input
									id="audit-actor-id"
									type="text"
									value={actorId}
									onChange={(e) => setActorId(e.target.value)}
									placeholder={
										actorType === 'user' ? 'Enter user ID (UUID)' : 'Enter client ID (UUID)'
									}
									style={{
										width: '100%',
										padding: '0.75rem 0.85rem',
										borderRadius: '0.75rem',
										border: '1px solid #cbd5f5',
										background: '#f8fafc',
										fontSize: '0.92rem',
										fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
									}}
								/>
								<p style={styles.hint}>
									{actorType === 'user'
										? 'Filter by user UUID (Note: username and email filtering not supported by PingOne API)'
										: 'Filter by client (application) UUID'}
								</p>
							</div>

							<div style={styles.fieldGroup}>
								<label htmlFor="audit-correlation-id" style={styles.label}>
									Correlation ID
								</label>
								<input
									id="audit-correlation-id"
									type="text"
									value={correlationId}
									onChange={(e) => setCorrelationId(e.target.value)}
									placeholder="e.g., abc123-correlation-id"
									style={{
										width: '100%',
										padding: '0.75rem 0.85rem',
										borderRadius: '0.75rem',
										border: '1px solid #cbd5f5',
										background: '#f8fafc',
										fontSize: '0.92rem',
										fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
									}}
								/>
								<p style={styles.hint}>
									Filter by correlation ID to track related activities across multiple audit events
								</p>
							</div>

							<div style={styles.fieldGroup}>
								<label htmlFor="audit-limit" style={styles.label}>
									Limit
								</label>
								<select
									id="audit-limit"
									style={styles.select}
									value={limit}
									onChange={(e) => setLimit(e.target.value)}
								>
									<option value="10">10 activities</option>
									<option value="25">25 activities</option>
									<option value="50">50 activities</option>
									<option value="100">100 activities</option>
									<option value="500">500 activities</option>
									<option value="1000">1000 activities</option>
								</select>
								<p style={styles.hint}>
									Maximum number of activities to retrieve (ordered by newest first)
								</p>
							</div>
							<div style={styles.fieldGroup}>
								<p
									style={{
										...styles.label,
										color: '#6b7280',
										fontSize: '0.75rem',
										fontWeight: 'normal',
									}}
								>
									Note: Time-based filtering is not supported by the PingOne Audit API. Results are
									ordered by newest first.
								</p>
							</div>
						</>
					)}

					<div style={styles.buttonRow}>
						<button
							type="button"
							style={styles.primaryButton(
								!hasWorkerToken ||
									loading ||
									!environmentId.trim() ||
									(viewMode === 'single' && !singleActivityId.trim())
							)}
							onClick={handleFetch}
							disabled={
								!hasWorkerToken ||
								loading ||
								!environmentId.trim() ||
								(viewMode === 'single' && !singleActivityId.trim())
							}
							title={
								!environmentId.trim()
									? 'Environment ID is required'
									: !hasWorkerToken
										? 'Worker token is required'
										: viewMode === 'single' && !singleActivityId.trim()
											? 'Activity ID is required'
											: ''
							}
						>
							{loading ? (
								<>
									<FiRefreshCw className="spin" /> Fetching…
								</>
							) : viewMode === 'single' ? (
								<>
									<FiEye /> Get Activity
								</>
							) : (
								<>
									<FiActivity /> Retrieve Activities
								</>
							)}
						</button>

						<button
							style={styles.secondaryButton}
							type="button"
							onClick={() => {
								if (viewMode === 'single') {
									setSingleActivityId('');
								} else {
									setActionType('');
									setActorId('');
									setActorType('user');
									setCorrelationId('');
									setLimit('25');
								}
							}}
						>
							<FiX /> {viewMode === 'single' ? 'Clear ID' : 'Reset Filters'}
						</button>
					</div>

					{error && (
						<div style={styles.errorBanner}>
							<FiInfo size={18} style={{ marginTop: '0.2rem' }} />
							<span>{error}</span>
						</div>
					)}

					<div style={styles.resultContainer}>
						{auditResponse ? (
							<>
								{summary && (
									<div
										style={{
											...styles.card,
											border: '1px solid #93c5fd',
											background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
										}}
									>
										<h2 style={styles.sectionTitle}>
											<FiBarChart2 /> Summary Statistics
										</h2>
										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
												gap: '1rem',
												marginTop: '1rem',
											}}
										>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #bfdbfe',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Total Activities
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>
													{summary.total}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #bfdbfe',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Successful
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
													{summary.success}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #bfdbfe',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Failed
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
													{summary.failure}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #bfdbfe',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Action Types
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>
													{summary.uniqueActionTypes}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #bfdbfe',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Unique Users
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>
													{summary.uniqueUsers}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #bfdbfe',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Total Count
												</div>
												<div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e40af' }}>
													{totalCount.toLocaleString()}
												</div>
											</div>
										</div>
										{lastUpdated && (
											<p
												style={{
													...styles.hint,
													marginTop: '1rem',
													paddingTop: '1rem',
													borderTop: '1px solid #bfdbfe',
												}}
											>
												Last updated: {new Date(lastUpdated).toLocaleString()}
											</p>
										)}
									</div>
								)}

								{activities.length > 0 && (
									<div
										style={{ ...styles.card, border: '1px solid #e2e8f0', background: '#ffffff' }}
									>
										<h2 style={styles.sectionTitle}>
											<FiActivity /> Activity Details{' '}
											{totalCount > activities.length
												? `(${activities.length} of ${totalCount})`
												: `(${activities.length})`}
										</h2>
										<div
											style={{
												display: 'flex',
												flexDirection: 'column',
												gap: '0.75rem',
												maxHeight: '400px',
												overflowY: 'auto',
												padding: '0.5rem',
											}}
										>
											{activities.map((activity) => (
												<button
													type="button"
													key={activity.id}
													style={{
														...styles.activityCard(true),
														border: 'none',
														cursor: 'pointer',
														textAlign: 'left',
														width: '100%',
													}}
													onClick={() => handleActivityClick(activity)}
												>
													<div style={styles.activityRow}>
														<div style={styles.activityMain}>
															<div
																style={{
																	fontWeight: 600,
																	color: '#1e293b',
																	fontSize: '0.9rem',
																	marginBottom: '0.25rem',
																}}
															>
																{activity.action.type}
															</div>
															{activity.action.description && (
																<div
																	style={{
																		fontSize: '0.8rem',
																		color: '#4b5563',
																		marginBottom: '0.5rem',
																	}}
																>
																	{activity.action.description}
																</div>
															)}
															<div style={styles.activityDetails}>
																{activity.result?.status && (
																	<span
																		style={styles.detailBadge(
																			activity.result.status?.toLowerCase() === 'success'
																				? '#d1fae5'
																				: '#fee2e2'
																		)}
																	>
																		{activity.result.status === 'success' ? (
																			<FiCheckCircle size={12} />
																		) : (
																			<FiAlertCircle size={12} />
																		)}
																		{activity.result.status.toUpperCase()}
																	</span>
																)}
																{activity.actors?.user?.name && (
																	<span style={styles.detailBadge('#dbeafe')}>
																		<FiUser size={12} />
																		{activity.actors.user.name}
																	</span>
																)}
																{activity.actors?.client?.name && (
																	<span style={styles.detailBadge('#e0f2fe')}>
																		<FiServer size={12} />
																		{activity.actors.client.name}
																	</span>
																)}
																{activity.resources && activity.resources.length > 0 && (
																	<span style={styles.detailBadge('#fef3c7')}>
																		<FiDatabase size={12} />
																		{activity.resources.length} resource
																		{activity.resources.length !== 1 ? 's' : ''}
																	</span>
																)}
																{activity.ipAddress && (
																	<span style={styles.detailBadge()}>
																		<FiGlobe size={12} />
																		{activity.ipAddress}
																	</span>
																)}
															</div>
														</div>
														<div style={styles.activityMeta}>
															<div
																style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
															>
																<FiClock size={12} />
																{formatTimestamp(activity.createdAt)}
															</div>
															<div
																style={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: '0.25rem',
																	marginTop: '0.25rem',
																	color: '#2563eb',
																}}
															>
																<FiEye size={12} />
																<span style={{ fontSize: '0.7rem' }}>View Details</span>
															</div>
														</div>
													</div>
												</button>
											))}
										</div>
									</div>
								)}

								<div style={{ ...styles.card, border: '1px solid #dbeafe', background: '#ffffff' }}>
									<h2 style={styles.sectionTitle}>
										<FiDatabase /> Full API Response
									</h2>
									{formattedResponse && (
										<div style={{ maxHeight: '600px', overflow: 'auto' }}>
											<JSONHighlighter data={formattedResponse} />
										</div>
									)}
								</div>
							</>
						) : (
							<div style={styles.emptyState}>
								<FiActivity size={22} />
								<span>Run the request to see audit activities returned by PingOne.</span>
							</div>
						)}
					</div>
				</div>
			</div>
			{/* Activity Detail Modal */}
			<div style={styles.detailModalOverlay(!!selectedActivity)}>
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Activity Details"
					style={styles.detailModalContent}
					onKeyDown={(e) => e.key === 'Escape' && handleCloseDetailModal()}
				>
					{selectedActivity && (
						<>
							<div style={styles.detailModalHeader}>
								<h2 style={styles.detailModalTitle}>
									<FiActivity size={24} />
									Activity Details
								</h2>
								<button type="button" style={styles.closeButton} onClick={handleCloseDetailModal}>
									<FiX />
								</button>
							</div>
							<div style={styles.detailModalBody}>
								{/* Basic Information */}
								<div style={styles.detailSection}>
									<h3 style={styles.detailSectionTitle}>
										<FiInfo /> Basic Information
									</h3>
									<div style={styles.detailGrid}>
										<div style={styles.detailLabel}>Activity ID</div>
										{renderDetailValue(selectedActivity.id)}
										<div style={styles.detailLabel}>Action Type</div>
										{renderDetailValue(selectedActivity.action.type)}
										{selectedActivity.action.description && (
											<>
												<div style={styles.detailLabel}>Description</div>
												{renderDetailValue(selectedActivity.action.description)}
											</>
										)}
										<div style={styles.detailLabel}>Created At</div>
										<div style={styles.detailValue}>
											{formatTimestamp(selectedActivity.createdAt)}
										</div>
									</div>
								</div>

								{/* Result Information */}
								{selectedActivity.result && (
									<div style={styles.detailSection}>
										<h3 style={styles.detailSectionTitle}>
											<FiCheckCircle /> Result
										</h3>
										<div style={styles.detailGrid}>
											<div style={styles.detailLabel}>Status</div>
											<div
												style={{
													...styles.detailValue,
													color:
														selectedActivity.result.status?.toLowerCase() === 'success'
															? '#10b981'
															: '#ef4444',
													fontWeight: 600,
												}}
											>
												{selectedActivity.result.status?.toUpperCase() || 'Unknown'}
											</div>
											{selectedActivity.result.description && (
												<>
													<div style={styles.detailLabel}>Description</div>
													{renderDetailValue(selectedActivity.result.description)}
												</>
											)}
											{selectedActivity.result.error && (
												<>
													<div style={styles.detailLabel}>Error Code</div>
													{renderDetailValue(selectedActivity.result.error.code)}
													<div style={styles.detailLabel}>Error Message</div>
													{renderDetailValue(selectedActivity.result.error.message)}
												</>
											)}
										</div>
									</div>
								)}

								{/* Actors Information */}
								{selectedActivity.actors && (
									<div style={styles.detailSection}>
										<h3 style={styles.detailSectionTitle}>
											<FiUser /> Actors
										</h3>
										<div style={styles.detailGrid}>
											{selectedActivity.actors.user && (
												<>
													<div style={styles.detailLabel}>User</div>
													<div>
														{selectedActivity.actors.user.name && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.actors.user.name}
															</div>
														)}
														{selectedActivity.actors.user.id && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>ID:</strong> {selectedActivity.actors.user.id}
															</div>
														)}
														{selectedActivity.actors.user.username && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>Username:</strong> {selectedActivity.actors.user.username}
															</div>
														)}
														{selectedActivity.actors.user.email && (
															<div style={styles.detailValue}>
																<strong>Email:</strong> {selectedActivity.actors.user.email}
															</div>
														)}
													</div>
												</>
											)}
											{selectedActivity.actors.client && (
												<>
													<div style={styles.detailLabel}>Client</div>
													<div>
														{selectedActivity.actors.client.name && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.actors.client.name}
															</div>
														)}
														{selectedActivity.actors.client.id && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>ID:</strong> {selectedActivity.actors.client.id}
															</div>
														)}
														{selectedActivity.actors.client.type && (
															<div style={styles.detailValue}>
																<strong>Type:</strong> {selectedActivity.actors.client.type}
															</div>
														)}
													</div>
												</>
											)}
											{selectedActivity.actors.system && (
												<>
													<div style={styles.detailLabel}>System</div>
													<div>
														{selectedActivity.actors.system.name && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.actors.system.name}
															</div>
														)}
														{selectedActivity.actors.system.id && (
															<div style={styles.detailValue}>
																<strong>ID:</strong> {selectedActivity.actors.system.id}
															</div>
														)}
													</div>
												</>
											)}
										</div>
									</div>
								)}

								{/* Resources Information */}
								{selectedActivity.resources && selectedActivity.resources.length > 0 && (
									<div style={styles.detailSection}>
										<h3 style={styles.detailSectionTitle}>
											<FiDatabase /> Resources ({selectedActivity.resources.length})
										</h3>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
											{selectedActivity.resources.map((resource, idx) => (
												<div
													key={idx}
													style={{
														padding: '0.75rem',
														background: '#f8fafc',
														borderRadius: '0.5rem',
														border: '1px solid #e2e8f0',
													}}
												>
													<div style={styles.detailGrid}>
														{resource.type && (
															<>
																<div style={styles.detailLabel}>Type</div>
																{renderDetailValue(resource.type)}
															</>
														)}
														{resource.name && (
															<>
																<div style={styles.detailLabel}>Name</div>
																{renderDetailValue(resource.name)}
															</>
														)}
														{resource.id && (
															<>
																<div style={styles.detailLabel}>ID</div>
																{renderDetailValue(resource.id)}
															</>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Request Context */}
								{(selectedActivity.ipAddress ||
									selectedActivity.userAgent ||
									selectedActivity.correlationId) && (
									<div style={styles.detailSection}>
										<h3 style={styles.detailSectionTitle}>
											<FiGlobe /> Request Context
										</h3>
										<div style={styles.detailGrid}>
											{selectedActivity.ipAddress && (
												<>
													<div style={styles.detailLabel}>IP Address</div>
													{renderDetailValue(selectedActivity.ipAddress)}
												</>
											)}
											{selectedActivity.userAgent && (
												<>
													<div style={styles.detailLabel}>User Agent</div>
													{renderDetailValue(selectedActivity.userAgent)}
												</>
											)}
											{selectedActivity.correlationId && (
												<>
													<div style={styles.detailLabel}>Correlation ID</div>
													{renderDetailValue(selectedActivity.correlationId)}
												</>
											)}
										</div>
									</div>
								)}

								{/* Environment & Organization */}
								{(selectedActivity.environment || selectedActivity.organization) && (
									<div style={styles.detailSection}>
										<h3 style={styles.detailSectionTitle}>
											<FiShield /> Context
										</h3>
										<div style={styles.detailGrid}>
											{selectedActivity.environment && (
												<>
													<div style={styles.detailLabel}>Environment</div>
													<div>
														{selectedActivity.environment.name && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.environment.name}
															</div>
														)}
														{selectedActivity.environment.id && (
															<div style={styles.detailValue}>
																<strong>ID:</strong> {selectedActivity.environment.id}
															</div>
														)}
													</div>
												</>
											)}
											{selectedActivity.organization && (
												<>
													<div style={styles.detailLabel}>Organization</div>
													<div>
														{selectedActivity.organization.name && (
															<div style={{ ...styles.detailValue, marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.organization.name}
															</div>
														)}
														{selectedActivity.organization.id && (
															<div style={styles.detailValue}>
																<strong>ID:</strong> {selectedActivity.organization.id}
															</div>
														)}
													</div>
												</>
											)}
										</div>
									</div>
								)}

								{/* Target */}
								{selectedActivity.target && (
									<div style={styles.detailSection}>
										<h3 style={styles.detailSectionTitle}>
											<FiDatabase /> Target
										</h3>
										<div style={styles.detailGrid}>
											{selectedActivity.target.type && (
												<>
													<div style={styles.detailLabel}>Type</div>
													{renderDetailValue(selectedActivity.target.type)}
												</>
											)}
											{selectedActivity.target.name && (
												<>
													<div style={styles.detailLabel}>Name</div>
													{renderDetailValue(selectedActivity.target.name)}
												</>
											)}
											{selectedActivity.target.id && (
												<>
													<div style={styles.detailLabel}>ID</div>
													{renderDetailValue(selectedActivity.target.id)}
												</>
											)}
										</div>
									</div>
								)}

								{/* Raw JSON */}
								<div style={styles.detailSection}>
									<h3 style={styles.detailSectionTitle}>
										<FiDatabase /> Complete JSON
									</h3>
									<div
										style={{
											maxHeight: '400px',
											overflow: 'auto',
											padding: '1rem',
											background: '#f8fafc',
											borderRadius: '0.5rem',
											border: '1px solid #e2e8f0',
										}}
									>
										<JSONHighlighter data={selectedActivity as JSONData} />
									</div>
								</div>
							</div>
							<div style={styles.detailModalFooter}>
								<button type="button" style={styles.copyButton} onClick={handleCopyJson}>
									{copiedJson ? <FiCheck size={16} /> : <FiCopy size={16} />}
									{copiedJson ? 'Copied!' : 'Copy JSON'}
								</button>
								<button
									type="button"
									style={styles.secondaryButton}
									onClick={handleCloseDetailModal}
								>
									<FiX /> Close
								</button>
							</div>
						</>
					)}
				</div>
			</div>

			{/* API Call Display at the bottom */}
			<ApiCallList title="API Calls to PingOne" showLegend={true} />
		</div>
	);
};

export default PingOneAuditActivities;
