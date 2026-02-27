// src/pages/PingOneAuditActivities.tsx
// Visual explorer for PingOne Audit Activities API
// Cache bust: 2025-02-17-11:32viewer with filtering - matching Identity Metrics page design

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiActivity,
	FiAlertCircle,
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
	FiKey,
	FiRefreshCw,
	FiServer,
	FiShield,
	FiUser,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import ApiCallList from '../components/ApiCallList';
import JSONHighlighter, { type JSONData } from '../components/JSONHighlighter';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { apiCallTrackerService } from '../services/apiCallTrackerService';
import { apiRequestModalService } from '../services/apiRequestModalService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';
import { WorkerTokenModalV8 } from '../v8/components/WorkerTokenModalV8';

const PageContainer = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
	width: 100%;
`;

const HeaderCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.75rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.04));
	border: 1px solid rgba(102, 126, 234, 0.2);
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #4f46e5;
`;

const Title = styled.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #4338ca;
	max-width: 720px;
	line-height: 1.6;
`;

const LayoutGrid = styled.div`
	display: grid;
	grid-template-columns: 280px 1fr;
	gap: 2rem;

	@media (max-width: 1080px) {
		grid-template-columns: 1fr;
	}
`;

const Card = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.18);
	overflow: hidden;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const SectionTitle = styled.h2`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0f172a;
`;

const FieldGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 600;
	font-size: 0.85rem;
	color: #334155;
	display: flex;
	align-items: center;
	gap: 0.35rem;
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem 0.85rem;
	border-radius: 0.75rem;
	border: 1px solid #cbd5f5;
	background: #f8fafc;
	transition: all 0.2s ease;
	font-size: 0.92rem;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
	}
`;

const Hint = styled.p`
	margin: 0;
	font-size: 0.8rem;
	color: #64748b;
`;

const ButtonRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const PrimaryButton = styled.button<{ disabled?: boolean }>`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: ${({ disabled }) => (disabled ? '#cbd5f5' : '#667eea')};
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-1px)')};
		box-shadow: ${({ disabled }) => (disabled ? 'none' : '0 10px 22px -12px rgba(102, 126, 234, 0.65)')};
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`;

const DangerButton = styled.button`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: #ef4444;
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px -12px rgba(239, 68, 68, 0.65);
		background: #dc2626;
	}

	&:active {
		transform: translateY(0);
	}
`;

const SecondaryButton = styled.button`
	border: 1px solid #cbd5f5;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: white;
	color: #1e293b;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease;

	&:hover {
		background: #f8fafc;
		border-color: #94a3b8;
	}
`;

const WarningBanner = styled.div`
	padding: 1rem;
	background: #fef3c7;
	border: 1px solid #fbbf24;
	border-radius: 0.75rem;
	margin-bottom: 1rem;
`;

const ErrorBanner = styled.div`
	padding: 1rem;
	background: #fee2e2;
	border: 1px solid #f87171;
	border-radius: 0.75rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	color: #dc2626;
	font-size: 0.875rem;
`;

const ResultContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 3rem 2rem;
	color: #6b7280;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
`;

const ActivityCard = styled.div<{ $clickable?: boolean }>`
	padding: 0.75rem;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	background: #f9fafb;
	cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
	transition: all 0.2s ease;

	&:hover {
		${({ $clickable }) =>
			$clickable
				? `
			border-color: #667eea;
			background: #f0f4ff;
			box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
			transform: translateY(-1px);
		`
				: ''}
	}
`;

const ActivityRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	margin-bottom: 0.5rem;
`;

const ActivityMain = styled.div`
	flex: 1;
`;

const ActivityMeta = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.25rem;
	font-size: 0.75rem;
	color: #6b7280;
`;

const ActivityDetails = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 0.5rem;
	font-size: 0.8rem;
`;

const DetailBadge = styled.span<{ $color?: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.375rem;
	background: ${({ $color }) => $color || '#e5e7eb'};
	color: ${({ $color }) => {
		if ($color === '#d1fae5') return '#065f46';
		if ($color === '#fee2e2') return '#dc2626';
		if ($color === '#dbeafe') return '#1e40af';
		return '#374151';
	}};
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
`;

const DetailModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.6);
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 2000;
	padding: 2rem;
	backdrop-filter: blur(4px);
`;

const DetailModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
	max-width: 900px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const DetailModalHeader = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid #e2e8f0;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const DetailModalTitle = styled.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 700;
	color: #1e293b;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
	font-size: 1.5rem;
	line-height: 1;

	&:hover {
		background: #f1f5f9;
		color: #0f172a;
	}
`;

const DetailModalBody = styled.div`
	padding: 1.5rem;
	overflow-y: auto;
	flex: 1;
`;

const DetailSection = styled.div`
	margin-bottom: 1.5rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const DetailSectionTitle = styled.h3`
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #334155;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding-bottom: 0.5rem;
	border-bottom: 2px solid #e2e8f0;
`;

const DetailGrid = styled.div`
	display: grid;
	grid-template-columns: 140px 1fr;
	gap: 0.75rem;
	font-size: 0.875rem;
`;

const DetailLabel = styled.div`
	font-weight: 600;
	color: #64748b;
	padding: 0.5rem;
	background: #f8fafc;
	border-radius: 0.375rem;
`;

const DetailValue = styled.div<{ $isCode?: boolean }>`
	color: #1e293b;
	padding: 0.5rem;
	word-break: break-word;
	font-family: ${({ $isCode }) => ($isCode ? "'Monaco', 'Menlo', 'Courier New', monospace" : 'inherit')};
	font-size: ${({ $isCode }) => ($isCode ? '0.8rem' : 'inherit')};
	background: ${({ $isCode }) => ($isCode ? '#f8fafc' : 'transparent')};
	border-radius: ${({ $isCode }) => ($isCode ? '0.375rem' : '0')};
	border: ${({ $isCode }) => ($isCode ? '1px solid #e2e8f0' : 'none')};
`;

const DetailModalFooter = styled.div`
	padding: 1rem 1.5rem;
	border-top: 1px solid #e2e8f0;
	background: #f8fafc;
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`;

const CopyButton = styled.button`
	border: 1px solid #cbd5e1;
	border-radius: 0.5rem;
	padding: 0.5rem 1rem;
	background: white;
	color: #475569;
	font-weight: 600;
	font-size: 0.875rem;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}
`;

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

	// Use global worker token hook for unified token management
	const globalTokenStatus = useGlobalWorkerToken();
	const workerToken = globalTokenStatus.token || '';
	const hasWorkerToken = globalTokenStatus.isValid;
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

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
		// Clear unified worker token
		localStorage.removeItem('unified_worker_token');
		v4ToastManager.showSuccess('Worker token cleared successfully.');
		// Trigger page reload to reset state
		window.location.reload();
	};

	const handleGetWorkerToken = useCallback(() => {
		setShowWorkerTokenModal(true);
	}, []);

	// Update environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = () => {
			try {
				const stored = localStorage.getItem('unified_worker_token');
				if (stored) {
					const data = JSON.parse(stored);
					if (data.credentials?.environmentId && !environmentId) {
						setEnvironmentId(data.credentials.environmentId);
					}
				}
			} catch (error) {
				console.log('Failed to update environment ID from worker token:', error);
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
			setError('Worker token required. Click "Get Worker Token" to generate one.');
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
			return <DetailValue $isCode>{JSON.stringify(value, null, 2)}</DetailValue>;
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
								<DetailValue $isCode>{JSON.stringify(item, null, 2)}</DetailValue>
							) : (
								<DetailValue>{String(item)}</DetailValue>
							)}
						</div>
					))}
				</div>
			);
		}
		return <DetailValue>{String(value)}</DetailValue>;
	};

	return (
		<PageContainer>
			<HeaderCard>
				<TitleRow>
					<FiActivity size={24} />
					<Title>PingOne Audit Activities</Title>
				</TitleRow>
				<Subtitle>
					Query and analyze audit events from your PingOne environment. Retrieve activities by ID,
					filter by action type, status, actor, resource, or correlation ID. Track user actions,
					system events, and security activities. Requires <strong>p1:read:audit</strong> scope.
				</Subtitle>
				{!hasWorkerToken && (
					<WarningBanner>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
							<FiAlertCircle size={20} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
							<div style={{ flex: 1 }}>
								<strong>Worker Token Required</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Click "Get Worker Token" below to generate a token with your PingOne credentials.
								</p>
							</div>
						</div>
					</WarningBanner>
				)}
			</HeaderCard>

			<LayoutGrid>
				<Card>
					<SectionTitle>
						<FiShield /> Authentication & Configuration
					</SectionTitle>

					<FieldGroup>
						<Label>Environment ID</Label>
						<input
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
							<Hint style={{ color: '#d97706', fontWeight: 600 }}>
								⚠️ Environment ID is required. Enter it manually or click "Get Worker Token" below to
								auto-fill.
							</Hint>
						) : (
							<Hint>
								Your PingOne Environment ID (automatically loaded from worker credentials)
							</Hint>
						)}
					</FieldGroup>

					{hasWorkerToken ? (
						<WorkerTokenDetectedBanner token={workerToken} tokenExpiryKey="unified_worker_token" />
					) : (
						<WarningBanner style={{ marginBottom: '1rem' }}>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
								<FiAlertCircle size={18} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
								<div style={{ flex: 1 }}>
									<strong>No Worker Token Found</strong>
									<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
										Click the button below to open the Worker Token modal and generate a token with
										the required credentials.
									</p>
								</div>
							</div>
						</WarningBanner>
					)}

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

					<ButtonRow>
						<PrimaryButton
							onClick={handleGetWorkerToken}
							type="button"
							style={{
								background: hasWorkerToken ? '#10b981' : undefined,
								cursor: 'pointer',
								color: 'white',
							}}
						>
							{hasWorkerToken ? (
								<>
									<FiCheckCircle /> Worker Token Ready
								</>
							) : (
								<>
									<FiKey /> Get Worker Token
								</>
							)}
						</PrimaryButton>
						{hasWorkerToken && (
							<DangerButton onClick={handleClearWorkerToken} type="button">
								<FiX /> Clear Token
							</DangerButton>
						)}
					</ButtonRow>
				</Card>

				<Card>
					<SectionTitle>
						<FiFilter /> Query Configuration
					</SectionTitle>

					<FieldGroup>
						<Label>View Mode</Label>
						<Select
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
						</Select>
						<Hint>Choose whether to list multiple activities or retrieve a specific one by ID</Hint>
					</FieldGroup>

					{viewMode === 'single' ? (
						<FieldGroup>
							<Label>Activity ID</Label>
							<input
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
							<Hint>Enter the unique ID of the activity you want to retrieve</Hint>
						</FieldGroup>
					) : (
						<>
							<FieldGroup>
								<Label>Action Type</Label>
								<Select value={actionType} onChange={(e) => setActionType(e.target.value)}>
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
								</Select>
								<Hint>Filter by specific action type (e.g., USER.CREATED, SESSION.CREATED)</Hint>
							</FieldGroup>

							<FieldGroup>
								<Label>Actor Type</Label>
								<Select
									value={actorType}
									onChange={(e) => setActorType(e.target.value as 'user' | 'client')}
								>
									<option value="user">User</option>
									<option value="client">Client (Application)</option>
								</Select>
								<Hint>Select whether to filter by user ID or client (application) ID</Hint>
							</FieldGroup>

							<FieldGroup>
								<Label>{actorType === 'user' ? 'User ID' : 'Client ID'}</Label>
								<input
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
								<Hint>
									{actorType === 'user'
										? 'Filter by user UUID (Note: username and email filtering not supported by PingOne API)'
										: 'Filter by client (application) UUID'}
								</Hint>
							</FieldGroup>

							<FieldGroup>
								<Label>Correlation ID</Label>
								<input
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
								<Hint>
									Filter by correlation ID to track related activities across multiple audit events
								</Hint>
							</FieldGroup>

							<FieldGroup>
								<Label>Limit</Label>
								<Select value={limit} onChange={(e) => setLimit(e.target.value)}>
									<option value="10">10 activities</option>
									<option value="25">25 activities</option>
									<option value="50">50 activities</option>
									<option value="100">100 activities</option>
									<option value="500">500 activities</option>
									<option value="1000">1000 activities</option>
								</Select>
								<Hint>Maximum number of activities to retrieve (ordered by newest first)</Hint>
							</FieldGroup>
							<FieldGroup>
								<Label style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'normal' }}>
									Note: Time-based filtering is not supported by the PingOne Audit API. Results are
									ordered by newest first.
								</Label>
							</FieldGroup>
						</>
					)}

					<ButtonRow>
						<PrimaryButton
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
						</PrimaryButton>

						<SecondaryButton
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
						</SecondaryButton>
					</ButtonRow>

					{error && (
						<ErrorBanner>
							<FiInfo size={18} style={{ marginTop: '0.2rem' }} />
							<span>{error}</span>
						</ErrorBanner>
					)}

					<ResultContainer>
						{auditResponse ? (
							<>
								{summary && (
									<Card
										style={{
											border: '1px solid #667eea',
											background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
										}}
									>
										<SectionTitle>
											<FiBarChart2 /> Summary Statistics
										</SectionTitle>
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
													border: '1px solid #c4b5fd',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Total Activities
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
													{summary.total}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #c4b5fd',
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
													border: '1px solid #c4b5fd',
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
													border: '1px solid #c4b5fd',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Action Types
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
													{summary.uniqueActionTypes}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #c4b5fd',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Unique Users
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
													{summary.uniqueUsers}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #c4b5fd',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Total Count
												</div>
												<div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#6366f1' }}>
													{totalCount.toLocaleString()}
												</div>
											</div>
										</div>
										{lastUpdated && (
											<Hint
												style={{
													marginTop: '1rem',
													paddingTop: '1rem',
													borderTop: '1px solid #c4b5fd',
												}}
											>
												Last updated: {new Date(lastUpdated).toLocaleString()}
											</Hint>
										)}
									</Card>
								)}

								{activities.length > 0 && (
									<Card style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}>
										<SectionTitle>
											<FiActivity /> Activity Details{' '}
											{totalCount > activities.length
												? `(${activities.length} of ${totalCount})`
												: `(${activities.length})`}
										</SectionTitle>
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
												<ActivityCard
													key={activity.id}
													$clickable
													onClick={() => handleActivityClick(activity)}
												>
													<ActivityRow>
														<ActivityMain>
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
															<ActivityDetails>
																{activity.result?.status && (
																	<DetailBadge
																		$color={
																			activity.result.status?.toLowerCase() === 'success'
																				? '#d1fae5'
																				: '#fee2e2'
																		}
																	>
																		{activity.result.status === 'success' ? (
																			<FiCheckCircle size={12} />
																		) : (
																			<FiAlertCircle size={12} />
																		)}
																		{activity.result.status.toUpperCase()}
																	</DetailBadge>
																)}
																{activity.actors?.user?.name && (
																	<DetailBadge $color="#dbeafe">
																		<FiUser size={12} />
																		{activity.actors.user.name}
																	</DetailBadge>
																)}
																{activity.actors?.client?.name && (
																	<DetailBadge $color="#f3e8ff">
																		<FiServer size={12} />
																		{activity.actors.client.name}
																	</DetailBadge>
																)}
																{activity.resources && activity.resources.length > 0 && (
																	<DetailBadge $color="#fef3c7">
																		<FiDatabase size={12} />
																		{activity.resources.length} resource
																		{activity.resources.length !== 1 ? 's' : ''}
																	</DetailBadge>
																)}
																{activity.ipAddress && (
																	<DetailBadge>
																		<FiGlobe size={12} />
																		{activity.ipAddress}
																	</DetailBadge>
																)}
															</ActivityDetails>
														</ActivityMain>
														<ActivityMeta>
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
																	color: '#667eea',
																}}
															>
																<FiEye size={12} />
																<span style={{ fontSize: '0.7rem' }}>View Details</span>
															</div>
														</ActivityMeta>
													</ActivityRow>
												</ActivityCard>
											))}
										</div>
									</Card>
								)}

								<Card style={{ border: '1px solid #dbeafe', background: '#ffffff' }}>
									<SectionTitle>
										<FiDatabase /> Full API Response
									</SectionTitle>
									{formattedResponse && (
										<div style={{ maxHeight: '600px', overflow: 'auto' }}>
											<JSONHighlighter data={formattedResponse} />
										</div>
									)}
								</Card>
							</>
						) : (
							<EmptyState>
								<FiActivity size={22} />
								<span>Run the request to see audit activities returned by PingOne.</span>
							</EmptyState>
						)}
					</ResultContainer>
				</Card>
			</LayoutGrid>

			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={() => {
					// Token generated, the global hook will automatically update
					// Update environment ID from unified worker token credentials
					try {
						const stored = localStorage.getItem('unified_worker_token');
						if (stored) {
							const data = JSON.parse(stored);
							if (data.credentials?.environmentId) {
								setEnvironmentId(data.credentials.environmentId);
							}
						}
					} catch (error) {
						console.log('Failed to update environment ID from unified worker token:', error);
					}
					setShowWorkerTokenModal(false);
					v4ToastManager.showSuccess(
						'Worker token generated successfully. Ready to query audit activities.'
					);
				}}
				environmentId={(() => {
					try {
						const stored = localStorage.getItem('unified_worker_token');
						if (stored) {
							const data = JSON.parse(stored);
							return data.credentials?.environmentId || '';
						}
					} catch (error) {
						console.log('Failed to load environment ID from unified worker token:', error);
					}
					return '';
				})()}
			/>

			{/* Activity Detail Modal */}
			<DetailModalOverlay $isOpen={!!selectedActivity} onClick={handleCloseDetailModal}>
				<DetailModalContent onClick={(e) => e.stopPropagation()}>
					{selectedActivity && (
						<>
							<DetailModalHeader>
								<DetailModalTitle>
									<FiActivity size={24} />
									Activity Details
								</DetailModalTitle>
								<CloseButton onClick={handleCloseDetailModal}>
									<FiX />
								</CloseButton>
							</DetailModalHeader>
							<DetailModalBody>
								{/* Basic Information */}
								<DetailSection>
									<DetailSectionTitle>
										<FiInfo /> Basic Information
									</DetailSectionTitle>
									<DetailGrid>
										<DetailLabel>Activity ID</DetailLabel>
										{renderDetailValue(selectedActivity.id)}
										<DetailLabel>Action Type</DetailLabel>
										{renderDetailValue(selectedActivity.action.type)}
										{selectedActivity.action.description && (
											<>
												<DetailLabel>Description</DetailLabel>
												{renderDetailValue(selectedActivity.action.description)}
											</>
										)}
										<DetailLabel>Created At</DetailLabel>
										<DetailValue>{formatTimestamp(selectedActivity.createdAt)}</DetailValue>
									</DetailGrid>
								</DetailSection>

								{/* Result Information */}
								{selectedActivity.result && (
									<DetailSection>
										<DetailSectionTitle>
											<FiCheckCircle /> Result
										</DetailSectionTitle>
										<DetailGrid>
											<DetailLabel>Status</DetailLabel>
											<DetailValue
												style={{
													color:
														selectedActivity.result.status?.toLowerCase() === 'success'
															? '#10b981'
															: '#ef4444',
													fontWeight: 600,
												}}
											>
												{selectedActivity.result.status?.toUpperCase() || 'Unknown'}
											</DetailValue>
											{selectedActivity.result.description && (
												<>
													<DetailLabel>Description</DetailLabel>
													{renderDetailValue(selectedActivity.result.description)}
												</>
											)}
											{selectedActivity.result.error && (
												<>
													<DetailLabel>Error Code</DetailLabel>
													{renderDetailValue(selectedActivity.result.error.code)}
													<DetailLabel>Error Message</DetailLabel>
													{renderDetailValue(selectedActivity.result.error.message)}
												</>
											)}
										</DetailGrid>
									</DetailSection>
								)}

								{/* Actors Information */}
								{selectedActivity.actors && (
									<DetailSection>
										<DetailSectionTitle>
											<FiUser /> Actors
										</DetailSectionTitle>
										<DetailGrid>
											{selectedActivity.actors.user && (
												<>
													<DetailLabel>User</DetailLabel>
													<div>
														{selectedActivity.actors.user.name && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.actors.user.name}
															</DetailValue>
														)}
														{selectedActivity.actors.user.id && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>ID:</strong> {selectedActivity.actors.user.id}
															</DetailValue>
														)}
														{selectedActivity.actors.user.username && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>Username:</strong> {selectedActivity.actors.user.username}
															</DetailValue>
														)}
														{selectedActivity.actors.user.email && (
															<DetailValue>
																<strong>Email:</strong> {selectedActivity.actors.user.email}
															</DetailValue>
														)}
													</div>
												</>
											)}
											{selectedActivity.actors.client && (
												<>
													<DetailLabel>Client</DetailLabel>
													<div>
														{selectedActivity.actors.client.name && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.actors.client.name}
															</DetailValue>
														)}
														{selectedActivity.actors.client.id && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>ID:</strong> {selectedActivity.actors.client.id}
															</DetailValue>
														)}
														{selectedActivity.actors.client.type && (
															<DetailValue>
																<strong>Type:</strong> {selectedActivity.actors.client.type}
															</DetailValue>
														)}
													</div>
												</>
											)}
											{selectedActivity.actors.system && (
												<>
													<DetailLabel>System</DetailLabel>
													<div>
														{selectedActivity.actors.system.name && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.actors.system.name}
															</DetailValue>
														)}
														{selectedActivity.actors.system.id && (
															<DetailValue>
																<strong>ID:</strong> {selectedActivity.actors.system.id}
															</DetailValue>
														)}
													</div>
												</>
											)}
										</DetailGrid>
									</DetailSection>
								)}

								{/* Resources Information */}
								{selectedActivity.resources && selectedActivity.resources.length > 0 && (
									<DetailSection>
										<DetailSectionTitle>
											<FiDatabase /> Resources ({selectedActivity.resources.length})
										</DetailSectionTitle>
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
													<DetailGrid>
														{resource.type && (
															<>
																<DetailLabel>Type</DetailLabel>
																{renderDetailValue(resource.type)}
															</>
														)}
														{resource.name && (
															<>
																<DetailLabel>Name</DetailLabel>
																{renderDetailValue(resource.name)}
															</>
														)}
														{resource.id && (
															<>
																<DetailLabel>ID</DetailLabel>
																{renderDetailValue(resource.id)}
															</>
														)}
													</DetailGrid>
												</div>
											))}
										</div>
									</DetailSection>
								)}

								{/* Request Context */}
								{(selectedActivity.ipAddress ||
									selectedActivity.userAgent ||
									selectedActivity.correlationId) && (
									<DetailSection>
										<DetailSectionTitle>
											<FiGlobe /> Request Context
										</DetailSectionTitle>
										<DetailGrid>
											{selectedActivity.ipAddress && (
												<>
													<DetailLabel>IP Address</DetailLabel>
													{renderDetailValue(selectedActivity.ipAddress)}
												</>
											)}
											{selectedActivity.userAgent && (
												<>
													<DetailLabel>User Agent</DetailLabel>
													{renderDetailValue(selectedActivity.userAgent)}
												</>
											)}
											{selectedActivity.correlationId && (
												<>
													<DetailLabel>Correlation ID</DetailLabel>
													{renderDetailValue(selectedActivity.correlationId)}
												</>
											)}
										</DetailGrid>
									</DetailSection>
								)}

								{/* Environment & Organization */}
								{(selectedActivity.environment || selectedActivity.organization) && (
									<DetailSection>
										<DetailSectionTitle>
											<FiShield /> Context
										</DetailSectionTitle>
										<DetailGrid>
											{selectedActivity.environment && (
												<>
													<DetailLabel>Environment</DetailLabel>
													<div>
														{selectedActivity.environment.name && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.environment.name}
															</DetailValue>
														)}
														{selectedActivity.environment.id && (
															<DetailValue>
																<strong>ID:</strong> {selectedActivity.environment.id}
															</DetailValue>
														)}
													</div>
												</>
											)}
											{selectedActivity.organization && (
												<>
													<DetailLabel>Organization</DetailLabel>
													<div>
														{selectedActivity.organization.name && (
															<DetailValue style={{ marginBottom: '0.25rem' }}>
																<strong>Name:</strong> {selectedActivity.organization.name}
															</DetailValue>
														)}
														{selectedActivity.organization.id && (
															<DetailValue>
																<strong>ID:</strong> {selectedActivity.organization.id}
															</DetailValue>
														)}
													</div>
												</>
											)}
										</DetailGrid>
									</DetailSection>
								)}

								{/* Target */}
								{selectedActivity.target && (
									<DetailSection>
										<DetailSectionTitle>
											<FiDatabase /> Target
										</DetailSectionTitle>
										<DetailGrid>
											{selectedActivity.target.type && (
												<>
													<DetailLabel>Type</DetailLabel>
													{renderDetailValue(selectedActivity.target.type)}
												</>
											)}
											{selectedActivity.target.name && (
												<>
													<DetailLabel>Name</DetailLabel>
													{renderDetailValue(selectedActivity.target.name)}
												</>
											)}
											{selectedActivity.target.id && (
												<>
													<DetailLabel>ID</DetailLabel>
													{renderDetailValue(selectedActivity.target.id)}
												</>
											)}
										</DetailGrid>
									</DetailSection>
								)}

								{/* Raw JSON */}
								<DetailSection>
									<DetailSectionTitle>
										<FiDatabase /> Complete JSON
									</DetailSectionTitle>
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
								</DetailSection>
							</DetailModalBody>
							<DetailModalFooter>
								<CopyButton onClick={handleCopyJson}>
									{copiedJson ? <FiCheck size={16} /> : <FiCopy size={16} />}
									{copiedJson ? 'Copied!' : 'Copy JSON'}
								</CopyButton>
								<SecondaryButton onClick={handleCloseDetailModal}>
									<FiX /> Close
								</SecondaryButton>
							</DetailModalFooter>
						</>
					)}
				</DetailModalContent>
			</DetailModalOverlay>

			{/* API Call Display at the bottom */}
			<ApiCallList title="API Calls to PingOne" showLegend={true} />
		</PageContainer>
	);
};

export default PingOneAuditActivities;
