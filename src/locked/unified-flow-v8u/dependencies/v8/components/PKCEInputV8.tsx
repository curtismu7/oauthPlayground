/**
 * @file PKCEInputV8.tsx
 * @module v8/components
 * @description PKCE (Proof Key for Code Exchange) dropdown with comprehensive education
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <PKCEInputV8
 *   value="REQUIRED"
 *   onChange={handlePKCEChange}
 *   clientType="public"
 * />
 */

import { FiAlertTriangle, FiChevronDown, FiInfo } from '@icons';
import React, { useState } from 'react';

const MODULE_TAG = '[🔐 PKCE-V8]';

export type PKCEMode = 'DISABLED' | 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED';

export interface PKCEInputV8Props {
	value: PKCEMode;
	onChange: (mode: PKCEMode) => void;
	clientType?: 'public' | 'confidential';
	flowType?: string;
	disabled?: boolean;
	className?: string;
}

interface PKCEModeOption {
	value: PKCEMode;
	label: string;
	icon: string;
	description: string;
	security: string;
	useCase: string;
	recommended?: boolean;
	deprecated?: boolean;
}

const PKCE_OPTIONS: Record<PKCEMode, PKCEModeOption> = {
	DISABLED: {
		value: 'DISABLED',
		label: 'Disabled',
		icon: '⚠️',
		description: 'PKCE is not used (insecure)',
		security: 'Low - Vulnerable to code interception',
		useCase: 'Legacy apps only (not recommended)',
		deprecated: true,
	},
	OPTIONAL: {
		value: 'OPTIONAL',
		label: 'Optional',
		icon: '🟡',
		description: 'PKCE can be used but is not required',
		security: 'Medium - Allows flows without PKCE',
		useCase: 'Legacy apps transitioning to PKCE',
	},
	REQUIRED: {
		value: 'REQUIRED',
		label: 'Required (Any Method)',
		icon: '🟢',
		description: 'PKCE is required, allows plain or S256',
		security: 'High - PKCE always used',
		useCase: 'Modern apps with PKCE support',
		recommended: true,
	},
	S256_REQUIRED: {
		value: 'S256_REQUIRED',
		label: 'Required (S256 Only)',
		icon: '🔒',
		description: 'PKCE required with S256 method only',
		security: 'Highest - Only secure S256 method',
		useCase: 'Production apps, OAuth 2.1 compliance',
	},
};

export const PKCEInputV8: React.FC<PKCEInputV8Props> = ({
	value,
	onChange,
	clientType,
	flowType,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const selectedOption = PKCE_OPTIONS[value];
	const isPublicClient = clientType === 'public';
	const shouldWarn = isPublicClient && value === 'DISABLED';

	const handleChange = (newMode: PKCEMode) => {
		console.log(`${MODULE_TAG} PKCE mode changed`, { from: value, to: newMode });
		onChange(newMode);
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
					PKCE (Proof Key for Code Exchange)
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
					onChange={(e) => handleChange(e.target.value as PKCEMode)}
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
					{Object.values(PKCE_OPTIONS).map((option) => (
						<option key={option.value} value={option.value}>
							{option.icon} {option.label}
							{option.recommended ? ' (Recommended)' : ''}
							{option.deprecated ? ' (Not Recommended)' : ''}
						</option>
					))}
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

			{/* Selected mode description */}
			<div
				style={{
					marginTop: '8px',
					padding: '8px 12px',
					background: selectedOption.deprecated
						? '#fef3c7'
						: value === 'DISABLED'
							? '#fef2f2'
							: '#f9fafb', // Yellow, red, or grey
					border: `1px solid ${selectedOption.deprecated ? '#fbbf24' : value === 'DISABLED' ? '#fecaca' : '#e5e7eb'}`,
					borderRadius: '4px',
					fontSize: '12px',
					color: selectedOption.deprecated
						? '#92400e'
						: value === 'DISABLED'
							? '#991b1b'
							: '#374151', // Dark brown, red, or dark grey
				}}
			>
				<div style={{ fontWeight: '600', marginBottom: '4px' }}>
					{selectedOption.icon} {selectedOption.description}
				</div>
				<div style={{ color: '#6b7280' }}>
					<strong>Security:</strong> {selectedOption.security}
				</div>
			</div>

			{/* Warning for public clients without PKCE */}
			{shouldWarn && (
				<div
					style={{
						marginTop: '12px',
						padding: '12px',
						background: '#fef2f2', // Light red background
						border: '1px solid #fecaca',
						borderRadius: '6px',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							gap: '8px',
						}}
					>
						<FiAlertTriangle size={16} color="#ef4444" style={{ marginTop: '2px' }} />
						<div
							style={{
								fontSize: '12px',
								color: '#991b1b', // Dark red text - high contrast
								lineHeight: '1.5',
							}}
						>
							<strong>⚠️ Security Warning:</strong> PKCE is <strong>required</strong> for public
							clients in OAuth 2.1. Without PKCE, your authorization codes can be intercepted and
							stolen by malicious apps.
						</div>
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
						📚 PKCE Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						<strong>PKCE (Proof Key for Code Exchange)</strong> is a security extension for OAuth
						2.0 that prevents authorization code interception attacks. It's{' '}
						<strong>required</strong> in OAuth 2.1 for public clients.
					</p>

					{/* How PKCE Works */}
					<div
						style={{
							padding: '12px',
							background: '#ffffff', // White background
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							marginBottom: '12px',
						}}
					>
						<div
							style={{
								fontSize: '13px',
								fontWeight: '600',
								color: '#1f2937', // Dark text
								marginBottom: '8px',
							}}
						>
							🔐 How PKCE Works
						</div>
						<ol
							style={{
								margin: 0,
								paddingLeft: '20px',
								fontSize: '12px',
								color: '#374151', // Dark text
								lineHeight: '1.6',
							}}
						>
							<li>
								<strong>Generate code_verifier:</strong> Random string (43-128 characters)
								<div
									style={{
										fontFamily: 'monospace',
										fontSize: '11px',
										color: '#6b7280',
										marginTop: '2px',
									}}
								>
									Example: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
								</div>
							</li>
							<li style={{ marginTop: '8px' }}>
								<strong>Create code_challenge:</strong> SHA256 hash of code_verifier (base64url
								encoded)
								<div
									style={{
										fontFamily: 'monospace',
										fontSize: '11px',
										color: '#6b7280',
										marginTop: '2px',
									}}
								>
									code_challenge = BASE64URL(SHA256(code_verifier))
								</div>
							</li>
							<li style={{ marginTop: '8px' }}>
								<strong>Authorization request:</strong> Send code_challenge to server
								<div
									style={{
										fontFamily: 'monospace',
										fontSize: '11px',
										color: '#6b7280',
										marginTop: '2px',
									}}
								>
									?code_challenge=E9Melhoa...&code_challenge_method=S256
								</div>
							</li>
							<li style={{ marginTop: '8px' }}>
								<strong>Token request:</strong> Send code_verifier to prove you're the same client
								<div
									style={{
										fontFamily: 'monospace',
										fontSize: '11px',
										color: '#6b7280',
										marginTop: '2px',
									}}
								>
									code_verifier=dBjftJeZ4CVP...
								</div>
							</li>
							<li style={{ marginTop: '8px' }}>
								<strong>Server verifies:</strong> Hashes code_verifier and compares to
								code_challenge
							</li>
						</ol>
					</div>

					{/* Why PKCE Matters */}
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
								fontSize: '13px',
								fontWeight: '600',
								color: '#92400e', // Dark brown text
								marginBottom: '8px',
							}}
						>
							🛡️ Why PKCE Matters
						</div>
						<div
							style={{
								fontSize: '12px',
								color: '#92400e', // Dark brown text
								lineHeight: '1.6',
							}}
						>
							<strong>Without PKCE:</strong> A malicious app can intercept your authorization code
							and exchange it for tokens.
							<br />
							<br />
							<strong>With PKCE:</strong> Even if the code is intercepted, the attacker cannot
							exchange it without the code_verifier (which never leaves your app).
						</div>
					</div>

					{/* When to Use PKCE */}
					<div
						style={{
							padding: '12px',
							background: '#ffffff', // White background
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							marginBottom: '12px',
						}}
					>
						<div
							style={{
								fontSize: '13px',
								fontWeight: '600',
								color: '#1f2937', // Dark text
								marginBottom: '8px',
							}}
						>
							✅ When to Use PKCE
						</div>
						<ul
							style={{
								margin: 0,
								paddingLeft: '20px',
								fontSize: '12px',
								color: '#374151', // Dark text
								lineHeight: '1.6',
							}}
						>
							<li>
								<strong>Public Clients (REQUIRED):</strong> SPAs, mobile apps, desktop apps, CLI
								tools
							</li>
							<li>
								<strong>Confidential Clients (RECOMMENDED):</strong> Even backend servers benefit
								from PKCE
							</li>
							<li>
								<strong>OAuth 2.1 (REQUIRED):</strong> All clients must use PKCE in OAuth 2.1
							</li>
							<li>
								<strong>Authorization Code Flow:</strong> PKCE is designed for this flow
							</li>
						</ul>
					</div>

					{/* PKCE Methods */}
					<div
						style={{
							padding: '12px',
							background: '#ffffff', // White background
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							marginBottom: '12px',
						}}
					>
						<div
							style={{
								fontSize: '13px',
								fontWeight: '600',
								color: '#1f2937', // Dark text
								marginBottom: '8px',
							}}
						>
							🔒 PKCE Methods
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							<div>
								<code
									style={{
										background: '#f3f4f6',
										padding: '2px 6px',
										borderRadius: '3px',
										fontSize: '11px',
									}}
								>
									S256
								</code>
								<span style={{ fontSize: '12px', color: '#374151', marginLeft: '8px' }}>
									<strong>(RECOMMENDED)</strong> - SHA256 hash of code_verifier. Most secure.
								</span>
							</div>
							<div>
								<code
									style={{
										background: '#f3f4f6',
										padding: '2px 6px',
										borderRadius: '3px',
										fontSize: '11px',
									}}
								>
									plain
								</code>
								<span style={{ fontSize: '12px', color: '#374151', marginLeft: '8px' }}>
									<strong>(DEPRECATED)</strong> - code_challenge = code_verifier. Less secure, only
									for legacy clients.
								</span>
							</div>
						</div>
					</div>

					{/* OAuth 2.1 Requirement */}
					<div
						style={{
							padding: '12px',
							background: '#f0fdf4', // Light green background
							border: '1px solid #86efac',
							borderRadius: '6px',
						}}
					>
						<div
							style={{
								fontSize: '12px',
								color: '#166534', // Dark green text - high contrast
								lineHeight: '1.5',
							}}
						>
							<strong>📜 OAuth 2.1 Requirement:</strong> PKCE is <strong>mandatory</strong> for all
							clients (public and confidential) in OAuth 2.1. The implicit flow is removed, and PKCE
							makes authorization code flow secure for all client types.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PKCEInputV8;
