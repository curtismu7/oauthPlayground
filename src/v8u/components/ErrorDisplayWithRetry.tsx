/**
 * @file ErrorDisplayWithRetry.tsx
 * @module v8u/components
 * @description Enhanced error display with retry functionality and OAuth error code references
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Error display with OAuth error code detection
 * - Retry button for failed operations
 * - Error code reference links
 * - Suggested fixes from OAuth error codes service
 */

import React, { useState } from 'react';
import { FiAlertCircle, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { OAuthErrorCodesServiceV8 } from '@/v8/services/oauthErrorCodesServiceV8';

const _MODULE_TAG = '[❌ ERROR-DISPLAY-V8U]';

export interface ErrorDisplayWithRetryProps {
	error: string;
	onRetry?: () => void;
	isLoading?: boolean;
	className?: string;
}

export const ErrorDisplayWithRetry: React.FC<ErrorDisplayWithRetryProps> = ({
	error,
	onRetry,
	isLoading = false,
	className = '',
}) => {
	const [showDetails, setShowDetails] = useState(false);

	// Extract OAuth error code from error message
	const errorCode = OAuthErrorCodesServiceV8.extractErrorCode(error);
	const errorInfo = errorCode ? OAuthErrorCodesServiceV8.getErrorInfo(errorCode) : null;

	// Determine if this is a retryable error
	const isRetryable =
		errorCode && ['server_error', 'temporarily_unavailable', 'slow_down'].includes(errorCode);

	return (
		<div
			className={className}
			style={{
				marginTop: '12px',
				padding: '16px',
				background: '#fee2e2',
				borderRadius: '8px',
				border: '1px solid #dc2626',
				color: '#991b1b',
			}}
		>
			{/* Error Header */}
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-start',
					gap: '12px',
					marginBottom: errorInfo ? '12px' : '0',
				}}
			>
				<FiAlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
				<div style={{ flex: 1 }}>
					<div
						style={{
							fontSize: '15px',
							fontWeight: '600',
							marginBottom: '4px',
						}}
					>
						Error
					</div>
					<div
						style={{
							fontSize: '14px',
							lineHeight: '1.5',
						}}
					>
						{error}
					</div>
				</div>
			</div>

			{/* OAuth Error Code Info */}
			{errorInfo && (
				<div
					style={{
						marginTop: '12px',
						padding: '12px',
						background: 'rgba(220, 38, 38, 0.1)',
						borderRadius: '6px',
						border: '1px solid rgba(220, 38, 38, 0.2)',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							marginBottom: '8px',
						}}
					>
						<strong style={{ fontSize: '13px' }}>OAuth Error Code:</strong>
						<code
							style={{
								padding: '2px 8px',
								background: 'rgba(220, 38, 38, 0.2)',
								borderRadius: '4px',
								fontSize: '12px',
								fontFamily: 'monospace',
							}}
						>
							{errorInfo.code}
						</code>
						<a
							href={errorInfo.specReference}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: '#dc2626',
								textDecoration: 'underline',
								fontSize: '12px',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
							}}
							title="View specification reference"
						>
							Spec
							<FiExternalLink size={12} />
						</a>
					</div>

					<div
						style={{
							fontSize: '13px',
							marginBottom: '8px',
							lineHeight: '1.5',
						}}
					>
						{errorInfo.description}
					</div>

					{/* Suggested Fixes */}
					{errorInfo.suggestedFixes.length > 0 && (
						<div style={{ marginTop: '10px' }}>
							<button
								type="button"
								onClick={() => setShowDetails(!showDetails)}
								style={{
									background: 'transparent',
									border: 'none',
									color: '#991b1b',
									fontSize: '12px',
									fontWeight: '600',
									cursor: 'pointer',
									padding: '4px 0',
									textDecoration: 'underline',
								}}
							>
								{showDetails ? 'Hide' : 'Show'} Suggested Fixes ({errorInfo.suggestedFixes.length})
							</button>

							{showDetails && (
								<ul
									style={{
										margin: '8px 0 0 0',
										paddingLeft: '20px',
										fontSize: '12px',
										lineHeight: '1.6',
									}}
								>
									{errorInfo.suggestedFixes.map((fix, index) => (
										<li key={index} style={{ marginBottom: '6px' }}>
											{fix}
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</div>
			)}

			{/* Retry Button */}
			{onRetry && (
				<div
					style={{
						marginTop: '12px',
						display: 'flex',
						gap: '8px',
						alignItems: 'center',
					}}
				>
					<button
						type="button"
						onClick={onRetry}
						disabled={isLoading}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							padding: '8px 16px',
							background: isLoading ? '#9ca3af' : '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '13px',
							fontWeight: '500',
							cursor: isLoading ? 'not-allowed' : 'pointer',
							transition: 'background 0.2s ease',
						}}
						onMouseEnter={(e) => {
							if (!isLoading) {
								e.currentTarget.style.background = '#b91c1c';
							}
						}}
						onMouseLeave={(e) => {
							if (!isLoading) {
								e.currentTarget.style.background = '#dc2626';
							}
						}}
					>
						<FiRefreshCw
							size={14}
							style={{
								animation: isLoading ? 'spin 1s linear infinite' : 'none',
							}}
						/>
						{isLoading ? 'Retrying...' : isRetryable ? 'Retry' : 'Try Again'}
					</button>
					{isRetryable && (
						<span style={{ fontSize: '12px', color: '#7f1d1d' }}>
							This error may be temporary. Retrying is recommended.
						</span>
					)}
				</div>
			)}

			<style>{`
				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
};

export default ErrorDisplayWithRetry;
