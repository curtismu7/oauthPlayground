/**
 * @file PKCEEnforcementDropdownV8.tsx
 * @module v8/components
 * @description PKCE enforcement dropdown with education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <PKCEEnforcementDropdownV8
 *   value={pkceEnforcement}
 *   onChange={handlePKCEEnforcementChange}
 * />
 */

import { FiChevronDown, FiInfo } from '@icons';
import React, { useState } from 'react';

const MODULE_TAG = '[🔐 PKCE-ENFORCEMENT-V8]';

export type PKCEEnforcement = 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED';

export interface PKCEEnforcementDropdownV8Props {
	value: PKCEEnforcement;
	onChange: (enforcement: PKCEEnforcement) => void;
	disabled?: boolean;
	className?: string;
}

interface PKCEEnforcementOption {
	value: PKCEEnforcement;
	label: string;
	icon: string;
	description: string;
	security: string;
	useCase: string;
	recommended?: boolean;
}

const PKCE_ENFORCEMENT_OPTIONS: Record<PKCEEnforcement, PKCEEnforcementOption> = {
	OPTIONAL: {
		value: 'OPTIONAL',
		label: 'OPTIONAL - PKCE is optional (can proceed without codes)',
		icon: '🔓',
		description: 'PKCE codes are optional. Your application can proceed with or without PKCE.',
		security: 'Lower - No PKCE protection required',
		useCase: 'Legacy applications, testing, or when PKCE is not supported',
	},
	REQUIRED: {
		value: 'REQUIRED',
		label: 'REQUIRED - PKCE must be used (allows S256 or plain)',
		icon: '🔐',
		description:
			'PKCE codes are required. Your application must use PKCE, but can use either S256 (SHA-256) or plain code challenge method.',
		security: 'High - PKCE protection required',
		useCase: 'Production applications, OAuth 2.1 compliance, public clients',
		recommended: true,
	},
	S256_REQUIRED: {
		value: 'S256_REQUIRED',
		label: 'S256_REQUIRED - PKCE required with S256 only (most secure)',
		icon: '🔒',
		description:
			'PKCE codes are required and must use S256 (SHA-256) code challenge method. Plain method is not allowed.',
		security: 'Highest - PKCE with S256 only (most secure)',
		useCase: 'High-security applications, OAuth 2.1 best practices, enterprise deployments',
		recommended: true,
	},
};

export const PKCEEnforcementDropdownV8: React.FC<PKCEEnforcementDropdownV8Props> = ({
	value,
	onChange,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const selectedOption = PKCE_ENFORCEMENT_OPTIONS[value];

	const handleChange = (newEnforcement: PKCEEnforcement) => {
		console.log(`${MODULE_TAG} PKCE enforcement changed`, { from: value, to: newEnforcement });
		onChange(newEnforcement);
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
					🔐 PKCE Enforcement
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
					onChange={(e) => handleChange(e.target.value as PKCEEnforcement)}
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
					{Object.values(PKCE_ENFORCEMENT_OPTIONS).map((option) => (
						<option key={option.value} value={option.value}>
							{option.icon} {option.label}
							{option.recommended ? ' (Recommended)' : ''}
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

			{/* Selected enforcement description */}
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
					{/* Main Title Section */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							marginBottom: '12px',
							padding: '12px',
							background: '#dbeafe',
							borderRadius: '6px',
						}}
					>
						<span style={{ fontSize: '18px' }}>📚</span>
						<h4
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: '#1e40af', // Dark blue text - high contrast
								margin: 0,
								flex: 1,
							}}
						>
							What is PKCE Enforcement?
						</h4>
					</div>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '16px',
							lineHeight: '1.5',
						}}
					>
						PKCE (Proof Key for Code Exchange) enforcement controls <strong>whether</strong> and{' '}
						<strong>how</strong> your application must use PKCE to protect authorization code flows:
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{Object.values(PKCE_ENFORCEMENT_OPTIONS).map((option) => {
							const isSelected = option.value === value;

							return (
								<div
									key={option.value}
									style={{
										padding: '12px',
										background: isSelected ? '#dbeafe' : '#ffffff', // Light blue or white
										border: `1px solid ${isSelected ? '#3b82f6' : '#93c5fd'}`,
										borderRadius: '6px',
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
										<span style={{ fontSize: '16px' }}>{option.icon}</span>
										<span
											style={{
												fontSize: '13px',
												fontWeight: '600',
												color: '#1e40af', // Dark blue text
											}}
										>
											{option.label.split(' - ')[0]}
										</span>
										{option.recommended && (
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
													marginLeft: 'auto',
												}}
											>
												SELECTED
											</span>
										)}
									</div>
									<div
										style={{
											fontSize: '12px',
											color: '#374151', // Dark text
											marginBottom: '8px',
										}}
									>
										{option.description}
									</div>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
										<div
											style={{
												fontSize: '11px',
												color: '#1e40af',
												display: 'flex',
												alignItems: 'center',
												gap: '6px',
											}}
										>
											<span>🔒</span>
											<span>
												<strong>Security:</strong> {option.security}
											</span>
										</div>
										<div
											style={{
												fontSize: '11px',
												color: '#1e40af',
												display: 'flex',
												alignItems: 'center',
												gap: '6px',
											}}
										>
											<span>✅</span>
											<span>
												<strong>Use Case:</strong> {option.useCase}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* PKCE Explanation */}
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
								marginBottom: '8px',
							}}
						>
							<strong>🔐 What is PKCE?</strong>
						</div>
						<div
							style={{
								fontSize: '11px',
								color: '#92400e',
								lineHeight: '1.5',
							}}
						>
							PKCE (RFC 7636) is a security extension for OAuth 2.0 that protects authorization
							codes from interception attacks. It works by:
						</div>
						<ul
							style={{
								margin: '8px 0 0 0',
								paddingLeft: '20px',
								fontSize: '11px',
								color: '#92400e',
								lineHeight: '1.5',
							}}
						>
							<li>
								<strong>Code Verifier:</strong> A random secret generated by your app
							</li>
							<li>
								<strong>Code Challenge:</strong> A derived value (S256 hash or plain) sent in the
								authorization request
							</li>
							<li>
								<strong>Code Verifier Exchange:</strong> The original verifier is sent when
								exchanging the code for tokens
							</li>
						</ul>
						<div
							style={{
								marginTop: '8px',
								fontSize: '11px',
								color: '#92400e',
								lineHeight: '1.5',
							}}
						>
							This ensures only the app that initiated the flow can exchange the authorization code.
						</div>
					</div>

					{/* Bottom Summary Bar */}
					<div
						style={{
							marginTop: '12px',
							padding: '10px 12px',
							background: '#dbeafe',
							borderRadius: '6px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span style={{ fontSize: '16px' }}>💡</span>
						<span
							style={{
								fontSize: '12px',
								color: '#1e40af',
								fontWeight: '500',
							}}
						>
							Current setting: {selectedOption.label.split(' - ')[0]} - {selectedOption.description}
						</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default PKCEEnforcementDropdownV8;
