// src/pages/EnvironmentManagementPageV8.PingUI.tsx
// V8 Environment Management Page - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiCallList from '../components/ApiCallList';
import { WorkerTokenButton } from '../components/WorkerTokenButton';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import EnvironmentServiceV8, { PingOneEnvironment } from '../services/environmentServiceV8';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

// PingOne UI Styled Components (using inline styles with CSS variables)
const getContainerStyle = () => ({
	padding: '2rem',
	maxWidth: '1400px',
	margin: '0 auto',
	background: 'var(--pingone-surface-background)',
	minHeight: '100vh',
});

const getHeaderStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: '2rem',
	flexWrap: 'wrap',
	gap: '1rem',
});

const getTitleStyle = () => ({
	color: 'var(--pingone-text-primary)',
	fontSize: '2rem',
	fontWeight: '600',
});

const getActionsStyle = () => ({
	display: 'flex',
	gap: '1rem',
	flexWrap: 'wrap',
});

const getButtonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => ({
	background:
		variant === 'primary'
			? 'var(--pingone-brand-primary)'
			: variant === 'secondary'
				? 'var(--pingone-surface-secondary)'
				: 'var(--pingone-surface-error)',
	color: variant === 'secondary' ? 'var(--pingone-text-primary)' : 'var(--pingone-text-inverse)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	padding: '0.5rem 1rem',
	borderRadius: '0.375rem',
	cursor: 'pointer',
	fontWeight: '500',
	fontSize: '0.875rem',
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
	transition: 'all 0.15s ease-in-out',
	whiteSpace: 'nowrap',
	'&:hover': {
		transform: 'translateY(-1px)',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: variant === 'secondary'
					? 'var(--pingone-surface-tertiary)'
					: 'var(--pingone-surface-error-dark)',
	},
	'&:active': {
		transform: 'translateY(0)',
		boxShadow: 'none',
	},
});

const getEducationalSectionStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: '0.75rem',
	padding: '2rem',
	marginBottom: '2rem',
	border: '1px solid var(--pingone-border-primary)',
});

const getEducationalHeaderStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.75rem',
	marginBottom: '1.5rem',
});

const getEducationalTitleStyle = () => ({
	color: 'var(--pingone-text-primary)',
	fontSize: '1.5rem',
	fontWeight: '600',
});

const getEducationalContentStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
	gap: '1.5rem',
});

const getEducationalCardStyle = () => ({
	background: 'var(--pingone-surface-secondary)',
	borderRadius: '0.5rem',
	padding: '1.5rem',
	border: '1px solid var(--pingone-border-primary)',
});

const getEducationalCardTitleStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
	color: 'var(--pingone-text-primary)',
	fontWeight: '600',
	marginBottom: '0.75rem',
});

const getEducationalCardTextStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	lineHeight: '1.6',
});

const getAPIEndpointsSectionStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: '0.75rem',
	padding: '2rem',
	marginBottom: '2rem',
	border: '1px solid var(--pingone-border-primary)',
});

const getAPIEndpointsHeaderStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.75rem',
	marginBottom: '1rem',
	color: 'var(--pingone-text-primary)',
	fontSize: '1.25rem',
	fontWeight: '600',
});

const getAPIEndpointsDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	marginBottom: '1.5rem',
});

const getAPIEndpointsTableStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
	gap: '1rem',
});

const getAPIEndpointCellStyle = () => ({
	background: 'var(--pingone-surface-tertiary)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: '0.375rem',
	padding: '1rem',
	textAlign: 'center',
	textDecoration: 'none',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:hover': {
		background: 'var(--pingone-surface-primary)',
		transform: 'translateY(-1px)',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
	},
});

const getLoadingMessageStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
	color: 'var(--pingone-text-secondary)',
	fontSize: '1.125rem',
});

const getErrorMessageStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
	color: 'var(--pingone-text-error)',
	fontSize: '1.125rem',
	background: 'var(--pingone-surface-error)',
	border: '1px solid var(--pingone-border-error)',
	borderRadius: '0.5rem',
	margin: '2rem',
	padding: '2rem',
});

const EnvironmentManagementPageV8PingUI: React.FC = () => {
	const [environments, setEnvironments] = useState<PingOneEnvironment[]>([]);
	const [_selectedEnvironments, setSelectedEnvironments] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const [envError, setEnvError] = useState<string | null>(null);
	const [_showCreateForm, setShowCreateForm] = useState(false);
	const [_editingEnvironment, setEditingEnvironment] = useState<PingOneEnvironment | null>(null);

	const globalTokenStatus = useGlobalWorkerToken();

	// Load environments
	const loadEnvironments = useCallback(async () => {
		try {
			setLoading(true);
			setEnvError(null);
			const response = await EnvironmentServiceV8.getEnvironments();
			setEnvironments(response.environments);
		} catch (error) {
			console.error('Failed to load environments:', error);
			setEnvError(error instanceof Error ? error.message : 'Failed to load environments');
		} finally {
			setLoading(false);
		}
	}, []);

	// Initialize environments on mount
	useEffect(() => {
		loadEnvironments();
	}, [loadEnvironments]);

	// Handle environment selection
	const _toggleEnvironmentSelection = useCallback((envId: string) => {
		setSelectedEnvironments((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(envId)) {
				newSet.delete(envId);
			} else {
				newSet.add(envId);
			}
			return newSet;
		});
	}, []);

	// Handle refresh
	const handleRefresh = useCallback(() => {
		loadEnvironments();
	}, [loadEnvironments]);

	// Handle create
	const handleCreate = useCallback(() => {
		setShowCreateForm(true);
		setEditingEnvironment(null);
	}, []);

	// Handle edit
	const _handleEdit = useCallback((env: PingOneEnvironment) => {
		setEditingEnvironment(env);
		setShowCreateForm(true);
	}, []);

	// Handle delete
	const _handleDelete = useCallback(
		async (envId: string) => {
			if (!confirm('Are you sure you want to delete this environment?')) {
				return;
			}

			try {
				await EnvironmentServiceV8.deleteEnvironment(envId);
				await loadEnvironments();
			} catch (error) {
				console.error('Failed to delete environment:', error);
				setEnvError(error instanceof Error ? error.message : 'Failed to delete environment');
			}
		},
		[loadEnvironments]
	);

	// Memoized filtered environments
	const _filteredEnvironments = useMemo(() => {
		return environments.filter((_env) => {
			// Add any filtering logic here if needed
			return true;
		});
	}, [environments]);

	// Check if global token is available
	if (globalTokenStatus.isLoading) {
		return <div style={getLoadingMessageStyle()}>Initializing global worker token...</div>;
	}

	// Show worker token UI when token is not available
	if (!globalTokenStatus.isValid || !globalTokenStatus.token) {
		return (
			<div style={getContainerStyle()}>
				{globalTokenStatus.token && (
					<WorkerTokenDetectedBanner token={globalTokenStatus.token} />
				)}
				<WorkerTokenButton />
			</div>
		);
	}

	if (loading && environments.length === 0) {
		return <div style={getLoadingMessageStyle()}>Loading environments...</div>;
	}

	if (envError) {
		return <div style={getErrorMessageStyle()}>Error: {envError}</div>;
	}

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				{/* Header */}
				<div style={getHeaderStyle()}>
					<h1 style={getTitleStyle()}>
						<MDIIcon icon="server" size={32} />
						PingOne Environments
					</h1>
					<div style={getActionsStyle()}>
						<button style={getButtonStyle('primary')} onClick={handleCreate}>
							<MDIIcon icon="plus" size={16} />
							Create Environment
						</button>
						<button style={getButtonStyle('secondary')} onClick={handleRefresh}>
							<MDIIcon icon="refresh" size={16} />
							Refresh
						</button>
					</div>
				</div>

				{/* Educational Section */}
				<div style={getEducationalSectionStyle()}>
					<div style={getEducationalHeaderStyle()}>
						<MDIIcon icon="book" size={24} />
						<div style={getEducationalTitleStyle()}>PingOne Environments API</div>
					</div>
					<div style={getEducationalContentStyle()}>
						<div style={getEducationalCardStyle()}>
							<div style={getEducationalCardTitleStyle()}>
								<MDIIcon icon="information" size={20} />
								What are Environments?
							</div>
							<div style={getEducationalCardTextStyle()}>
								Every organization contains at least one environment resource. Environments are the
								primary subdivision of an organization and contain the core resources on which all
								identity services are built. They can be based on region or used to segregate
								operations by functionality, staging, or configurations.
							</div>
						</div>
						<div style={getEducationalCardStyle()}>
							<div style={getEducationalCardTitleStyle()}>
								<MDIIcon icon="shield" size={20} />
								Environment Types
							</div>
							<div style={getEducationalCardTextStyle()}>
								<strong>PRODUCTION:</strong> Contains actual business identities. Requires non-Trial
								license. Cannot be immediately deleted - must go through soft delete state.
								<br />
								<strong>SANDBOX:</strong> Temporary configurations for testing. Can be deleted
								immediately. Cannot be restored once deleted.
							</div>
						</div>
					</div>
				</div>

				{/* API Endpoints Section */}
				<div style={getAPIEndpointsSectionStyle()}>
					<div style={getAPIEndpointsHeaderStyle()}>
						<MDIIcon icon="code" size={24} />
						Supported API Endpoints
					</div>
					<div style={getAPIEndpointsDescriptionStyle()}>
						All environment management operations are supported and tracked:
					</div>
					<div style={getAPIEndpointsTableStyle()}>
						<a
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-environments"
							target="_blank"
							rel="noopener noreferrer"
							style={getAPIEndpointCellStyle()}
						>
							<MDIIcon icon="download" size={20} />
							GET /environments
						</a>
						<a
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-environments"
							target="_blank"
							rel="noopener noreferrer"
							style={getAPIEndpointCellStyle()}
						>
							<MDIIcon icon="upload" size={20} />
							POST /environments
						</a>
						<a
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-environments-id"
							target="_blank"
							rel="noopener noreferrer"
							style={getAPIEndpointCellStyle()}
						>
							<MDIIcon icon="download" size={20} />
							GET /environments/{id}
						</a>
						<a
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#put-environments-id"
							target="_blank"
							rel="noopener noreferrer"
							style={getAPIEndpointCellStyle()}
						>
							<MDIIcon icon="edit" size={20} />
							PUT /environments/{id}
						</a>
						<a
							href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#delete-environments-id"
							target="_blank"
							rel="noopener noreferrer"
							style={getAPIEndpointCellStyle()}
						>
							<MDIIcon icon="trash-can" size={20} />
							DELETE /environments/{id}
						</a>
					</div>
				</div>

				{/* API Call List */}
				<ApiCallList />
			</div>
		</div>
	);
};

export default EnvironmentManagementPageV8PingUI;
