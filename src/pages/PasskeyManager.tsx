/**
 * @file PasskeyManager.tsx
 * @module pages
 * @description Standalone page for managing and identifying passkeys
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import { usePageScroll } from '@/hooks/usePageScroll';
import { PasskeyManagementUtility } from '@/utils/PasskeyManagementUtility';
import { UserSearchDropdownV8 } from '@/v8/components/UserSearchDropdownV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';

export const PasskeyManager: React.FC = () => {
	usePageScroll({ pageName: 'Passkey Manager', force: true });

	// Use unified global worker token hook for token management
	const globalTokenStatus = useGlobalWorkerToken();
	const workerToken = globalTokenStatus.token || '';
	const hasWorkerToken = globalTokenStatus.isValid;
	const [_showWorkerTokenModal, _setShowWorkerTokenModal] = useState(false);

	const [environmentId, setEnvironmentId] = useState(() => readBestEnvironmentId());
	const [userId, setUserId] = useState('');
	const [loadingToken, setLoadingToken] = useState(false);

	const handleLoadWorkerToken = async () => {
		if (!environmentId) {
			alert('Please enter an Environment ID');
			return;
		}

		setLoadingToken(true);
		try {
			const flowKey = 'worker-token-v8';
			const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
				flowKey,
				flowType: 'client-credentials' as const,
				includeClientSecret: true,
				includeScopes: true,
				includeRedirectUri: false,
				includeLogoutUri: false,
			};

			const credentials = CredentialsServiceV8.loadCredentials(flowKey, config);
			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				throw new Error(
					'Missing worker credentials. Please configure worker token credentials first.'
				);
			}

			// Worker token is now managed by unified service
			if (!hasWorkerToken) {
				alert('Please get a worker token first');
				return;
			}

			setLoadingToken(true);
			try {
				// Token is already available from unified service
				console.log('[Passkey Manager] Using worker token from unified service');
			} catch (error) {
				console.error('Failed to load worker token:', error);
				alert(
					`Failed to load worker token: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			} finally {
				setLoadingToken(false);
			}
		} finally {
			setLoadingToken(false);
		}
	};

	return (
		<div>
			{/* Configuration Section */}
			<div
				style={{
					background: 'white',
					padding: '2rem',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					marginBottom: '2rem',
					maxWidth: '1200px',
					margin: '0 auto 2rem',
				}}
			>
				<h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: '600' }}>Configuration</h2>
				<div style={{ display: 'grid', gap: '1rem' }}>
					<div>
						<label
							htmlFor="passkey-env-id"
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontSize: '0.875rem',
								fontWeight: '500',
								color: '#374151',
							}}
						>
							Environment ID *
						</label>
						<input
							id="passkey-env-id"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="Enter your PingOne Environment ID"
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '0.95rem',
							}}
						/>
					</div>

					<div style={{ marginBottom: '1.5rem' }}>
						<label
							htmlFor="passkey-user-id"
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							User ID *
						</label>
						<UserSearchDropdownV8
							environmentId={environmentId}
							value={userId}
							onChange={(value) => setUserId(value)}
							placeholder="Search for a user by ID, username, or email..."
							disabled={!environmentId.trim() || !workerToken.trim()}
							id="passkey-user-id"
							autoLoad={true}
						/>
					</div>

					<div>
						<label
							htmlFor="passkey-worker-token"
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontSize: '0.875rem',
								fontWeight: '500',
								color: '#374151',
							}}
						>
							Worker Token
						</label>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<input
								id="passkey-worker-token"
								type="password"
								value={workerToken || ''}
								readOnly
								placeholder="Click 'Load Worker Token' to fetch"
								style={{
									flex: 1,
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '0.95rem',
									background: workerToken ? '#f9fafb' : '#ffffff',
								}}
							/>
							<button
								type="button"
								onClick={handleLoadWorkerToken}
								disabled={loadingToken || !environmentId}
								style={{
									padding: '0.75rem 1.5rem',
									background: loadingToken || !environmentId ? '#9ca3af' : '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: loadingToken || !environmentId ? 'not-allowed' : 'pointer',
									fontSize: '0.95rem',
									fontWeight: '500',
								}}
							>
								{loadingToken ? 'Loading...' : 'Load Worker Token'}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Passkey Management Utility */}
			{environmentId && userId && workerToken && (
				<PasskeyManagementUtility
					environmentId={environmentId}
					userId={userId}
					workerToken={workerToken}
					onDeviceDeleted={() => {
						// Refresh handled by utility
					}}
				/>
			)}

			{(!environmentId || !userId || !workerToken) && (
				<div
					style={{
						maxWidth: '1200px',
						margin: '0 auto',
						padding: '2rem',
						background: '#fef3c7',
						border: '1px solid #f59e0b',
						borderRadius: '12px',
						textAlign: 'center',
						color: '#92400e',
					}}
				>
					<p style={{ margin: 0, fontSize: '1rem' }}>
						Please configure Environment ID, User ID, and load a Worker Token to view passkeys.
					</p>
				</div>
			)}
		</div>
	);
};
