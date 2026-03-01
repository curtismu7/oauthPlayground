/**
 * @file TokenEndpointAuthMethodDropdownV8.tsx
 * @module v8/components
 * @description Token endpoint authentication method dropdown with education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <TokenEndpointAuthMethodDropdownV8
 *   value={clientAuthMethod}
 *   onChange={handleAuthMethodChange}
 *   flowType="oauth-authz"
 *   specVersion="oauth2.0"
 *   usePKCE={true}
 * />
 */

import { FiChevronDown, FiInfo } from '@icons';
import React, { useState } from 'react';
import type { FlowType, SpecVersion } from '../services/specVersionServiceV8.ts';
import {
	type TokenEndpointAuthMethod,
	TokenEndpointAuthMethodServiceV8,
} from '../services/tokenEndpointAuthMethodServiceV8.ts';

const MODULE_TAG = '[🔐 TOKEN-AUTH-METHOD-V8]';

export interface TokenEndpointAuthMethodDropdownV8Props {
	value: TokenEndpointAuthMethod;
	onChange: (method: TokenEndpointAuthMethod) => void;
	flowType: FlowType;
	specVersion: SpecVersion;
	usePKCE?: boolean;
	disabled?: boolean;
	className?: string;
}

interface AuthMethodOption {
	value: TokenEndpointAuthMethod;
	label: string;
	icon: string;
	description: string;
	security: string;
	useCase: string;
	rfc?: string;
	recommended?: boolean;
}

const AUTH_METHOD_OPTIONS: Record<TokenEndpointAuthMethod, AuthMethodOption> = {
	none: {
		value: 'none',
		label: 'None (Public Client)',
		icon: '🌐',
		description:
			'No client authentication. Used for public clients (SPAs, mobile apps) when using PKCE.',
		security: 'Medium - Requires PKCE for security',
		useCase: 'Public clients (SPAs, mobile apps) with PKCE',
		rfc: 'RFC 6749, Section 2.3.1',
	},
	client_secret_basic: {
		value: 'client_secret_basic',
		label: 'Client Secret Basic (HTTP Basic)',
		icon: '🔐',
		description:
			'Client authenticates using HTTP Basic authentication with client_id and client_secret in the Authorization header.',
		security: 'High - Credentials in HTTP header',
		useCase: 'Traditional web apps, server-side applications',
		rfc: 'RFC 6749, Section 2.3.1',
		recommended: true,
	},
	client_secret_post: {
		value: 'client_secret_post',
		label: 'Client Secret Post (Form Body)',
		icon: '📝',
		description:
			'Client authenticates by including client_id and client_secret in the request body as form parameters.',
		security: 'High - Credentials in request body',
		useCase: 'Web apps, APIs, most common method',
		rfc: 'RFC 6749, Section 2.3.1',
		recommended: true,
	},
	client_secret_jwt: {
		value: 'client_secret_jwt',
		label: 'Client Secret JWT',
		icon: '🎫',
		description:
			'Client authenticates using a JWT signed with a symmetric key (client_secret) using HMAC-SHA256.',
		security: 'Very High - JWT signed with secret',
		useCase: 'Advanced security requirements, JWT-based auth',
		rfc: 'RFC 7523, Section 2.2',
	},
	private_key_jwt: {
		value: 'private_key_jwt',
		label: 'Private Key JWT',
		icon: '🔑',
		description:
			'Client authenticates using a JWT signed with an asymmetric private key. Most secure method.',
		security: 'Highest - Asymmetric cryptography, no shared secrets',
		useCase: 'Enterprise applications, A2A scenarios, highest security',
		rfc: 'RFC 7523, Section 2.2',
	},
};

export const TokenEndpointAuthMethodDropdownV8: React.FC<
	TokenEndpointAuthMethodDropdownV8Props
> = ({
	value,
	onChange,
	flowType,
	specVersion,
	usePKCE = false,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const _availableMethods = TokenEndpointAuthMethodServiceV8.getAuthMethods(
		flowType,
		specVersion,
		usePKCE
	);
	const allMethodsWithStatus = TokenEndpointAuthMethodServiceV8.getAllAuthMethodsWithStatus(
		flowType,
		specVersion,
		usePKCE
	);
	const selectedOption = AUTH_METHOD_OPTIONS[value];

	const handleChange = (newMethod: TokenEndpointAuthMethod) => {
		console.log(`${MODULE_TAG} Auth method changed`, {
			from: value,
			to: newMethod,
			flowType,
			specVersion,
			usePKCE,
		});
		onChange(newMethod);
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
					Token Endpoint Authentication Method
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
					onChange={(e) => handleChange(e.target.value as TokenEndpointAuthMethod)}
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
					{allMethodsWithStatus.map(({ method, label, enabled, disabledReason }) => {
						const option = AUTH_METHOD_OPTIONS[method];
						return (
							<option
								key={method}
								value={method}
								disabled={!enabled}
								style={{
									color: enabled ? 'inherit' : '#94a3b8',
									fontStyle: enabled ? 'normal' : 'italic',
								}}
								title={disabledReason}
							>
								{option.icon} {label}
								{!enabled && disabledReason ? ` - ${disabledReason}` : ''}
								{option.recommended && enabled ? ' (Recommended)' : ''}
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

			{/* Selected method description */}
			{selectedOption && (
				<div
					style={{
						marginTop: '8px',
						padding: '12px',
						background: '#f0fdf4', // Light green background
						border: '1px solid #86efac',
						borderRadius: '6px',
					}}
				>
					<div
						style={{
							fontSize: '13px',
							fontWeight: '600',
							color: '#166534', // Dark green
							marginBottom: '6px',
						}}
					>
						{selectedOption.icon} {selectedOption.description}
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
							<strong>Security:</strong> {selectedOption.security}
						</div>
						<div>
							<strong>Use Case:</strong> {selectedOption.useCase}
						</div>
						{selectedOption.rfc && (
							<div>
								<strong>RFC:</strong> {selectedOption.rfc}
							</div>
						)}
					</div>
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
						📚 Token Endpoint Authentication Method Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						Token endpoint authentication method specifies <strong>how</strong> your client
						application authenticates with the token endpoint when exchanging authorization codes
						for tokens or requesting tokens directly.
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{allMethodsWithStatus.map(({ method, label, enabled, disabledReason }) => {
							const option = AUTH_METHOD_OPTIONS[method];
							const isSelected = method === value;

							return (
								<div
									key={method}
									style={{
										padding: '12px',
										background: isSelected ? '#dbeafe' : '#ffffff', // Light blue or white
										border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
										borderRadius: '6px',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '6px',
										}}
									>
										<span style={{ fontSize: '16px' }}>{option.icon}</span>
										<span
											style={{
												fontSize: '13px',
												fontWeight: '600',
												color: '#1f2937', // Dark text
											}}
										>
											{label}
										</span>
										{option.recommended && enabled && (
											<span
												style={{
													padding: '2px 6px',
													background: '#10b981',
													color: '#ffffff', // White text on green
													borderRadius: '4px',
													fontSize: '10px',
													fontWeight: '600',
												}}
											>
												RECOMMENDED
											</span>
										)}
										{isSelected && (
											<span
												style={{
													padding: '2px 6px',
													background: '#3b82f6',
													color: '#ffffff', // White text on blue
													borderRadius: '4px',
													fontSize: '10px',
													fontWeight: '600',
												}}
											>
												SELECTED
											</span>
										)}
										{!enabled && (
											<span
												style={{
													padding: '2px 6px',
													background: '#ef4444',
													color: '#ffffff', // White text on red
													borderRadius: '4px',
													fontSize: '10px',
													fontWeight: '600',
												}}
											>
												NOT AVAILABLE
											</span>
										)}
									</div>
									<div
										style={{
											fontSize: '12px',
											color: '#374151', // Dark text
											marginBottom: '4px',
										}}
									>
										{option.description}
									</div>
									<div
										style={{
											fontSize: '11px',
											color: '#6b7280', // Muted text
											display: 'flex',
											flexDirection: 'column',
											gap: '2px',
										}}
									>
										<div>
											<strong>Security:</strong> {option.security}
										</div>
										<div>
											<strong>Use Case:</strong> {option.useCase}
										</div>
										{option.rfc && (
											<div>
												<strong>RFC:</strong> {option.rfc}
											</div>
										)}
										{!enabled && disabledReason && (
											<div style={{ color: '#ef4444', marginTop: '4px' }}>
												<strong>Why disabled:</strong> {disabledReason}
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>

					<div
						style={{
							marginTop: '12px',
							padding: '12px',
							background: '#fef3c7', // Light yellow background
							border: '1px solid #fbbf24',
							borderRadius: '6px',
						}}
					>
						<div
							style={{
								fontSize: '12px',
								color: '#92400e', // Dark brown text - high contrast
								lineHeight: '1.5',
							}}
						>
							<strong>💡 Quick Tip:</strong> Use <strong>Client Secret Post</strong> for most web
							applications, <strong>None</strong> for public clients with PKCE, or{' '}
							<strong>Private Key JWT</strong> for the highest security requirements.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TokenEndpointAuthMethodDropdownV8;
