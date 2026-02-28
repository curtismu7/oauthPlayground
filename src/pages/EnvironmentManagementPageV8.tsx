// src/pages/EnvironmentManagementPageV8.tsx
// V8 Environment Management Page - Main dashboard for PingOne environment management

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiBook,
	FiCode,
	FiDownload,
	FiEdit,
	FiEdit2,
	FiInfo,
	FiPlus,
	FiRefreshCw,
	FiShield,
	FiTrash,
	FiTrash2,
	FiUpload
} from 'react-icons/fi';
import ApiCallList from '../components/ApiCallList';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { apiCallTrackerService } from '../services/apiCallTrackerService';
import EnvironmentServiceV8, { PingOneEnvironment } from '../services/environmentServiceV8';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

const styles = {
	container: {
		padding: '2rem',
		maxWidth: '1400px',
		margin: '0 auto',
	} as React.CSSProperties,

	header: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '2rem',
		flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
		gap: '1rem',
	} as React.CSSProperties,

	title: {
		color: '#111827',
		fontSize: '2rem',
		fontWeight: 600,
	} as React.CSSProperties,

	actions: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
	} as React.CSSProperties,

	button: (variant?: 'primary' | 'secondary' | 'danger'): React.CSSProperties => ({
		background: variant === 'secondary' ? '#6b7280' : variant === 'danger' ? '#dc2626' : '#2563eb',
		color: 'white',
		border: 'none',
		padding: '0.5rem 1rem',
		borderRadius: '6px',
		cursor: 'pointer',
		fontWeight: 500,
		fontSize: '0.875rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		transition: 'all 0.2s ease',
		whiteSpace: 'nowrap',
	}),

	searchContainer: {
		display: 'flex',
		gap: '1rem',
		marginBottom: '2rem',
		flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
	} as React.CSSProperties,

	filterContainer: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
	} as React.CSSProperties,

	filterSelect: {
		padding: '0.75rem',
		border: '1px solid #ddd',
		borderRadius: '4px',
		fontSize: '1rem',
		background: 'white',
	} as React.CSSProperties,

	environmentGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
		gap: '1.5rem',
		marginBottom: '2rem',
	} as React.CSSProperties,

	environmentCard: {
		background: 'white',
		borderRadius: '8px',
		padding: '1.5rem',
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
		border: '1px solid #e0e0e0',
	} as React.CSSProperties,

	cardHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: '1rem',
	} as React.CSSProperties,

	cardTitle: {
		color: '#333',
		fontSize: '1.25rem',
		fontWeight: 600,
		margin: 0,
		flex: 1,
	} as React.CSSProperties,

	cardStatus: (status: string): React.CSSProperties => ({
		padding: '0.25rem 0.75rem',
		borderRadius: '12px',
		fontSize: '0.875rem',
		fontWeight: 500,
		background: `${EnvironmentServiceV8.getStatusColor(status)}20`,
		color: EnvironmentServiceV8.getStatusColor(status),
	}),

	cardType: (type: string): React.CSSProperties => ({
		padding: '0.25rem 0.75rem',
		borderRadius: '12px',
		fontSize: '0.875rem',
		fontWeight: 500,
		background: `${EnvironmentServiceV8.getTypeColor(type)}20`,
		color: EnvironmentServiceV8.getTypeColor(type),
		marginLeft: '0.5rem',
	}),

	cardDescription: {
		color: '#666',
		fontSize: '0.875rem',
		marginBottom: '1rem',
		lineHeight: 1.5,
	} as React.CSSProperties,

	cardInfo: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '0.5rem',
		marginBottom: '1rem',
	} as React.CSSProperties,

	infoItem: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.875rem',
	} as React.CSSProperties,

	infoLabel: {
		color: '#666',
	} as React.CSSProperties,

	infoValue: {
		color: '#333',
		fontWeight: 500,
	} as React.CSSProperties,

	cardActions: {
		display: 'flex',
		gap: '0.5rem',
		justifyContent: 'flex-end',
	} as React.CSSProperties,

	iconButton: {
		background: 'none',
		border: '1px solid #ddd',
		padding: '0.5rem',
		borderRadius: '4px',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		transition: 'all 0.2s ease',
	} as React.CSSProperties,

	loadingMessage: {
		textAlign: 'center',
		padding: '2rem',
		color: '#666',
		fontSize: '1.1rem',
	} as React.CSSProperties,

	errorMessage: {
		textAlign: 'center',
		padding: '2rem',
		color: '#dc2626',
		fontSize: '1.1rem',
	} as React.CSSProperties,

	educationalSection: {
		background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		borderRadius: '12px',
		padding: '2rem',
		marginBottom: '2rem',
		color: 'white',
		boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
	} as React.CSSProperties,

	educationalHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		marginBottom: '1.5rem',
	} as React.CSSProperties,

	educationalTitle: {
		fontSize: '1.5rem',
		fontWeight: 600,
		margin: 0,
	} as React.CSSProperties,

	educationalContent: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
		gap: '1.5rem',
	} as React.CSSProperties,

	educationalCard: {
		background: 'white',
		borderRadius: '8px',
		padding: '1.5rem',
		border: '1px solid #e0e0e0',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
	} as React.CSSProperties,

	educationalCardTitle: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		fontSize: '1.1rem',
		fontWeight: 600,
		margin: '0 0 0.75rem 0',
		color: '#333',
	} as React.CSSProperties,

	educationalCardText: {
		margin: 0,
		lineHeight: 1.6,
		color: '#555',
	} as React.CSSProperties,

	apiEndpointsSection: {
		margin: '2rem 0',
		padding: '1.5rem',
		background: '#ffffff',
		borderRadius: '12px',
		border: '1px solid #e9ecef',
	} as React.CSSProperties,

	apiEndpointsHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		margin: '0 0 0.5rem 0',
		color: '#495057',
		fontSize: '1.25rem',
		fontWeight: 600,
	} as React.CSSProperties,

	apiEndpointsDescription: {
		margin: '0 0 1rem 0',
		color: '#6b7280',
	} as React.CSSProperties,

	apiEndpointsTable: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1rem',
		marginTop: '1rem',
	} as React.CSSProperties,

	apiEndpointCell: {
		display: 'flex',
		alignItems: 'center',
		padding: '0.75rem',
		background: '#f8f9fa',
		border: '1px solid #e9ecef',
		borderRadius: '6px',
		textDecoration: 'none',
		color: 'inherit',
		fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
		fontSize: '0.875rem',
		transition: 'all 0.2s ease',
	} as React.CSSProperties,

	apiEndpointText: {
		marginLeft: '0.5rem',
	} as React.CSSProperties,

	apiVerb: (method: 'GET' | 'POST' | 'PUT' | 'DELETE'): React.CSSProperties => ({
		display: 'inline-block',
		width: '60px',
		fontWeight: 'bold',
		color:
			method === 'GET'
				? '#2563eb'
				: method === 'POST'
					? '#10b981'
					: method === 'PUT'
						? '#f59e0b'
						: '#dc2626',
	}),

	apiDisplayModal: (isOpen: boolean): React.CSSProperties => ({
		position: 'fixed',
		top: 0,
		right: isOpen ? 0 : '-600px',
		width: '600px',
		height: '100vh',
		background: 'white',
		boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
		zIndex: 1000,
		transition: 'right 0.3s ease',
		overflowY: 'auto',
	}),

	apiDisplayOverlay: (isOpen: boolean): React.CSSProperties => ({
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: 'rgba(0, 0, 0, 0.5)',
		zIndex: 999,
		display: isOpen ? 'block' : 'none',
	}),

	apiDisplayHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '1.5rem',
		borderBottom: '1px solid #e9ecef',
		background: '#f8f9fa',
	} as React.CSSProperties,

	apiDisplayTitle: {
		margin: 0,
		fontSize: '1.25rem',
		fontWeight: 600,
		color: '#495057',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties,

	closeButton: {
		background: 'none',
		border: 'none',
		fontSize: '1.5rem',
		cursor: 'pointer',
		color: '#6b7280',
		padding: '0.5rem',
		borderRadius: '4px',
	} as React.CSSProperties,

	apiDisplayContent: {
		padding: '1.5rem',
	} as React.CSSProperties,

	pagination: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		gap: '1rem',
		marginTop: '2rem',
	} as React.CSSProperties,

	paginationButton: (active?: boolean): React.CSSProperties => ({
		padding: '0.5rem 1rem',
		border: '1px solid #ddd',
		background: active ? '#2563eb' : 'white',
		color: active ? 'white' : '#111827',
		borderRadius: '4px',
		cursor: 'pointer',
		transition: 'all 0.2s ease',
	}),
};

const EnvironmentManagementPageV8: React.FC = () => {
	const [environments, setEnvironments] = useState<PingOneEnvironment[]>([]);
	const [loading, setLoading] = useState(true);
	const [envError, setEnvError] = useState<string | null>(null);
	const [totalPages, setTotalPages] = useState(1);
	const [showApiDisplay, setShowApiDisplay] = useState(false);
	const [isChangingRegion, setIsChangingRegion] = useState(false);
	const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
	const [selectedApiRegion, setSelectedApiRegion] = useState<string>('na');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [regionFilter, setRegionFilter] = useState<string>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
	const [showBulkActions, setShowBulkActions] = useState(false);

	// Global worker token for authenticated API calls
	const globalTokenStatus = useGlobalWorkerToken();

	// Worker token state - using unifiedWorkerTokenService for consistency
	const [_workerToken, setWorkerToken] = useState<string>(() => {
		// Try to get token from unifiedWorkerTokenService first
		try {
			const tokenData = unifiedWorkerTokenService.getTokenDataSync();
			return tokenData?.token || '';
		} catch {
			return '';
		}
	});
	// Listen for token updates
	useEffect(() => {
		const handleTokenUpdate = async () => {
			// Get token from unifiedWorkerTokenService
			try {
				const tokenData = unifiedWorkerTokenService.getTokenDataSync();
				const token = tokenData?.token || '';
				setWorkerToken(token);
				// Note: workerTokenExpiresAt is managed by WorkerTokenDetectedBanner component
			} catch (error) {
				console.error(
					'[EnvironmentManagementPageV8] Failed to get token from unifiedWorkerTokenService:',
					error
				);
				setWorkerToken('');
			}
		};

		// Initial load
		handleTokenUpdate();

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('workerTokenMetricsUpdated', handleTokenUpdate);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('workerTokenMetricsUpdated', handleTokenUpdate);
		};
	}, []);

	const pageSize = 12;
	const STORAGE_KEY = 'environment-management-settings';
	const [displayAll, _setDisplayAll] = useState(false);
	const [_showCreateModal, _setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState<PingOneEnvironment | null>(null);
	const [editName, setEditName] = useState('');
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [_newEnvironment, _setNewEnvironment] = useState({
		name: '',
		description: '',
		type: 'SANDBOX',
	});
	const [searchTerm, setSearchTerm] = useState('');

	// Filter environments based on all criteria
	const filteredEnvironments = useMemo(() => {
		if (!environments || environments.length === 0) return [];

		let filtered = [...environments];

		// If a specific environment is selected from dropdown, show only that one
		if (selectedEnvironmentId) {
			filtered = filtered.filter((env) => env.id === selectedEnvironmentId);
		} else {
			// Apply other filters only when no specific environment is selected
			if (searchTerm) {
				filtered = filtered.filter(
					(env) =>
						env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						env.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
						env.description?.toLowerCase().includes(searchTerm.toLowerCase())
				);
			}

			if (typeFilter !== 'all') {
				filtered = filtered.filter((env) => env.type === typeFilter);
			}

			if (statusFilter !== 'all') {
				filtered = filtered.filter((env) => env.status === statusFilter);
			}

			if (regionFilter !== 'all') {
				filtered = filtered.filter((env) => env.region === regionFilter);
			}
		}

		return filtered;
	}, [environments, searchTerm, typeFilter, statusFilter, regionFilter, selectedEnvironmentId]);

	// Load settings from IndexedDB backup on component mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				// Load from localStorage (fallback since unified storage is for tokens)
				const storedSettings = localStorage.getItem(STORAGE_KEY);
				if (storedSettings) {
					const backupSettings = JSON.parse(storedSettings);
					console.log('[ENV-MGMT] ✅ Loaded settings from localStorage');
					setSelectedApiRegion(backupSettings.selectedApiRegion || 'na');
					setTypeFilter(backupSettings.typeFilter || 'all');
					setStatusFilter(backupSettings.statusFilter || 'all');
					setRegionFilter(backupSettings.regionFilter || 'all');
					setCurrentPage(backupSettings.currentPage || 1);
					return;
				}
			} catch (error) {
				console.warn('[ENV-MGMT] Failed to load settings from localStorage', error);
			}
		};

		loadSettings();
	}, []);

	// Save settings to IndexedDB backup whenever they change
	useEffect(() => {
		const saveSettings = async () => {
			const settings = {
				selectedApiRegion,
				typeFilter,
				statusFilter,
				regionFilter,
				currentPage,
				timestamp: Date.now(),
			};

			try {
				// Save to localStorage (fallback since unified storage is for tokens)
				localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
				console.log('[ENV-MGMT] ✅ Settings saved to localStorage');
			} catch (error) {
				console.warn('[ENV-MGMT] Failed to save settings to localStorage', error);
			}
		};

		// Debounce saves to avoid excessive writes
		const timeoutId = setTimeout(saveSettings, 500);
		return () => clearTimeout(timeoutId);
	}, [selectedApiRegion, typeFilter, statusFilter, regionFilter, currentPage]);

	// Test function to debug environment fetching
	const _testEnvironmentFetch = useCallback(async () => {
		console.log('[TEST] Starting environment fetch test...');
		try {
			const token = unifiedWorkerTokenService.getTokenDataSync()?.token;
			if (!token) {
				console.error('[TEST] No token available');
				return;
			}

			const response = await fetch(`/api/test-environments?accessToken=${token}&region=na`);
			const data = await response.json();
			console.log('[TEST] Response:', data);
		} catch (error) {
			console.error('[TEST] Error:', error);
		}
	}, []);

	const fetchEnvironments = useCallback(async () => {
		console.log('[EnvironmentManagementPageV8] 🚀 Starting fetchEnvironments...');

		try {
			setLoading(true);
			setEnvError(null);

			console.log('[EnvironmentManagementPageV8] 📊 Fetching environments - Token status:', {
				isLoading: globalTokenStatus.isLoading,
				isValid: globalTokenStatus.isValid,
				hasToken: !!globalTokenStatus.token,
				tokenLength: globalTokenStatus.token?.length || 0,
				error: globalTokenStatus.error,
				message: globalTokenStatus.message,
			});

			// Check if global worker token is still loading
			if (globalTokenStatus.isLoading) {
				console.log(
					'[EnvironmentManagementPageV8] ⏳ Global worker token is still loading, skipping fetch'
				);
				return;
			}

			// Check if global worker token is available and valid
			if (!globalTokenStatus.isValid || !globalTokenStatus.token) {
				console.log(
					'[EnvironmentManagementPageV8] ❌ Global worker token not available, skipping fetch',
					{
						isValid: globalTokenStatus.isValid,
						hasToken: !!globalTokenStatus.token,
						error: globalTokenStatus.error,
					}
				);
				// Don't throw error - just return early to allow UI to show worker token prompt
				return;
			}

			console.log(
				'[EnvironmentManagementPageV8] ✅ Token is valid, proceeding with environment fetch'
			);

			const filters: {
				type?: string[];
				status?: string[];
				region?: string[];
				search?: string;
				page?: number;
				pageSize?: number;
			} = {};

			// Add filters if they're set
			if (typeFilter !== 'all') {
				filters.type = [typeFilter];
			}
			if (statusFilter !== 'all') {
				filters.status = [statusFilter];
			}
			if (regionFilter !== 'all') {
				filters.region = [regionFilter];
			}

			// Add pagination
			if (displayAll) {
				filters.page = 1;
				filters.pageSize = 1000; // Large number to get all environments
			} else {
				filters.page = currentPage;
				filters.pageSize = pageSize;
			}

			console.log('[EnvironmentManagementPageV8] 🔍 Fetching with filters:', {
				filters,
				selectedApiRegion,
				currentPage,
			});

			// Track the API call
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: `/api/environments?page=${currentPage}&pageSize=${pageSize}`,
				headers: {
					Authorization: `Bearer ${globalTokenStatus.token?.substring(0, 20)}...`,
					'Content-Type': 'application/json',
				},
				queryParams: Object.fromEntries(
					Object.entries(filters)
						.filter(([, v]) => v !== undefined && v !== 'all')
						.map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)])
				),
			});

			console.log(
				'[EnvironmentManagementPageV8] 📡 Making API call to EnvironmentServiceV8.getEnvironments'
			);

			const response = await EnvironmentServiceV8.getEnvironments(
				filters,
				globalTokenStatus.token,
				selectedApiRegion // Use selected API region
			);

			console.log('[EnvironmentManagementPageV8] 📦 Received response:', {
				response,
				environmentsCount: response?.environments?.length,
				totalCount: response?.totalCount,
				hasResponse: !!response,
				hasEnvironments: !!response?.environments,
				environmentsArray: response?.environments,
				fullResponse: JSON.stringify(response, null, 2),
			});

			// Update the API call with response
			apiCallTrackerService.updateApiCallResponse(callId, {
				status: 200,
				statusText: 'OK',
				data: response,
			});

			// CRITICAL FIX: Ensure environments is always an array, never undefined
			const envs = response?.environments ?? [];
			console.log('[EnvironmentManagementPageV8] 📝 Setting environments:', {
				count: envs.length,
				firstEnv: envs[0] || 'No environments',
			});

			setEnvironments(envs);
			setTotalPages(Math.ceil((response?.totalCount ?? 0) / pageSize));

			console.log('[EnvironmentManagementPageV8] ✅ Successfully loaded environments');
		} catch (err) {
			console.error('[EnvironmentManagementPageV8] 💥 Failed to fetch environments:', {
				error: err,
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
			});

			const errorMessage = err instanceof Error ? err.message : 'Failed to fetch environments';
			setEnvError(errorMessage);

			// CRITICAL: Set empty array on error to prevent undefined .map() crash
			setEnvironments([]);
			setTotalPages(1);
		} finally {
			console.log('[EnvironmentManagementPageV8] 🏁 Fetch environments completed');
			setLoading(false);
		}
	}, [
		typeFilter,
		statusFilter,
		regionFilter,
		currentPage,
		selectedApiRegion,
		globalTokenStatus.isValid,
		globalTokenStatus.token,
		globalTokenStatus.isLoading,
		globalTokenStatus.error,
		globalTokenStatus.message,
		displayAll,
	]);

	useEffect(() => {
		// Only fetch environments when global worker token is not loading
		if (!globalTokenStatus.isLoading) {
			fetchEnvironments();
		}
	}, [fetchEnvironments, globalTokenStatus.isLoading]);

	const handleRefresh = () => {
		fetchEnvironments();
	};

	const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newRegion = e.target.value;
		console.log('[EnvironmentManagementPageV8] 🌍 Region changing to:', newRegion);
		setIsChangingRegion(true);
		setSelectedApiRegion(newRegion);
		// Reset to first page when changing region
		setCurrentPage(1);
		// Clear environments immediately for better UX
		setEnvironments([]);
		setEnvError(null);
		// Reset selected environment when region changes
		setSelectedEnvironmentId('');
		// Reset loading state after a short delay to allow for smooth transition
		setTimeout(() => setIsChangingRegion(false), 300);
	};

	const handleToggleApiDisplay = () => {
		setShowApiDisplay(!showApiDisplay);
	};

	const handleCreateEnvironment = () => {
		// eslint-disable-next-line no-alert
		const name = window.prompt('Enter environment name:', '');

		if (name?.trim()) {
			// Simple environment creation - in a real app this would call an API
			console.log('Create environment:', name.trim());

			// For demo purposes, we'll just log it
			// In production: await EnvironmentServiceV8.createEnvironment({ name: name.trim() });

			setEnvError('Environment created (demo mode - no API call made)');
			// In production: fetchEnvironments();
		}
	};

	const handleExportEnvironments = () => {
		try {
			const dataStr = JSON.stringify(environments || [], null, 2);
			const dataBlob = new Blob([dataStr], { type: 'application/json' });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `environments-export-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to export environments:', error);
			setEnvError('Failed to export environments');
		}
	};

	const handleImportEnvironments = () => {
		// TODO: Implement import functionality
		console.log('Import environments - Feature not yet implemented');
		setEnvError('Import functionality coming soon');
	};

	const handleEditEnvironment = (id: string) => {
		const environment = environments.find((env) => env.id === id);
		if (!environment) return;

		// Open custom edit modal
		setEditingEnvironment(environment);
		setEditName(environment.name);
		setHasUnsavedChanges(false);
		setShowEditModal(true);
	};

	const handleSaveEdit = () => {
		if (!editingEnvironment || !editName.trim()) return;

		if (editName.trim() !== editingEnvironment.name) {
			// Simple name update - in a real app this would call an API
			console.log('Update environment name:', editingEnvironment.id, editName.trim());

			// For demo purposes, we'll just log it
			// In production: await EnvironmentServiceV8.updateEnvironmentName(editingEnvironment.id, editName.trim());

			setEnvError('Environment name updated (demo mode - no API call made)');
			setHasUnsavedChanges(false);
			// In production: fetchEnvironments();
		}

		// Close modal
		setShowEditModal(false);
		setEditingEnvironment(null);
		setEditName('');
	};

	const handleCancelEdit = () => {
		setShowEditModal(false);
		setEditingEnvironment(null);
		setEditName('');
		setHasUnsavedChanges(false);
	};

	const handleNameChange = (value: string) => {
		setEditName(value);
		if (editingEnvironment && value.trim() !== editingEnvironment.name) {
			setHasUnsavedChanges(true);
		} else {
			setHasUnsavedChanges(false);
		}
	};

	const handleDeleteEnvironment = async (id: string) => {
		try {
			const environment = environments.find((env) => env.id === id);
			if (!environment) return;

			// Show confirmation dialog
			// eslint-disable-next-line no-alert
			const confirmed = window.confirm(
				`Are you sure you want to delete the environment "${environment.name}"?\n\nThis action cannot be undone and will permanently remove the environment and all associated data.`
			);

			if (!confirmed) return;

			setEnvError(null);

			await EnvironmentServiceV8.deleteEnvironment(id);
			fetchEnvironments();
		} catch (err) {
			setEnvError(err instanceof Error ? err.message : 'Failed to delete environment');
		}
	};

	const handleToggleEnvironmentStatus = async (id: string) => {
		try {
			const environment = environments.find((env) => env.id === id);
			if (!environment) return;

			const newStatus = environment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
			await EnvironmentServiceV8.updateEnvironmentStatus(id, newStatus);
			fetchEnvironments();
		} catch (err) {
			setEnvError(err instanceof Error ? err.message : 'Failed to update environment status');
		}
	};

	const handleSelectEnvironment = (id: string) => {
		setSelectedEnvironments((prev) =>
			prev.includes(id) ? prev.filter((envId) => envId !== id) : [...prev, id]
		);
	};

	const handleSelectAll = () => {
		// CRITICAL FIX: Add null safety check for environments array
		if (!environments || environments.length === 0) {
			setSelectedEnvironments([]);
			return;
		}

		if (selectedEnvironments.length === environments.length) {
			setSelectedEnvironments([]);
		} else {
			setSelectedEnvironments(environments.map((env) => env.id));
		}
	};

	const handleBulkDelete = async () => {
		try {
			await EnvironmentServiceV8.performBulkOperation({
				environmentIds: selectedEnvironments,
				operation: 'delete',
			});
			setSelectedEnvironments([]);
			fetchEnvironments();
		} catch (err) {
			setEnvError(err instanceof Error ? err.message : 'Failed to delete environments');
		}
	};

	const handleBulkStatusUpdate = async (status: 'ACTIVE' | 'INACTIVE') => {
		try {
			await EnvironmentServiceV8.performBulkOperation({
				environmentIds: selectedEnvironments,
				operation: 'status_update',
				parameters: { status },
			});
			setSelectedEnvironments([]);
			fetchEnvironments();
		} catch (err) {
			setEnvError(err instanceof Error ? err.message : 'Failed to update environments');
		}
	};

	useEffect(() => {
		setShowBulkActions(selectedEnvironments.length > 0);
	}, [selectedEnvironments]);

	if (globalTokenStatus.isLoading) {
		return <div style={styles.loadingMessage}>Initializing global worker token...</div>;
	}

	// Show worker token UI when token is not available
	if (!globalTokenStatus.isValid || !globalTokenStatus.token) {
		return (
			<div style={styles.container}>
				<div style={styles.header}>
					<h1>Environment Management</h1>
				</div>

				<div
					style={{
						background: '#f8fafc',
						border: '1px solid #e2e8f0',
						borderRadius: '8px',
						padding: '2rem',
						textAlign: 'center',
						marginBottom: '2rem',
					}}
				>
					<h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Worker Token Required</h3>
					<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
						A valid worker token is required to access and manage PingOne environments. Please
						generate a worker token to continue.
					</p>

					<WorkerTokenSectionV8 compact />
				</div>
			</div>
		);
	}

	if (loading && environments.length === 0) {
		return <div style={styles.loadingMessage}>Loading environments...</div>;
	}

	if (envError) {
		return <div style={styles.errorMessage}>Error: {envError}</div>;
	}

	return (
		<div style={styles.container}>
			<div style={styles.educationalSection}>
				<div style={styles.educationalHeader}>
					<FiBook size={24} />
					<h2 style={styles.educationalTitle}>PingOne Environments API</h2>
				</div>
				<div style={styles.educationalContent}>
					<div style={styles.educationalCard}>
						<h3 style={styles.educationalCardTitle}>
							<FiInfo />
							What are Environments?
						</h3>
						<div style={styles.educationalCardText}>
							Every organization contains at least one environment resource. Environments are the
							primary subdivision of an organization and contain the core resources on which all
							identity services are built. They can be based on region or used to segregate
							operations by functionality, staging, or configurations.
						</div>
					</div>
					<div style={styles.educationalCard}>
						<h3 style={styles.educationalCardTitle}>
							<FiShield />
							Environment Types
						</h3>
						<div style={styles.educationalCardText}>
							<strong>PRODUCTION:</strong> Contains actual business identities. Requires non-Trial
							license. Cannot be immediately deleted - must go through soft delete state.
							<br />
							<strong>SANDBOX:</strong> Temporary configurations for testing. Can be deleted
							immediately. Cannot be restored once deleted.
						</div>
					</div>
				</div>
			</div>

			{/* API Endpoints Section - Full Width */}
			<div style={styles.apiEndpointsSection}>
				<h3 style={styles.apiEndpointsHeader}>
					<FiCode />
					Supported API Endpoints
				</h3>
				<p style={styles.apiEndpointsDescription}>
					All environment management operations are supported and tracked:
				</p>
				<div style={styles.apiEndpointsTable}>
					<a
						style={styles.apiEndpointCell}
						href="https://developer.pingidentity.com/pingone-api/platform/environments.html#get-read-all-environments"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span style={styles.apiVerb('GET')}>GET</span>
						<span style={styles.apiEndpointText}>/api/environments - List all environments</span>
					</a>
					<a
						style={styles.apiEndpointCell}
						href="https://developer.pingidentity.com/pingone-api/platform/environments.html#get-read-one-environment"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span style={styles.apiVerb('GET')}>GET</span>
						<span style={styles.apiEndpointText}>
							/api/environments/:id - Get single environment
						</span>
					</a>
					<a
						style={styles.apiEndpointCell}
						href="https://developer.pingidentity.com/pingone-api/platform/environments.html#post-create-environment-activelicense"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span style={styles.apiVerb('POST')}>POST</span>
						<span style={styles.apiEndpointText}>/api/environments - Create new environment</span>
					</a>
					<a
						style={styles.apiEndpointCell}
						href="https://developer.pingidentity.com/pingone-api/platform/environments.html#put-update-environment"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span style={styles.apiVerb('PUT')}>PUT</span>
						<span style={styles.apiEndpointText}>/api/environments/:id - Update environment</span>
					</a>
					<a
						style={styles.apiEndpointCell}
						href="https://developer.pingidentity.com/pingone-api/platform/environments.html#put-update-environment"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span style={styles.apiVerb('PUT')}>PUT</span>
						<span style={styles.apiEndpointText}>/api/environments/:id/status - Update status</span>
					</a>
					<a
						style={styles.apiEndpointCell}
						href="https://developer.pingidentity.com/pingone-api/platform/environments.html#delete-delete-environment"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span style={styles.apiVerb('DELETE')}>DELETE</span>
						<span style={styles.apiEndpointText}>/api/environments/:id - Delete environment</span>
					</a>
				</div>
			</div>

			<div style={styles.header}>
				<h1 style={styles.title}>PingOne Environment Management</h1>
				<div style={styles.actions}>
					<button type="button" style={styles.button()} onClick={handleRefresh}>
						<FiRefreshCw />
						Refresh
					</button>
					<button
						type="button"
						style={styles.button(showApiDisplay ? 'primary' : 'secondary')}
						onClick={handleToggleApiDisplay}
					>
						<FiCode />
						{showApiDisplay ? 'Hide API' : 'Show API'}
					</button>
					<button
						type="button"
						style={styles.button('secondary')}
						onClick={handleExportEnvironments}
					>
						<FiDownload />
						Export
					</button>
					<button
						type="button"
						style={styles.button('secondary')}
						onClick={handleImportEnvironments}
					>
						<FiUpload />
						Import
					</button>
					<button type="button" style={styles.button('primary')} onClick={handleCreateEnvironment}>
						<FiPlus />
						Create Environment
					</button>
				</div>
			</div>

			<div style={styles.searchContainer}>
				<select
					style={{ ...styles.filterSelect, minWidth: '150px', opacity: isChangingRegion ? 0.6 : 1 }}
					value={selectedApiRegion}
					onChange={handleRegionChange}
					disabled={isChangingRegion}
				>
					<option value="na">North America</option>
					<option value="ca">Canada</option>
					<option value="eu">Europe</option>
					<option value="au">Australia</option>
					<option value="sg">Singapore</option>
					<option value="ap">Asia Pacific</option>
				</select>
				<select
					style={{ ...styles.filterSelect, flex: 1, minWidth: '300px' }}
					value={selectedEnvironmentId}
					onChange={(e) => setSelectedEnvironmentId(e.target.value)}
				>
					<option value="">Select Environment...</option>
					{environments?.map((env) => (
						<option key={env.id} value={env.id}>
							{env.name} ({env.type}) - {env.region}
						</option>
					))}
				</select>
				<div style={styles.filterContainer}>
					<select
						style={styles.filterSelect}
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value)}
					>
						<option value="all">All Types</option>
						<option value="PRODUCTION">Production</option>
						<option value="SANDBOX">Sandbox</option>
						<option value="DEVELOPMENT">Development</option>
					</select>
					<select
						style={styles.filterSelect}
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="all">All Status</option>
						<option value="ACTIVE">Active</option>
						<option value="INACTIVE">Inactive</option>
						<option value="DELETE_PENDING">Delete Pending</option>
					</select>
					<select
						style={styles.filterSelect}
						value={regionFilter}
						onChange={(e) => setRegionFilter(e.target.value)}
					>
						<option value="all">All Regions</option>
						<option value="NA">North America (.com)</option>
						<option value="EU">European Union (.eu)</option>
						<option value="CA">Canada (.ca)</option>
						<option value="AU">Australia (.com.au)</option>
						<option value="SG">Singapore (.sg)</option>
						<option value="AP">Asia Pacific (.asia)</option>
					</select>
				</div>
			</div>

			{showBulkActions && (
				<div
					style={{
						marginBottom: '1rem',
						padding: '1rem',
						background: '#f8f9fa',
						borderRadius: '4px',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<span>{selectedEnvironments.length} environments selected</span>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<button
								type="button"
								style={styles.button('secondary')}
								onClick={() => handleBulkStatusUpdate('ACTIVE')}
							>
								Activate
							</button>
							<button
								type="button"
								style={styles.button('secondary')}
								onClick={() => handleBulkStatusUpdate('INACTIVE')}
							>
								Deactivate
							</button>
							<button type="button" style={styles.button('danger')} onClick={handleBulkDelete}>
								Delete
							</button>
							<button
								type="button"
								style={styles.button('secondary')}
								onClick={() => setSelectedEnvironments([])}
							>
								Clear Selection
							</button>
						</div>
					</div>
				</div>
			)}

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '1rem',
					padding: '1rem',
					background: '#f8f9fa',
					borderRadius: '4px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<input
						type="checkbox"
						checked={
							selectedEnvironments.length === environments?.length && environments?.length > 0
						}
						{...(selectedEnvironments.length > 0 &&
						selectedEnvironments.length < (environments?.length || 0)
							? { indeterminate: 'true' }
							: {})}
						onChange={handleSelectAll}
						style={{ marginRight: '0.5rem' }}
						id="select-all-checkbox"
					/>
					<label htmlFor="select-all-checkbox">
						Select All ({environments?.length || 0} environments)
					</label>
				</div>
				<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
					<input
						type="text"
						placeholder="Search environments..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{
							padding: '0.5rem',
							border: '1px solid #ddd',
							borderRadius: '4px',
							minWidth: '200px',
						}}
					/>
				</div>
			</div>

			<div style={styles.environmentGrid}>
				{/* CRITICAL FIX: Add null safety check to prevent undefined .map() crash */}
				{filteredEnvironments.map((environment) => (
					<div key={environment.id} style={styles.environmentCard}>
						<div style={styles.cardHeader}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<input
									type="checkbox"
									checked={selectedEnvironments.includes(environment.id)}
									onChange={() => handleSelectEnvironment(environment.id)}
									style={{ marginRight: '0.5rem' }}
								/>
								<h3 style={styles.cardTitle}>{environment.name}</h3>
							</div>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									gap: '0.25rem',
								}}
							>
								<span style={styles.cardStatus(environment.status)}>
									{EnvironmentServiceV8.formatEnvironmentStatus(environment.status)}
								</span>
								<span style={styles.cardType(environment.type)}>
									{EnvironmentServiceV8.formatEnvironmentType(environment.type)}
								</span>
							</div>
						</div>

						{environment.description && (
							<p style={styles.cardDescription}>{environment.description}</p>
						)}

						<div style={styles.cardInfo}>
							<div style={styles.infoItem}>
								<span style={styles.infoLabel}>ID:</span>
								<span style={styles.infoValue}>{environment.id}</span>
							</div>
							<div style={styles.infoItem}>
								<span style={styles.infoLabel}>Region:</span>
								<span style={styles.infoValue}>{environment.region || 'N/A'}</span>
							</div>
							<div style={styles.infoItem}>
								<span style={styles.infoLabel}>Created:</span>
								<span style={styles.infoValue}>
									{new Date(environment.createdAt).toLocaleDateString()}
								</span>
							</div>
							<div style={styles.infoItem}>
								<span style={styles.infoLabel}>Updated:</span>
								<span style={styles.infoValue}>
									{new Date(environment.updatedAt).toLocaleDateString()}
								</span>
							</div>
							<div style={styles.infoItem}>
								<span style={styles.infoLabel}>Services:</span>
								<span style={styles.infoValue}>{environment.enabledServices.length}</span>
							</div>
							<div style={styles.infoItem}>
								<span style={styles.infoLabel}>Status:</span>
								<span style={styles.infoValue}>
									{EnvironmentServiceV8.formatEnvironmentStatus(environment.status)}
								</span>
							</div>
						</div>

						<div style={styles.cardActions}>
							<button
								type="button"
								style={styles.iconButton}
								onClick={() => handleToggleEnvironmentStatus(environment.id)}
								disabled={!EnvironmentServiceV8.canEditEnvironment(environment)}
								title={environment.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
							>
								<FiRefreshCw />
							</button>
							<button
								type="button"
								style={styles.iconButton}
								onClick={() => handleEditEnvironment(environment.id)}
								disabled={!EnvironmentServiceV8.canEditEnvironment(environment)}
								title="Edit"
							>
								<FiEdit2 />
							</button>
							<button
								type="button"
								style={styles.iconButton}
								onClick={() => handleDeleteEnvironment(environment.id)}
								disabled={!EnvironmentServiceV8.canDeleteEnvironment(environment)}
								title="Delete"
							>
								<FiTrash2 />
							</button>
						</div>
					</div>
				))}
			</div>

			{totalPages > 1 && (
				<div style={styles.pagination}>
					<button
						type="button"
						style={styles.paginationButton(false)}
						onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
						disabled={currentPage === 1}
					>
						Previous
					</button>

					{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
						<button
							key={page}
							type="button"
							style={styles.paginationButton(page === currentPage)}
							onClick={() => setCurrentPage(page)}
						>
							{page}
						</button>
					))}

					<button
						type="button"
						style={styles.paginationButton(false)}
						onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
						disabled={currentPage === totalPages}
					>
						Next
					</button>
				</div>
			)}

			{/* Edit Environment Modal */}
			<button
				type="button"
				aria-label="Close modal"
				style={{ ...styles.apiDisplayOverlay(showEditModal), border: 'none' }}
				onClick={handleCancelEdit}
			/>
			<div style={styles.apiDisplayModal(showEditModal)}>
				<div style={styles.apiDisplayHeader}>
					<h3 style={styles.apiDisplayTitle}>
						<FiEdit2 />
						Edit Environment
					</h3>
					<button type="button" style={styles.closeButton} onClick={handleCancelEdit}>
						×
					</button>
				</div>
				<div style={styles.apiDisplayContent}>
					<div style={{ padding: '1rem' }}>
						{editingEnvironment && (
							<div>
								<div style={{ marginBottom: '1rem' }}>
									<label
										htmlFor="env-id"
										style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}
									>
										Environment ID
									</label>
									<input
										id="env-id"
										type="text"
										value={editingEnvironment.id}
										disabled
										style={{
											width: '100%',
											padding: '0.5rem',
											border: '1px solid #ddd',
											borderRadius: '4px',
											background: '#f5f5f5',
										}}
									/>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<label
										htmlFor="env-name"
										style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}
									>
										Environment Name
									</label>
									<input
										id="env-name"
										type="text"
										value={editName}
										onChange={(e) => handleNameChange(e.target.value)}
										placeholder="Enter environment name"
										style={{
											width: '100%',
											padding: '0.5rem',
											border: '1px solid #ddd',
											borderRadius: '4px',
											fontSize: '1rem',
										}}
									/>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<label
										htmlFor="env-type"
										style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}
									>
										Type
									</label>
									<input
										id="env-type"
										type="text"
										value={editingEnvironment.type}
										disabled
										style={{
											width: '100%',
											padding: '0.5rem',
											border: '1px solid #ddd',
											borderRadius: '4px',
											background: '#f5f5f5',
										}}
									/>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<label
										htmlFor="env-region"
										style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}
									>
										Region
									</label>
									<input
										id="env-region"
										type="text"
										value={editingEnvironment.region || 'N/A'}
										disabled
										style={{
											width: '100%',
											padding: '0.5rem',
											border: '1px solid #ddd',
											borderRadius: '4px',
											background: '#f5f5f5',
										}}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
				<div
					style={{
						padding: '1rem',
						borderTop: '1px solid #eee',
						display: 'flex',
						gap: '0.5rem',
						justifyContent: 'flex-end',
					}}
				>
					<button type="button" style={styles.button('secondary')} onClick={handleCancelEdit}>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSaveEdit}
						disabled={!editName.trim()}
						style={{
							...styles.button(),
							backgroundColor: hasUnsavedChanges
								? '#dc2626'
								: editName.trim()
									? '#2563eb'
									: '#6b7280',
							color: '#fff',
							opacity: editName.trim() ? 1 : 0.6,
							cursor: editName.trim() ? 'pointer' : 'not-allowed',
						}}
					>
						{hasUnsavedChanges ? 'Save Changes*' : editName.trim() ? 'Saved' : 'Save Changes'}
					</button>
				</div>
			</div>

			{/* API Display Modal */}
			<button
				type="button"
				aria-label="Close modal"
				style={{ ...styles.apiDisplayOverlay(showApiDisplay), border: 'none' }}
				onClick={() => setShowApiDisplay(false)}
			/>
			<div style={styles.apiDisplayModal(showApiDisplay)}>
				<div style={styles.apiDisplayHeader}>
					<h3 style={styles.apiDisplayTitle}>
						<FiCode />
						API Call History
					</h3>
					<button type="button" style={styles.closeButton} onClick={() => setShowApiDisplay(false)}>
						×
					</button>
				</div>
				<div style={styles.apiDisplayContent}>
					<ApiCallList />
				</div>
			</div>

			{/* Worker Token Section - Always available */}
			<WorkerTokenSectionV8 compact />
		</div>
	);
};

export default EnvironmentManagementPageV8;
