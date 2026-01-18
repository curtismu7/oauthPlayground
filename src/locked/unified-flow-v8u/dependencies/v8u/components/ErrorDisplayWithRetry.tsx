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
import { OAuthErrorCodesServiceV8 } from '../../v8/services/oauthErrorCodesServiceV8.ts';

const _MODULE_TAG = '[❌ ERROR-DISPLAY-V8U]';

/**
 * Formats error message with proper paragraphs, bullet points, and highlighted URIs
 */
const FormattedErrorMessage: React.FC<{ error: string }> = ({ error }) => {
	// Split by double newlines to create paragraphs
	const paragraphs = error.split(/\n\n+/).filter((p) => p.trim());

	return (
		<div
			style={{
				fontSize: '14px',
				lineHeight: '1.7',
				color: '#991b1b',
			}}
		>
			{paragraphs.map((paragraph, idx) => {
				const trimmed = paragraph.trim();
				if (!trimmed) return null;

				// Check if this is a heading (starts with emoji and bold text)
				const isHeading = /^[📋💡⚠️🔧📝📚🔍]/u.test(trimmed);
				
				// Check if this is a bullet list item
				const isBulletItem = /^[•\-*]\s/.test(trimmed);
				
				// Check if this is a numbered list item
				const isNumberedItem = /^\d+\.\s/.test(trimmed);

				// For numbered items, extract the number and remove it from the text
				// For bullet items, extract the bullet and remove it from the text
				let displayText = trimmed;
				let numberPrefix = '';
				let bulletPrefix = '';
				if (isNumberedItem) {
					const numberMatch = trimmed.match(/^(\d+\.\s)(.+)$/);
					if (numberMatch) {
						numberPrefix = numberMatch[1];
						displayText = numberMatch[2];
					}
				} else if (isBulletItem) {
					const bulletMatch = trimmed.match(/^([•\-*]\s)(.+)$/);
					if (bulletMatch) {
						bulletPrefix = bulletMatch[1];
						displayText = bulletMatch[2];
					}
				}

				// Extract URLs from the paragraph
				const urlRegex = /(https?:\/\/[^\s]+)/g;
				const parts: Array<{ text: string; isUrl: boolean }> = [];
				let lastIndex = 0;
				let match: RegExpExecArray | null;

				while ((match = urlRegex.exec(displayText)) !== null) {
					if (match.index > lastIndex) {
						parts.push({ text: displayText.substring(lastIndex, match.index), isUrl: false });
					}
					parts.push({ text: match[0], isUrl: true });
					lastIndex = match.index + match[0].length;
				}
				if (lastIndex < displayText.length) {
					parts.push({ text: displayText.substring(lastIndex), isUrl: false });
				}

				// If no URLs found, use the whole paragraph
				if (parts.length === 0) {
					parts.push({ text: displayText, isUrl: false });
				}

				return (
					<div
						key={idx}
						style={{
							marginBottom: isHeading ? '12px' : isBulletItem || isNumberedItem ? '4px' : '8px',
							marginTop: isHeading && idx > 0 ? '16px' : '0',
							paddingLeft: isBulletItem || isNumberedItem ? '0' : '0',
						}}
					>
						{isHeading ? (
							<div
								style={{
									fontWeight: '700',
									fontSize: '15px',
									marginBottom: '6px',
									color: '#7f1d1d',
								}}
							>
								{parts.map((part, partIdx) =>
									part.isUrl ? (
										<a
											key={partIdx}
											href={part.text}
											target="_blank"
											rel="noopener noreferrer"
											style={{
												color: '#2563eb',
												textDecoration: 'underline',
												fontWeight: '600',
											}}
										>
											{part.text}
										</a>
									) : (
										<span key={partIdx}>{part.text}</span>
									)
								)}
							</div>
						) : isBulletItem || isNumberedItem ? (
							<div
								style={{
									display: 'flex',
									gap: '8px',
									marginLeft: isBulletItem ? '16px' : '0',
								}}
							>
								<span style={{ flexShrink: 0, fontWeight: '600' }}>
									{isBulletItem ? bulletPrefix : isNumberedItem ? numberPrefix : ''}
								</span>
								<div style={{ flex: 1 }}>
									{parts.map((part, partIdx) =>
										part.isUrl ? (
											<a
												key={partIdx}
												href={part.text}
												target="_blank"
												rel="noopener noreferrer"
												style={{
													color: '#2563eb',
													textDecoration: 'underline',
													fontWeight: '500',
												}}
											>
												{part.text}
											</a>
										) : (
											<span key={partIdx}>{part.text}</span>
										)
									)}
								</div>
							</div>
						) : (
							<div>
								{parts.map((part, partIdx) =>
									part.isUrl ? (
										<a
											key={partIdx}
											href={part.text}
											target="_blank"
											rel="noopener noreferrer"
											style={{
												color: '#2563eb',
												textDecoration: 'underline',
												fontWeight: '500',
											}}
										>
											{part.text}
										</a>
									) : (
										<span key={partIdx}>{part.text}</span>
									)
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

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
							marginBottom: '8px',
						}}
					>
						Error
					</div>
					<FormattedErrorMessage error={error} />
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
