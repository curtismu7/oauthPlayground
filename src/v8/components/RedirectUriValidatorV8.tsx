/**
 * @file RedirectUriValidatorV8.tsx
 * @module v8/components
 * @description Redirect URI validation component with visual feedback and correction suggestions
 * @version 8.0.0
 * @since 2026-02-06
 *
 * Purpose: Validate redirect URIs against PingOne configuration and provide visual feedback
 * Following SWE-15 principles for reusable validation components
 */

import React, { useState } from 'react';
import { FiAlertTriangle, FiCheck, FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[🔗 REDIRECT-URI-VALIDATOR-V8]';

export interface RedirectUriValidatorV8Props {
	/** Current redirect URI value */
	currentUri: string;
	/** List of valid redirect URIs from PingOne */
	validUris: string[];
	/** Label for the redirect URI field */
	label?: string;
	/** Callback when URI is updated */
	onUriChange?: (newUri: string) => void;
	/** Whether to show the validation feedback */
	showValidation?: boolean;
	/** Custom className for styling */
	className?: string;
}

export const RedirectUriValidatorV8: React.FC<RedirectUriValidatorV8Props> = ({
	currentUri,
	validUris,
	label = 'Redirect URI',
	onUriChange,
	showValidation = true,
	className = '',
}) => {
	const [copiedUri, setCopiedUri] = useState<string | null>(null);
	const [showSuggestions, setShowSuggestions] = useState(false);

	// Check if current URI is valid
	const isValid = validUris.includes(currentUri);
	const hasValidUris = validUris.length > 0;

	// Get suggested URI (first valid one or closest match)
	const getSuggestedUri = (): string => {
		if (!hasValidUris) return '';

		// Try to find a URI with the same domain
		const currentDomain = currentUri ? new URL(currentUri).hostname : '';
		const sameDomainUri = validUris.find((uri) => {
			try {
				return new URL(uri).hostname === currentDomain;
			} catch {
				return false;
			}
		});

		return sameDomainUri || validUris[0];
	};

	const suggestedUri = getSuggestedUri();

	// Copy URI to clipboard
	const copyToClipboard = async (uri: string, type: 'current' | 'suggested') => {
		try {
			await navigator.clipboard.writeText(uri);
			setCopiedUri(uri);
			toastV8.success(`${type === 'current' ? 'Current' : 'Suggested'} URI copied to clipboard`);

			// Clear copied state after 2 seconds
			setTimeout(() => setCopiedUri(null), 2000);
		} catch (_error) {
			toastV8.error('Failed to copy URI to clipboard');
		}
	};

	// Apply suggested URI
	const applySuggestedUri = () => {
		if (suggestedUri && onUriChange) {
			onUriChange(suggestedUri);
			toastV8.success('Applied suggested redirect URI');
		}
	};

	// Validation status
	const getValidationStatus = () => {
		if (!showValidation || !currentUri) return 'none';
		if (!hasValidUris) return 'no-config';
		return isValid ? 'valid' : 'invalid';
	};

	const validationStatus = getValidationStatus();

	// Get validation styles
	const getValidationStyles = () => {
		const baseStyles = {
			position: 'relative' as const,
			borderRadius: '6px',
			transition: 'all 0.2s ease',
		};

		switch (validationStatus) {
			case 'valid':
				return {
					...baseStyles,
					border: '2px solid #10b981',
					background: '#f0fdf4',
				};
			case 'invalid':
				return {
					...baseStyles,
					border: '2px solid #ef4444',
					background: '#fef2f2',
				};
			case 'no-config':
				return {
					...baseStyles,
					border: '2px solid #f59e0b',
					background: '#fffbeb',
				};
			default:
				return {
					...baseStyles,
					border: '1px solid #d1d5db',
					background: 'white',
				};
		}
	};

	// Get status icon
	const getStatusIcon = () => {
		switch (validationStatus) {
			case 'valid':
				return <FiCheck color="#10b981" size={20} />;
			case 'invalid':
				return <FiX color="#ef4444" size={20} />;
			case 'no-config':
				return <FiAlertTriangle color="#f59e0b" size={20} />;
			default:
				return null;
		}
	};

	// Get status message
	const getStatusMessage = () => {
		switch (validationStatus) {
			case 'valid':
				return '✓ This redirect URI is registered in PingOne';
			case 'invalid':
				return '✗ This redirect URI is not registered in PingOne';
			case 'no-config':
				return '⚠️ No redirect URIs configured in PingOne';
			default:
				return '';
		}
	};

	return (
		<div className={`redirect-uri-validator ${className}`}>
			{/* Label */}
			<div style={{ marginBottom: '8px', fontWeight: '600', color: '#374151' }}>{label}</div>

			{/* Current URI Input */}
			<div style={getValidationStyles()}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
					{/* Status Icon */}
					{getStatusIcon()}

					{/* URI Input */}
					<div style={{ flex: 1 }}>
						<input
							type="text"
							value={currentUri}
							onChange={(e) => onUriChange?.(e.target.value)}
							placeholder="https://your-app.com/callback"
							style={{
								width: '100%',
								padding: '8px 12px',
								border: `1px solid ${validationStatus === 'invalid' ? '#ef4444' : '#d1d5db'}`,
								borderRadius: '4px',
								fontSize: '14px',
								fontFamily: 'monospace',
								background: 'white',
							}}
						/>
					</div>

					{/* Copy Current URI */}
					{currentUri && (
						<button
							type="button"
							onClick={() => copyToClipboard(currentUri, 'current')}
							style={{
								padding: '8px',
								background: copiedUri === currentUri ? '#10b981' : '#6b7280',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
								fontSize: '12px',
								transition: 'background 0.2s ease',
							}}
							onMouseEnter={(e) => {
								if (copiedUri !== currentUri) {
									e.currentTarget.style.background = '#4b5563';
								}
							}}
							onMouseLeave={(e) => {
								if (copiedUri !== currentUri) {
									e.currentTarget.style.background = '#6b7280';
								}
							}}
						>
							{copiedUri === currentUri ? <FiCheck size={14} /> : <FiCopy size={14} />}
							{copiedUri === currentUri ? 'Copied!' : 'Copy'}
						</button>
					)}
				</div>

				{/* Status Message */}
				{validationStatus !== 'none' && (
					<div
						style={{
							padding: '8px 12px',
							fontSize: '13px',
							color:
								validationStatus === 'valid'
									? '#065f46'
									: validationStatus === 'invalid'
										? '#991b1b'
										: '#92400e',
							borderTop: `1px solid ${
								validationStatus === 'valid'
									? '#10b981'
									: validationStatus === 'invalid'
										? '#ef4444'
										: '#f59e0b'
							}`,
						}}
					>
						{getStatusMessage()}
					</div>
				)}
			</div>

			{/* Validation Issues and Suggestions */}
			{validationStatus === 'invalid' && suggestedUri && (
				<div style={{ marginTop: '16px' }}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '8px',
						}}
					>
						<div style={{ fontWeight: '600', color: '#374151' }}>Suggested Redirect URI</div>
						<button
							type="button"
							onClick={() => setShowSuggestions(!showSuggestions)}
							style={{
								padding: '4px 8px',
								background: '#f3f4f6',
								border: '1px solid #d1d5db',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
								color: '#6b7280',
							}}
						>
							{showSuggestions ? 'Hide' : 'Show'} Options
						</button>
					</div>

					{/* Suggested URI */}
					<div
						style={{
							border: '2px solid #10b981',
							borderRadius: '6px',
							background: '#f0fdf4',
							padding: '12px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<FiCheck color="#10b981" size={20} />
							<div style={{ flex: 1 }}>
								<div
									style={{
										fontFamily: 'monospace',
										fontSize: '14px',
										color: '#065f46',
										wordBreak: 'break-all',
									}}
								>
									{suggestedUri}
								</div>
							</div>
							<div style={{ display: 'flex', gap: '8px' }}>
								<button
									type="button"
									onClick={() => copyToClipboard(suggestedUri, 'suggested')}
									style={{
										padding: '6px 10px',
										background: copiedUri === suggestedUri ? '#10b981' : '#6b7280',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										fontSize: '12px',
									}}
								>
									{copiedUri === suggestedUri ? <FiCheck size={12} /> : <FiCopy size={12} />}
									Copy
								</button>
								<button
									type="button"
									onClick={applySuggestedUri}
									style={{
										padding: '6px 10px',
										background: '#10b981',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '12px',
									}}
								>
									Apply
								</button>
							</div>
						</div>
					</div>

					{/* All Valid URIs (expandable) */}
					{showSuggestions && validUris.length > 1 && (
						<div style={{ marginTop: '12px' }}>
							<div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
								All Valid Redirect URIs ({validUris.length})
							</div>
							<div
								style={{
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									background: 'white',
									maxHeight: '200px',
									overflowY: 'auto',
								}}
							>
								{validUris.map((uri, index) => (
									<div
										key={index}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '8px 12px',
											borderBottom: index < validUris.length - 1 ? '1px solid #f3f4f6' : 'none',
											fontFamily: 'monospace',
											fontSize: '13px',
										}}
									>
										<span style={{ color: '#374151', wordBreak: 'break-all' }}>{uri}</span>
										<button
											type="button"
											onClick={() => copyToClipboard(uri, 'current')}
											style={{
												padding: '4px 8px',
												background: '#f3f4f6',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '11px',
												color: '#6b7280',
											}}
										>
											<FiCopy size={10} />
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Help Link */}
					<div style={{ marginTop: '12px' }}>
						<a
							href="https://docs.pingidentity.com/pingone/platform/v1/api/"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
								color: '#3b82f6',
								textDecoration: 'none',
								fontSize: '13px',
							}}
						>
							<FiExternalLink size={14} />
							Learn more about redirect URIs in PingOne
						</a>
					</div>
				</div>
			)}

			{/* No Configuration Warning */}
			{validationStatus === 'no-config' && (
				<div style={{ marginTop: '16px' }}>
					<div
						style={{
							border: '2px solid #f59e0b',
							borderRadius: '6px',
							background: '#fffbeb',
							padding: '12px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<FiAlertTriangle color="#f59e0b" size={20} />
							<div>
								<div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
									No Redirect URIs Configured
								</div>
								<div style={{ fontSize: '13px', color: '#78350f' }}>
									This application has no redirect URIs configured in PingOne. Please add redirect
									URIs to your PingOne application settings.
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default RedirectUriValidatorV8;
