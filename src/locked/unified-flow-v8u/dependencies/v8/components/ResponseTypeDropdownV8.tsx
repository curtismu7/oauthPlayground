/**
 * @file ResponseTypeDropdownV8.tsx
 * @module v8/components
 * @description Response type dropdown with comprehensive education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <ResponseTypeDropdownV8
 *   value={responseType}
 *   onChange={handleResponseTypeChange}
 *   flowType="oauth-authz"
 *   specVersion="oauth2.0"
 * />
 */

import React, { useState } from 'react';
import { FiChevronDown, FiInfo } from 'react-icons/fi';

const MODULE_TAG = '[🎯 RESPONSE-TYPE-V8]';

export interface ResponseTypeDropdownV8Props {
	value: string;
	onChange: (type: string) => void;
	flowType: 'oauth-authz' | 'implicit' | 'hybrid';
	specVersion: 'oauth2.0' | 'oauth2.1' | 'oidc';
	disabled?: boolean;
	className?: string;
}

interface ResponseTypeOption {
	value: string;
	label: string;
	icon: string;
	shortDescription: string;
	fullDescription: string;
	returns: string[];
	security: string;
	useCase: string;
	specSupport: {
		oauth20: boolean;
		oauth21: boolean;
		oidc: boolean;
	};
	recommended?: boolean;
	deprecated?: boolean;
}

const RESPONSE_TYPE_OPTIONS: Record<string, ResponseTypeOption> = {
	// Authorization Code Flow
	code: {
		value: 'code',
		label: 'code',
		icon: '🔐',
		shortDescription: 'Authorization code only',
		fullDescription:
			'Returns an authorization code that must be exchanged for tokens at the token endpoint. Most secure option.',
		returns: ['authorization_code'],
		security: 'Most Secure - Code is single-use and short-lived',
		useCase: 'Web apps, mobile apps, SPAs with backend',
		specSupport: { oauth20: true, oauth21: true, oidc: true },
		recommended: true,
	},

	// Implicit Flow (OAuth 2.0)
	token: {
		value: 'token',
		label: 'token',
		icon: '⚡',
		shortDescription: 'Access token directly (OAuth 2.0)',
		fullDescription:
			'Returns access token directly in URL fragment. No token endpoint call needed. OAuth 2.0 only.',
		returns: ['access_token', 'token_type', 'expires_in'],
		security: 'Less Secure - Token exposed in URL',
		useCase: 'Legacy SPAs (deprecated in OAuth 2.1)',
		specSupport: { oauth20: true, oauth21: false, oidc: false },
		deprecated: true,
	},

	// Implicit Flow (OIDC)
	id_token: {
		value: 'id_token',
		label: 'id_token',
		icon: '🪪',
		shortDescription: 'ID token only (OIDC)',
		fullDescription:
			'Returns ID token directly in URL fragment. Used for authentication only, not API access.',
		returns: ['id_token'],
		security: 'Medium - ID token exposed in URL',
		useCase: 'Authentication-only flows (no API access)',
		specSupport: { oauth20: false, oauth21: false, oidc: true },
	},

	'id_token token': {
		value: 'id_token token',
		label: 'id_token token',
		icon: '🪪⚡',
		shortDescription: 'ID token + access token (OIDC Implicit)',
		fullDescription: 'Returns both ID token and access token in URL fragment. OIDC Implicit Flow.',
		returns: ['id_token', 'access_token', 'token_type', 'expires_in'],
		security: 'Less Secure - Tokens exposed in URL',
		useCase: 'Legacy OIDC SPAs (deprecated)',
		specSupport: { oauth20: false, oauth21: false, oidc: true },
		deprecated: true,
	},

	// Hybrid Flow (OIDC)
	'code id_token': {
		value: 'code id_token',
		label: 'code id_token',
		icon: '🔐🪪',
		shortDescription: 'Code + ID token (OIDC Hybrid)',
		fullDescription:
			'Returns authorization code and ID token. Code is exchanged for access token at token endpoint.',
		returns: ['authorization_code', 'id_token'],
		security: 'High - Code must be exchanged, ID token for immediate auth',
		useCase: 'Web apps needing immediate user info',
		specSupport: { oauth20: false, oauth21: false, oidc: true },
	},

	'code token': {
		value: 'code token',
		label: 'code token',
		icon: '🔐⚡',
		shortDescription: 'Code + access token (OIDC Hybrid)',
		fullDescription:
			'Returns authorization code and access token. Code can be exchanged for refresh token.',
		returns: ['authorization_code', 'access_token', 'token_type', 'expires_in'],
		security: 'Medium - Access token exposed, but code for refresh',
		useCase: 'Immediate API access + refresh capability',
		specSupport: { oauth20: false, oauth21: false, oidc: true },
	},

	'code id_token token': {
		value: 'code id_token token',
		label: 'code id_token token',
		icon: '🔐🪪⚡',
		shortDescription: 'Code + ID token + access token (OIDC Hybrid)',
		fullDescription:
			'Returns authorization code, ID token, and access token. Maximum flexibility but complex.',
		returns: ['authorization_code', 'id_token', 'access_token', 'token_type', 'expires_in'],
		security: 'Medium - Tokens exposed, but code for refresh',
		useCase: 'Complex scenarios needing all tokens immediately',
		specSupport: { oauth20: false, oauth21: false, oidc: true },
	},
};

/**
 * Get available response types for a flow type and spec version
 */
const getAvailableTypes = (flowType: string, specVersion: string): string[] => {
	const allTypes = Object.values(RESPONSE_TYPE_OPTIONS);

	return allTypes
		.filter((option) => {
			// Filter by spec version support
			if (specVersion === 'oauth2.0' && !option.specSupport.oauth20) return false;
			if (specVersion === 'oauth2.1' && !option.specSupport.oauth21) return false;
			if (specVersion === 'oidc' && !option.specSupport.oidc) return false;

			// Filter by flow type
			if (flowType === 'oauth-authz') {
				return option.value === 'code';
			} else if (flowType === 'implicit') {
				return ['token', 'id_token', 'id_token token'].includes(option.value);
			} else if (flowType === 'hybrid') {
				return ['code id_token', 'code token', 'code id_token token'].includes(option.value);
			}

			return true;
		})
		.map((option) => option.value);
};

export const ResponseTypeDropdownV8: React.FC<ResponseTypeDropdownV8Props> = ({
	value,
	onChange,
	flowType,
	specVersion,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const availableTypes = getAvailableTypes(flowType, specVersion);
	const selectedOption = RESPONSE_TYPE_OPTIONS[value];

	const handleChange = (newType: string) => {
		console.log(`${MODULE_TAG} Response type changed`, {
			from: value,
			to: newType,
			flowType,
			specVersion,
		});
		onChange(newType);
	};

	return (
		<div className={className}>
			{/* Label with info button */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: '8px',
				}}
			>
				<label
					style={{
						fontSize: '14px',
						fontWeight: '600',
						color: '#1f2937', // Dark text on light background
					}}
				>
					Response Type
				</label>
				<button
					type="button"
					onClick={() => setShowInfo(!showInfo)}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						padding: '4px 8px',
						background: '#eff6ff', // Light blue background
						border: '1px solid #93c5fd',
						borderRadius: '4px',
						fontSize: '12px',
						color: '#1e40af', // Dark blue text - high contrast
						cursor: 'pointer',
						transition: 'all 0.2s ease',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#dbeafe';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = '#eff6ff';
					}}
				>
					<FiInfo size={14} />
					{showInfo ? 'Hide Info' : 'What is this?'}
				</button>
			</div>

			{/* Dropdown */}
			<div style={{ position: 'relative' }}>
				<select
					value={value}
					onChange={(e) => handleChange(e.target.value)}
					disabled={disabled}
					style={{
						width: '100%',
						padding: '10px 36px 10px 12px',
						fontSize: '14px',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						background: disabled ? '#f3f4f6' : '#ffffff', // Light grey or white
						color: '#1f2937', // Dark text
						cursor: disabled ? 'not-allowed' : 'pointer',
						appearance: 'none',
						outline: 'none',
					}}
					onFocus={(e) => {
						if (!disabled) {
							e.currentTarget.style.borderColor = '#3b82f6';
							e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
						}
					}}
					onBlur={(e) => {
						e.currentTarget.style.borderColor = '#d1d5db';
						e.currentTarget.style.boxShadow = 'none';
					}}
				>
					{availableTypes.map((type) => {
						const option = RESPONSE_TYPE_OPTIONS[type];
						return (
							<option key={type} value={type}>
								{option.icon} {option.label}
								{option.recommended ? ' (Recommended)' : ''}
								{option.deprecated ? ' (Deprecated)' : ''}
							</option>
						);
					})}
				</select>
				<FiChevronDown
					size={16}
					style={{
						position: 'absolute',
						right: '12px',
						top: '50%',
						transform: 'translateY(-50%)',
						pointerEvents: 'none',
						color: '#6b7280',
					}}
				/>
			</div>

			{/* Selected type description */}
			{selectedOption && (
				<div
					style={{
						marginTop: '8px',
						padding: '12px',
						background: selectedOption.deprecated ? '#fef3c7' : '#f0fdf4', // Yellow or green
						border: `1px solid ${selectedOption.deprecated ? '#fbbf24' : '#86efac'}`,
						borderRadius: '6px',
					}}
				>
					<div
						style={{
							fontSize: '13px',
							fontWeight: '600',
							color: selectedOption.deprecated ? '#92400e' : '#166534', // Dark brown or green
							marginBottom: '6px',
						}}
					>
						{selectedOption.icon} {selectedOption.shortDescription}
					</div>
					<div
						style={{
							fontSize: '12px',
							color: selectedOption.deprecated ? '#92400e' : '#166534',
							marginBottom: '8px',
						}}
					>
						{selectedOption.fullDescription}
					</div>
					<div
						style={{
							fontSize: '11px',
							color: '#6b7280',
							display: 'flex',
							flexDirection: 'column',
							gap: '4px',
						}}
					>
						<div>
							<strong>Returns:</strong> {selectedOption.returns.join(', ')}
						</div>
						<div>
							<strong>Security:</strong> {selectedOption.security}
						</div>
						<div>
							<strong>Use Case:</strong> {selectedOption.useCase}
						</div>
					</div>
					{selectedOption.deprecated && (
						<div
							style={{
								marginTop: '8px',
								padding: '8px',
								background: '#fecaca',
								border: '1px solid #ef4444',
								borderRadius: '4px',
								fontSize: '11px',
								color: '#991b1b',
								fontWeight: '600',
							}}
						>
							⚠️ DEPRECATED: This response type is deprecated in OAuth 2.1. Use Authorization Code
							Flow with PKCE instead.
						</div>
					)}
				</div>
			)}

			{/* Educational info panel */}
			{showInfo && (
				<div
					style={{
						marginTop: '12px',
						padding: '16px',
						background: '#eff6ff', // Light blue background
						border: '1px solid #93c5fd',
						borderRadius: '6px',
					}}
				>
					<h4
						style={{
							fontSize: '14px',
							fontWeight: '600',
							color: '#1e40af', // Dark blue text - high contrast
							marginBottom: '12px',
						}}
					>
						📚 Response Type Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						The{' '}
						<code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '3px' }}>
							response_type
						</code>{' '}
						parameter determines <strong>what the authorization server returns</strong> from the
						authorization endpoint. This is one of the most critical OAuth/OIDC parameters.
					</p>

					{/* Flow Type Explanation */}
					<div
						style={{
							padding: '12px',
							background: '#ffffff',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							marginBottom: '12px',
						}}
					>
						<div
							style={{
								fontSize: '13px',
								fontWeight: '600',
								color: '#1f2937',
								marginBottom: '8px',
							}}
						>
							🎯 Current Flow:{' '}
							{flowType === 'oauth-authz'
								? 'Authorization Code'
								: flowType === 'implicit'
									? 'Implicit'
									: 'Hybrid'}{' '}
							({specVersion.toUpperCase()})
						</div>
						<div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
							{flowType === 'oauth-authz' && (
								<>
									<strong>Authorization Code Flow</strong> - Most secure. Returns only a code that
									must be exchanged for tokens at the token endpoint. Recommended for all
									application types.
								</>
							)}
							{flowType === 'implicit' && (
								<>
									<strong>Implicit Flow</strong> - Returns tokens directly in URL fragment.
									Deprecated in OAuth 2.1 due to security concerns. Use Authorization Code Flow with
									PKCE instead.
								</>
							)}
							{flowType === 'hybrid' && (
								<>
									<strong>Hybrid Flow</strong> - OIDC only. Returns some tokens immediately and a
									code for additional tokens. Useful when you need immediate user info but also want
									refresh tokens.
								</>
							)}
						</div>
					</div>

					{/* Available Response Types */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{availableTypes.map((type) => {
							const option = RESPONSE_TYPE_OPTIONS[type];
							const isSelected = type === value;

							return (
								<div
									key={type}
									style={{
										padding: '12px',
										background: isSelected ? '#dbeafe' : '#ffffff',
										border: `2px solid ${isSelected ? '#3b82f6' : option.deprecated ? '#fbbf24' : '#e5e7eb'}`,
										borderRadius: '6px',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '6px',
											flexWrap: 'wrap',
										}}
									>
										<span style={{ fontSize: '16px' }}>{option.icon}</span>
										<code
											style={{
												fontSize: '13px',
												fontWeight: '600',
												color: '#1f2937',
												background: '#f3f4f6',
												padding: '2px 8px',
												borderRadius: '4px',
											}}
										>
											{option.label}
										</code>
										{option.recommended && (
											<span
												style={{
													padding: '2px 6px',
													background: '#10b981',
													color: '#ffffff',
													borderRadius: '4px',
													fontSize: '10px',
													fontWeight: '600',
												}}
											>
												RECOMMENDED
											</span>
										)}
										{option.deprecated && (
											<span
												style={{
													padding: '2px 6px',
													background: '#ef4444',
													color: '#ffffff',
													borderRadius: '4px',
													fontSize: '10px',
													fontWeight: '600',
												}}
											>
												DEPRECATED
											</span>
										)}
										{isSelected && (
											<span
												style={{
													padding: '2px 6px',
													background: '#3b82f6',
													color: '#ffffff',
													borderRadius: '4px',
													fontSize: '10px',
													fontWeight: '600',
												}}
											>
												SELECTED
											</span>
										)}
									</div>
									<div
										style={{
											fontSize: '12px',
											color: '#374151',
											marginBottom: '6px',
										}}
									>
										{option.fullDescription}
									</div>
									<div
										style={{
											fontSize: '11px',
											color: '#6b7280',
											display: 'flex',
											flexDirection: 'column',
											gap: '3px',
										}}
									>
										<div>
											<strong>Returns:</strong> {option.returns.join(', ')}
										</div>
										<div>
											<strong>Security:</strong> {option.security}
										</div>
										<div>
											<strong>Use Case:</strong> {option.useCase}
										</div>
										<div>
											<strong>Spec Support:</strong> {option.specSupport.oauth20 && 'OAuth 2.0 '}
											{option.specSupport.oauth21 && 'OAuth 2.1 '}
											{option.specSupport.oidc && 'OIDC'}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Key Concepts */}
					<div
						style={{
							marginTop: '12px',
							padding: '12px',
							background: '#f0fdf4',
							border: '1px solid #86efac',
							borderRadius: '6px',
						}}
					>
						<div
							style={{
								fontSize: '12px',
								color: '#166534',
								lineHeight: '1.6',
							}}
						>
							<strong>💡 Key Concepts:</strong>
							<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li>
									<strong>code</strong> = Authorization code (must be exchanged)
								</li>
								<li>
									<strong>token</strong> = Access token (for API calls)
								</li>
								<li>
									<strong>id_token</strong> = ID token (user identity, OIDC only)
								</li>
								<li>Multiple values = Hybrid flow (OIDC only)</li>
							</ul>
						</div>
					</div>

					{/* Security Warning */}
					<div
						style={{
							marginTop: '12px',
							padding: '12px',
							background: '#fef3c7',
							border: '1px solid #fbbf24',
							borderRadius: '6px',
						}}
					>
						<div
							style={{
								fontSize: '12px',
								color: '#92400e',
								lineHeight: '1.5',
							}}
						>
							<strong>🔐 Security Best Practice:</strong> Always use{' '}
							<code style={{ background: '#fde68a', padding: '2px 4px', borderRadius: '3px' }}>
								code
							</code>{' '}
							(Authorization Code Flow) with PKCE for maximum security. Implicit Flow (
							<code style={{ background: '#fde68a', padding: '2px 4px', borderRadius: '3px' }}>
								token
							</code>
							) is deprecated in OAuth 2.1.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ResponseTypeDropdownV8;
