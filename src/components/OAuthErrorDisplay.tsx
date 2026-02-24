// src/components/OAuthErrorDisplay.tsx
// Reusable OAuth Error Display Component for consistent error presentation across all flows

import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import BootstrapButton from '../components/bootstrap/BootstrapButton';
import { OAuthErrorDetails } from '../services/oauthErrorHandlingService';
import StandardHeader from './StandardHeader';

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
			className={`oauth-error-display end-user-nano ${className}`}
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
			<StandardHeader
				title={errorDetails.message}
				description="Please check the troubleshooting steps below to resolve this issue."
				icon="mdi-alert-circle"
				variant="primary"
				isCollapsible={false}
				style={{ marginBottom: '1rem' }}
			/>

			{showCorrelationId && errorDetails.correlationId && (
				<p
					style={{
						margin: '0.25rem 0 1rem 0',
						fontSize: '0.75rem',
						color: '#9ca3af',
						fontFamily: 'monospace',
					}}
				>
					Correlation ID: {errorDetails.correlationId}
				</p>
			)}

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
			<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
				<BootstrapButton variant="primary" onClick={onDismiss} whiteBorder={true}>
					<span
						className="mdi mdi-close"
						style={{ fontSize: '16px', marginRight: '0.5rem' }}
					></span>
					Dismiss
				</BootstrapButton>

				{onRetry && (
					<BootstrapButton variant="success" onClick={onRetry} whiteBorder={true}>
						<span
							className="mdi mdi-refresh"
							style={{ fontSize: '16px', marginRight: '0.5rem' }}
						></span>
						Retry
					</BootstrapButton>
				)}

				{onClearAndRetry && (
					<BootstrapButton variant="secondary" onClick={onClearAndRetry} whiteBorder={true}>
						<span
							className="mdi mdi-refresh"
							style={{ fontSize: '16px', marginRight: '0.5rem' }}
						></span>
						Clear & Retry
					</BootstrapButton>
				)}

				{/* Documentation Link */}
				<BootstrapButton
					variant="primary"
					onClick={() =>
						window.open(
							'https://docs.pingidentity.com/bundle/pingone-for-customers/page/authentication.html',
							'_blank'
						)
					}
					whiteBorder={true}
				>
					<FiExternalLink size={16} style={{ marginRight: '0.5rem' }} />
					Documentation
				</BootstrapButton>
			</div>
		</div>
	);
};

export default OAuthErrorDisplay;
