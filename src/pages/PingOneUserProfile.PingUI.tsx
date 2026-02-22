// src/pages/PingOneUserProfile.PingUI.tsx
// PingOne User Profile viewer with worker token management - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { usePageScroll } from '../hooks/usePageScroll';
import { lookupPingOneUser } from '../services/pingOneUserProfileService';
import { credentialManager } from '../utils/credentialManager';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';
import { WorkerTokenModalV8 } from '../v8/components/WorkerTokenModalV8';

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

// Interfaces (keeping from original)
interface WorkerTokenMeta {
	hasToken: boolean;
	expiresAt: number | null;
	isExpired: boolean;
	relativeDescription: string;
	absoluteDescription: string;
}

interface PingOneConsentRecord {
	id?: string;
	type?: string;
	name?: string;
	status?: string;
	[key: string]: unknown;
}

interface UserDataBundle {
	profile: PingOneUserProfileData;
	groups: PingOneUserGroup[];
	roles: PingOneUserRole[];
	consents: PingOneConsentRecord[];
	workerTokenMeta: WorkerTokenMeta;
}

interface PingOneUserProfileData {
	id?: string;
	name?: {
		first?: string;
		last?: string;
		middle?: string;
	};
	email?: string;
	username?: string;
	enabled?: boolean;
	account?: {
		enabled?: boolean;
		status?: string;
	};
	createdAt?: string;
	updatedAt?: string;
	lastLogin?: string;
	populated?: boolean;
	[key: string]: unknown;
}

interface PingOneUserGroup {
	id?: string;
	name?: string;
	description?: string;
	[key: string]: unknown;
}

interface PingOneUserRole {
	id?: string;
	name?: string;
	description?: string;
	[key: string]: unknown;
}

// PingOne UI Styled Components (using inline styles with CSS variables)
const getContainerStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: 'var(--pingone-spacing-xl, 2rem)',
});

const getHeaderStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-lg, 1rem)',
	padding: 'var(--pingone-spacing-xl, 2rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
	boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
});

const getTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-3xl, 2.5rem)',
	fontWeight: 'var(--pingone-font-weight-bold, 700)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-md, 1rem)',
});

const getSubtitleStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
});

const getCardStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	boxShadow: 'var(--pingone-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
});

const getSectionTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: 'var(--pingone-spacing-md, 1rem) var(--pingone-spacing-lg, 1.5rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: 'var(--pingone-surface-tertiary)',
		transform: 'translateY(-1px)',
		boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
	},
	'&:disabled': {
		opacity: '0.5',
		cursor: 'not-allowed',
		transform: 'none',
	},
});

const getGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
	gap: 'var(--pingone-spacing-md, 1rem)',
});

const getListItemStyle = () => ({
	padding: 'var(--pingone-spacing-sm, 0.625rem) 0',
	borderBottom: '1px solid var(--pingone-border-secondary)',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
});

const getLabelStyle = () => ({
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	color: 'var(--pingone-text-secondary)',
});

const getValueStyle = () => ({
	color: 'var(--pingone-text-primary)',
	fontWeight: 'var(--pingone-font-weight-normal, 400)',
});

const getStatusStyle = (isActive: boolean) => ({
	background: isActive ? 'var(--pingone-surface-success)' : 'var(--pingone-surface-error)',
	color: isActive ? 'var(--pingone-text-success)' : 'var(--pingone-text-error)',
	padding: 'var(--pingone-spacing-xs, 0.25rem) var(--pingone-spacing-sm, 0.625rem)',
	borderRadius: 'var(--pingone-border-radius-full, 9999px)',
	fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
});

const getEmptyStateStyle = () => ({
	textAlign: 'center',
	padding: 'var(--pingone-spacing-xl, 2rem)',
	color: 'var(--pingone-text-secondary)',
	fontStyle: 'italic',
});

const PingOneUserProfilePingUI: React.FC = () => {
	const [searchParams] = useSearchParams();
	const [userData, setUserData] = useState<UserDataBundle | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showTokenConfig, setShowTokenConfig] = useState(false);
	const [silentApiConfig, setSilentApiConfig] = useState(false);

	const { workerToken, clearWorkerToken } = useGlobalWorkerToken();

	usePageScroll({ pageName: 'PingOne User Profile', force: true });

	const fetchUserProfile = useCallback(async () => {
		setIsLoading(true);
		setError('');

		try {
			const credentials = await credentialManager.getCredentials();
			if (!credentials || !credentials.environmentId) {
				setError('No credentials found. Please configure your PingOne credentials.');
				return;
			}

			const result = await lookupPingOneUser(credentials);
			setUserData(result);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(`Failed to fetch user profile: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUserProfile();
	}, [fetchUserProfile]);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${label} copied to clipboard`);
		} catch (err) {
			v4ToastManager.showError('Failed to copy to clipboard');
		}
	}, []);

	const formatDate = useCallback((dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleString();
	}, []);

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				{/* Header */}
				<div style={getHeaderStyle()}>
					<h1 style={getTitleStyle()}>
						<MDIIcon icon="account-circle" size={32} title="User Profile" />
						PingOne User Profile
					</h1>
					<p style={getSubtitleStyle()}>
						Comprehensive view of user profile, groups, roles, and consents
					</p>

					<div
						style={{
							display: 'flex',
							gap: 'var(--pingone-spacing-md, 1rem)',
							alignItems: 'center',
						}}
					>
						<button
							type="button"
							onClick={fetchUserProfile}
							disabled={isLoading}
							style={getButtonStyle('primary')}
						>
							<MDIIcon
								icon={isLoading ? 'loading' : 'refresh'}
								size={16}
								className={isLoading ? 'mdi-spin' : ''}
							/>
							{isLoading ? 'Loading...' : 'Refresh Profile'}
						</button>

						<ShowTokenConfigCheckboxV8
							showTokenConfig={showTokenConfig}
							setShowTokenConfig={setShowTokenConfig}
						/>

						<SilentApiConfigCheckboxV8
							silentApiConfig={silentApiConfig}
							setSilentApiConfig={setSilentApiConfig}
						/>
					</div>
				</div>

				{/* Worker Token Banner */}
				<WorkerTokenDetectedBanner
					workerToken={workerToken}
					onClearToken={clearWorkerToken}
					onManageToken={() => setShowWorkerTokenModal(true)}
				/>

				{showWorkerTokenModal && (
					<WorkerTokenModalV8
						isOpen={showWorkerTokenModal}
						onClose={() => setShowWorkerTokenModal(false)}
					/>
				)}

				{/* Error Display */}
				{error && (
					<div
						style={{
							background: 'var(--pingone-surface-error)',
							border: '1px solid var(--pingone-border-error)',
							borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
							padding: 'var(--pingone-spacing-md, 1rem)',
							marginBottom: 'var(--pingone-spacing-md, 1rem)',
							color: 'var(--pingone-text-error)',
						}}
					>
						<strong>Error:</strong> {error}
					</div>
				)}

				{/* User Data Display */}
				{userData && (
					<>
						{/* Profile Information */}
						<div style={getCardStyle()}>
							<h2 style={getSectionTitleStyle()}>
								<MDIIcon icon="account" size={20} title="Profile" />
								Profile Information
							</h2>

							<div style={getGridStyle()}>
								<div>
									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>User ID:</span>
										<span style={getValueStyle()}>
											{userData.profile.id || 'N/A'}
											{userData.profile.id && (
												<button
													type="button"
													onClick={() => copyToClipboard(userData.profile.id!, 'User ID')}
													style={{
														...getButtonStyle('secondary'),
														padding: '0.25rem 0.5rem',
														fontSize: '0.75rem',
													}}
												>
													<MDIIcon icon="content-copy" size={12} />
												</button>
											)}
										</span>
									</div>

									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>Username:</span>
										<span style={getValueStyle()}>
											{userData.profile.username || 'N/A'}
											{userData.profile.username && (
												<button
													type="button"
													onClick={() => copyToClipboard(userData.profile.username!, 'Username')}
													style={{
														...getButtonStyle('secondary'),
														padding: '0.25rem 0.5rem',
														fontSize: '0.75rem',
													}}
												>
													<MDIIcon icon="content-copy" size={12} />
												</button>
											)}
										</span>
									</div>

									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>Email:</span>
										<span style={getValueStyle()}>
											{userData.profile.email || 'N/A'}
											{userData.profile.email && (
												<button
													type="button"
													onClick={() => copyToClipboard(userData.profile.email!, 'Email')}
													style={{
														...getButtonStyle('secondary'),
														padding: '0.25rem 0.5rem',
														fontSize: '0.75rem',
													}}
												>
													<MDIIcon icon="content-copy" size={12} />
												</button>
											)}
										</span>
									</div>

									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>Full Name:</span>
										<span style={getValueStyle()}>
											{userData.profile.name
												? `${userData.profile.name.first || ''} ${userData.profile.name.last || ''}`.trim() ||
													'N/A'
												: 'N/A'}
										</span>
									</div>

									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>Account Status:</span>
										<span style={getStatusStyle(userData.profile.enabled ?? false)}>
											{userData.profile.enabled ? 'Enabled' : 'Disabled'}
										</span>
									</div>

									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>Created:</span>
										<span style={getValueStyle()}>{formatDate(userData.profile.createdAt)}</span>
									</div>

									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>Last Updated:</span>
										<span style={getValueStyle()}>{formatDate(userData.profile.updatedAt)}</span>
									</div>

									<div style={getListItemStyle()}>
										<span style={getLabelStyle()}>Last Login:</span>
										<span style={getValueStyle()}>{formatDate(userData.profile.lastLogin)}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Groups */}
						<div style={getCardStyle()}>
							<h2 style={getSectionTitleStyle()}>
								<MDIIcon icon="account-group" size={20} title="Groups" />
								User Groups ({userData.groups.length})
							</h2>

							{userData.groups.length > 0 ? (
								<div style={getGridStyle()}>
									{userData.groups.map((group, index) => (
										<div
											key={index}
											style={{
												background: 'var(--pingone-surface-secondary)',
												border: '1px solid var(--pingone-border-secondary)',
												borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
												padding: 'var(--pingone-spacing-md, 1rem)',
											}}
										>
											<div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
												{group.name || 'Unnamed Group'}
											</div>
											{group.description && (
												<div
													style={{ fontSize: '0.875rem', color: 'var(--pingone-text-secondary)' }}
												>
													{group.description}
												</div>
											)}
											{group.id && (
												<div
													style={{
														fontSize: '0.75rem',
														color: 'var(--pingone-text-tertiary)',
														marginTop: '0.5rem',
													}}
												>
													ID: {group.id}
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<div style={getEmptyStateStyle()}>No groups found for this user</div>
							)}
						</div>

						{/* Roles */}
						<div style={getCardStyle()}>
							<h2 style={getSectionTitleStyle()}>
								<MDIIcon icon="shield-account" size={20} title="Roles" />
								User Roles ({userData.roles.length})
							</h2>

							{userData.roles.length > 0 ? (
								<div style={getGridStyle()}>
									{userData.roles.map((role, index) => (
										<div
											key={index}
											style={{
												background: 'var(--pingone-surface-secondary)',
												border: '1px solid var(--pingone-border-secondary)',
												borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
												padding: 'var(--pingone-spacing-md, 1rem)',
											}}
										>
											<div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
												{role.name || 'Unnamed Role'}
											</div>
											{role.description && (
												<div
													style={{ fontSize: '0.875rem', color: 'var(--pingone-text-secondary)' }}
												>
													{role.description}
												</div>
											)}
											{role.id && (
												<div
													style={{
														fontSize: '0.75rem',
														color: 'var(--pingone-text-tertiary)',
														marginTop: '0.5rem',
													}}
												>
													ID: {role.id}
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<div style={getEmptyStateStyle()}>No roles found for this user</div>
							)}
						</div>

						{/* Consents */}
						<div style={getCardStyle()}>
							<h2 style={getSectionTitleStyle()}>
								<MDIIcon icon="checkbox-marked" size={20} title="Consents" />
								User Consents ({userData.consents.length})
							</h2>

							{userData.consents.length > 0 ? (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 'var(--pingone-spacing-sm, 0.5rem)',
									}}
								>
									{userData.consents.map((consent, index) => (
										<div
											key={index}
											style={{
												background: 'var(--pingone-surface-secondary)',
												border: '1px solid var(--pingone-border-secondary)',
												borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
												padding: 'var(--pingone-spacing-md, 1rem)',
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
											}}
										>
											<div>
												<div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
													{consent.name || consent.type || 'Unnamed Consent'}
												</div>
												{consent.description && (
													<div
														style={{ fontSize: '0.875rem', color: 'var(--pingone-text-secondary)' }}
													>
														{consent.description}
													</div>
												)}
											</div>
											<span style={getStatusStyle(consent.status === 'active')}>
												{consent.status || 'Unknown'}
											</span>
										</div>
									))}
								</div>
							) : (
								<div style={getEmptyStateStyle()}>No consents found for this user</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default PingOneUserProfilePingUI;
