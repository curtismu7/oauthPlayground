/**
 * @file PasskeyManager.tsx
 * @module pages
 * @description Standalone page for managing and identifying passkeys
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { PasskeyManagementUtility } from '@/utils/PasskeyManagementUtility';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { WorkerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';

export const PasskeyManager: React.FC = () => {
	usePageScroll({ pageName: 'Passkey Manager', force: true });

	const [environmentId, setEnvironmentId] = useState(
		() => EnvironmentIdServiceV8.getEnvironmentId() || ''
	);
	const [userId, setUserId] = useState('');
	const [workerToken, setWorkerToken] = useState<string | null>(null);
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

			const workerTokenService = new WorkerTokenServiceV8();
			const token = await workerTokenService.getWorkerToken({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				scopes: credentials.scopes || 'openid',
			});

			setWorkerToken(token);
		} catch (error) {
			console.error('Failed to load worker token:', error);
			alert(
				`Failed to load worker token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
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

					<div>
						<label
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontSize: '0.875rem',
								fontWeight: '500',
								color: '#374151',
							}}
						>
							User ID *
						</label>
						<input
							type="text"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							placeholder="Enter the User ID to manage passkeys for"
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '0.95rem',
							}}
						/>
					</div>

					<div>
						<label
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
