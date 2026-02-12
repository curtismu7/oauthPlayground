// src/pages/EnvironmentManagementPageV8.tsx
// V8 Environment Management Page - Main dashboard for PingOne environment management

import React, { useCallback, useEffect, useState } from 'react';
import { FiDownload, FiEdit2, FiPlus, FiRefreshCw, FiTrash2, FiUpload } from 'react-icons/fi';
import styled from 'styled-components';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import EnvironmentServiceV8, { PingOneEnvironment } from '../services/environmentServiceV8';
import { useWorkerTokenState, WorkerTokenUI } from '../services/workerTokenUIService';
import { IndexedDBBackupServiceV8U } from '../v8u/services/indexedDBBackupServiceV8U';
import { UnifiedOAuthCredentialsServiceV8U } from '../v8u/services/unifiedOAuthCredentialsServiceV8U';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${(props) => {
		switch (props.variant) {
			case 'primary':
				return '#007bff';
			case 'secondary':
				return '#6c757d';
			case 'danger':
				return '#dc3545';
			default:
				return '#007bff';
		}
	}};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${(props) => {
			switch (props.variant) {
				case 'primary':
					return '#0056b3';
				case 'secondary':
					return '#545b62';
				case 'danger':
					return '#c82333';
				default:
					return '#0056b3';
			}
		}};
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const EnvironmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const EnvironmentCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const CardStatus = styled.span<{ $status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${(props) => EnvironmentServiceV8.getStatusColor(props.$status)}20;
  color: ${(props) => EnvironmentServiceV8.getStatusColor(props.$status)};
`;

const CardType = styled.span<{ $type: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${(props) => EnvironmentServiceV8.getTypeColor(props.$type)}20;
  color: ${(props) => EnvironmentServiceV8.getTypeColor(props.$type)};
  margin-left: 0.5rem;
`;

const CardDescription = styled.p`
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const CardInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
`;

const InfoLabel = styled.span`
  color: #666;
`;

const InfoValue = styled.span`
  color: #333;
  font-weight: 500;
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #dc3545;
  font-size: 1.1rem;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: ${(props) => (props.active ? '#007bff' : 'white')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${(props) => (props.active ? '#0056b3' : '#f8f9fa')};
    border-color: #007bff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EnvironmentManagementPageV8: React.FC = () => {
	const [environments, setEnvironments] = useState<PingOneEnvironment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
	const [selectedApiRegion, setSelectedApiRegion] = useState<string>('na');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [regionFilter, setRegionFilter] = useState<string>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
	const [showBulkActions, setShowBulkActions] = useState(false);

	// Global worker token for authenticated API calls
	const globalTokenStatus = useGlobalWorkerToken();

	// Worker token UI state
	const {
		workerToken,
		workerTokenExpiresAt,
		showWorkerTokenModal,
		setShowWorkerTokenModal,
		handleModalContinue,
	} = useWorkerTokenState();

	const pageSize = 12;
	const STORAGE_KEY = 'environment-management-settings';
	const STORAGE_VERSION = 1;

	// Load settings from enhanced storage on component mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				// Try enhanced storage first (IndexedDB + SQLite backup)
				const enhancedSettings = await UnifiedOAuthCredentialsServiceV8U.loadCredentials(STORAGE_KEY, {
					environmentId: 'global',
					enableBackup: true,
				});
				
				if (enhancedSettings) {
					console.log('[ENV-MGMT] ✅ Loaded settings from enhanced storage');
					setSelectedApiRegion(enhancedSettings.selectedApiRegion || 'na');
					setTypeFilter(enhancedSettings.typeFilter || 'all');
					setStatusFilter(enhancedSettings.statusFilter || 'all');
					setRegionFilter(enhancedSettings.regionFilter || 'all');
					setCurrentPage(enhancedSettings.currentPage || 1);
					return;
				}
			} catch (error) {
				console.warn('[ENV-MGMT] Enhanced storage failed, trying fallback', error);
			}
			
			// Fallback to IndexedDB backup
			try {
				const backupSettings = await IndexedDBBackupServiceV8U.load(STORAGE_KEY);
				if (backupSettings) {
					console.log('[ENV-MGMT] ✅ Loaded settings from IndexedDB backup');
					setSelectedApiRegion(backupSettings.selectedApiRegion || 'na');
					setTypeFilter(backupSettings.typeFilter || 'all');
					setStatusFilter(backupSettings.statusFilter || 'all');
					setRegionFilter(backupSettings.regionFilter || 'all');
					setCurrentPage(backupSettings.currentPage || 1);
				}
			} catch (error) {
				console.warn('[ENV-MGMT] IndexedDB backup failed', error);
			}
		};
		
		loadSettings();
	}, []);

	// Save settings to enhanced storage when they change
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
				// Save to enhanced storage (IndexedDB + SQLite backup)
				await UnifiedOAuthCredentialsServiceV8U.saveCredentials(STORAGE_KEY, settings, {
					environmentId: 'global',
					enableBackup: true,
					backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
				});
				console.log('[ENV-MGMT] ✅ Settings saved to enhanced storage');
			} catch (error) {
				console.warn('[ENV-MGMT] Enhanced storage failed, using fallback', error);
				
				// Fallback to IndexedDB backup
				try {
					await IndexedDBBackupServiceV8U.save(STORAGE_KEY, settings);
					console.log('[ENV-MGMT] ✅ Settings saved to IndexedDB backup');
				} catch (backupError) {
					console.warn('[ENV-MGMT] IndexedDB backup failed', backupError);
				}
			}
		};
		
		// Debounce saves to avoid excessive writes
		const timeoutId = setTimeout(saveSettings, 500);
		return () => clearTimeout(timeoutId);
	}, [selectedApiRegion, typeFilter, statusFilter, regionFilter, currentPage]);

	const fetchEnvironments = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Check if global worker token is still loading
			if (globalTokenStatus.isLoading) {
				console.log(
					'[EnvironmentManagementPageV8] Global worker token is still loading, skipping fetch'
				);
				return;
			}

			// Check if global worker token is available and valid
			if (!globalTokenStatus.isValid || !globalTokenStatus.token) {
				console.log(
					'[EnvironmentManagementPageV8] Global worker token not available, skipping fetch'
				);
				// Don't throw error - just return early to allow UI to show worker token prompt
				return;
			}

			const filters: {
				type?: string[];
				status?: string[];
				region?: string[];
				page?: number;
				pageSize?: number;
			} = {
				page: currentPage,
				pageSize,
			};

			if (typeFilter !== 'all') {
				filters.type = [typeFilter];
			}

			if (statusFilter !== 'all') {
				filters.status = [statusFilter];
			}

			if (regionFilter !== 'all') {
				filters.region = [regionFilter];
			}

			const response = await EnvironmentServiceV8.getEnvironments(
				filters,
				globalTokenStatus.token,
				selectedApiRegion // Use selected API region
			);

			// CRITICAL FIX: Ensure environments is always an array, never undefined
			setEnvironments(response?.environments ?? []);
			setTotalPages(Math.ceil((response?.totalCount ?? 0) / pageSize));
		} catch (err) {
			console.error('[EnvironmentManagementPageV8] Failed to fetch environments:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch environments');
			// CRITICAL: Set empty array on error to prevent undefined .map() crash
			setEnvironments([]);
			setTotalPages(1);
		} finally {
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

	const handleCreateEnvironment = () => {
		// TODO: Implement create environment modal
		console.log('Create environment');
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
			setError('Failed to export environments');
		}
	};

	const handleImportEnvironments = () => {
		// TODO: Implement import functionality
		console.log('Import environments - Feature not yet implemented');
		setError('Import functionality coming soon');
	};

	const handleEditEnvironment = (id: string) => {
		// TODO: Implement edit environment modal
		console.log('Edit environment:', id);
	};

	const handleDeleteEnvironment = (id: string) => {
		// TODO: Implement delete confirmation modal
		console.log('Delete environment:', id);
	};

	const handleToggleEnvironmentStatus = async (id: string) => {
		try {
			const environment = environments.find((env) => env.id === id);
			if (!environment) return;

			const newStatus = environment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
			await EnvironmentServiceV8.updateEnvironmentStatus(id, newStatus);
			fetchEnvironments();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update environment status');
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
			setError(err instanceof Error ? err.message : 'Failed to delete environments');
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
			setError(err instanceof Error ? err.message : 'Failed to update environments');
		}
	};

	useEffect(() => {
		setShowBulkActions(selectedEnvironments.length > 0);
	}, [selectedEnvironments]);

	if (globalTokenStatus.isLoading) {
		return <LoadingMessage>Initializing global worker token...</LoadingMessage>;
	}

	// Show worker token UI when token is not available
	if (!globalTokenStatus.isValid || !globalTokenStatus.token) {
		return (
			<Container>
				<Header>
					<h1>Environment Management</h1>
				</Header>

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

					<WorkerTokenUI
						workerToken={workerToken}
						workerTokenExpiresAt={workerTokenExpiresAt || 0}
						showModal={showWorkerTokenModal}
						onShowModal={() => setShowWorkerTokenModal(true)}
						onCloseModal={() => setShowWorkerTokenModal(false)}
						onModalContinue={handleModalContinue}
						flowType="environment-management"
						generateButtonText="Get Worker Token for Environments"
						readyButtonText="Worker Token Ready"
						refreshButtonText="Refresh Worker Token"
						bannerMessage="Generate a worker token to access PingOne environment management features."
					/>
				</div>
			</Container>
		);
	}

	if (loading && environments.length === 0) {
		return <LoadingMessage>Loading environments...</LoadingMessage>;
	}

	if (error) {
		return <ErrorMessage>Error: {error}</ErrorMessage>;
	}

	return (
		<Container>
			<Header>
				<Title>PingOne Environment Management</Title>
				<Actions>
					<Button onClick={handleRefresh}>
						<FiRefreshCw />
						Refresh
					</Button>
					<Button variant="primary" onClick={handleCreateEnvironment}>
						<FiPlus />
						Create Environment
					</Button>
				</Actions>
			</Header>

			<SearchContainer>
				<FilterSelect
					value={selectedApiRegion}
					onChange={(e) => setSelectedApiRegion(e.target.value)}
					style={{ minWidth: '150px' }}
				>
					<option value="na">North America</option>
					<option value="ca">Canada</option>
					<option value="eu">Europe</option>
					<option value="au">Australia</option>
					<option value="sg">Singapore</option>
					<option value="ap">Asia Pacific</option>
				</FilterSelect>
				<FilterSelect
					value={selectedEnvironmentId}
					onChange={(e) => setSelectedEnvironmentId(e.target.value)}
					style={{ flex: 1, minWidth: '300px' }}
				>
					<option value="">Select Environment...</option>
					{environments?.map((env) => (
						<option key={env.id} value={env.id}>
							{env.name} ({env.type}) - {env.region}
						</option>
					))}
				</FilterSelect>
				<FilterContainer>
					<FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
						<option value="all">All Types</option>
						<option value="PRODUCTION">Production</option>
						<option value="SANDBOX">Sandbox</option>
						<option value="DEVELOPMENT">Development</option>
					</FilterSelect>
					<FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
						<option value="all">All Status</option>
						<option value="ACTIVE">Active</option>
						<option value="INACTIVE">Inactive</option>
						<option value="DELETE_PENDING">Delete Pending</option>
					</FilterSelect>
					<FilterSelect value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
						<option value="all">All Regions</option>
						<option value="us-east-1">US East</option>
						<option value="us-west-2">US West</option>
						<option value="eu-west-1">Europe West</option>
						<option value="ap-southeast-2">Asia Pacific</option>
					</FilterSelect>
				</FilterContainer>
			</SearchContainer>

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
							<Button variant="secondary" onClick={() => handleBulkStatusUpdate('ACTIVE')}>
								Activate
							</Button>
							<Button variant="secondary" onClick={() => handleBulkStatusUpdate('INACTIVE')}>
								Deactivate
							</Button>
							<Button variant="danger" onClick={handleBulkDelete}>
								Delete
							</Button>
							<Button variant="secondary" onClick={() => setSelectedEnvironments([])}>
								Clear Selection
							</Button>
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
				}}
			>
				<div>
					<input
						type="checkbox"
						checked={
							selectedEnvironments.length === (environments?.length || 0) &&
							(environments?.length || 0) > 0
						}
						onChange={handleSelectAll}
						style={{ marginRight: '0.5rem' }}
						id="select-all-checkbox"
					/>
					<label htmlFor="select-all-checkbox">
						Select All ({environments?.length || 0} environments)
					</label>
				</div>
				<div>
					<Button variant="secondary" onClick={handleExportEnvironments}>
						<FiDownload />
						Export
					</Button>
					<Button variant="secondary" onClick={handleImportEnvironments}>
						<FiUpload />
						Import
					</Button>
				</div>
			</div>

			<EnvironmentGrid>
				{/* CRITICAL FIX: Add null safety check to prevent undefined .map() crash */}
				{(environments ?? []).map((environment) => (
					<EnvironmentCard key={environment.id}>
						<CardHeader>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<input
									type="checkbox"
									checked={selectedEnvironments.includes(environment.id)}
									onChange={() => handleSelectEnvironment(environment.id)}
									style={{ marginRight: '0.5rem' }}
								/>
								<CardTitle>{environment.name}</CardTitle>
							</div>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									gap: '0.25rem',
								}}
							>
								<CardStatus $status={environment.status}>
									{EnvironmentServiceV8.formatEnvironmentStatus(environment.status)}
								</CardStatus>
								<CardType $type={environment.type}>
									{EnvironmentServiceV8.formatEnvironmentType(environment.type)}
								</CardType>
							</div>
						</CardHeader>

						{environment.description && (
							<CardDescription>{environment.description}</CardDescription>
						)}

						<CardInfo>
							<InfoItem>
								<InfoLabel>ID:</InfoLabel>
								<InfoValue>{environment.id}</InfoValue>
							</InfoItem>
							<InfoItem>
								<InfoLabel>Region:</InfoLabel>
								<InfoValue>{environment.region || 'N/A'}</InfoValue>
							</InfoItem>
							<InfoItem>
								<InfoLabel>Created:</InfoLabel>
								<InfoValue>{new Date(environment.createdAt).toLocaleDateString()}</InfoValue>
							</InfoItem>
							<InfoItem>
								<InfoLabel>Updated:</InfoLabel>
								<InfoValue>{new Date(environment.updatedAt).toLocaleDateString()}</InfoValue>
							</InfoItem>
							<InfoItem>
								<InfoLabel>Services:</InfoLabel>
								<InfoValue>{environment.enabledServices.length}</InfoValue>
							</InfoItem>
							<InfoItem>
								<InfoLabel>Status:</InfoLabel>
								<InfoValue>
									{EnvironmentServiceV8.formatEnvironmentStatus(environment.status)}
								</InfoValue>
							</InfoItem>
						</CardInfo>

						<CardActions>
							<IconButton
								onClick={() => handleToggleEnvironmentStatus(environment.id)}
								disabled={!EnvironmentServiceV8.canEditEnvironment(environment)}
								title={environment.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
							>
								<FiRefreshCw />
							</IconButton>
							<IconButton
								onClick={() => handleEditEnvironment(environment.id)}
								disabled={!EnvironmentServiceV8.canEditEnvironment(environment)}
								title="Edit"
							>
								<FiEdit2 />
							</IconButton>
							<IconButton
								onClick={() => handleDeleteEnvironment(environment.id)}
								disabled={!EnvironmentServiceV8.canDeleteEnvironment(environment)}
								title="Delete"
							>
								<FiTrash2 />
							</IconButton>
						</CardActions>
					</EnvironmentCard>
				))}
			</EnvironmentGrid>

			{totalPages > 1 && (
				<Pagination>
					<PaginationButton
						onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
						disabled={currentPage === 1}
					>
						Previous
					</PaginationButton>

					{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
						<PaginationButton
							key={page}
							onClick={() => setCurrentPage(page)}
							active={page === currentPage}
						>
							{page}
						</PaginationButton>
					))}

					<PaginationButton
						onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
						disabled={currentPage === totalPages}
					>
						Next
					</PaginationButton>
				</Pagination>
			)}
		</Container>
	);
};

export default EnvironmentManagementPageV8;
