/**
 * @file TokenUIIntegrationV8.tsx
 * @module v8/components
 * @description Token UI Integration Component for MFA flows
 * @version 8.0.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { comprehensiveTokenUIService } from '@/v8/services/comprehensiveTokenUIService';

// Token UI Integration Component
export const TokenUIIntegrationV8: React.FC = () => {
	const [tokenState, setTokenState] = useState(comprehensiveTokenUIService.getTokenState());
	const [collapsibleStates, setCollapsibleStates] = useState(
		comprehensiveTokenUIService.getAllCollapsibleStates()
	);
	const [statusCardInfo, setStatusCardInfo] = useState(
		comprehensiveTokenUIService.getStatusCardInfo()
	);

	// Listen for token UI updates
	useEffect(() => {
		const handleTokenUIUpdate = (event: CustomEvent) => {
			const { type } = event.detail;

			if (type === 'token' || type === 'collapsible' || type === 'choice') {
				setTokenState(comprehensiveTokenUIService.getTokenState());
				setCollapsibleStates(comprehensiveTokenUIService.getAllCollapsibleStates());
				setStatusCardInfo(comprehensiveTokenUIService.getStatusCardInfo());
			}
		};

		window.addEventListener('tokenUIUpdate', handleTokenUIUpdate as EventListener);

		return () => {
			window.removeEventListener('tokenUIUpdate', handleTokenUIUpdate as EventListener);
		};
	}, []);

	// Token management methods (available for future use)
	// const setWorkerToken = useCallback((tokenInfo: any) => {
	//     comprehensiveTokenUIService.setWorkerToken(tokenInfo);
	// }, []);

	// const setUserToken = useCallback((tokenInfo: any) => {
	//     comprehensiveTokenUIService.setUserToken(tokenInfo);
	// }, []);

	// const clearAllTokens = useCallback(() => {
	//     comprehensiveTokenUIService.clearAllTokens();
	// }, []);

	// Collapsible UI methods
	const toggleCollapsibleStatus = useCallback((tokenType: 'worker' | 'user') => {
		comprehensiveTokenUIService.toggleCollapsibleStatus(tokenType);
	}, []);

	const expandAllStatusBoxes = useCallback(() => {
		comprehensiveTokenUIService.expandAllStatusBoxes();
	}, []);

	const collapseAllStatusBoxes = useCallback(() => {
		comprehensiveTokenUIService.collapseAllStatusBoxes();
	}, []);

	// Utility functions
	const formatTimeRemaining = (expiresAt: number): string => {
		if (!expiresAt) return 'N/A';

		const now = Date.now();
		const diff = expiresAt - now;

		if (diff <= 0) return 'Expired';

		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
		if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
		if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
		return 'Less than 1 minute';
	};

	const formatTokenId = (tokenId: string): string => {
		if (!tokenId || tokenId === 'N/A') return 'N/A';
		if (tokenId.length <= 8) return tokenId;
		return `${tokenId.substring(0, 4)}...${tokenId.substring(tokenId.length - 4)}`;
	};

	return (
		<div style={{ marginBottom: '24px' }}>
			{/* Status Card */}
			<div
				style={{
					background:
						statusCardInfo.type === 'success'
							? '#f0fdf4'
							: statusCardInfo.type === 'warning'
								? '#fffbeb'
								: statusCardInfo.type === 'error'
									? '#fef2f2'
									: '#eff6ff',
					border: `2px solid ${
						statusCardInfo.type === 'success'
							? '#bbf7d0'
							: statusCardInfo.type === 'warning'
								? '#fed7aa'
								: statusCardInfo.type === 'error'
									? '#fecaca'
									: '#dbeafe'
					}`,
					borderRadius: '12px',
					padding: '20px',
					marginBottom: '24px',
					display: 'flex',
					alignItems: 'center',
					gap: '16px',
				}}
			>
				<div style={{ fontSize: '24px' }}>
					{statusCardInfo.icon === 'check'
						? '✅'
						: statusCardInfo.icon === 'alert'
							? '⚠️'
							: statusCardInfo.icon === 'error'
								? '❌'
								: 'ℹ️'}
				</div>
				<div style={{ flex: 1 }}>
					<div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
						{statusCardInfo.title}
					</div>
					<div style={{ color: '#6b7280', fontSize: '14px' }}>{statusCardInfo.message}</div>
				</div>
				<div
					style={{
						padding: '6px 12px',
						borderRadius: '20px',
						fontSize: '12px',
						fontWeight: '600',
						textTransform: 'uppercase',
						background:
							statusCardInfo.type === 'success'
								? '#10b981'
								: statusCardInfo.type === 'warning'
									? '#f59e0b'
									: statusCardInfo.type === 'error'
										? '#ef4444'
										: '#3b82f6',
						color: 'white',
					}}
				>
					{statusCardInfo.badge}
				</div>
			</div>

			{/* Collapsible Controls */}
			<div
				style={{
					background: '#f9fafb',
					border: '1px solid #e5e7eb',
					borderRadius: '12px',
					padding: '20px',
					marginBottom: '24px',
				}}
			>
				<div
					style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}
				>
					🎛️ Collapsible Controls
				</div>
				<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
					<button
						type="button"
						onClick={expandAllStatusBoxes}
						style={{
							padding: '8px 16px',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							background: 'white',
							color: '#374151',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#f3f4f6';
							e.currentTarget.style.borderColor = '#9ca3af';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = 'white';
							e.currentTarget.style.borderColor = '#d1d5db';
						}}
						onFocus={(e) => {
							e.currentTarget.style.background = '#f3f4f6';
							e.currentTarget.style.borderColor = '#9ca3af';
						}}
						onBlur={(e) => {
							e.currentTarget.style.background = 'white';
							e.currentTarget.style.borderColor = '#d1d5db';
						}}
					>
						Expand All
					</button>
					<button
						type="button"
						onClick={collapseAllStatusBoxes}
						style={{
							padding: '8px 16px',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							background: 'white',
							color: '#374151',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#f3f4f6';
							e.currentTarget.style.borderColor = '#9ca3af';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = 'white';
							e.currentTarget.style.borderColor = '#d1d5db';
						}}
						onFocus={(e) => {
							e.currentTarget.style.background = '#f3f4f6';
							e.currentTarget.style.borderColor = '#9ca3af';
						}}
						onBlur={(e) => {
							e.currentTarget.style.background = 'white';
							e.currentTarget.style.borderColor = '#d1d5db';
						}}
					>
						Collapse All
					</button>
				</div>
			</div>

			{/* Token Sections */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
				{/* Worker Token Section */}
				<div
					style={{
						background: 'white',
						border: `2px solid ${tokenState.workerTokenValid ? '#3b82f6' : '#e5e7eb'}`,
						borderRadius: '16px',
						padding: '24px',
						boxShadow: tokenState.workerTokenValid
							? '0 0 0 4px rgba(59, 130, 246, 0.1)'
							: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
						<div
							style={{
								width: '48px',
								height: '48px',
								borderRadius: '12px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '20px',
								background: tokenState.workerTokenValid ? '#dbeafe' : '#f3f4f6',
								border: `2px solid ${tokenState.workerTokenValid ? '#3b82f6' : '#e5e7eb'}`,
							}}
						>
							🔑
						</div>
						<div>
							<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
								Worker Token
							</h3>
							<p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
								Service account token for API access and device registration
							</p>
						</div>
					</div>

					<div
						style={{
							position: 'relative',
							display: 'flex',
							alignItems: 'flex-start',
							gap: '16px',
							fontSize: '16px',
							fontWeight: '600',
							marginBottom: '20px',
							padding: '20px',
							borderRadius: '12px',
							background: tokenState.workerTokenValid ? '#f0fdf4' : '#fef2f2',
							color: tokenState.workerTokenValid ? '#16a34a' : '#dc2626',
							border: `2px solid ${tokenState.workerTokenValid ? '#bbf7d0' : '#fecaca'}`,
							minHeight: '120px',
							overflow: 'hidden',
						}}
					>
						<button
							type="button"
							onClick={() => toggleCollapsibleStatus('worker')}
							style={{
								position: 'absolute',
								top: '12px',
								right: '12px',
								background: 'rgba(255, 255, 255, 0.9)',
								border: '2px solid rgba(0, 0, 0, 0.2)',
								borderRadius: '8px',
								padding: '6px 10px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '700',
								color: 'inherit',
								zIndex: 10,
								minWidth: '32px',
								minHeight: '32px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							}}
							onMouseOver={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
								e.currentTarget.style.transform = 'scale(1.05)';
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
								e.currentTarget.style.transform = 'scale(1)';
							}}
							onFocus={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
								e.currentTarget.style.transform = 'scale(1.05)';
							}}
							onBlur={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
								e.currentTarget.style.transform = 'scale(1)';
							}}
						>
							{collapsibleStates.worker.isExpanded ? '▲' : '▼'}
						</button>

						<div
							style={{
								flex: 1,
								overflow: 'hidden',
								transition: 'max-height 0.3s ease',
								maxHeight: collapsibleStates.worker.isExpanded ? 'none' : '0',
								opacity: collapsibleStates.worker.isExpanded ? '1' : '0',
							}}
						>
							{/* Expanded content */}
							<div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
								{tokenState.workerTokenValid ? '✅ Worker Token Active' : '⚠️ No Worker Token'}
							</div>
							<div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.6' }}>
								{tokenState.hasWorkerToken ? (
									<>
										<div style={{ marginBottom: '8px' }}>
											<strong>Status:</strong> {tokenState.workerTokenInfo.status.toUpperCase()}
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Expires:</strong>{' '}
											{formatTimeRemaining(tokenState.workerTokenInfo.expiresAt)}
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Environment:</strong> {tokenState.workerTokenInfo.environment}
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Permissions:</strong> {tokenState.workerTokenInfo.permissions}
										</div>
										<div>
											<strong>Token ID:</strong> {formatTokenId(tokenState.workerTokenInfo.tokenId)}
										</div>
									</>
								) : (
									<>
										<div style={{ marginBottom: '8px' }}>
											<strong>Status:</strong> NOT AVAILABLE
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Action:</strong> Click "Get Worker Token" to generate
										</div>
										<div>
											<strong>Required:</strong> For MFA device registration
										</div>
									</>
								)}
							</div>
						</div>

						{/* Collapsed state - basic info */}
						{!collapsibleStates.worker.isExpanded && (
							<div
								style={{
									position: 'absolute',
									bottom: '12px',
									left: '20px',
									right: '60px',
									fontSize: '12px',
									color: tokenState.workerTokenValid ? '#16a34a' : '#dc2626',
									fontWeight: '500',
									opacity: 0.8,
								}}
							>
								{tokenState.hasWorkerToken ? (
									<>
										<span>{tokenState.workerTokenInfo.status.toUpperCase()}</span>
										{tokenState.workerTokenInfo.expiresAt && (
											<span style={{ marginLeft: '12px' }}>
												• {formatTimeRemaining(tokenState.workerTokenInfo.expiresAt)}
											</span>
										)}
									</>
								) : (
									<span>NO TOKEN</span>
								)}
							</div>
						)}
					</div>
				</div>

				{/* User Token Section */}
				<div
					style={{
						background: 'white',
						border: `2px solid ${tokenState.userTokenValid ? '#3b82f6' : '#e5e7eb'}`,
						borderRadius: '16px',
						padding: '24px',
						boxShadow: tokenState.userTokenValid
							? '0 0 0 4px rgba(59, 130, 246, 0.1)'
							: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
						<div
							style={{
								width: '48px',
								height: '48px',
								borderRadius: '12px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '20px',
								background: tokenState.userTokenValid ? '#dbeafe' : '#f3f4f6',
								border: `2px solid ${tokenState.userTokenValid ? '#3b82f6' : '#e5e7eb'}`,
							}}
						>
							👤
						</div>
						<div>
							<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
								User Login
							</h3>
							<p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
								User authentication token for MFA flow access
							</p>
						</div>
					</div>

					<div
						style={{
							position: 'relative',
							display: 'flex',
							alignItems: 'flex-start',
							gap: '16px',
							fontSize: '16px',
							fontWeight: '600',
							marginBottom: '20px',
							padding: '20px',
							borderRadius: '12px',
							background: tokenState.userTokenValid ? '#f0fdf4' : '#fef2f2',
							color: tokenState.userTokenValid ? '#16a34a' : '#dc2626',
							border: `2px solid ${tokenState.userTokenValid ? '#bbf7d0' : '#fecaca'}`,
							minHeight: '120px',
							overflow: 'hidden',
						}}
					>
						<button
							type="button"
							onClick={() => toggleCollapsibleStatus('user')}
							style={{
								position: 'absolute',
								top: '12px',
								right: '12px',
								background: 'rgba(255, 255, 255, 0.9)',
								border: '2px solid rgba(0, 0, 0, 0.2)',
								borderRadius: '8px',
								padding: '6px 10px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '700',
								color: 'inherit',
								zIndex: 10,
								minWidth: '32px',
								minHeight: '32px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							}}
							onMouseOver={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
								e.currentTarget.style.transform = 'scale(1.05)';
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
								e.currentTarget.style.transform = 'scale(1)';
							}}
							onFocus={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
								e.currentTarget.style.transform = 'scale(1.05)';
							}}
							onBlur={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
								e.currentTarget.style.transform = 'scale(1)';
							}}
						>
							{collapsibleStates.user.isExpanded ? '▲' : '▼'}
						</button>

						<div
							style={{
								flex: 1,
								overflow: 'hidden',
								transition: 'max-height 0.3s ease',
								maxHeight: collapsibleStates.user.isExpanded ? 'none' : '0',
								opacity: collapsibleStates.user.isExpanded ? '1' : '0',
							}}
						>
							{/* Expanded content */}
							<div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
								{tokenState.userTokenValid ? '✅ User Authenticated' : '⚠️ User Not Authenticated'}
							</div>
							<div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.6' }}>
								{tokenState.hasUserToken ? (
									<>
										<div style={{ marginBottom: '8px' }}>
											<strong>Username:</strong> {tokenState.userTokenInfo.username}
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Email:</strong> {tokenState.userTokenInfo.email}
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Status:</strong> {tokenState.userTokenInfo.status.toUpperCase()}
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Expires:</strong>{' '}
											{formatTimeRemaining(tokenState.userTokenInfo.expiresAt)}
										</div>
										<div>
											<strong>Roles:</strong> {tokenState.userTokenInfo.roles?.join(', ') || 'N/A'}
										</div>
									</>
								) : (
									<>
										<div style={{ marginBottom: '8px' }}>
											<strong>Status:</strong> NOT AUTHENTICATED
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Action:</strong> Click "User Login" to authenticate
										</div>
										<div>
											<strong>Required:</strong> For MFA user authentication
										</div>
									</>
								)}
							</div>
						</div>

						{/* Collapsed state - basic info */}
						{!collapsibleStates.user.isExpanded && (
							<div
								style={{
									position: 'absolute',
									bottom: '12px',
									left: '20px',
									right: '60px',
									fontSize: '12px',
									color: tokenState.userTokenValid ? '#16a34a' : '#dc2626',
									fontWeight: '500',
									opacity: 0.8,
								}}
							>
								{tokenState.hasUserToken ? (
									<>
										<span>{tokenState.userTokenInfo.status.toUpperCase()}</span>
										{tokenState.userTokenInfo.expiresAt && (
											<span style={{ marginLeft: '12px' }}>
												• {formatTimeRemaining(tokenState.userTokenInfo.expiresAt)}
											</span>
										)}
									</>
								) : (
									<span>NOT AUTHENTICATED</span>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TokenUIIntegrationV8;
