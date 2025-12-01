/**
 * @file WorkerTokenModalV8.tsx
 * @module v8/components
 * @description Worker token credential management modal for V8
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useState } from 'react';
import { AuthMethodServiceV8, type AuthMethodV8 } from '@/v8/services/authMethodServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { WorkerTokenRequestModalV8 } from './WorkerTokenRequestModalV8';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-MODAL-V8]';

interface WorkerTokenModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onTokenGenerated?: (token: string) => void;
	environmentId?: string;
}

export const WorkerTokenModalV8: React.FC<WorkerTokenModalV8Props> = ({
	isOpen,
	onClose,
	onTokenGenerated,
	environmentId: propEnvironmentId = '',
}) => {
	const [environmentId, setEnvironmentId] = useState(propEnvironmentId);
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopeInput, setScopeInput] = useState(PINGONE_WORKER_MFA_SCOPE_STRING);
	const [region, setRegion] = useState<'us' | 'eu' | 'ap' | 'ca'>('us');
	const [authMethod, setAuthMethod] = useState<AuthMethodV8>('client_secret_basic');
	const [showSecret, setShowSecret] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [requestDetails, setRequestDetails] = useState<{
		tokenEndpoint: string;
		requestParams: {
			grant_type: string;
			client_id: string;
			client_secret: string;
			scope: string;
		};
		authMethod: AuthMethodV8;
		region: 'us' | 'eu' | 'ap' | 'ca';
		resolvedHeaders: Record<string, string>;
		resolvedBody: string;
	} | null>(null);
	const [saveCredentials, setSaveCredentials] = useState(true);

	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
		return undefined;
	}, [isOpen]);

	// Load saved credentials on mount
	React.useEffect(() => {
		if (isOpen) {
			const saved = localStorage.getItem('worker_credentials_v8');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					setEnvironmentId(parsed.environmentId || propEnvironmentId);
					setClientId(parsed.clientId || '');
					setClientSecret(parsed.clientSecret || '');
					setScopeInput(
						Array.isArray(parsed.scopes) && parsed.scopes.length
							? parsed.scopes.join(' ')
							: ''
					);
					setRegion(parsed.region || 'us');
					setAuthMethod(parsed.authMethod || 'client_secret_basic');
					console.log(`${MODULE_TAG} Loaded saved credentials`);
				} catch (e) {
					console.error(`${MODULE_TAG} Failed to load saved credentials`, e);
				}
			}
		}
	}, [isOpen, propEnvironmentId]);

	React.useEffect(() => {
		// NOTE: Scope event handling removed - worker token provides necessary permissions
	}, []);

	if (!isOpen) return null;

	const handleGenerate = async () => {
		if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
			toastV8.error('Please fill in all required fields');
			return;
		}

		const normalizedScopes = scopeInput
			.split(/\s+/)
			.map((scope) => scope.trim())
			.filter(Boolean);

		if (normalizedScopes.length === 0) {
			toastV8.error('Please provide at least one scope for the worker token');
			return;
		}

		setScopeInput(normalizedScopes.join(' '));

		// Save credentials if checkbox is checked
		if (saveCredentials) {
			const credsToSave = {
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				scopes: normalizedScopes,
				region,
				authMethod,
			};
			localStorage.setItem('worker_credentials_v8', JSON.stringify(credsToSave));
			console.log(`${MODULE_TAG} Credentials saved`);
		}

		// Build token endpoint
		const regionDomains = {
			us: 'auth.pingone.com',
			eu: 'auth.pingone.eu',
			ap: 'auth.pingone.asia',
			ca: 'auth.pingone.ca',
		};
		const domain = regionDomains[region];
		const tokenEndpoint = `https://${domain}/${environmentId.trim()}/as/token`;

		const params = new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: clientId.trim(),
			scope: normalizedScopes.join(' '),
		});

		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		if (authMethod === 'client_secret_post') {
			params.set('client_secret', clientSecret.trim());
		} else if (authMethod === 'client_secret_basic') {
			const basicAuth = btoa(`${clientId.trim()}:${clientSecret.trim()}`);
			headers.Authorization = `Basic ${basicAuth}`;
		}

		const details = {
			tokenEndpoint,
			requestParams: {
				grant_type: 'client_credentials',
				client_id: clientId.trim(),
				client_secret: clientSecret.trim(),
				scope: normalizedScopes.join(' '),
			},
			authMethod,
			region,
			resolvedHeaders: headers,
			resolvedBody: params.toString(),
		};

		setRequestDetails(details);
		setShowRequestModal(true);
	};

	const handleExecuteRequest = async () => {
		if (!requestDetails) return;

		setIsGenerating(true);
		try {
			console.log(`${MODULE_TAG} Generating worker token`, { environmentId, region });

			const scopeList = requestDetails.requestParams.scope
				.split(/\s+/)
				.map((scope) => scope.trim())
				.filter(Boolean);

			// First, save credentials to workerTokenServiceV8
			const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
			await workerTokenServiceV8.saveCredentials({
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				scopes: scopeList,
				region,
				tokenEndpointAuthMethod: authMethod,
			});
			console.log(`${MODULE_TAG} Credentials saved to workerTokenServiceV8`);

			const response = await fetch(requestDetails.tokenEndpoint, {
				method: 'POST',
				headers: requestDetails.resolvedHeaders,
				body: requestDetails.resolvedBody,
			});

			if (!response.ok) {
				let errorMessage = `Token generation failed (HTTP ${response.status})`;
				try {
					const errorJson = await response.json();
					errorMessage = errorJson.error_description || errorJson.error || errorMessage;
				} catch {
					const errorText = await response.text();
					if (errorText) {
						errorMessage = `${errorMessage}: ${errorText}`;
					}
				}

				if (/client authentication failed/i.test(errorMessage)) {
					errorMessage +=
						'. Verify the client secret and make sure the token endpoint authentication method matches your PingOne app (try switching between Client Secret Post and Client Secret Basic).';
				} else if (/unsupported_grant_type/i.test(errorMessage)) {
					errorMessage += '. Double-check that the Worker app allows the client_credentials grant.';
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			const token = data.access_token;

			// Now store token using workerTokenServiceV8 (credentials are already saved)
			const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;
			await workerTokenServiceV8.saveToken(token, expiresAt);
			console.log(`${MODULE_TAG} Token saved to workerTokenServiceV8`);

			if (typeof data.scope === 'string' && data.scope.trim().length > 0) {
				console.log(`${MODULE_TAG} Token scopes:`, data.scope);
			}

			// Dispatch event for status update
			window.dispatchEvent(new Event('workerTokenUpdated'));

			toastV8.success('Worker token generated successfully!');
			console.log(`${MODULE_TAG} Token generated and stored`);

			onTokenGenerated?.(token);
			setShowRequestModal(false);
			onClose();
		} catch (error) {
			console.error(`${MODULE_TAG} Token generation error`, error);
			toastV8.error(error instanceof Error ? error.message : 'Failed to generate token');
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			{/* Backdrop */}
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					zIndex: 999,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onClick={onClose}
				onKeyUp={(e) => e.key === 'Enter' && onClose()}
				onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
				role="button"
				tabIndex={0}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div
				className="worker-token-modal-v8"
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: 'white',
					borderRadius: '8px',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					zIndex: 1000,
					maxWidth: '500px',
					width: '90%',
					maxHeight: '80vh',
					overflow: 'auto',
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyUp={(e) => e.key === 'Escape' && onClose()}
				onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()}
				role="dialog"
				tabIndex={-1}
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<style>{`
					.worker-token-modal-v8 input[type="text"],
					.worker-token-modal-v8 input[type="password"],
					.worker-token-modal-v8 select {
						box-sizing: border-box !important;
					}
					.worker-token-modal-v8 input[type="text"],
					.worker-token-modal-v8 input[type="password"] {
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				`}</style>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(to right, #fef3c7 0%, #fde68a 100%)',
						padding: '20px 24px',
						borderBottom: '1px solid #fcd34d',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div>
							<h2
								style={{
									margin: '0 0 4px 0',
									fontSize: '18px',
									fontWeight: '700',
									color: '#92400e',
								}}
							>
								🔑 Worker Token Credentials
							</h2>
							<p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
								Generate a worker token for API access
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#92400e',
								padding: '4px 8px',
							}}
							aria-label="Close modal"
						>
							×
						</button>
					</div>
				</div>

				{/* Content */}
				<div style={{ padding: '24px' }}>
					{/* Info Box */}
					<div
						style={{
							padding: '12px',
							background: '#dbeafe',
							borderRadius: '6px',
							border: '1px solid #93c5fd',
							marginBottom: '16px',
							fontSize: '13px',
							color: '#1e40af',
							lineHeight: '1.5',
						}}
					>
						<div style={{ marginBottom: '8px' }}>
							<strong>ℹ️ What is a Worker Token?</strong>
						</div>
						<div style={{ marginBottom: '8px' }}>
							Worker tokens are used for server-to-server API calls to discover applications and
							access PingOne management APIs.
						</div>
						<div style={{ marginBottom: '8px' }}>
							<strong>Requirements:</strong> A Worker application in PingOne with appropriate roles
							(e.g., "Identity Data Read Only" or "Environment Admin").
						</div>
						<div
							style={{
								marginTop: '8px',
								padding: '8px',
								background: '#fef3c7',
								borderRadius: '4px',
								border: '1px solid #fcd34d',
								color: '#92400e',
							}}
						>
							<strong>⏰ Token Validity:</strong> Worker tokens are valid for{' '}
							<strong>1 hour</strong> after generation. You will need to generate a new token after
							it expires.
						</div>
						{(() => {
							try {
								const config = MFAConfigurationServiceV8.loadConfiguration();
								const autoRenewal = config.workerToken.autoRenewal;
								const renewalThreshold = config.workerToken.renewalThreshold;
								
								return (
									<div
										style={{
											marginTop: '8px',
											padding: '8px',
											background: autoRenewal ? '#d1fae5' : '#fee2e2',
											borderRadius: '4px',
											border: `1px solid ${autoRenewal ? '#86efac' : '#fca5a5'}`,
											color: autoRenewal ? '#065f46' : '#991b1b',
										}}
									>
										<strong>🔄 Auto-Renewal:</strong>{' '}
										{autoRenewal ? (
											<>
												<strong>Enabled</strong> - Tokens will automatically renew{' '}
												{renewalThreshold} seconds before expiry during MFA flows.
											</>
										) : (
											<>
												<strong>Disabled</strong> - You will need to manually generate new tokens when they expire.
											</>
										)}{' '}
										<a
											href="/v8/mfa-config"
											onClick={(e) => {
												e.preventDefault();
												window.location.href = '/v8/mfa-config';
											}}
											style={{
												color: 'inherit',
												textDecoration: 'underline',
												fontWeight: '600',
											}}
										>
											Configure in MFA Settings
										</a>
									</div>
								);
							} catch {
								return null;
							}
						})()}
						<div
							style={{
								marginTop: '8px',
								padding: '8px',
								background: '#fff7ed',
								borderRadius: '4px',
								border: '1px solid #fdba74',
								color: '#9a3412',
							}}
						>
							<strong>✅ Recommended MFA scopes:</strong>
							<div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
								{PINGONE_WORKER_MFA_SCOPE_STRING}
							</div>
							<p style={{ marginTop: '6px', fontSize: '12px' }}>
								You can adjust the scope list below to match your PingOne Worker application.
							</p>
						</div>
					</div>

					{/* How to Get Credentials */}
					<div
						style={{
							padding: '12px',
							background: '#f0fdf4',
							borderRadius: '6px',
							border: '1px solid #86efac',
							marginBottom: '20px',
							fontSize: '12px',
							color: '#166534',
							lineHeight: '1.5',
						}}
					>
						<div style={{ marginBottom: '6px', fontWeight: '600' }}>
							📝 How to get these credentials:
						</div>
						<ol style={{ margin: '0', paddingLeft: '20px' }}>
							<li>Go to PingOne Console → Connections → Applications</li>
							<li>Create or select a Worker application</li>
							<li>Copy the Environment ID, Client ID, and Client Secret</li>
							<li>Ensure the app has required roles assigned</li>
								<li>
									Set <strong>Token Endpoint Auth Method</strong> to match your Worker app. If you see
									“client authentication failed”, try switching between <em>Client Secret Post</em>{' '}
									and <em>Client Secret Basic</em>.
								</li>
						</ol>
					</div>

					{/* Form Fields */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleGenerate();
						}}
						style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
					>
						{/* Environment ID */}
						<div>
							<label
								htmlFor="environmentId"
								style={{
									display: 'block',
									fontWeight: '600',
									fontSize: '13px',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Environment ID <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								id="environmentId"
								type="text"
								value={environmentId}
								onChange={(e) => setEnvironmentId(e.target.value)}
								placeholder="12345678-1234-1234-1234-123456789012"
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									fontSize: '14px',
									fontFamily: 'monospace',
								}}
							/>
						</div>

						{/* Client ID */}
						<div>
							<label
								htmlFor="clientId"
								style={{
									display: 'block',
									fontWeight: '600',
									fontSize: '13px',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Client ID <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								id="clientId"
								type="text"
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								placeholder="abc123def456..."
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									fontSize: '14px',
									fontFamily: 'monospace',
								}}
							/>
						</div>

						{/* Client Secret */}
						<div>
							<label
								htmlFor="clientSecret"
								style={{
									display: 'block',
									fontWeight: '600',
									fontSize: '13px',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Client Secret <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<div style={{ position: 'relative' }}>
								<input
									id="clientSecret"
									type={showSecret ? 'text' : 'password'}
									value={clientSecret}
									onChange={(e) => setClientSecret(e.target.value)}
									placeholder="••••••••••••••••"
									style={{
										width: '100%',
										padding: '10px 12px',
										paddingRight: '40px',
										border: '1px solid #d1d5db',
										borderRadius: '4px',
										fontSize: '14px',
										fontFamily: 'monospace',
									}}
								/>
								<button
									type="button"
									onClick={() => setShowSecret(!showSecret)}
									style={{
										position: 'absolute',
										right: '8px',
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										color: '#6b7280',
										fontSize: '18px',
									}}
								>
									{showSecret ? '👁️' : '👁️‍🗨️'}
								</button>
							</div>
						</div>

						{/* Scopes */}
						<div>
							<label
								htmlFor="scopes"
								style={{
									display: 'block',
									fontWeight: '600',
									fontSize: '13px',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Scopes <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<textarea
								id="scopes"
								value={scopeInput}
								onChange={(e) => setScopeInput(e.target.value)}
								rows={3}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									fontSize: '13px',
									fontFamily: 'monospace',
									resize: 'vertical',
								}}
							/>
							<small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
								Space-separated list. Leave empty for default scopes.
							</small>
						</div>

						{/* Region */}
						<div>
							<label
								htmlFor="region"
								style={{
									display: 'block',
									fontWeight: '600',
									fontSize: '13px',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Region
							</label>
							<select
								id="region"
								value={region}
								onChange={(e) => setRegion(e.target.value as 'us' | 'eu' | 'ap' | 'ca')}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							>
								<option value="us">North America (US)</option>
								<option value="eu">Europe (EU)</option>
								<option value="ap">Asia Pacific (AP)</option>
								<option value="ca">Canada (CA)</option>
							</select>
						</div>

						{/* Token Endpoint Authentication */}
						<div>
							<label
								htmlFor="authMethod"
								style={{
									display: 'block',
									fontWeight: '600',
									fontSize: '13px',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Token Endpoint Authentication
							</label>
							<select
								id="authMethod"
								value={authMethod}
								onChange={(e) => setAuthMethod(e.target.value as AuthMethodV8)}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							>
								{AuthMethodServiceV8.getAvailableMethodsForFlow('client-credentials').map(
									(method) => (
										<option key={method} value={method}>
											{AuthMethodServiceV8.getDisplayLabel(method)}
										</option>
									)
								)}
							</select>
							<div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
								{AuthMethodServiceV8.getMethodConfig(authMethod).description}
							</div>
						</div>
					</form>

					{/* Save Credentials Checkbox */}
					<div
						style={{
							marginTop: '16px',
							padding: '12px',
							background: '#f9fafb',
							borderRadius: '6px',
							border: '1px solid #e5e7eb',
						}}
					>
						<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
							<input
								type="checkbox"
								checked={saveCredentials}
								onChange={(e) => setSaveCredentials(e.target.checked)}
								style={{ cursor: 'pointer' }}
							/>
							<span style={{ fontSize: '13px', color: '#374151' }}>
								💾 Save credentials for next time
							</span>
						</label>
						<small
							style={{
								display: 'block',
								marginTop: '4px',
								marginLeft: '24px',
								fontSize: '11px',
								color: '#6b7280',
							}}
						>
							Credentials are stored securely in your browser's local storage
						</small>
					</div>

					{/* Actions */}
					<div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
						<button
							type="button"
							onClick={onClose}
							style={{
								flex: 1,
								padding: '10px 16px',
								background: '#e5e7eb',
								color: '#1f2937',
								border: 'none',
								borderRadius: '4px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleGenerate}
							disabled={isGenerating}
							style={{
								flex: 1,
								padding: '10px 16px',
								background: isGenerating ? '#9ca3af' : '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: isGenerating ? 'not-allowed' : 'pointer',
							}}
						>
							{isGenerating ? '🔄 Generating...' : '🔑 Generate Token'}
						</button>
					</div>
				</div>
			</div>

			{/* Request Modal */}
			{showRequestModal && requestDetails && (
				<WorkerTokenRequestModalV8
					isOpen={showRequestModal}
					onClose={() => setShowRequestModal(false)}
					onExecute={handleExecuteRequest}
					requestDetails={requestDetails}
					isExecuting={isGenerating}
				/>
			)}
		</>
	);
};

export default WorkerTokenModalV8;
