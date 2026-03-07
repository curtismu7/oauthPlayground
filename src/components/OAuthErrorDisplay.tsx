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
				return 'V9_COLORS.PRIMARY.RED_DARK'; // red-600
			case 'forbidden':
				return '#ea580c'; // orange-600
			case 'not_found':
				return '#ca8a04'; // yellow-600
			case 'network':
				return 'V9_COLORS.PRIMARY.BLUE_DARK'; // blue-600
			case 'server_error':
				return '#7c3aed'; // violet-600
			case 'invalid_grant':
				return 'V9_COLORS.PRIMARY.RED_DARK'; // red-600
			case 'invalid_scope':
				return '#ea580c'; // orange-600
			case 'unauthorized_client':
				return 'V9_COLORS.PRIMARY.RED_DARK'; // red-600
			case 'unsupported_grant_type':
				return 'V9_COLORS.PRIMARY.RED_DARK'; // red-600
			default:
				return 'V9_COLORS.TEXT.GRAY_MEDIUM'; // gray-500
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
				background: 'V9_COLORS.BG.ERROR',
				border: '1px solid V9_COLORS.BG.ERROR_BORDER',
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
								color: 'V9_COLORS.TEXT.GRAY_LIGHT',
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
					background: 'V9_COLORS.TEXT.WHITE',
					padding: '1rem',
					borderRadius: '0.5rem',
					border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
					fontSize: '0.875rem',
					lineHeight: 1.6,
					marginBottom: '1rem',
				}}
			>
				<div
					style={{
						whiteSpace: 'pre-line',
						color: 'V9_COLORS.TEXT.GRAY_DARK',
					}}
				>
					{errorDetails.troubleshootingSteps}
				</div>
			</div>

			{/* Recovery Actions */}
			{errorDetails.recoveryActions.length > 0 && (
				<div
					style={{
						background: 'V9_COLORS.BG.GRAY_LIGHT',
						padding: '0.75rem',
						borderRadius: '0.5rem',
						border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
						marginBottom: '1rem',
					}}
				>
					<h5
						style={{
							margin: '0 0 0.5rem 0',
							fontSize: '0.875rem',
							fontWeight: 600,
							color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
						}}
					>
						💡 Quick Actions:
					</h5>
					<ul
						style={{
							margin: 0,
							paddingLeft: '1.25rem',
							fontSize: '0.875rem',
							color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
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
							background: 'V9_COLORS.PRIMARY.GREEN_DARK',
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
							e.currentTarget.style.background = 'V9_COLORS.PRIMARY.GREEN_DARK';
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
							background: 'V9_COLORS.TEXT.GRAY_MEDIUM',
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
							e.currentTarget.style.background = 'V9_COLORS.TEXT.GRAY_MEDIUM';
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
						background: 'V9_COLORS.PRIMARY.BLUE',
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
						e.currentTarget.style.background = 'V9_COLORS.PRIMARY.BLUE_DARK';
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.background = 'V9_COLORS.PRIMARY.BLUE';
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
