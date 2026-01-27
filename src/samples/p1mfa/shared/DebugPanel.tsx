/**
 * @file DebugPanel.tsx
 * @module samples/p1mfa/shared
 * @description One-screen debug panel for MFA operations
 * @version 1.0.0
 */

import React, { useState } from 'react';

interface DebugPanelProps {
	request?: {
		method?: string;
		url?: string;
		headers?: Record<string, string>;
		body?: unknown;
	};
	response?: unknown;
	correlationId?: string;
	stateMachineStatus?: string;
	copyableValues?: Record<string, string>; // e.g., { deviceId: 'xxx', userId: 'yyy' }
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
	request,
	response,
	correlationId,
	stateMachineStatus,
	copyableValues = {},
}) => {
	const [copied, setCopied] = useState<Record<string, boolean>>({});

	const sanitizeBody = (body: unknown): unknown => {
		if (!body) return body;
		if (typeof body !== 'object') return body;

		const sanitized = { ...(body as Record<string, unknown>) };
		const sensitiveKeys = [
			'token',
			'secret',
			'password',
			'otp',
			'client_secret',
			'access_token',
			'refresh_token',
		];

		for (const key of sensitiveKeys) {
			if (key in sanitized) {
				sanitized[key] = '***REDACTED***';
			}
		}

		return sanitized;
	};

	const handleCopy = async (key: string, value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied((prev) => ({ ...prev, [key]: true }));
			setTimeout(() => {
				setCopied((prev) => ({ ...prev, [key]: false }));
			}, 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	return (
		<div
			style={{
				marginTop: '2rem',
				padding: '1.5rem',
				backgroundColor: '#f8f9fa',
				border: '2px solid #dee2e6',
				borderRadius: '8px',
				fontFamily: 'monospace',
				fontSize: '0.875rem',
			}}
		>
			<h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>🔍 Debug Panel</h3>

			{/* State Machine Status */}
			{stateMachineStatus && (
				<div
					style={{
						marginBottom: '1rem',
						padding: '0.75rem',
						backgroundColor: '#fff',
						borderRadius: '4px',
					}}
				>
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
					>
						<strong>State Machine Status:</strong>
						<span
							style={{
								padding: '0.25rem 0.5rem',
								backgroundColor:
									stateMachineStatus.includes('REQUIRED') || stateMachineStatus.includes('PENDING')
										? '#fff3cd'
										: stateMachineStatus.includes('COMPLETE') ||
												stateMachineStatus.includes('ACTIVE')
											? '#d4edda'
											: stateMachineStatus.includes('ERROR') ||
													stateMachineStatus.includes('FAILED')
												? '#f8d7da'
												: '#e7f3ff',
								borderRadius: '4px',
								fontWeight: 'bold',
							}}
						>
							{stateMachineStatus}
						</span>
					</div>
				</div>
			)}

			{/* Correlation ID */}
			{correlationId && (
				<div
					style={{
						marginBottom: '1rem',
						padding: '0.75rem',
						backgroundColor: '#fff',
						borderRadius: '4px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<strong>Correlation ID:</strong>
						<code
							style={{
								flex: 1,
								padding: '0.25rem 0.5rem',
								backgroundColor: '#f8f9fa',
								borderRadius: '4px',
							}}
						>
							{correlationId}
						</code>
						<button
							onClick={() => handleCopy('correlationId', correlationId)}
							style={{
								padding: '0.25rem 0.5rem',
								backgroundColor: copied.correlationId ? '#28a745' : '#007bff',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '0.75rem',
							}}
						>
							{copied.correlationId ? '✓ Copied' : 'Copy'}
						</button>
					</div>
				</div>
			)}

			{/* Copyable Values */}
			{Object.keys(copyableValues).length > 0 && (
				<div
					style={{
						marginBottom: '1rem',
						padding: '0.75rem',
						backgroundColor: '#fff',
						borderRadius: '4px',
					}}
				>
					<strong style={{ display: 'block', marginBottom: '0.5rem' }}>Quick Copy:</strong>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						{Object.entries(copyableValues).map(([key, value]) => (
							<div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<strong style={{ minWidth: '100px' }}>{key}:</strong>
								<code
									style={{
										flex: 1,
										padding: '0.25rem 0.5rem',
										backgroundColor: '#f8f9fa',
										borderRadius: '4px',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
									title={value}
								>
									{value.length > 50 ? `${value.substring(0, 50)}...` : value}
								</code>
								<button
									onClick={() => handleCopy(key, value)}
									style={{
										padding: '0.25rem 0.5rem',
										backgroundColor: copied[key] ? '#28a745' : '#007bff',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '0.75rem',
									}}
								>
									{copied[key] ? '✓' : 'Copy'}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Request */}
			{request && (
				<div style={{ marginBottom: '1rem' }}>
					<strong style={{ display: 'block', marginBottom: '0.5rem' }}>Request:</strong>
					<div
						style={{
							padding: '0.75rem',
							backgroundColor: '#fff',
							borderRadius: '4px',
							overflow: 'auto',
						}}
					>
						<div style={{ marginBottom: '0.5rem' }}>
							<strong>Method:</strong> {request.method || 'N/A'}
						</div>
						{request.url && (
							<div style={{ marginBottom: '0.5rem' }}>
								<strong>URL:</strong>{' '}
								<code
									style={{
										padding: '0.25rem 0.5rem',
										backgroundColor: '#f8f9fa',
										borderRadius: '4px',
									}}
								>
									{request.url}
								</code>
							</div>
						)}
						{request.headers && Object.keys(request.headers).length > 0 && (
							<div style={{ marginBottom: '0.5rem' }}>
								<strong>Headers:</strong>
								<pre
									style={{
										marginTop: '0.25rem',
										padding: '0.5rem',
										backgroundColor: '#f8f9fa',
										borderRadius: '4px',
										overflow: 'auto',
										fontSize: '0.75rem',
									}}
								>
									{JSON.stringify(request.headers, null, 2)}
								</pre>
							</div>
						)}
						{request.body && (
							<div>
								<strong>Body (Sanitized):</strong>
								<pre
									style={{
										marginTop: '0.25rem',
										padding: '0.5rem',
										backgroundColor: '#f8f9fa',
										borderRadius: '4px',
										overflow: 'auto',
										fontSize: '0.75rem',
										maxHeight: '300px',
									}}
								>
									{JSON.stringify(sanitizeBody(request.body), null, 2)}
								</pre>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Response */}
			{response && (
				<div>
					<strong style={{ display: 'block', marginBottom: '0.5rem' }}>Response:</strong>
					<pre
						style={{
							padding: '0.75rem',
							backgroundColor: '#fff',
							borderRadius: '4px',
							overflow: 'auto',
							fontSize: '0.75rem',
							maxHeight: '400px',
						}}
					>
						{JSON.stringify(response, null, 2)}
					</pre>
				</div>
			)}

			{!request && !response && !correlationId && !stateMachineStatus && (
				<div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
					No debug information available. Start an operation to see request/response details.
				</div>
			)}
		</div>
	);
};
