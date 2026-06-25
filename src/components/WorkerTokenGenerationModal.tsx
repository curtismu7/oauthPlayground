/**
 * @file WorkerTokenGenerationModal.tsx
 * @description Worker token generation modal with form and state machine
 */

import React, { useState } from 'react';
import { workerTokenApiClient } from '@/services/workerTokenApiClient';

interface GenerationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTokenGenerated?: (token: string) => void;
}

export const WorkerTokenGenerationModal: React.FC<GenerationModalProps> = ({ isOpen, onClose, onTokenGenerated }) => {
	const [state, setState] = useState<'form' | 'loading' | 'success' | 'error'>('form');
	const [error, setError] = useState<string>('');
	const [generatedToken, setGeneratedToken] = useState<string>('');

	// Form fields
	const [envId, setEnvId] = useState('');
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [showSecret, setShowSecret] = useState(false);
	const [region, setRegion] = useState<'us' | 'eu' | 'ap' | 'ca'>('us');
	const [authMethod, setAuthMethod] = useState<'client_secret_basic' | 'client_secret_post'>('client_secret_basic');
	const [customDomain, setCustomDomain] = useState('');
	const [grantType, setGrantType] = useState<'client_credentials' | 'authorization_code'>('client_credentials');
	const [roles, setRoles] = useState({ appDev: true, envAdmin: true, orgAdmin: false });
	const [name, setName] = useState('');

	async function handleGenerate() {
		if (!envId || !clientId || !clientSecret || !region || !authMethod) {
			setError('Missing required fields');
			return;
		}

		setState('loading');
		setError('');

		try {
			const result = await workerTokenApiClient.generateToken({
				environmentId: envId,
				clientId,
				clientSecret,
				region,
				authMethod,
				customDomain,
				roles: Object.entries(roles)
					.filter(([, v]) => v)
					.map(([k]) => k),
				name,
			});

			setGeneratedToken(result.token);
			setState('success');
			onTokenGenerated?.(result.token);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to generate token');
			setState('error');
		}
	}

	function handleReset() {
		setState('form');
		setError('');
		setGeneratedToken('');
		onClose();
	}

	if (!isOpen) return null;

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				background: 'rgba(0,0,0,0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
			}}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '8px',
					maxWidth: '500px',
					width: '100%',
					overflow: 'hidden',
					boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
				}}
			>
				{/* Header */}
				<div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
					<h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Create Worker Token</h2>
					<p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Generate a new API authentication token</p>
				</div>

				{/* Body */}
				<div style={{ padding: '20px', minHeight: '300px' }}>
					{state === 'form' && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							<details style={{ padding: '10px', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '4px' }}>
								<summary style={{ cursor: 'pointer', fontWeight: '600', color: '#1e40af' }}>About worker tokens & credentials</summary>
								<div style={{ marginTop: '8px', fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>
									Worker tokens expire after <strong>1 hour</strong>. Get credentials from PingOne Console → Connections → Applications (Worker app).
								</div>
							</details>

							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
									Environment ID <span style={{ color: '#dc2626' }}>*</span>
								</label>
								<input
									type="text"
									value={envId}
									onChange={e => setEnvId(e.target.value)}
									placeholder="e.g., a1b2c3d4e5f6g7h8"
									style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
								/>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
									Client ID <span style={{ color: '#dc2626' }}>*</span>
								</label>
								<input
									type="text"
									value={clientId}
									onChange={e => setClientId(e.target.value)}
									placeholder="e.g., abc123xyz"
									style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
								/>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
									Client Secret <span style={{ color: '#dc2626' }}>*</span>
								</label>
								<div style={{ position: 'relative' }}>
									<input
										type={showSecret ? 'text' : 'password'}
										value={clientSecret}
										onChange={e => setClientSecret(e.target.value)}
										placeholder="••••••••••••"
										style={{ width: '100%', padding: '8px 10px', paddingRight: '50px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
									/>
									<button
										type="button"
										onClick={() => setShowSecret(!showSecret)}
										style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#3b82f6' }}
									>
										{showSecret ? 'Hide' : 'Show'}
									</button>
								</div>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Region</label>
								<select value={region} onChange={e => setRegion(e.target.value as any)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}>
									<option value="us">North America — US (pingone.com)</option>
									<option value="ca">Canada — CA (pingone.ca)</option>
									<option value="eu">Europe — EMEA (pingone.eu)</option>
									<option value="ap">Asia Pacific — APAC (pingone.asia)</option>
								</select>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Auth Method</label>
								<select value={authMethod} onChange={e => setAuthMethod(e.target.value as any)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}>
									<option value="client_secret_basic">client_secret_basic</option>
									<option value="client_secret_post">client_secret_post</option>
								</select>
								<small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>Can be auto-corrected if needed</small>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Roles</label>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
										<input type="checkbox" checked={roles.appDev} onChange={e => setRoles({ ...roles, appDev: e.target.checked })} />
										<span style={{ fontSize: '13px' }}>Application Developer</span>
									</label>
									<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
										<input type="checkbox" checked={roles.envAdmin} onChange={e => setRoles({ ...roles, envAdmin: e.target.checked })} />
										<span style={{ fontSize: '13px' }}>Environment Admin</span>
									</label>
									<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
										<input type="checkbox" checked={roles.orgAdmin} onChange={e => setRoles({ ...roles, orgAdmin: e.target.checked })} />
										<span style={{ fontSize: '13px' }}>Organization Admin</span>
									</label>
								</div>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Name (optional)</label>
								<input
									type="text"
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder="e.g., Staging CI/CD"
									style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
								/>
							</div>

							{error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '4px', fontSize: '13px' }}>❌ {error}</div>}
						</div>
					)}

					{state === 'loading' && (
						<div style={{ textAlign: 'center' }}>
							<div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '20px auto' }}></div>
							<div style={{ color: '#6b7280', fontSize: '13px', marginTop: '12px' }}>Generating your worker token...</div>
						</div>
					)}

					{state === 'success' && (
						<div>
							<div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>🎉</div>
							<h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Token Generated Successfully</h3>
							<p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Copy it now — you won't see it again.</p>
							<div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', color: '#374151', wordBreak: 'break-all', marginBottom: '12px' }}>
								{generatedToken}
							</div>
							<button
								onClick={() => navigator.clipboard.writeText(generatedToken)}
								style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
							>
								📋 Copy Token
							</button>
						</div>
					)}

					{state === 'error' && (
						<div>
							<div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>❌</div>
							<h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>Generation Failed</h3>
							<p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Please try again</p>
							<div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '4px', padding: '10px', fontSize: '12px', color: '#991b1b' }}>
								{error}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div
					style={{
						padding: '16px 20px',
						background: '#f9fafb',
						borderTop: '1px solid #e5e7eb',
						display: 'flex',
						gap: '8px',
					}}
				>
					<button
						onClick={handleReset}
						style={{ flex: 1, padding: '8px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
					>
						{state === 'form' ? 'Cancel' : 'Close'}
					</button>
					{state === 'form' && (
						<button
							onClick={handleGenerate}
							style={{ flex: 1, padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
						>
							Generate Token
						</button>
					)}
					{state === 'error' && (
						<button
							onClick={() => setState('form')}
							style={{ flex: 1, padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
						>
							Retry
						</button>
					)}
				</div>
			</div>

			<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
		</div>
	);
};
