/**
 * @file ClientTypeRadioV8.tsx
 * @module v8/components
 * @description Client Type radio buttons with comprehensive education
 * @version 8.0.0
 * @since 2024-11-22
 * 
 * @example
 * <ClientTypeRadioV8
 *   value={clientType}
 *   onChange={handleClientTypeChange}
 * />
 */

import React, { useState } from 'react';
import { FiInfo, FiLock, FiUnlock } from 'react-icons/fi';

const MODULE_TAG = '[🔓 CLIENT-TYPE-V8]';

export type ClientType = 'public' | 'confidential';

export interface ClientTypeRadioV8Props {
	value: ClientType;
	onChange: (type: ClientType) => void;
	disabled?: boolean;
	className?: string;
}

interface ClientTypeOption {
	value: ClientType;
	label: string;
	icon: React.ReactNode;
	shortDescription: string;
	fullDescription: string;
	canKeepSecrets: boolean;
	requiresPKCE: boolean;
	examples: string[];
	security: string;
}

const CLIENT_TYPE_OPTIONS: Record<ClientType, ClientTypeOption> = {
	public: {
		value: 'public',
		label: 'Public Client',
		icon: <FiUnlock size={18} />,
		shortDescription: 'Cannot securely store secrets',
		fullDescription: 'Public clients run in environments where the source code or binary can be inspected (browser, mobile app, desktop app). They cannot keep secrets.',
		canKeepSecrets: false,
		requiresPKCE: true,
		examples: [
			'Single Page Applications (React, Vue, Angular)',
			'Mobile apps (iOS, Android)',
			'Desktop applications (Electron)',
			'CLI tools',
		],
		security: 'Must use PKCE, no client_secret',
	},
	confidential: {
		value: 'confidential',
		label: 'Confidential Client',
		icon: <FiLock size={18} />,
		shortDescription: 'Can securely store secrets',
		fullDescription: 'Confidential clients run on secure servers where the source code cannot be accessed by end users. They can safely store and use client secrets.',
		canKeepSecrets: true,
		requiresPKCE: false,
		examples: [
			'Backend web servers (Node.js, Java, Python)',
			'Server-side applications',
			'Microservices',
			'API gateways',
		],
		security: 'Can use client_secret, PKCE recommended',
	},
};

export const ClientTypeRadioV8: React.FC<ClientTypeRadioV8Props> = ({
	value,
	onChange,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const selectedOption = CLIENT_TYPE_OPTIONS[value];

	const handleChange = (newType: ClientType) => {
		console.log(`${MODULE_TAG} Client type changed`, { from: value, to: newType });
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
					Client Type
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

			{/* Radio buttons */}
			<div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
				{Object.values(CLIENT_TYPE_OPTIONS).map((option) => {
					const isSelected = value === option.value;
					return (
						<label
							key={option.value}
							style={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								gap: '10px',
								padding: '12px',
								background: isSelected ? '#dbeafe' : '#ffffff', // Light blue or white
								border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
								borderRadius: '6px',
								cursor: disabled ? 'not-allowed' : 'pointer',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								if (!disabled && !isSelected) {
									e.currentTarget.style.background = '#f9fafb';
								}
							}}
							onMouseLeave={(e) => {
								if (!disabled && !isSelected) {
									e.currentTarget.style.background = '#ffffff';
								}
							}}
						>
							<input
								type="radio"
								name="client-type"
								value={option.value}
								checked={isSelected}
								onChange={() => handleChange(option.value)}
								disabled={disabled}
								style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
							/>
							<div style={{ color: isSelected ? '#1e40af' : '#6b7280' }}>
								{option.icon}
							</div>
							<div style={{ flex: 1 }}>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '600',
										color: '#1f2937', // Dark text
									}}
								>
									{option.label}
								</div>
								<div
									style={{
										fontSize: '11px',
										color: '#6b7280', // Muted text
										marginTop: '2px',
									}}
								>
									{option.shortDescription}
								</div>
							</div>
						</label>
					);
				})}
			</div>

			{/* Selected type description */}
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
						fontSize: '13px',
						fontWeight: '600',
						color: '#1f2937', // Dark text
						marginBottom: '8px',
					}}
				>
					{selectedOption.label}
				</div>
				<div
					style={{
						fontSize: '12px',
						color: '#374151', // Dark text
						marginBottom: '8px',
						lineHeight: '1.5',
					}}
				>
					{selectedOption.fullDescription}
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '4px',
						fontSize: '11px',
						color: '#6b7280', // Muted text
					}}
				>
					<div>
						<strong>Can keep secrets:</strong> {selectedOption.canKeepSecrets ? 'Yes ✅' : 'No ❌'}
					</div>
					<div>
						<strong>PKCE required:</strong> {selectedOption.requiresPKCE ? 'Yes (OAuth 2.1)' : 'Recommended'}
					</div>
					<div>
						<strong>Security:</strong> {selectedOption.security}
					</div>
				</div>
			</div>

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
						📚 Client Type Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						Client type determines whether your application can securely store secrets. This is one of the most fundamental decisions in OAuth 2.0 and affects all other security choices.
					</p>

					{/* Comparison */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{Object.values(CLIENT_TYPE_OPTIONS).map((option) => {
							const isSelected = value === option.value;
							return (
								<div
									key={option.value}
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
											marginBottom: '8px',
										}}
									>
										<div style={{ color: isSelected ? '#1e40af' : '#6b7280' }}>
											{option.icon}
										</div>
										<span
											style={{
												fontSize: '13px',
												fontWeight: '600',
												color: '#1f2937', // Dark text
											}}
										>
											{option.label}
										</span>
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
									</div>
									<div
										style={{
											fontSize: '12px',
											color: '#374151', // Dark text
											marginBottom: '8px',
											lineHeight: '1.5',
										}}
									>
										{option.fullDescription}
									</div>
									<div
										style={{
											fontSize: '11px',
											color: '#6b7280',
											marginBottom: '8px',
										}}
									>
										<strong>Examples:</strong>
										<ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
											{option.examples.map((example, idx) => (
												<li key={idx}>{example}</li>
											))}
										</ul>
									</div>
									<div
										style={{
											fontSize: '11px',
											color: '#6b7280',
										}}
									>
										<strong>Security:</strong> {option.security}
									</div>
								</div>
							);
						})}
					</div>

					{/* Decision Guide */}
					<div
						style={{
							marginTop: '12px',
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
								lineHeight: '1.6',
							}}
						>
							<strong>🎯 How to Choose:</strong>
							<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li><strong>Public:</strong> If your code runs in a browser, mobile app, or desktop app</li>
								<li><strong>Confidential:</strong> If your code runs on a secure server you control</li>
							</ul>
						</div>
					</div>

					{/* Key Differences */}
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
								lineHeight: '1.6',
							}}
						>
							<strong>🔑 Key Differences:</strong>
							<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li><strong>Public clients</strong> MUST use PKCE (OAuth 2.1 requirement)</li>
								<li><strong>Public clients</strong> cannot use client_secret (it would be exposed)</li>
								<li><strong>Confidential clients</strong> can use client_secret for authentication</li>
								<li><strong>Confidential clients</strong> should still use PKCE (defense in depth)</li>
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ClientTypeRadioV8;
