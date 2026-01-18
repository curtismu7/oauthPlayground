/**
 * @file StatusDisplay.tsx
 * @module samples/p1mfa/shared
 * @description Display current operation status, API requests/responses, and errors
 * @version 1.0.0
 */

import React from 'react';

interface StatusDisplayProps {
	status: 'idle' | 'loading' | 'success' | 'error';
	message?: string;
	request?: unknown;
	response?: unknown;
	error?: Error | unknown;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
	status,
	message,
	request,
	response,
	error,
}) => {
	const getStatusColor = () => {
		switch (status) {
			case 'loading':
				return '#ffc107';
			case 'success':
				return '#28a745';
			case 'error':
				return '#dc3545';
			default:
				return '#6c757d';
		}
	};

	const getStatusText = () => {
		switch (status) {
			case 'loading':
				return '⏳ Processing...';
			case 'success':
				return '✅ Success';
			case 'error':
				return '❌ Error';
			default:
				return '⏸️ Idle';
		}
	};

	return (
		<div
			style={{
				marginTop: '2rem',
				padding: '1rem',
				border: `2px solid ${getStatusColor()}`,
				borderRadius: '8px',
				backgroundColor: '#f8f9fa',
			}}
		>
			<div style={{ marginBottom: '1rem' }}>
				<strong style={{ color: getStatusColor() }}>{getStatusText()}</strong>
				{message && <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>{message}</p>}
			</div>

			{error && (
				<div
					style={{
						marginTop: '1rem',
						padding: '0.75rem',
						backgroundColor: '#f8d7da',
						border: '1px solid #f5c6cb',
						borderRadius: '4px',
						color: '#721c24',
					}}
				>
					<strong>Error:</strong>{' '}
					{error instanceof Error ? error.message : String(error)}
				</div>
			)}

			{request && (
				<div style={{ marginTop: '1rem' }}>
					<strong>Request:</strong>
					<pre
						style={{
							marginTop: '0.5rem',
							padding: '0.75rem',
							backgroundColor: '#fff',
							border: '1px solid #ddd',
							borderRadius: '4px',
							overflow: 'auto',
							fontSize: '0.875rem',
						}}
					>
						{JSON.stringify(request, null, 2)}
					</pre>
				</div>
			)}

			{response && (
				<div style={{ marginTop: '1rem' }}>
					<strong>Response:</strong>
					<pre
						style={{
							marginTop: '0.5rem',
							padding: '0.75rem',
							backgroundColor: '#fff',
							border: '1px solid #ddd',
							borderRadius: '4px',
							overflow: 'auto',
							fontSize: '0.875rem',
						}}
					>
						{JSON.stringify(response, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
};
