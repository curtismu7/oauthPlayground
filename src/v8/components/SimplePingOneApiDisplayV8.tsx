/**
 * @file SimplePingOneApiDisplayV8.tsx
 * @module v8/components
 * @description Simple, educational display of PingOne API calls
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Shows only the essential information:
 * - HTTP method and URL
 * - Response status code
 * - Request body (if present)
 * - Response body (if present)
 *
 * Filters out proxy calls - only shows actual PingOne API calls
 */

import React, { useEffect, useState } from 'react';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';

const MODULE_TAG = '[📡 SIMPLE-API-DISPLAY-V8]';

interface ApiCall {
	id: string;
	method: string;
	url: string;
	body?: any;
	response?: {
		status: number;
		data?: any;
	};
	timestamp: number;
}

export const SimplePingOneApiDisplayV8: React.FC = () => {
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

	useEffect(() => {
		const updateCalls = () => {
			const allCalls = apiCallTrackerService.getApiCalls();

			// Filter to PingOne API calls (direct or via proxy)
			const pingOneCalls = allCalls
				.filter((call) => {
					const url = call.url || '';
					// Include direct PingOne calls and our proxy endpoints
					return (
						url.includes('pingone.com') ||
						url.includes('auth.pingone') ||
						url.includes('/api/pingone/')
					);
				})
				.map((call) => ({
					id: call.id,
					method: call.method,
					url: call.url,
					body: call.body,
					response: call.response,
					timestamp: call.timestamp,
				}));

			setApiCalls(pingOneCalls);

			if (pingOneCalls.length > 0) {
				console.log(`${MODULE_TAG} Displaying ${pingOneCalls.length} API calls`);
			}
		};

		// Initial load
		updateCalls();

		// Listen for updates
		const interval = setInterval(updateCalls, 500);

		return () => clearInterval(interval);
	}, []);

	if (apiCalls.length === 0) {
		return null;
	}

	return (
		<div
			style={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				maxHeight: '400px',
				background: '#1f2937', // Dark background
				borderTop: '2px solid #10b981',
				overflowY: 'auto',
				zIndex: 1000,
				fontFamily: 'monospace',
				fontSize: '13px',
			}}
		>
			<div
				style={{
					padding: '12px 16px',
					background: '#111827',
					borderBottom: '1px solid #374151',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
					📡 PingOne API Calls ({apiCalls.length})
				</div>
				<button
					onClick={() => {
						apiCallTrackerService.clearApiCalls();
						setApiCalls([]);
					}}
					style={{
						padding: '4px 12px',
						background: '#374151',
						color: '#f9fafb',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '12px',
					}}
				>
					Clear
				</button>
			</div>

			<div style={{ padding: '16px' }}>
				{apiCalls.map((call, index) => (
					<div
						key={call.id}
						style={{
							marginBottom: '16px',
							padding: '12px',
							background: '#111827',
							borderRadius: '6px',
							border: '1px solid #374151',
						}}
					>
						{/* Request Line */}
						<div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span
								style={{
									padding: '2px 8px',
									background:
										call.method === 'GET'
											? '#3b82f6'
											: call.method === 'POST'
												? '#10b981'
												: call.method === 'DELETE'
													? '#ef4444'
													: '#f59e0b',
									color: 'white',
									borderRadius: '4px',
									fontSize: '11px',
									fontWeight: 'bold',
								}}
							>
								{call.method}
							</span>
							<span
								style={{
									padding: '2px 8px',
									background: call.response?.status
										? call.response.status >= 200 && call.response.status < 300
											? '#10b981'
											: call.response.status >= 400
												? '#ef4444'
												: '#f59e0b'
										: '#6b7280',
									color: 'white',
									borderRadius: '4px',
									fontSize: '11px',
									fontWeight: 'bold',
								}}
							>
								{call.response?.status || '...'}
							</span>
						</div>

						{/* URL */}
						<div
							style={{
								color: '#60a5fa',
								marginBottom: '8px',
								wordBreak: 'break-all',
								fontSize: '12px',
							}}
						>
							{call.url.startsWith('/api/') && (
								<span
									style={{
										padding: '2px 6px',
										background: '#374151',
										color: '#9ca3af',
										borderRadius: '3px',
										fontSize: '10px',
										marginRight: '8px',
									}}
								>
									PROXY
								</span>
							)}
							{call.url}
						</div>

						{/* Request Body */}
						{call.body && Object.keys(call.body).length > 0 && (
							<div style={{ marginTop: '8px' }}>
								<div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>
									Request Body:
								</div>
								<pre
									style={{
										margin: 0,
										padding: '8px',
										background: '#0f172a',
										borderRadius: '4px',
										color: '#e5e7eb',
										fontSize: '11px',
										overflow: 'auto',
										maxHeight: '150px',
									}}
								>
									{JSON.stringify(call.body, null, 2)}
								</pre>
							</div>
						)}

						{/* Response Body */}
						{call.response?.data && (
							<div style={{ marginTop: '8px' }}>
								<div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>
									Response:
								</div>
								<pre
									style={{
										margin: 0,
										padding: '8px',
										background: '#0f172a',
										borderRadius: '4px',
										color: '#e5e7eb',
										fontSize: '11px',
										overflow: 'auto',
										maxHeight: '150px',
									}}
								>
									{JSON.stringify(call.response.data, null, 2)}
								</pre>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default SimplePingOneApiDisplayV8;
