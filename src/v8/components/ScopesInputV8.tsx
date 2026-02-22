/**
 * @file ScopesInputV8.tsx
 * @module v8/components
 * @description Scopes input with comprehensive education
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <ScopesInputV8
 *   value="openid profile email"
 *   onChange={handleScopesChange}
 *   flowType="oidc"
 * />
 */

import React, { useState } from 'react';
import { FiInfo, FiKey } from 'react-icons/fi';

const MODULE_TAG = '[🔑 SCOPES-V8]';

export interface ScopesInputV8Props {
	value: string;
	onChange: (scopes: string) => void;
	flowType?: 'oauth' | 'oidc';
	disabled?: boolean;
	className?: string;
}

interface ScopeInfo {
	scope: string;
	label: string;
	description: string;
	returns: string;
	required?: boolean;
	oidcOnly?: boolean;
}

const COMMON_SCOPES: ScopeInfo[] = [
	{
		scope: 'openid',
		label: 'openid',
		description: 'Required for OIDC - enables ID token',
		returns: 'sub (user ID) in ID token',
		required: true,
		oidcOnly: true,
	},
	{
		scope: 'profile',
		label: 'profile',
		description: 'User profile information',
		returns: 'name, family_name, given_name, picture, etc.',
		oidcOnly: true,
	},
	{
		scope: 'email',
		label: 'email',
		description: 'User email address',
		returns: 'email, email_verified',
		oidcOnly: true,
	},
	{
		scope: 'address',
		label: 'address',
		description: 'User physical address',
		returns: 'address (formatted, street, city, etc.)',
		oidcOnly: true,
	},
	{
		scope: 'phone',
		label: 'phone',
		description: 'User phone number',
		returns: 'phone_number, phone_number_verified',
		oidcOnly: true,
	},
	{
		scope: 'offline_access',
		label: 'offline_access',
		description: 'Request refresh token',
		returns: 'refresh_token (for getting new access tokens)',
		oidcOnly: false,
	},
];

export const ScopesInputV8: React.FC<ScopesInputV8Props> = ({
	value,
	onChange,
	flowType = 'oidc',
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const scopes = value.split(' ').filter((s) => s.trim());
	const hasOpenId = scopes.includes('openid');
	const isOIDC = flowType === 'oidc';

	const handleChange = (newValue: string) => {
		console.log(`${MODULE_TAG} Scopes changed`, { scopes: newValue });
		onChange(newValue);
	};

	const toggleScope = (scope: string) => {
		const currentScopes = value.split(' ').filter((s) => s.trim());
		let newScopes: string[];

		if (currentScopes.includes(scope)) {
			newScopes = currentScopes.filter((s) => s !== scope);
		} else {
			newScopes = [...currentScopes, scope];
		}

		handleChange(newScopes.join(' '));
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
					htmlFor="scopes"
				>
					Scopes
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

			{/* Text input */}
			<div style={{ position: 'relative', marginBottom: '12px' }}>
				<FiKey
					size={16}
					style={{
						position: 'absolute',
						left: '12px',
						top: '50%',
						transform: 'translateY(-50%)',
						color: '#6b7280',
						pointerEvents: 'none',
					}}
				/>
				<input
					type="text"
					value={value}
					onChange={(e) => handleChange(e.target.value)}
					disabled={disabled}
					placeholder="openid profile email"
					style={{
						width: '100%',
						padding: '10px 12px 10px 36px',
						fontSize: '14px',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						background: disabled ? '#f3f4f6' : '#ffffff', // Light grey or white
						color: '#1f2937', // Dark text
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
				/>
			</div>

			{/* Quick add buttons */}
			<div style={{ marginBottom: '12px' }}>
				<div
					style={{
						fontSize: '12px',
						fontWeight: '600',
						color: '#374151',
						marginBottom: '6px',
					}}
				>
					Quick Add:
				</div>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
					{COMMON_SCOPES.filter((s) => !s.oidcOnly || isOIDC).map((scopeInfo) => {
						const isActive = scopes.includes(scopeInfo.scope);
						return (
							<button
								key={scopeInfo.scope}
								type="button"
								onClick={() => toggleScope(scopeInfo.scope)}
								disabled={disabled}
								style={{
									padding: '6px 10px',
									fontSize: '12px',
									fontWeight: '500',
									background: isActive ? '#3b82f6' : '#ffffff',
									color: isActive ? '#ffffff' : '#374151',
									border: `1px solid ${isActive ? '#3b82f6' : '#d1d5db'}`,
									borderRadius: '6px',
									cursor: disabled ? 'not-allowed' : 'pointer',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									if (!disabled && !isActive) {
										e.currentTarget.style.background = '#f3f4f6';
									}
								}}
								onMouseLeave={(e) => {
									if (!disabled && !isActive) {
										e.currentTarget.style.background = '#ffffff';
									}
								}}
							>
								{scopeInfo.label}
								{scopeInfo.required && ' *'}
							</button>
						);
					})}
				</div>
			</div>

			{/* Warning for OIDC without openid */}
			{isOIDC && !hasOpenId && (
				<div
					style={{
						padding: '12px',
						background: '#fef3c7', // Light yellow background
						border: '1px solid #fbbf24',
						borderRadius: '6px',
						marginBottom: '12px',
					}}
				>
					<div
						style={{
							fontSize: '12px',
							color: '#92400e', // Dark brown text - high contrast
							lineHeight: '1.5',
						}}
					>
						<strong>⚠️ OIDC Requirement:</strong> The{' '}
						<code style={{ background: '#fde68a', padding: '2px 4px', borderRadius: '3px' }}>
							openid
						</code>{' '}
						scope is required for OIDC flows. Without it, you won't receive an ID token.
					</div>
				</div>
			)}

			{/* Current scopes display */}
			{scopes.length > 0 && (
				<div
					style={{
						padding: '12px',
						background: '#f9fafb', // Light grey background
						border: '1px solid #e5e7eb',
						borderRadius: '6px',
					}}
				>
					<div
						style={{
							fontSize: '12px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '6px',
						}}
					>
						Requested Scopes ({scopes.length}):
					</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
						{scopes.map((scope) => (
							<span
								key={scope}
								style={{
									padding: '4px 8px',
									background: '#dbeafe',
									color: '#1e40af',
									borderRadius: '4px',
									fontSize: '11px',
									fontWeight: '500',
								}}
							>
								{scope}
							</span>
						))}
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
						📚 Scopes Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						<strong>Scopes</strong> define what permissions your application is requesting. They
						determine what user data you can access and what operations you can perform.
					</p>

					{/* Common Scopes */}
					<div
						style={{
							fontSize: '13px',
							fontWeight: '600',
							color: '#1f2937',
							marginBottom: '8px',
						}}
					>
						🔑 Common Scopes
					</div>
					<div
						style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}
					>
						{COMMON_SCOPES.map((scopeInfo) => (
							<div
								key={scopeInfo.scope}
								style={{
									padding: '10px',
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
								}}
							>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}
								>
									<code
										style={{
											background: '#f3f4f6',
											padding: '2px 6px',
											borderRadius: '3px',
											fontSize: '12px',
											fontWeight: '600',
										}}
									>
										{scopeInfo.scope}
									</code>
									{scopeInfo.required && (
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
											REQUIRED
										</span>
									)}
									{scopeInfo.oidcOnly && (
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
											OIDC
										</span>
									)}
								</div>
								<div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
									{scopeInfo.description}
								</div>
								<div style={{ fontSize: '11px', color: '#6b7280' }}>
									<strong>Returns:</strong> {scopeInfo.returns}
								</div>
							</div>
						))}
					</div>

					{/* OAuth vs OIDC */}
					<div
						style={{
							padding: '12px',
							background: '#f0fdf4', // Light green background
							border: '1px solid #86efac',
							borderRadius: '6px',
							marginBottom: '12px',
						}}
					>
						<div
							style={{
								fontSize: '12px',
								color: '#166534', // Dark green text - high contrast
								lineHeight: '1.6',
							}}
						>
							<strong>🎯 OAuth 2.0 vs OIDC Scopes:</strong>
							<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li>
									<strong>OAuth 2.0:</strong> Custom scopes for API access (e.g., read:users,
									write:posts)
								</li>
								<li>
									<strong>OIDC:</strong> Standard scopes for user identity (openid, profile, email,
									etc.)
								</li>
								<li>
									<strong>openid scope:</strong> Required for OIDC - triggers ID token issuance
								</li>
							</ul>
						</div>
					</div>

					{/* Best Practices */}
					<div
						style={{
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
								lineHeight: '1.6',
							}}
						>
							<strong>💡 Best Practices:</strong>
							<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li>
									<strong>Request minimum:</strong> Only request scopes you actually need
								</li>
								<li>
									<strong>User consent:</strong> Users see and approve requested scopes
								</li>
								<li>
									<strong>Space-separated:</strong> Multiple scopes separated by spaces
								</li>
								<li>
									<strong>Case-sensitive:</strong> Scope names are case-sensitive
								</li>
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ScopesInputV8;
