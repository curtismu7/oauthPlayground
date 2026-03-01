// src/components/OAuthErrorDisplay.tsx
// Reusable OAuth Error Display Component for consistent error presentation across all flows

import { FiAlertTriangle, FiExternalLink, FiRefreshCw, FiX } from '@icons';
import React from 'react';
import { OAuthErrorDetails } from '../services/oauthErrorHandlingService';

interface OAuthErrorDisplayProps {
	errorDetails: OAuthErrorDetails;
	onDismiss: () => void;
	onRetry?: () => void;
	onClearAndRetry?: () => void;
	showCorrelationId?: boolean;
	className?: string;
}

const OAuthErrorDisplay: React.FC<OAuthErrorDisplayProps> = ({
	errorDetails,
	onDismiss,
	onRetry,
	onClearAndRetry,
	showCorrelationId = false,
	className = '',
}) => {
	const getErrorIcon = (errorType: OAuthErrorDetails['errorType']) => {
		switch (errorType) {
			case 'invalid_credentials':
				return '🔑';
			case 'forbidden':
				return '🚫';
			case 'not_found':
				return '🔍';
			case 'network':
				return '🌐';
			case 'server_error':
				return '⚡';
			case 'invalid_grant':
				return '🎫';
			case 'invalid_scope':
				return '📋';
			case 'unauthorized_client':
				return '👤';
			case 'unsupported_grant_type':
				return '❌';
			default:
				return '⚠️';
		}
	};

	const getErrorColor = (errorType: OAuthErrorDetails['errorType']) => {
		switch (errorType) {
			case 'invalid_credentials':
				return '#dc2626'; // red-600
			case 'forbidden':
				return '#ea580c'; // orange-600
			case 'not_found':
				return '#ca8a04'; // yellow-600
			case 'network':
				return '#2563eb'; // blue-600
			case 'server_error':
				return '#7c3aed'; // violet-600
			case 'invalid_grant':
				return '#dc2626'; // red-600
			case 'invalid_scope':
				return '#ea580c'; // orange-600
			case 'unauthorized_client':
				return '#dc2626'; // red-600
			case 'unsupported_grant_type':
				return '#dc2626'; // red-600
			default:
				return '#6b7280'; // gray-500
		}
	};

	const errorColor = getErrorColor(errorDetails.errorType);
	const errorIcon = getErrorIcon(errorDetails.errorType);

	return (
		<div
			className={`oauth-error-display ${className}`}
			style={{
				marginTop: '1rem',
				padding: '1rem',
				background: '#fef2f2',
				border: '1px solid #fecaca',
				borderRadius: '0.75rem',
				borderLeft: `4px solid ${errorColor}`,
			}}
		>
			{/* Error Header */}
			<div
				style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}
			>
				<div
					style={{
						fontSize: '1.25rem',
						flexShrink: 0,
						marginTop: '2px',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<span>{errorIcon}</span>
					<FiAlertTriangle size={20} style={{ color: errorColor }} />
				</div>
				<div style={{ flex: 1 }}>
					<h4
						style={{
							margin: '0 0 0.5rem 0',
							fontSize: '1rem',
							fontWeight: 600,
							color: errorColor,
						}}
					>
						{errorDetails.message}
					</h4>
					<p style={{ margin: 0, fontSize: '0.875rem', color: '#7f1d1d' }}>
						Please check the troubleshooting steps below to resolve this issue.
					</p>
					{showCorrelationId && errorDetails.correlationId && (
						<p
							style={{
								margin: '0.25rem 0 0 0',
								fontSize: '0.75rem',
								color: '#9ca3af',
								fontFamily: 'monospace',
							}}
						>
							Correlation ID: {errorDetails.correlationId}
						</p>
					)}
				</div>
			</div>

			{/* Troubleshooting Steps */}
			<div
				style={{
					background: '#ffffff',
					padding: '1rem',
					borderRadius: '0.5rem',
					border: '1px solid #e5e7eb',
					fontSize: '0.875rem',
					lineHeight: 1.6,
					marginBottom: '1rem',
				}}
			>
				<div
					style={{
						whiteSpace: 'pre-line',
						color: '#374151',
					}}
				>
					{errorDetails.troubleshootingSteps}
				</div>
			</div>

			{/* Recovery Actions */}
			{errorDetails.recoveryActions.length > 0 && (
				<div
					style={{
						background: '#f8fafc',
						padding: '0.75rem',
						borderRadius: '0.5rem',
						border: '1px solid #e2e8f0',
						marginBottom: '1rem',
					}}
				>
					<h5
						style={{
							margin: '0 0 0.5rem 0',
							fontSize: '0.875rem',
							fontWeight: 600,
							color: '#475569',
						}}
					>
						💡 Quick Actions:
					</h5>
					<ul
						style={{
							margin: 0,
							paddingLeft: '1.25rem',
							fontSize: '0.875rem',
							color: '#64748b',
						}}
					>
						{errorDetails.recoveryActions.map((action, index) => (
							<li key={index} style={{ marginBottom: '0.25rem' }}>
								{action}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Action Buttons */}
			<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
				<button
					onClick={onDismiss}
					style={{
						padding: '0.5rem 1rem',
						background: errorColor,
						color: 'white',
						border: 'none',
						borderRadius: '0.375rem',
						fontSize: '0.875rem',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						transition: 'all 0.2s ease',
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.background = errorColor;
						e.currentTarget.style.opacity = '0.9';
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.background = errorColor;
						e.currentTarget.style.opacity = '1';
					}}
				>
					<FiX size={16} />
					Dismiss
				</button>

				{onRetry && (
					<button
						onClick={onRetry}
						style={{
							padding: '0.5rem 1rem',
							background: '#059669',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#047857';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = '#059669';
						}}
					>
						<FiRefreshCw size={16} />
						Retry
					</button>
				)}

				{onClearAndRetry && (
					<button
						onClick={onClearAndRetry}
						style={{
							padding: '0.5rem 1rem',
							background: '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#4b5563';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = '#6b7280';
						}}
					>
						<FiRefreshCw size={16} />
						Clear & Retry
					</button>
				)}

				{/* Documentation Link */}
				<button
					onClick={() =>
						window.open(
							'https://docs.pingidentity.com/bundle/pingone-for-customers/page/authentication.html',
							'_blank'
						)
					}
					style={{
						padding: '0.5rem 1rem',
						background: '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '0.375rem',
						fontSize: '0.875rem',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						transition: 'all 0.2s ease',
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.background = '#2563eb';
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.background = '#3b82f6';
					}}
				>
					<FiExternalLink size={16} />
					PingOne Docs
				</button>
			</div>
		</div>
	);
};

export default OAuthErrorDisplay;
