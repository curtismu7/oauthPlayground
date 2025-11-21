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
	FiFilter,
	FiKey,
	FiPlus,
	FiRefreshCw,
	FiServer,
	FiTag,
	FiTrash2,
	FiX,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ApiCallList from '../components/ApiCallList';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { WorkerTokenModal } from '../components/WorkerTokenModal';
import { apiCallTrackerService } from '../services/apiCallTrackerService';
import { secureLog } from '../utils/secureLogging';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { getAnyWorkerToken } from '../utils/workerTokenDetection';

// Container - responsive and accounts for sidebar
const Container = styled.div`
	width: 100%;
	max-width: 100%;
	padding: 2rem;
	box-sizing: border-box;
	overflow-x: auto;
	min-width: 0;

	@media (max-width: 1024px) {
		padding: 1rem;
	}
`;

const PageContainer = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
`;

const HeaderCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.75rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(14, 165, 233, 0.04));
	border: 1px solid rgba(6, 182, 212, 0.2);
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #0891b2;
`;

const Title = styled.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #0e7490;
	max-width: 720px;
	line-height: 1.6;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	${({ $variant = 'secondary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover { background: #2563eb; }
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover { background: #dc2626; }
				`;
			default:
				return `
					background: #f1f5f9;
					color: #475569;
					&:hover { background: #e2e8f0; }
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const TabsContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 2rem;
	border-bottom: 2px solid #e2e8f0;
`;

const Tab = styled.button<{ $active: boolean }>`
	padding: 0.75rem 1.5rem;
	border: none;
	background: none;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ $active }) => ($active ? '#3b82f6' : '#64748b')};
	cursor: pointer;
	border-bottom: 2px solid ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
	margin-bottom: -2px;
	transition: all 0.2s;

	&:hover {
		color: #3b82f6;
	}
`;

const SectionCard = styled.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1e293b;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InputGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1rem;
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #475569;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	color: #1e293b;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Checkbox = styled.input`
	width: 1.25rem;
	height: 1.25rem;
	cursor: pointer;
`;

const SubscriptionList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const SubscriptionCard = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1.25rem;
	display: flex;
	justify-content: space-between;
	align-items: start;
	gap: 1rem;
`;

const SubscriptionInfo = styled.div`
	flex: 1;
`;

const SubscriptionName = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 0.5rem;
`;

const SubscriptionMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	font-size: 0.875rem;
	color: #64748b;
`;

const SubscriptionActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const StatusBadge = styled.span<{ $enabled: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${({ $enabled }) => ($enabled ? '#dcfce7' : '#fee2e2')};
	color: ${({ $enabled }) => ($enabled ? '#166534' : '#991b1b')};
`;

// Webhook List
const WebhookContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 2rem;
`;

const WebhookCard = styled.div<{ $type?: string }>`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: all 0.2s;

	&:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-color: #cbd5e1;
	}
`;

const WebhookHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
`;

const WebhookTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
`;

const WebhookMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.875rem;
	color: #64748b;
`;

const WebhookBody = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	overflow-x: auto;
`;

const EventStatusBadge = styled.span<{ $status?: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;

	${({ $status }) => {
		switch ($status) {
			case 'success':
				return 'background: #dcfce7; color: #166534;';
			case 'error':
				return 'background: #fee2e2; color: #991b1b;';
			case 'pending':
				return 'background: #fef3c7; color: #92400e;';
			default:
				return 'background: #f1f5f9; color: #475569;';
		}
	}}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 4rem 2rem;
	color: #64748b;

	svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}
`;

// Filter Bar
const FilterBar = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	flex-wrap: wrap;
`;

const FilterSelect = styled.select`
	padding: 0.5rem 1rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	background: white;
	font-size: 0.875rem;
	color: #1e293b;
	min-width: 150px;
`;

const FilterLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #475569;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ClearFiltersButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	background: white;
	font-size: 0.875rem;
	color: #64748b;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f1f5f9;
		color: #475569;
	}
`;

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
	destination: {
		url: string;
	};
	format?: string;
	topics?: string[];
	createdAt?: string;
	updatedAt?: string;
}

const PingOneWebhookViewer: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'subscriptions' | 'events'>('subscriptions');
	const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
	const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
	const [filter, setFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [timeFilter, setTimeFilter] = useState<string>('all');
	const [isActive, setIsActive] = useState(false);
	const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
	const [workerToken, setWorkerToken] = useState<string | null>(() => getAnyWorkerToken());
	const [environmentId, setEnvironmentId] = useState<string>(() => {
		// Try to load from worker_credentials first, then fall back to environmentId
		const workerCredsStr = localStorage.getItem('worker_credentials');
		const workerCreds = workerCredsStr ? JSON.parse(workerCredsStr) : null;
		const fallbackEnvId = localStorage.getItem('environmentId') || '';
		const finalEnvId = workerCreds?.environmentId || fallbackEnvId;

		console.log('[Webhook Viewer] Loading Environment ID from storage:', {
			workerCredsExists: !!workerCredsStr,
			workerCredsEnvId: workerCreds?.environmentId,
			fallbackEnvId: fallbackEnvId,
			finalEnvId: finalEnvId,
		});

		return finalEnvId;
	});
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingSubscription, setEditingSubscription] = useState<WebhookSubscription | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		enabled: true,
		destination: '',
		format: 'ACTIVITY',
		topics: '',
	});

	// Ensure URL is correct when component mounts
	useEffect(() => {
		if (location.pathname !== '/pingone-webhook-viewer') {
			navigate('/pingone-webhook-viewer', { replace: true });
		}
	}, [location.pathname, navigate]);

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

	// Fetch webhook subscriptions
	const fetchSubscriptions = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken();
		if (!effectiveWorkerToken || !environmentId) {
			return;
		}

		try {
			setIsLoadingSubscriptions(true);
			let callId: string | null = null;

			const url = `/api/pingone/subscriptions?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=na`;

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
	}, [environmentId]);

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
				destination: {
					url: formData.destination,
				},
				format: formData.format,
				topics: formData.topics
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
			};

			const url = `/api/pingone/subscriptions?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=na`;

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
			setFormData({ name: '', enabled: true, destination: '', format: 'ACTIVITY', topics: '' });
			await fetchSubscriptions();
		} catch (error) {
			console.error('[Webhook Viewer] Error creating subscription:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to create webhook subscription'
			);
		} finally {
			setIsLoadingSubscriptions(false);
		}
	}, [environmentId, formData, fetchSubscriptions]);

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
					destination: {
						url: formData.destination,
					},
					format: formData.format,
					topics: formData.topics
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean),
				};

				const url = `/api/pingone/subscriptions/${subscription.id}?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=na`;

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
				setFormData({ name: '', enabled: true, destination: '', format: 'ACTIVITY', topics: '' });
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
		[environmentId, formData, fetchSubscriptions]
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

				const url = `/api/pingone/subscriptions/${subscriptionId}?environmentId=${encodeURIComponent(environmentId)}&workerToken=${encodeURIComponent(effectiveWorkerToken)}&region=na`;

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
		[environmentId, fetchSubscriptions]
	);

	const handleEditSubscription = useCallback((subscription: WebhookSubscription) => {
		setEditingSubscription(subscription);
		setFormData({
			name: subscription.name,
			enabled: subscription.enabled,
			destination: subscription.destination?.url || '',
			format: subscription.format || 'ACTIVITY',
			topics: subscription.topics?.join(', ') || '',
		});
		setShowCreateModal(true);
	}, []);

	const handleCancelEdit = useCallback(() => {
		setEditingSubscription(null);
		setShowCreateModal(false);
		setFormData({ name: '', enabled: true, destination: '', format: 'ACTIVITY', topics: '' });
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

	const formatData = (data: Record<string, unknown>) => {
		return JSON.stringify(data, null, 2);
	};

	// Check for global token - use state for re-renders, but also check directly for accuracy
	const currentToken = getAnyWorkerToken() || workerToken || '';
	const hasWorkerToken = !!currentToken;

	return (
		<Container>
			<PageContainer>
				<HeaderCard>
					<TitleRow>
						<FiServer size={28} />
						<Title>PingOne Webhook Management</Title>
					</TitleRow>
					<Subtitle>
						Manage webhook subscriptions and monitor webhook events in real-time. Create, update,
						and delete webhook subscriptions using the PingOne Management API. Requires
						p1:read:subscriptions and p1:write:subscriptions scopes.
					</Subtitle>
				</HeaderCard>

				{!hasWorkerToken && (
					<WorkerTokenModal
						isOpen={showWorkerTokenModal}
						onClose={() => setShowWorkerTokenModal(false)}
						onContinue={() => {
							setShowWorkerTokenModal(false);
							const token = getAnyWorkerToken();
							setWorkerToken(token);
							// Update environment ID from worker credentials
							const credsStr = localStorage.getItem('worker_credentials');
							const creds = credsStr ? JSON.parse(credsStr) : null;
							if (creds?.environmentId) {
								setEnvironmentId(creds.environmentId);
								localStorage.setItem('environmentId', creds.environmentId);
							}
						}}
						flowType="pingone-webhook-viewer"
						environmentId={environmentId}
						prefillCredentials={{
							environmentId: environmentId || '',
							region: 'us',
							scopes: 'p1:read:subscriptions p1:write:subscriptions',
						}}
						tokenStorageKey="worker_token"
						tokenExpiryKey="worker_token_expires_at"
					/>
				)}

				{hasWorkerToken && currentToken && (
					<WorkerTokenDetectedBanner
						token={currentToken}
						tokenExpiryKey="worker_token_expires_at"
					/>
				)}

				{hasWorkerToken && (
					<SectionCard style={{ marginBottom: '1.5rem' }}>
						<div style={{ marginBottom: '0.5rem' }}>
							<label
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
								type="text"
								value={environmentId}
								onChange={(e) => {
									const newEnvId = e.target.value;
									setEnvironmentId(newEnvId);
									localStorage.setItem('environmentId', newEnvId);
								}}
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
								<p
									style={{
										margin: '0.5rem 0 0 0',
										fontSize: '0.8rem',
										color: '#d97706',
										fontWeight: 600,
									}}
								>
									⚠️ Environment ID is required. Enter it manually or generate a worker token to
									auto-fill.
								</p>
							) : (
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
									Your PingOne Environment ID (saved to localStorage)
								</p>
							)}
						</div>
					</SectionCard>
				)}

				<Header>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
						<FiServer size={24} />
						<Title style={{ fontSize: '1.5rem', margin: 0 }}>Webhook Management</Title>
					</div>
					<ActionButtons>
						{activeTab === 'subscriptions' && (
							<>
								<Button
									$variant="primary"
									onClick={() => {
										setEditingSubscription(null);
										setFormData({
											name: '',
											enabled: true,
											destination: '',
											format: 'ACTIVITY',
											topics: '',
										});
										setShowCreateModal(true);
									}}
									disabled={!hasWorkerToken || !environmentId}
								>
									<FiPlus />
									Create Subscription
								</Button>
								<Button
									$variant="secondary"
									onClick={fetchSubscriptions}
									disabled={!hasWorkerToken || !environmentId || isLoadingSubscriptions}
								>
									<FiRefreshCw />
									Refresh
								</Button>
							</>
						)}
						{activeTab === 'events' && (
							<>
								{!isActive ? (
									<Button $variant="primary" onClick={handleStartMonitoring}>
										<FiActivity />
										Start Monitoring
									</Button>
								) : (
									<Button $variant="danger" onClick={handleStopMonitoring}>
										<FiActivity />
										Stop Monitoring
									</Button>
								)}
								<Button
									$variant="secondary"
									onClick={handleClearWebhooks}
									disabled={webhooks.length === 0}
								>
									<FiTrash2 />
									Clear History
								</Button>
								<Button
									$variant="secondary"
									onClick={handleExportWebhooks}
									disabled={webhooks.length === 0}
								>
									<FiDownload />
									Export
								</Button>
							</>
						)}
					</ActionButtons>
				</Header>

				<TabsContainer>
					<Tab
						$active={activeTab === 'subscriptions'}
						onClick={() => setActiveTab('subscriptions')}
					>
						Subscriptions ({subscriptions.length})
					</Tab>
					<Tab $active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
						Events ({webhooks.length})
					</Tab>
				</TabsContainer>

				{activeTab === 'subscriptions' && (
					<>
						{!hasWorkerToken && (
							<SectionCard>
								<p style={{ color: '#64748b', marginBottom: '1rem' }}>
									A worker token is required to manage webhook subscriptions. Please provide a
									worker token to continue.
								</p>
								<Button $variant="primary" onClick={() => setShowWorkerTokenModal(true)}>
									<FiKey />
									Provide Worker Token
								</Button>
							</SectionCard>
						)}

						{showCreateModal && (
							<SectionCard>
								<SectionHeader>
									<SectionTitle>
										{editingSubscription ? 'Edit Subscription' : 'Create Subscription'}
									</SectionTitle>
									<Button $variant="secondary" onClick={handleCancelEdit}>
										<FiX />
										Cancel
									</Button>
								</SectionHeader>
								<InputGroup>
									<Label>Name *</Label>
									<Input
										type="text"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										placeholder="My Webhook Subscription"
									/>
								</InputGroup>
								<InputGroup>
									<Label>Destination URL *</Label>
									<Input
										type="url"
										value={formData.destination}
										onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
										placeholder="https://example.com/webhook"
									/>
								</InputGroup>
								<InputGroup>
									<Label>Format</Label>
									<FilterSelect
										value={formData.format}
										onChange={(e) => setFormData({ ...formData, format: e.target.value })}
									>
										<option value="ACTIVITY">ACTIVITY</option>
										<option value="JSON">JSON</option>
									</FilterSelect>
								</InputGroup>
								<InputGroup>
									<Label>Topics (comma-separated)</Label>
									<Input
										type="text"
										value={formData.topics}
										onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
										placeholder="user.created, user.updated"
									/>
								</InputGroup>
								<InputGroup>
									<Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<Checkbox
											type="checkbox"
											checked={formData.enabled}
											onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
										/>
										Enabled
									</Label>
								</InputGroup>
								<ActionButtons>
									<Button
										$variant="primary"
										onClick={
											editingSubscription
												? () => handleUpdateSubscription(editingSubscription)
												: handleCreateSubscription
										}
										disabled={!formData.name || !formData.destination || isLoadingSubscriptions}
									>
										{editingSubscription ? 'Update' : 'Create'} Subscription
									</Button>
									<Button $variant="secondary" onClick={handleCancelEdit}>
										Cancel
									</Button>
								</ActionButtons>
							</SectionCard>
						)}

						{hasWorkerToken && environmentId && (
							<SectionCard>
								<SectionHeader>
									<SectionTitle>Webhook Subscriptions</SectionTitle>
								</SectionHeader>
								{isLoadingSubscriptions ? (
									<p style={{ color: '#64748b' }}>Loading subscriptions...</p>
								) : subscriptions.length === 0 ? (
									<EmptyState>
										<FiServer size={48} />
										<h3>No webhook subscriptions</h3>
										<p>Create your first webhook subscription to start receiving events.</p>
									</EmptyState>
								) : (
									<SubscriptionList>
										{subscriptions.map((subscription) => (
											<SubscriptionCard key={subscription.id}>
												<SubscriptionInfo>
													<SubscriptionName>{subscription.name}</SubscriptionName>
													<SubscriptionMeta>
														<StatusBadge $enabled={subscription.enabled}>
															{subscription.enabled ? <FiCheckCircle /> : <FiX />}
															{subscription.enabled ? 'Enabled' : 'Disabled'}
														</StatusBadge>
														<span>URL: {subscription.destination?.url || 'N/A'}</span>
														{subscription.format && <span>Format: {subscription.format}</span>}
														{subscription.topics && subscription.topics.length > 0 && (
															<span>Topics: {subscription.topics.join(', ')}</span>
														)}
													</SubscriptionMeta>
												</SubscriptionInfo>
												<SubscriptionActions>
													<Button
														type="button"
														$variant="secondary"
														onClick={() => handleEditSubscription(subscription)}
													>
														<FiEdit />
													</Button>
													<Button
														type="button"
														$variant="danger"
														onClick={() => handleDeleteSubscription(subscription.id)}
													>
														<FiTrash2 />
													</Button>
												</SubscriptionActions>
											</SubscriptionCard>
										))}
									</SubscriptionList>
								)}
							</SectionCard>
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
							<FilterBar>
								<FiFilter size={20} color="#64748b" />
								<FilterLabel>
									Status:
									<FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
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
									</FilterSelect>
								</FilterLabel>
								<FilterLabel>
									<FiCalendar />
									Time:
									<FilterSelect value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
										<option value="all">All Time</option>
										<option value="1h">Last Hour</option>
										<option value="24h">Last 24 Hours</option>
										<option value="7d">Last 7 Days</option>
										<option value="30d">Last 30 Days</option>
									</FilterSelect>
								</FilterLabel>
								<FilterLabel>
									<FiTag />
									Type:
									<FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
										<option value="all">All Types ({eventTypes.length})</option>
										{eventTypes.map((type) => (
											<option key={type} value={type}>
												{type} ({webhooks.filter((w) => w.type === type).length})
											</option>
										))}
									</FilterSelect>
								</FilterLabel>
								{(filter !== 'all' || typeFilter !== 'all' || timeFilter !== 'all') && (
									<ClearFiltersButton onClick={handleClearFilters}>
										<FiX />
										Clear Filters
									</ClearFiltersButton>
								)}
							</FilterBar>
						)}

						<WebhookContainer>
							{filteredWebhooks.length === 0 ? (
								<EmptyState>
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
								</EmptyState>
							) : (
								filteredWebhooks.map((webhook) => (
									<WebhookCard key={webhook.id} $type={webhook.type}>
										<WebhookHeader>
											<WebhookTitle>
												<EventStatusBadge $status={webhook.status}>
													{webhook.status === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
													{webhook.status}
												</EventStatusBadge>
												<span>{webhook.type}</span>
											</WebhookTitle>
											<WebhookMeta>
												<FiClock size={16} />
												{formatTimestamp(webhook.timestamp)}
												<FiTag size={16} />
												{webhook.source}
											</WebhookMeta>
										</WebhookHeader>
										<WebhookBody>
											<pre>{formatData(webhook.data)}</pre>
										</WebhookBody>
									</WebhookCard>
								))
							)}
						</WebhookContainer>
					</>
				)}

				<ApiCallList title="API Calls to PingOne" showLegend={true} />
			</PageContainer>
		</Container>
	);
};

export default PingOneWebhookViewer;
