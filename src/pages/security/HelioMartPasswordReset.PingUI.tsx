// src/pages/security/HelioMartPasswordReset.PingUI.tsx
// HelioMart Password Reset Demo - Real-world password management interface - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useCallback, useState } from 'react';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import { ApiCallTable } from '../../components/ApiCallTable';
import { AuthorizationCodeConfigModal } from '../../components/AuthorizationCodeConfigModal';
import { WorkerTokenDetectedBanner } from '../../components/WorkerTokenDetectedBanner';
import { WorkerTokenModal } from '../../components/WorkerTokenModal';
import type { ApiCall } from '../../services/apiCallTrackerService';
import { apiCallTrackerService } from '../../services/apiCallTrackerService';
import { PageLayoutService } from '../../services/pageLayoutService';
import {
	changePassword,
	recoverPassword,
	setPasswordAdmin,
	setPasswordLdapGateway,
} from '../../services/passwordResetService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

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
const _getContainerStyle = () => ({
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

const getTabButtonStyle = (isActive: boolean) => ({
	background: isActive ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: isActive ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: isActive ? 'none' : '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: 'var(--pingone-spacing-sm, 0.625rem) var(--pingone-spacing-md, 1rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	marginRight: 'var(--pingone-spacing-xs, 0.25rem)',
	'&:hover': {
		background: isActive ? 'var(--pingone-brand-primary-dark)' : 'var(--pingone-surface-tertiary)',
	},
});

const getFormStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
	gap: 'var(--pingone-spacing-md, 1rem)',
});

const getFormGroupStyle = () => ({
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
});

const getLabelStyle = () => ({
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	color: 'var(--pingone-text-primary)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
});

const getInputStyle = () => ({
	padding: 'var(--pingone-spacing-sm, 0.625rem) var(--pingone-spacing-md, 1rem)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:focus': {
		outline: 'none',
		borderColor: 'var(--pingone-brand-primary)',
		boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},
});

const getAlertStyle = (type: 'info' | 'success' | 'warning' | 'error') => {
	const colors = {
		info: {
			bg: 'var(--pingone-surface-info)',
			border: 'var(--pingone-border-info)',
			text: 'var(--pingone-text-info)',
		},
		success: {
			bg: 'var(--pingone-surface-success)',
			border: 'var(--pingone-border-success)',
			text: 'var(--pingone-text-success)',
		},
		warning: {
			bg: 'var(--pingone-surface-warning)',
			border: 'var(--pingone-border-warning)',
			text: 'var(--pingone-text-warning)',
		},
		error: {
			bg: 'var(--pingone-surface-error)',
			border: 'var(--pingone-border-error)',
			text: 'var(--pingone-text-error)',
		},
	};

	return {
		background: colors[type].bg,
		border: `1px solid ${colors[type].border}`,
		borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
		padding: 'var(--pingone-spacing-md, 1rem)',
		marginBottom: 'var(--pingone-spacing-md, 1rem)',
		color: colors[type].text,
	};
};

const HelioMartPasswordResetPingUI: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'recovery' | 'change' | 'admin' | 'ldap'>('recovery');
	const [isLoading, setIsLoading] = useState(false);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showAuthConfigModal, setShowAuthConfigModal] = useState(false);
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
	const [results, setResults] = useState<Record<string, any>>({});

	// Form states
	const [recoveryForm, setRecoveryForm] = useState({
		email: '',
		userId: '',
	});
	const [changeForm, setChangeForm] = useState({
		userId: '',
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [adminForm, setAdminForm] = useState({
		userId: '',
		newPassword: '',
		forceChange: false,
	});
	const [ldapForm, setLdapForm] = useState({
		userId: '',
		newPassword: '',
	});

	const pageConfig = {
		flowType: 'password-reset' as const,
		theme: 'blue' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'helio-mart-password-reset',
	};

	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	const handlePasswordRecovery = useCallback(async () => {
		setIsLoading(true);
		try {
			const callId = apiCallTrackerService.startCall('Password Recovery');

			const result = await recoverPassword(recoveryForm.email);
			setResults((prev) => ({ ...prev, recovery: result }));

			apiCallTrackerService.endCall(callId, {
				status: 'success',
				response: result,
				duration: 1000,
			});

			setApiCalls((prev) => [...prev, apiCallTrackerService.getCall(callId)]);
			v4ToastManager.showSuccess('Password recovery initiated successfully');
		} catch (_error) {
			v4ToastManager.showError('Password recovery failed');
		} finally {
			setIsLoading(false);
		}
	}, [recoveryForm]);

	const handlePasswordChange = useCallback(async () => {
		if (changeForm.newPassword !== changeForm.confirmPassword) {
			v4ToastManager.showError('Passwords do not match');
			return;
		}

		setIsLoading(true);
		try {
			const callId = apiCallTrackerService.startCall('Password Change');

			const result = await changePassword(
				changeForm.userId,
				changeForm.oldPassword,
				changeForm.newPassword
			);
			setResults((prev) => ({ ...prev, change: result }));

			apiCallTrackerService.endCall(callId, {
				status: 'success',
				response: result,
				duration: 1200,
			});

			setApiCalls((prev) => [...prev, apiCallTrackerService.getCall(callId)]);
			v4ToastManager.showSuccess('Password changed successfully');
		} catch (_error) {
			v4ToastManager.showError('Password change failed');
		} finally {
			setIsLoading(false);
		}
	}, [changeForm]);

	const handleAdminPasswordSet = useCallback(async () => {
		setIsLoading(true);
		try {
			const callId = apiCallTrackerService.startCall('Admin Password Set');

			const result = await setPasswordAdmin(
				adminForm.userId,
				adminForm.newPassword,
				adminForm.forceChange
			);
			setResults((prev) => ({ ...prev, admin: result }));

			apiCallTrackerService.endCall(callId, {
				status: 'success',
				response: result,
				duration: 1500,
			});

			setApiCalls((prev) => [...prev, apiCallTrackerService.getCall(callId)]);
			v4ToastManager.showSuccess('Admin password set successfully');
		} catch (_error) {
			v4ToastManager.showError('Admin password set failed');
		} finally {
			setIsLoading(false);
		}
	}, [adminForm]);

	const handleLDAPPasswordSet = useCallback(async () => {
		setIsLoading(true);
		try {
			const callId = apiCallTrackerService.startCall('LDAP Password Set');

			const result = await setPasswordLdapGateway(ldapForm.userId, ldapForm.newPassword);
			setResults((prev) => ({ ...prev, ldap: result }));

			apiCallTrackerService.endCall(callId, {
				status: 'success',
				response: result,
				duration: 1300,
			});

			setApiCalls((prev) => [...prev, apiCallTrackerService.getCall(callId)]);
			v4ToastManager.showSuccess('LDAP password set successfully');
		} catch (_error) {
			v4ToastManager.showError('LDAP password set failed');
		} finally {
			setIsLoading(false);
		}
	}, [ldapForm]);

	return (
		<div className="end-user-nano">
			<PageContainer>
				<ContentWrapper>
					{LayoutFlowHeader && <LayoutFlowHeader />}

					{/* Header */}
					<div style={getHeaderStyle()}>
						<h1 style={getTitleStyle()}>
							<MDIIcon icon="lock-reset" size={32} title="Password Reset" />
							HelioMart Password Reset
						</h1>
						<p style={getSubtitleStyle()}>
							Real-world password management interface with recovery, change, and admin operations
						</p>

						<div
							style={{
								display: 'flex',
								gap: 'var(--pingone-spacing-md, 1rem)',
								alignItems: 'center',
								flexWrap: 'wrap',
							}}
						>
							<button
								type="button"
								onClick={() => setShowWorkerTokenModal(true)}
								style={getButtonStyle('secondary')}
							>
								<MDIIcon icon="key" size={16} />
								Worker Token
							</button>

							<button
								type="button"
								onClick={() => setShowAuthConfigModal(true)}
								style={getButtonStyle('secondary')}
							>
								<MDIIcon icon="cog" size={16} />
								Auth Config
							</button>
						</div>
					</div>

					{/* Worker Token Banner */}
					<WorkerTokenDetectedBanner onManageToken={() => setShowWorkerTokenModal(true)} />

					{showWorkerTokenModal && (
						<WorkerTokenModal
							isOpen={showWorkerTokenModal}
							onClose={() => setShowWorkerTokenModal(false)}
						/>
					)}

					{showAuthConfigModal && (
						<AuthorizationCodeConfigModal
							isOpen={showAuthConfigModal}
							onClose={() => setShowAuthConfigModal(false)}
						/>
					)}

					{/* Tab Navigation */}
					<div style={getCardStyle()}>
						<div
							style={{
								display: 'flex',
								gap: 'var(--pingone-spacing-xs, 0.25rem)',
								marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
							}}
						>
							{[
								{ key: 'recovery', label: 'Password Recovery', icon: 'email-lock' },
								{ key: 'change', label: 'Change Password', icon: 'lock' },
								{ key: 'admin', label: 'Admin Set', icon: 'shield-account' },
								{ key: 'ldap', label: 'LDAP Gateway', icon: 'server' },
							].map((tab) => (
								<button
									key={tab.key}
									type="button"
									onClick={() => setActiveTab(tab.key as any)}
									style={getTabButtonStyle(activeTab === tab.key)}
								>
									<MDIIcon icon={tab.icon} size={16} />
									{tab.label}
								</button>
							))}
						</div>

						{/* Tab Content */}
						{activeTab === 'recovery' && (
							<div>
								<h3 style={getSectionTitleStyle()}>
									<MDIIcon icon="email-lock" size={20} title="Password Recovery" />
									Password Recovery
								</h3>

								<div style={getAlertStyle('info')}>
									<strong>Info:</strong> Send a password recovery email to the user. They will
									receive a code to reset their password.
								</div>

								<div style={getFormStyle()}>
									<div style={getFormGroupStyle()}>
										<label htmlFor="recovery-email" style={getLabelStyle()}>
											Email Address
										</label>
										<input
											id="recovery-email"
											type="email"
											style={getInputStyle()}
											value={recoveryForm.email}
											onChange={(e) =>
												setRecoveryForm((prev) => ({ ...prev, email: e.target.value }))
											}
											placeholder="user@example.com"
										/>
									</div>

									<div style={getFormGroupStyle()}>
										<label htmlFor="recovery-userId" style={getLabelStyle()}>
											User ID (Optional)
										</label>
										<input
											id="recovery-userId"
											type="text"
											style={getInputStyle()}
											value={recoveryForm.userId}
											onChange={(e) =>
												setRecoveryForm((prev) => ({ ...prev, userId: e.target.value }))
											}
											placeholder="user-12345"
										/>
									</div>
								</div>

								<div style={{ marginTop: 'var(--pingone-spacing-lg, 1.5rem)' }}>
									<button
										type="button"
										onClick={handlePasswordRecovery}
										disabled={isLoading || !recoveryForm.email}
										style={getButtonStyle('primary')}
									>
										<MDIIcon
											icon={isLoading ? 'loading' : 'email-send'}
											size={16}
											className={isLoading ? 'mdi-spin' : ''}
										/>
										{isLoading ? 'Sending...' : 'Send Recovery Email'}
									</button>
								</div>

								{results.recovery && (
									<div style={getAlertStyle('success')}>
										<strong>Success:</strong> Recovery email sent to {recoveryForm.email}
									</div>
								)}
							</div>
						)}

						{activeTab === 'change' && (
							<div>
								<h3 style={getSectionTitleStyle()}>
									<MDIIcon icon="lock" size={20} title="Change Password" />
									Change Password
								</h3>

								<div style={getAlertStyle('info')}>
									<strong>Info:</strong> Change your password by providing the current password and
									a new one.
								</div>

								<div style={getFormStyle()}>
									<div style={getFormGroupStyle()}>
										<label htmlFor="change-userId" style={getLabelStyle()}>
											User ID
										</label>
										<input
											id="change-userId"
											type="text"
											style={getInputStyle()}
											value={changeForm.userId}
											onChange={(e) =>
												setChangeForm((prev) => ({ ...prev, userId: e.target.value }))
											}
											placeholder="user-12345"
										/>
									</div>

									<div style={getFormGroupStyle()}>
										<label htmlFor="change-oldPassword" style={getLabelStyle()}>
											Current Password
										</label>
										<input
											id="change-oldPassword"
											type="password"
											style={getInputStyle()}
											value={changeForm.oldPassword}
											onChange={(e) =>
												setChangeForm((prev) => ({ ...prev, oldPassword: e.target.value }))
											}
											placeholder="Enter current password"
										/>
									</div>

									<div style={getFormGroupStyle()}>
										<label htmlFor="change-newPassword" style={getLabelStyle()}>
											New Password
										</label>
										<input
											id="change-newPassword"
											type="password"
											style={getInputStyle()}
											value={changeForm.newPassword}
											onChange={(e) =>
												setChangeForm((prev) => ({ ...prev, newPassword: e.target.value }))
											}
											placeholder="Enter new password"
										/>
									</div>

									<div style={getFormGroupStyle()}>
										<label htmlFor="change-confirmPassword" style={getLabelStyle()}>
											Confirm New Password
										</label>
										<input
											id="change-confirmPassword"
											type="password"
											style={getInputStyle()}
											value={changeForm.confirmPassword}
											onChange={(e) =>
												setChangeForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
											}
											placeholder="Confirm new password"
										/>
									</div>
								</div>

								<div style={{ marginTop: 'var(--pingone-spacing-lg, 1.5rem)' }}>
									<button
										type="button"
										onClick={handlePasswordChange}
										disabled={
											isLoading ||
											!changeForm.userId ||
											!changeForm.oldPassword ||
											!changeForm.newPassword
										}
										style={getButtonStyle('primary')}
									>
										<MDIIcon
											icon={isLoading ? 'loading' : 'lock'}
											size={16}
											className={isLoading ? 'mdi-spin' : ''}
										/>
										{isLoading ? 'Changing...' : 'Change Password'}
									</button>
								</div>

								{results.change && (
									<div style={getAlertStyle('success')}>
										<strong>Success:</strong> Password changed successfully for user{' '}
										{changeForm.userId}
									</div>
								)}
							</div>
						)}

						{activeTab === 'admin' && (
							<div>
								<h3 style={getSectionTitleStyle()}>
									<MDIIcon icon="shield-account" size={20} title="Admin Set" />
									Admin Password Set
								</h3>

								<div style={getAlertStyle('warning')}>
									<strong>Warning:</strong> This allows administrators to set passwords for users.
									Use with caution.
								</div>

								<div style={getFormStyle()}>
									<div style={getFormGroupStyle()}>
										<label htmlFor="admin-userId" style={getLabelStyle()}>
											User ID
										</label>
										<input
											id="admin-userId"
											type="text"
											style={getInputStyle()}
											value={adminForm.userId}
											onChange={(e) =>
												setAdminForm((prev) => ({ ...prev, userId: e.target.value }))
											}
											placeholder="user-12345"
										/>
									</div>

									<div style={getFormGroupStyle()}>
										<label htmlFor="admin-newPassword" style={getLabelStyle()}>
											New Password
										</label>
										<input
											id="admin-newPassword"
											type="password"
											style={getInputStyle()}
											value={adminForm.newPassword}
											onChange={(e) =>
												setAdminForm((prev) => ({ ...prev, newPassword: e.target.value }))
											}
											placeholder="Enter new password"
										/>
									</div>

									<div style={getFormGroupStyle()}>
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 'var(--pingone-spacing-xs, 0.25rem)',
											}}
										>
											<input
												type="checkbox"
												checked={adminForm.forceChange}
												onChange={(e) =>
													setAdminForm((prev) => ({ ...prev, forceChange: e.target.checked }))
												}
											/>
											Force password change on next login
										</label>
									</div>
								</div>

								<div style={{ marginTop: 'var(--pingone-spacing-lg, 1.5rem)' }}>
									<button
										type="button"
										onClick={handleAdminPasswordSet}
										disabled={isLoading || !adminForm.userId || !adminForm.newPassword}
										style={getButtonStyle('primary')}
									>
										<MDIIcon
											icon={isLoading ? 'loading' : 'shield-account'}
											size={16}
											className={isLoading ? 'mdi-spin' : ''}
										/>
										{isLoading ? 'Setting...' : 'Set Password'}
									</button>
								</div>

								{results.admin && (
									<div style={getAlertStyle('success')}>
										<strong>Success:</strong> Admin password set for user {adminForm.userId}
									</div>
								)}
							</div>
						)}

						{activeTab === 'ldap' && (
							<div>
								<h3 style={getSectionTitleStyle()}>
									<MDIIcon icon="server" size={20} title="LDAP Gateway" />
									LDAP Gateway Password Set
								</h3>

								<div style={getAlertStyle('info')}>
									<strong>Info:</strong> Set password through LDAP gateway for directory-integrated
									users.
								</div>

								<div style={getFormStyle()}>
									<div style={getFormGroupStyle()}>
										<label htmlFor="ldap-userId" style={getLabelStyle()}>
											User ID
										</label>
										<input
											id="ldap-userId"
											type="text"
											style={getInputStyle()}
											value={ldapForm.userId}
											onChange={(e) => setLdapForm((prev) => ({ ...prev, userId: e.target.value }))}
											placeholder="user-12345"
										/>
									</div>

									<div style={getFormGroupStyle()}>
										<label htmlFor="ldap-newPassword" style={getLabelStyle()}>
											New Password
										</label>
										<input
											id="ldap-newPassword"
											type="password"
											style={getInputStyle()}
											value={ldapForm.newPassword}
											onChange={(e) =>
												setLdapForm((prev) => ({ ...prev, newPassword: e.target.value }))
											}
											placeholder="Enter new password"
										/>
									</div>
								</div>

								<div style={{ marginTop: 'var(--pingone-spacing-lg, 1.5rem)' }}>
									<button
										type="button"
										onClick={handleLDAPPasswordSet}
										disabled={isLoading || !ldapForm.userId || !ldapForm.newPassword}
										style={getButtonStyle('primary')}
									>
										<MDIIcon
											icon={isLoading ? 'loading' : 'server'}
											size={16}
											className={isLoading ? 'mdi-spin' : ''}
										/>
										{isLoading ? 'Setting...' : 'Set LDAP Password'}
									</button>
								</div>

								{results.ldap && (
									<div style={getAlertStyle('success')}>
										<strong>Success:</strong> LDAP password set for user {ldapForm.userId}
									</div>
								)}
							</div>
						)}
					</div>

					{/* API Call History */}
					{apiCalls.length > 0 && (
						<div style={getCardStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="history" size={20} title="API Calls" />
								API Call History
							</h3>
							<ApiCallTable calls={apiCalls} />
						</div>
					)}
				</ContentWrapper>
			</PageContainer>
		</div>
	);
};

export default HelioMartPasswordResetPingUI;
