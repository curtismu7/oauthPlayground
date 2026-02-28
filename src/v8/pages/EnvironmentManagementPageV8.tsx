// src/v8/pages/EnvironmentManagementPageV8.tsx
// PingOne Environment Management Page V8 - Main dashboard for managing environments

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiActivity,
	FiDatabase,
	FiEdit,
	FiEdit3,
	FiEye,
	FiFilter,
	FiGlobe,
	FiPlus,
	FiRefreshCw,
	FiSearch,
	FiServer,
	FiSettings,
	FiTrash,
	FiTrash2
} from '@icons';
import styled from 'styled-components';
import {
	type EnvironmentListOptions,
	type EnvironmentStatus,
	type EnvironmentType,
	environmentServiceV8,
	type PingOneEnvironment,
} from '../services/environmentServiceV8Simple';

// Styled Components
const PageContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #f8fafc;
`;

const Header = styled.div`
	background: white;
	border-bottom: 1px solid #e2e8f0;
	padding: 1.5rem 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	max-width: 1400px;
	margin: 0 auto;
`;

const Title = styled.h1`
	font-size: 1.875rem;
	font-weight: 700;
	color: #1a202c;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const TitleIcon = styled(FiGlobe)`
	color: #3182ce;
	font-size: 2rem;
`;

const Actions = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
`;

const SearchContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchInput = styled.input`
	padding: 0.625rem 1rem 0.625rem 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	width: 300px;
	outline: none;
	transition: all 0.2s;

	&:focus {
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}
`;

const SearchIcon = styled(FiSearch)`
	position: absolute;
	left: 0.75rem;
	color: #6b7280;
	font-size: 1rem;
`;

const FilterButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	background: white;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}
`;

const CreateButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1.25rem;
	background: #3182ce;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}
`;

const RefreshButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	background: white;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const MainContent = styled.div`
	flex: 1;
	padding: 2rem;
	overflow-y: auto;
	max-width: 1400px;
	margin: 0 auto;
	width: 100%;
`;

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const StatCard = styled.div`
	background: white;
	padding: 1.5rem;
	border-radius: 0.75rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
`;

const StatTitle = styled.h3`
	font-size: 0.875rem;
	font-weight: 500;
	color: #6b7280;
	margin: 0;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const StatIcon = styled.div<{ color: string }>`
	color: ${(props) => props.color};
	font-size: 1.25rem;
`;

const StatValue = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #1a202c;
	margin-bottom: 0.25rem;
`;

const StatDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
`;

const EnvironmentGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 1.5rem;
`;

const EnvironmentCard = styled.div`
	background: white;
	border-radius: 0.75rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
`;

const CardHeader = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid #f1f5f9;
`;

const CardTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1a202c;
	margin: 0 0 0.5rem 0;
`;

const CardDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.4;
`;

const CardMeta = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 0.75rem;
	flex-wrap: wrap;
`;

const MetaItem = styled.span`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
	color: #6b7280;
`;

const StatusBadge = styled.span<{ status: EnvironmentStatus }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;

	${(props) => {
		switch (props.status) {
			case 'ACTIVE':
				return `
					background: #dcfce7;
					color: #166534;
				`;
			case 'INACTIVE':
				return `
					background: #fef3c7;
					color: #92400e;
				`;
			case 'DELETE_PENDING':
				return `
					background: #fee2e2;
					color: #991b1b;
				`;
			default:
				return `
					background: #f3f4f6;
					color: #374151;
				`;
		}
	}}
`;

const TypeBadge = styled.span<{ type: EnvironmentType }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;

	${(props) => {
		switch (props.type) {
			case 'PRODUCTION':
				return `
					background: #dbeafe;
					color: #1e40af;
				`;
			case 'SANDBOX':
				return `
					background: #f3e8ff;
					color: #6b21a8;
				`;
			case 'DEVELOPMENT':
				return `
					background: #ecfdf5;
					color: #065f46;
				`;
			default:
				return `
					background: #f3f4f6;
					color: #374151;
				`;
		}
	}}
`;

const CardBody = styled.div`
	padding: 1.5rem;
`;

const ServicesList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-bottom: 1rem;
`;

const ServiceTag = styled.span`
	padding: 0.25rem 0.5rem;
	background: #f1f5f9;
	color: #475569;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 500;
`;

const CardActions = styled.div`
	display: flex;
	gap: 0.5rem;
	justify-content: flex-end;
`;

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.5rem 0.75rem;
	background: white;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const DeleteButton = styled(ActionButton)`
	color: #dc2626;
	border-color: #fca5a5;

	&:hover:not(:disabled) {
		background: #fef2f2;
		border-color: #dc2626;
	}
`;

const LoadingState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 400px;
	color: #6b7280;
`;

const LoadingIcon = styled(FiRefreshCw)`
	font-size: 2rem;
	margin-bottom: 1rem;
	animation: spin 1s linear infinite;

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 400px;
	color: #6b7280;
	text-align: center;
`;

const EmptyIcon = styled(FiDatabase)`
	font-size: 3rem;
	margin-bottom: 1rem;
	color: #d1d5db;
`;

const EmptyTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0 0 0.5rem 0;
	color: #374151;
`;

const EmptyDescription = styled.p`
	font-size: 0.875rem;
	margin: 0;
	max-width: 400px;
	line-height: 1.5;
`;

const FilterPanel = styled.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FilterTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #1a202c;
	margin: 0 0 1rem 0;
`;

const FilterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
`;

const FilterGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const FilterLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
`;

const FilterSelect = styled.select`
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	outline: none;

	&:focus {
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}
`;

const FilterActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	justify-content: flex-end;
`;

const FilterButtonSecondary = styled.button`
	padding: 0.5rem 1rem;
	background: white;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}
`;

// Component

export const EnvironmentManagementPageV8: React.FC = () => {
	const [environments, setEnvironments] = useState<PingOneEnvironment[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<EnvironmentListOptions>({});
	const [totalCount, setTotalCount] = useState(0);
	const [refreshing, setRefreshing] = useState(false);

	// Load environments
	const loadEnvironments = useCallback(async () => {
		try {
			setLoading(true);
			const options: EnvironmentListOptions = {
				...filters,
				search: searchTerm || undefined,
			};
			const response = await environmentServiceV8.getEnvironments(options);
			setEnvironments(response.environments);
			setTotalCount(response.totalCount);
		} catch (error) {
			console.error('Failed to load environments:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [filters, searchTerm]);

	// Initial load
	useEffect(() => {
		loadEnvironments();
	}, [loadEnvironments]);

	// Handle search
	const handleSearch = (value: string) => {
		setSearchTerm(value);
	};

	// Handle refresh
	const handleRefresh = async () => {
		setRefreshing(true);
		await loadEnvironments();
	};

	// Handle filter changes
	const handleFilterChange = (key: keyof EnvironmentListOptions, value: string | undefined) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Clear filters
	const clearFilters = () => {
		setFilters({});
	};

	// Get environment statistics
	const getEnvironmentStats = () => {
		const stats = {
			total: environments.length,
			active: environments.filter((env) => env.status === 'ACTIVE').length,
			production: environments.filter((env) => env.type === 'PRODUCTION').length,
			sandbox: environments.filter((env) => env.type === 'SANDBOX').length,
		};
		return stats;
	};

	const stats = getEnvironmentStats();

	if (loading && environments.length === 0) {
		return (
			<PageContainer>
				<Header>
					<HeaderContent>
						<Title>
							<TitleIcon />
							Environment Management
						</Title>
						<Actions>
							<RefreshButton disabled>
								<FiRefreshCw />
								Refresh
							</RefreshButton>
							<CreateButton>
								<FiPlus />
								Create Environment
							</CreateButton>
						</Actions>
					</HeaderContent>
				</Header>
				<MainContent>
					<LoadingState>
						<LoadingIcon />
						<div>Loading environments...</div>
					</LoadingState>
				</MainContent>
			</PageContainer>
		);
	}

	return (
		<PageContainer>
			<Header>
				<HeaderContent>
					<Title>
						<TitleIcon />
						Environment Management
					</Title>
					<Actions>
						<SearchContainer>
							<SearchIcon />
							<SearchInput
								placeholder="Search environments..."
								value={searchTerm}
								onChange={(e) => handleSearch(e.target.value)}
							/>
						</SearchContainer>
						<FilterButton onClick={() => setShowFilters(!showFilters)}>
							<FiFilter />
							Filters
						</FilterButton>
						<RefreshButton onClick={handleRefresh} disabled={refreshing}>
							<FiRefreshCw className={refreshing ? 'spinning' : ''} />
							Refresh
						</RefreshButton>
						<CreateButton>
							<FiPlus />
							Create Environment
						</CreateButton>
					</Actions>
				</HeaderContent>
			</Header>

			<MainContent>
				{showFilters && (
					<FilterPanel>
						<FilterTitle>Filter Environments</FilterTitle>
						<FilterGrid>
							<FilterGroup>
								<FilterLabel>Type</FilterLabel>
								<FilterSelect
									value={filters.type || ''}
									onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
								>
									<option value="">All Types</option>
									<option value="PRODUCTION">Production</option>
									<option value="SANDBOX">Sandbox</option>
									<option value="DEVELOPMENT">Development</option>
								</FilterSelect>
							</FilterGroup>
							<FilterGroup>
								<FilterLabel>Status</FilterLabel>
								<FilterSelect
									value={filters.status || ''}
									onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
								>
									<option value="">All Statuses</option>
									<option value="ACTIVE">Active</option>
									<option value="INACTIVE">Inactive</option>
									<option value="DELETE_PENDING">Delete Pending</option>
								</FilterSelect>
							</FilterGroup>
							<FilterGroup>
								<FilterLabel>Region</FilterLabel>
								<FilterSelect
									value={filters.region || ''}
									onChange={(e) => handleFilterChange('region', e.target.value || undefined)}
								>
									<option value="">All Regions</option>
									<option value="us-east-1">US East</option>
									<option value="us-west-2">US West</option>
									<option value="eu-west-1">Europe</option>
								</FilterSelect>
							</FilterGroup>
						</FilterGrid>
						<FilterActions>
							<FilterButtonSecondary onClick={clearFilters}>Clear Filters</FilterButtonSecondary>
						</FilterActions>
					</FilterPanel>
				)}

				<StatsGrid>
					<StatCard>
						<StatHeader>
							<StatTitle>Total Environments</StatTitle>
							<StatIcon color="#3182ce">
								<FiServer />
							</StatIcon>
						</StatHeader>
						<StatValue>{totalCount}</StatValue>
						<StatDescription>All environments</StatDescription>
					</StatCard>
					<StatCard>
						<StatHeader>
							<StatTitle>Active</StatTitle>
							<StatIcon color="#10b981">
								<FiActivity />
							</StatIcon>
						</StatHeader>
						<StatValue>{stats.active}</StatValue>
						<StatDescription>Currently active</StatDescription>
					</StatCard>
					<StatCard>
						<StatHeader>
							<StatTitle>Production</StatTitle>
							<StatIcon color="#f59e0b">
								<FiSettings />
							</StatIcon>
						</StatHeader>
						<StatValue>{stats.production}</StatValue>
						<StatDescription>Production environments</StatDescription>
					</StatCard>
					<StatCard>
						<StatHeader>
							<StatTitle>Sandbox</StatTitle>
							<StatIcon color="#8b5cf6">
								<FiDatabase />
							</StatIcon>
						</StatHeader>
						<StatValue>{stats.sandbox}</StatValue>
						<StatDescription>Development sandboxes</StatDescription>
					</StatCard>
				</StatsGrid>

				{environments.length === 0 ? (
					<EmptyState>
						<EmptyIcon />
						<EmptyTitle>No environments found</EmptyTitle>
						<EmptyDescription>
							{searchTerm || filters.type || filters.status || filters.region
								? 'Try adjusting your search or filters to find environments.'
								: 'Get started by creating your first environment.'}
						</EmptyDescription>
					</EmptyState>
				) : (
					<EnvironmentGrid>
						{environments.map((environment) => (
							<EnvironmentCard key={environment.id}>
								<CardHeader>
									<CardTitle>{environment.name}</CardTitle>
									{environment.description && (
										<CardDescription>{environment.description}</CardDescription>
									)}
									<CardMeta>
										<TypeBadge type={environment.type}>{environment.type}</TypeBadge>
										<StatusBadge status={environment.status}>{environment.status}</StatusBadge>
										{environment.region && (
											<MetaItem>
												<FiGlobe />
												{environment.region}
											</MetaItem>
										)}
									</CardMeta>
								</CardHeader>
								<CardBody>
									<ServicesList>
										{environment.enabledServices.map((service) => (
											<ServiceTag key={service}>{service}</ServiceTag>
										))}
									</ServicesList>
									<CardActions>
										<ActionButton>
											<FiEye />
											View
										</ActionButton>
										<ActionButton>
											<FiEdit3 />
											Edit
										</ActionButton>
										<DeleteButton>
											<FiTrash2 />
											Delete
										</DeleteButton>
									</CardActions>
								</CardBody>
							</EnvironmentCard>
						))}
					</EnvironmentGrid>
				)}
			</MainContent>
		</PageContainer>
	);
};
