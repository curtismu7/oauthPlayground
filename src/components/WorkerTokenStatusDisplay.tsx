/**
 * @file WorkerTokenStatusDisplay.tsx
 * @description Status display components: Badge, Banner, Inline Info
 */

import React, { useEffect, useState } from 'react';
import { workerTokenApiClient } from '@/services/workerTokenApiClient';

interface Token {
	id: string;
	expiresAt: number;
	status: 'active' | 'expiring' | 'expired' | 'revoked';
	roles?: string[];
	name?: string;
	createdAt?: number;
}

export const WorkerTokenStatusBadge: React.FC = () => {
	const [token, setToken] = useState<Token | null>(null);
	const [expiresIn, setExpiresIn] = useState(0);

	useEffect(() => {
		loadToken();
		const interval = setInterval(loadToken, 60000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!token || token.status === 'expired') return;
		const timer = setInterval(() => {
			const now = Date.now();
			setExpiresIn(Math.max(0, token.expiresAt - now));
		}, 1000);
		return () => clearInterval(timer);
	}, [token]);

	async function loadToken() {
		try {
			const t = await workerTokenApiClient.getActiveToken();
			setToken(t);
			if (t) {
				setExpiresIn(Math.max(0, t.expiresAt - Date.now()));
			}
		} catch (err) {
			console.error('Failed to load token:', err);
		}
	}

	if (!token) return null;

	const minutes = Math.floor(expiresIn / 60000);
	const statusStyle =
		token.status === 'active'
			? { background: '#dcfce7', color: '#166534' }
			: token.status === 'expiring'
				? { background: '#fef08a', color: '#92400e' }
				: { background: '#fee2e2', color: '#991b1b' };

	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: '6px',
				padding: '4px 10px',
				borderRadius: '20px',
				fontSize: '12px',
				fontWeight: '600',
				...statusStyle,
			}}
		>
			<span
				style={{
					width: '6px',
					height: '6px',
					borderRadius: '50%',
					background: 'currentColor',
					animation: token.status === 'expired' ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				}}
			></span>
			{token.status === 'active' ? 'Active' : token.status === 'expiring' ? 'Expiring' : 'Expired'} ({minutes}m)
		</span>
	);
};

export const WorkerTokenExpiryBanner: React.FC = () => {
	const [token, setToken] = useState<Token | null>(null);
	const [expiresIn, setExpiresIn] = useState(0);

	useEffect(() => {
		loadToken();
		const interval = setInterval(loadToken, 60000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!token) return;
		const timer = setInterval(() => {
			const now = Date.now();
			setExpiresIn(Math.max(0, token.expiresAt - now));
		}, 1000);
		return () => clearInterval(timer);
	}, [token]);

	async function loadToken() {
		try {
			const t = await workerTokenApiClient.getActiveToken();
			setToken(t);
			if (t) {
				setExpiresIn(Math.max(0, t.expiresAt - Date.now()));
			}
		} catch (err) {
			console.error('Failed to load token:', err);
		}
	}

	if (!token) return null;

	const minutes = Math.floor(expiresIn / 60000);

	const bannerStyle =
		token.status === 'active'
			? {
					background: '#f0fdf4',
					borderLeftColor: '#10b981',
					color: '#15803d',
				}
			: token.status === 'expiring'
				? {
						background: '#fffbeb',
						borderLeftColor: '#f59e0b',
						color: '#92400e',
					}
				: {
						background: '#fef2f2',
						borderLeftColor: '#ef4444',
						color: '#991b1b',
					};

	const icon = token.status === 'active' ? '✓' : token.status === 'expiring' ? '⚠️' : '❌';

	return (
		<div
			style={{
				padding: '12px 16px',
				borderRadius: '6px',
				borderLeft: '4px solid',
				marginBottom: '12px',
				fontSize: '13px',
				...bannerStyle,
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<span>
					<span style={{ marginRight: '8px' }}>{icon}</span>
					Your worker token {token.status === 'active' ? 'is active and will expire in' : token.status === 'expiring' ? 'expires in' : 'has'}{' '}
					<strong>{minutes} minutes</strong>
					{token.status === 'expired' && ' ago'}
				</span>
			</div>
		</div>
	);
};

export const WorkerTokenInlineInfo: React.FC = () => {
	const [token, setToken] = useState<Token | null>(null);
	const [expiresIn, setExpiresIn] = useState(0);

	useEffect(() => {
		loadToken();
		const interval = setInterval(loadToken, 60000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!token) return;
		const timer = setInterval(() => {
			const now = Date.now();
			setExpiresIn(Math.max(0, token.expiresAt - Date.now()));
		}, 1000);
		return () => clearInterval(timer);
	}, [token]);

	async function loadToken() {
		try {
			const t = await workerTokenApiClient.getActiveToken();
			setToken(t);
			if (t) {
				setExpiresIn(Math.max(0, t.expiresAt - Date.now()));
			}
		} catch (err) {
			console.error('Failed to load token:', err);
		}
	}

	if (!token) return null;

	const minutes = Math.floor(expiresIn / 60000);
	const statusColor =
		token.status === 'active'
			? '#10b981'
			: token.status === 'expiring'
				? '#f59e0b'
				: '#ef4444';

	return (
		<div
			style={{
				background: '#f9fafb',
				border: '1px solid #e5e7eb',
				borderRadius: '6px',
				padding: '12px',
				fontSize: '13px',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
				<span style={{ color: '#6b7280', fontWeight: '500' }}>Status</span>
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<span
						style={{
							width: '8px',
							height: '8px',
							borderRadius: '50%',
							background: statusColor,
						}}
					></span>
					<span style={{ color: '#1f2937', fontWeight: '600' }}>
						{token.status === 'active' ? 'Active' : token.status === 'expiring' ? 'Expiring Soon' : 'Expired'}
					</span>
				</div>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
				<span style={{ color: '#6b7280', fontWeight: '500' }}>Expires</span>
				<span style={{ color: '#1f2937', fontWeight: '600' }}>{minutes} minutes</span>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
				<span style={{ color: '#6b7280', fontWeight: '500' }}>Generated</span>
				<span style={{ color: '#1f2937', fontWeight: '600' }}>
					{token.createdAt ? new Date(token.createdAt).toLocaleString() : 'Recently'}
				</span>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
				<span style={{ color: '#6b7280', fontWeight: '500' }}>Roles</span>
				<span style={{ color: '#1f2937', fontWeight: '600' }}>{token.roles?.join(', ') || 'None'}</span>
			</div>
		</div>
	);
};

export const WorkerTokenStatusDisplay: React.FC<{ variant?: 'badge' | 'banner' | 'inline' | 'all' }> = ({ variant = 'all' }) => {
	const showBadge = variant === 'badge' || variant === 'all';
	const showBanner = variant === 'banner' || variant === 'all';
	const showInline = variant === 'inline' || variant === 'all';

	return (
		<>
			{showBadge && <WorkerTokenStatusBadge />}
			{showBanner && <WorkerTokenExpiryBanner />}
			{showInline && <WorkerTokenInlineInfo />}
			<style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
		</>
	);
};
