/**
 * @file UnifiedWorkerTokenDashboard.tsx
 * @description Unified worker token management dashboard
 * Displays: active token, expiry countdown, history, decode/encode tools
 */

import React, { useEffect, useState } from 'react';
import { workerTokenApiClient } from '@/services/workerTokenApiClient';

interface Token {
	id: string;
	expiresAt: number;
	expiresIn: number;
	status: 'active' | 'expiring' | 'expired' | 'revoked';
	roles?: string[];
	name?: string;
	createdAt?: number;
}

export const UnifiedWorkerTokenDashboard: React.FC = () => {
	const [activeToken, setActiveToken] = useState<Token | null>(null);
	const [history, setHistory] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [decodeInput, setDecodeInput] = useState('');
	const [decodeOutput, setDecodeOutput] = useState('');
	const [encodeInput, setEncodeInput] = useState('');
	const [encodeOutput, setEncodeOutput] = useState('');

	// Fetch active token and history on mount
	useEffect(() => {
		loadTokenData();
		const interval = setInterval(() => loadTokenData(), 60000); // Refresh every minute
		return () => clearInterval(interval);
	}, []);

	// Update countdown timer
	useEffect(() => {
		if (!activeToken || activeToken.status === 'expired') return;

		const timer = setInterval(() => {
			setActiveToken(prev => {
				if (!prev) return null;
				const newExpiresIn = Math.max(0, prev.expiresAt - Date.now());
				return {
					...prev,
					expiresIn: newExpiresIn,
					status:
						newExpiresIn < 5 * 60 * 1000
							? 'expiring'
							: newExpiresIn < 1000
								? 'expired'
								: 'active',
				};
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [activeToken]);

	async function loadTokenData() {
		try {
			setLoading(true);
			setError(null);
			const token = await workerTokenApiClient.getActiveToken();
			setActiveToken(token);
			const hist = await workerTokenApiClient.getHistory();
			setHistory(hist);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load token data');
		} finally {
			setLoading(false);
		}
	}

	async function handleRevoke() {
		if (!activeToken) return;
		try {
			await workerTokenApiClient.revokeToken(activeToken.id);
			setActiveToken(null);
			await loadTokenData();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to revoke token');
		}
	}

	function formatTime(ms: number): string {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}m ${seconds}s`;
	}

	// Base64 decode helper
	function base64Decode(str: string): string {
		try {
			return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
		} catch {
			return 'Invalid base64';
		}
	}

	// JWT decode
	function decodeToken() {
		if (!decodeInput) {
			setDecodeOutput('');
			return;
		}
		try {
			if (decodeInput.includes('.')) {
				const parts = decodeInput.split('.');
				if (parts.length === 3) {
					const header = JSON.parse(base64Decode(parts[0]));
					const payload = JSON.parse(base64Decode(parts[1]));
					setDecodeOutput(JSON.stringify({ header, payload }, null, 2));
					return;
				}
			}
			const decoded = base64Decode(decodeInput);
			try {
				setDecodeOutput(JSON.stringify(JSON.parse(decoded), null, 2));
			} catch {
				setDecodeOutput(decoded);
			}
		} catch (err) {
			setDecodeOutput(`❌ Decode error: ${(err as Error).message}`);
		}
	}

	// Base64 encode
	function base64Encode(str: string): string {
		return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}

	// JWT encode
	function encodeToken() {
		if (!encodeInput) {
			setEncodeOutput('');
			return;
		}
		try {
			const payload = JSON.parse(encodeInput);
			const header = base64Encode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
			const body = base64Encode(JSON.stringify(payload));
			const jwt = `${header}.${body}.`;
			setEncodeOutput(jwt);
			navigator.clipboard.writeText(jwt);
		} catch (err) {
			setEncodeOutput(`❌ Encode error: ${(err as Error).message}`);
		}
	}

	if (loading) {
		return <div style={{ padding: '20px', textAlign: 'center' }}>Loading token data...</div>;
	}

	return (
		<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
			<h1>Worker Tokens</h1>

			{error && (
				<div
					style={{
						background: '#fee2e2',
						color: '#991b1b',
						padding: '12px',
						borderRadius: '4px',
						marginBottom: '20px',
					}}
				>
					{error}
				</div>
			)}

			{/* Active Token Section */}
			{activeToken ? (
				<div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
					<div style={{ marginBottom: '12px' }}>
						<h2 style={{ marginBottom: '4px' }}>Active Token</h2>
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#dcfce7', color: '#166534' }}>
							<span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
							{activeToken.status === 'active' ? 'Active' : 'Expiring'} ({formatTime(activeToken.expiresIn)})
						</span>
					</div>

					<div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#374151', wordBreak: 'break-all', marginBottom: '12px' }}>
						wt_sk_[token hidden for security]
					</div>

					<div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
						Generated {activeToken.createdAt ? new Date(activeToken.createdAt).toLocaleString() : 'recently'} • Expires in <strong>{formatTime(activeToken.expiresIn)}</strong>
					</div>

					<div style={{ display: 'flex', gap: '8px' }}>
						<button onClick={() => navigator.clipboard.writeText('wt_sk_[token]')} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
							📋 Copy Token
						</button>
						<button onClick={() => {}} style={{ padding: '8px 16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
							⬇️ Download
						</button>
						<button onClick={handleRevoke} style={{ padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
							🗑️ Revoke
						</button>
					</div>
				</div>
			) : (
				<div style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center', marginBottom: '20px' }}>
					<div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>⚡</div>
					<h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>No Active Token</h3>
					<p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>Generate a worker token to authenticate API requests. Tokens expire after 1 hour.</p>
					<button style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
						+ Generate Token
					</button>
				</div>
			)}

			{/* Token History */}
			<div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
				<h2 style={{ marginBottom: '16px' }}>Token History</h2>
				{history.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '30px 20px', color: '#9ca3af' }}>
						<div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.5 }}>📋</div>
						<p>No tokens yet</p>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{history.map(t => (
							<div key={t.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<div>
									<div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6b7280', wordBreak: 'break-all', marginBottom: '4px' }}>{t.token?.substring(0, 50) || 'N/A'}...</div>
									<div style={{ fontSize: '12px', color: '#9ca3af' }}>
										{t.status === 'revoked' ? 'Revoked' : 'Expired'} {t.revokedAt ? new Date(t.revokedAt).toLocaleString() : new Date(t.expires_at).toLocaleString()}
									</div>
								</div>
								<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: t.status === 'revoked' ? '#fee2e2' : '#fef3c7', color: t.status === 'revoked' ? '#991b1b' : '#92400e' }}>
									<span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
									{t.status === 'revoked' ? 'Revoked' : 'Expired'}
								</span>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Decode/Encode Tools */}
			<div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
				<h2 style={{ marginBottom: '16px' }}>Token Tools</h2>

				<div style={{ marginBottom: '20px' }}>
					<h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>📖 Decode JWT / Token</h3>
					<textarea
						value={decodeInput}
						onChange={e => {
							setDecodeInput(e.target.value);
							decodeToken();
						}}
						placeholder="Paste JWT or token..."
						style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', minHeight: '80px' }}
					/>
					{decodeOutput && (
						<div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '4px', marginTop: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#374151', maxHeight: '200px', overflow: 'auto' }}>
							{decodeOutput}
						</div>
					)}
				</div>

				<div>
					<h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>🔐 Encode Payload to JWT</h3>
					<textarea
						value={encodeInput}
						onChange={e => {
							setEncodeInput(e.target.value);
							encodeToken();
						}}
						placeholder='{"sub": "user123", "aud": "my-app"}'
						style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', minHeight: '80px' }}
					/>
					{encodeOutput && (
						<div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '4px', marginTop: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#374151', wordBreak: 'break-all' }}>
							{encodeOutput}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
