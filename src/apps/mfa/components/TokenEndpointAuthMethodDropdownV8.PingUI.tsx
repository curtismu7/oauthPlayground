/**
 * @file TokenEndpointAuthMethodDropdownV8.PingUI.tsx
 * @module v8/components
 * @description Ping UI migration of Token endpoint authentication method dropdown with education for V8 flows
 * @version 8.0.0-PingUI
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React, { useState } from 'react';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import {
	type TokenEndpointAuthMethod,
	TokenEndpointAuthMethodServiceV8,
} from '@/v8/services/tokenEndpointAuthMethodServiceV8';

const MODULE_TAG = '[🔐 TOKEN-AUTH-METHOD-V8-PINGUI]';

// MDI Icon Mapping for React Icons → MDI CSS
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiChevronDown: 'mdi-chevron-down',
		FiInfo: 'mdi-information',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
			role="img"
		></span>
	);
};

export interface TokenEndpointAuthMethodDropdownV8PingUIProps {
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

export const TokenEndpointAuthMethodDropdownV8PingUI: React.FC<
	TokenEndpointAuthMethodDropdownV8PingUIProps
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

	// PING UI MIGRATION: Added .end-user-nano wrapper as required by pingui2.md
	return (
		<div className="end-user-nano">
			<div className={className}>
				{/* Label with info button */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
					}}
				>
					<label
						style={{
							fontSize: '14px',
							fontWeight: '600',
							color: 'var(--ping-text-color, #1a1a1a)',
						}}
						htmlFor="tokenendpointauthenticationmethod"
					>
						Token Endpoint Authentication Method
					</label>
					<button
						type="button"
						onClick={() => setShowInfo(!showInfo)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-xs, 0.25rem)',
							padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
							background: 'var(--ping-hover-color, #f1f3f4)',
							border: `1px solid var(--ping-primary-color, #0066cc)`,
							borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
							fontSize: '12px',
							color: 'var(--ping-primary-color, #0066cc)',
							cursor: 'pointer',
							transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'var(--ping-active-color, #e3e6ea)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'var(--ping-hover-color, #f1f3f4)';
						}}
						aria-label={
							showInfo
								? 'Hide authentication method information'
								: 'Show authentication method information'
						}
					>
						{/* PING UI MIGRATION: Replaced FiInfo with MDI icon */}
						<MDIIcon icon="FiInfo" size={14} ariaLabel="Information" />
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
							padding:
								'var(--ping-spacing-sm, 0.5rem) 36px var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-sm, 0.5rem)',
							fontSize: '14px',
							border: `1px solid var(--ping-border-color, #dee2e6)`,
							borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
							background: disabled
								? 'var(--ping-hover-color, #f1f3f4)'
								: 'var(--ping-secondary-color, #f8f9fa)',
							color: 'var(--ping-text-color, #1a1a1a)',
							cursor: disabled ? 'not-allowed' : 'pointer',
							appearance: 'none',
							outline: 'none',
							transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
						}}
						onFocus={(e) => {
							if (!disabled) {
								e.currentTarget.style.borderColor = 'var(--ping-primary-color, #0066cc)';
								e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 102, 204, 0.1)';
							}
						}}
						onBlur={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-border-color, #dee2e6)';
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
										color: enabled ? 'inherit' : 'var(--ping-border-color, #dee2e6)',
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
					{/* PING UI MIGRATION: Replaced FiChevronDown with MDI icon */}
					<MDIIcon
						icon="FiChevronDown"
						size={16}
						style={{
							position: 'absolute',
							right: 'var(--ping-spacing-sm, 0.5rem)',
							top: '50%',
							transform: 'translateY(-50%)',
							pointerEvents: 'none',
							color: 'var(--ping-text-color, #1a1a1a)',
						}}
						ariaHidden={true}
					/>
				</div>

				{/* Selected method description */}
				{selectedOption && (
					<div
						style={{
							marginTop: 'var(--ping-spacing-sm, 0.5rem)',
							padding: 'var(--ping-spacing-sm, 0.5rem)',
							background: 'rgba(40, 167, 69, 0.1)',
							border: `1px solid var(--ping-success-color, #28a745)`,
							borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
						}}
					>
						<div
							style={{
								fontSize: '13px',
								fontWeight: '600',
								color: 'var(--ping-success-color, #28a745)',
								marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
							}}
						>
							{selectedOption.icon} {selectedOption.description}
						</div>
						<div
							style={{
								fontSize: '11px',
								color: 'var(--ping-text-color, #1a1a1a)',
								display: 'flex',
								flexDirection: 'column',
								gap: 'var(--ping-spacing-xs, 0.25rem)',
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
							marginTop: 'var(--ping-spacing-sm, 0.5rem)',
							padding: 'var(--ping-spacing-md, 1rem)',
							background: 'var(--ping-hover-color, #f1f3f4)',
							border: `1px solid var(--ping-primary-color, #0066cc)`,
							borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
						}}
					>
						<h4
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: 'var(--ping-primary-color, #0066cc)',
								marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							📚 Token Endpoint Authentication Method Guide
						</h4>
						<p
							style={{
								fontSize: '13px',
								color: 'var(--ping-text-color, #1a1a1a)',
								marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
								lineHeight: '1.5',
							}}
						>
							Token endpoint authentication method specifies <strong>how</strong> your client
							application authenticates with the token endpoint when exchanging authorization codes
							for tokens or requesting tokens directly.
						</p>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							{allMethodsWithStatus.map(({ method, label, enabled, disabledReason }) => {
								const option = AUTH_METHOD_OPTIONS[method];
								const isSelected = method === value;

								return (
									<div
										key={method}
										style={{
											padding: 'var(--ping-spacing-sm, 0.5rem)',
											background: isSelected
												? 'var(--ping-hover-color, #f1f3f4)'
												: 'var(--ping-secondary-color, #f8f9fa)',
											border: `2px solid ${isSelected ? 'var(--ping-primary-color, #0066cc)' : 'var(--ping-border-color, #dee2e6)'}`,
											borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
											transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 'var(--ping-spacing-sm, 0.5rem)',
												marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
											}}
										>
											<span style={{ fontSize: '16px' }}>{option.icon}</span>
											<span
												style={{
													fontSize: '13px',
													fontWeight: '600',
													color: 'var(--ping-text-color, #1a1a1a)',
												}}
											>
												{label}
											</span>
											{option.recommended && enabled && (
												<span
													style={{
														padding:
															'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
														background: 'var(--ping-success-color, #28a745)',
														color: 'white',
														borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
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
														padding:
															'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
														background: 'var(--ping-primary-color, #0066cc)',
														color: 'white',
														borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
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
														padding:
															'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
														background: 'var(--ping-error-color, #dc3545)',
														color: 'white',
														borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
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
												color: 'var(--ping-text-color, #1a1a1a)',
												marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
											}}
										>
											{option.description}
										</div>
										<div
											style={{
												fontSize: '11px',
												color: 'var(--ping-text-color, #1a1a1a)',
												display: 'flex',
												flexDirection: 'column',
												gap: 'var(--ping-spacing-xs, 0.25rem)',
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
												<div
													style={{
														color: 'var(--ping-error-color, #dc3545)',
														marginTop: 'var(--ping-spacing-xs, 0.25rem)',
													}}
												>
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
								marginTop: 'var(--ping-spacing-sm, 0.5rem)',
								padding: 'var(--ping-spacing-sm, 0.5rem)',
								background: 'rgba(255, 193, 7, 0.1)',
								border: `1px solid var(--ping-warning-color, #ffc107)`,
								borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
							}}
						>
							<div
								style={{
									fontSize: '12px',
									color: 'var(--ping-text-color, #1a1a1a)',
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
		</div>
	);
};

export default TokenEndpointAuthMethodDropdownV8PingUI;
