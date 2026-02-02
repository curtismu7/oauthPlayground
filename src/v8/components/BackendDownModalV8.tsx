/**
 * @file BackendDownModalV8.tsx
 * @module v8/components
 * @description Modal shown when backend server is not running
 * @version 8.0.0
 */

import React, { useEffect, useState } from 'react';
import { backendConnectivityService } from '@/v8/services/backendConnectivityServiceV8';

export const BackendDownModalV8: React.FC = () => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Check initial state
		setIsVisible(backendConnectivityService.shouldShowModal());

		// Listen for connectivity changes
		const unsubscribe = backendConnectivityService.addListener((isConnected) => {
			setIsVisible(!isConnected);
		});

		return unsubscribe;
	}, []);

	const handleRetry = () => {
		console.log('[BACKEND-MODAL] User clicked retry - resetting connectivity state');
		backendConnectivityService.reset();
		setIsVisible(false);
		// Reload the page to retry API calls
		window.location.reload();
	};

	const handleDismiss = () => {
		console.log('[BACKEND-MODAL] User dismissed modal');
		backendConnectivityService.dismissModal();
		setIsVisible(false);
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.75)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 10000,
			}}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '12px',
					padding: '32px',
					maxWidth: '500px',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
				}}
			>
				{/* Icon */}
				<div style={{ textAlign: 'center', marginBottom: '20px' }}>
					<div
						style={{
							fontSize: '64px',
							color: '#dc2626',
						}}
					>
						🔌
					</div>
				</div>

				{/* Title */}
				<h2
					style={{
						margin: '0 0 16px 0',
						fontSize: '24px',
						fontWeight: 600,
						color: '#1f2937',
						textAlign: 'center',
					}}
				>
					Backend Server Not Running
				</h2>

				{/* Message */}
				<p
					style={{
						margin: '0 0 24px 0',
						fontSize: '16px',
						color: '#6b7280',
						lineHeight: '1.6',
						textAlign: 'center',
					}}
				>
					The backend server is not responding. Please start or restart the server to continue using
					the application.
				</p>

				{/* Instructions */}
				<div
					style={{
						background: '#f3f4f6',
						padding: '16px',
						borderRadius: '8px',
						marginBottom: '24px',
					}}
				>
					<p
						style={{
							margin: '0 0 8px 0',
							fontSize: '14px',
							fontWeight: 600,
							color: '#374151',
						}}
					>
						To start the server, run:
					</p>
					<code
						style={{
							display: 'block',
							background: '#1f2937',
							color: '#10b981',
							padding: '12px',
							borderRadius: '6px',
							fontSize: '13px',
							fontFamily: 'monospace',
							overflowX: 'auto',
						}}
					>
						(PORT=3001 node server.js &) && (PORT=3002 node server.js &)
					</code>
				</div>

				{/* Buttons */}
				<div style={{ display: 'flex', gap: '12px' }}>
					<button
						type="button"
						onClick={handleDismiss}
						style={{
							flex: 1,
							padding: '12px 24px',
							fontSize: '16px',
							fontWeight: 500,
							color: '#6b7280',
							background: 'white',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							cursor: 'pointer',
							transition: 'all 0.2s',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#f9fafb';
							e.currentTarget.style.borderColor = '#9ca3af';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'white';
							e.currentTarget.style.borderColor = '#d1d5db';
						}}
					>
						Dismiss
					</button>
					<button
						type="button"
						onClick={handleRetry}
						style={{
							flex: 1,
							padding: '12px 24px',
							fontSize: '16px',
							fontWeight: 500,
							color: 'white',
							background: '#2563eb',
							border: 'none',
							borderRadius: '8px',
							cursor: 'pointer',
							transition: 'all 0.2s',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#1d4ed8';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#2563eb';
						}}
					>
						🔄 Retry Connection
					</button>
				</div>
			</div>
		</div>
	);
};
