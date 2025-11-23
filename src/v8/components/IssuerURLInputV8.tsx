/**
 * @file IssuerURLInputV8.tsx
 * @module v8/components
 * @description Issuer URL input with education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <IssuerURLInputV8
 *   value={issuerUrl}
 *   onChange={handleIssuerURLChange}
 *   environmentId={environmentId}
 * />
 */

import React, { useState } from 'react';
import { FiInfo } from 'react-icons/fi';

const MODULE_TAG = '[🌐 ISSUER-URL-V8]';

export interface IssuerURLInputV8Props {
	value: string;
	onChange: (url: string) => void;
	environmentId?: string;
	disabled?: boolean;
	className?: string;
	placeholder?: string;
}

export const IssuerURLInputV8: React.FC<IssuerURLInputV8Props> = ({
	value,
	onChange,
	environmentId,
	disabled = false,
	className = '',
	placeholder = 'https://auth.example.com',
}) => {
	const [showInfo, setShowInfo] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newUrl = e.target.value;
		console.log(`${MODULE_TAG} Issuer URL changed`, { from: value, to: newUrl });
		onChange(newUrl);
	};

	// Generate example issuer URL from environment ID if available
	const exampleIssuerUrl = environmentId
		? `https://auth.pingone.com/${environmentId}/as`
		: 'https://auth.pingone.com/{environment-id}/as';

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
					Issuer URL <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(optional)</span>
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

			{/* Input */}
			<input
				type="text"
				value={value}
				onChange={handleChange}
				disabled={disabled}
				placeholder={placeholder}
				aria-label="Issuer URL"
				style={{
					width: '100%',
					padding: '10px 12px',
					fontSize: '14px',
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					background: disabled ? '#f3f4f6' : '#ffffff', // Light grey or white
					color: '#1f2937', // Dark text
					cursor: disabled ? 'not-allowed' : 'text',
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
							What is an Issuer URL?
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
						The <strong>Issuer URL</strong> (also called the <strong>Issuer Identifier</strong>) is the
						base URL of your OIDC/OAuth 2.0 provider. It uniquely identifies your authorization server
						and is used for:
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{/* OIDC Discovery */}
						<div
							style={{
								padding: '12px',
								background: '#ffffff',
								border: '1px solid #93c5fd',
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
								<span style={{ fontSize: '16px' }}>🔍</span>
								<span
									style={{
										fontSize: '13px',
										fontWeight: '600',
										color: '#1e40af', // Dark blue text
									}}
								>
									OIDC Discovery
								</span>
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#374151', // Dark text
									marginBottom: '8px',
								}}
							>
								Used to automatically discover OIDC endpoints (authorization, token, userinfo, etc.)
								via the <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>.well-known/openid-configuration</code> endpoint.
							</div>
							<div
								style={{
									padding: '8px',
									background: '#f3f4f6',
									borderRadius: '4px',
									marginBottom: '8px',
									fontFamily: 'monospace',
									fontSize: '11px',
									color: '#1f2937',
									wordBreak: 'break-all',
								}}
							>
								{exampleIssuerUrl}/.well-known/openid-configuration
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
								<span>Automatically discovers all OIDC endpoints</span>
							</div>
						</div>

						{/* Token Validation */}
						<div
							style={{
								padding: '12px',
								background: '#ffffff',
								border: '1px solid #93c5fd',
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
								<span style={{ fontSize: '16px' }}>🔐</span>
								<span
									style={{
										fontSize: '13px',
										fontWeight: '600',
										color: '#1e40af', // Dark blue text
									}}
								>
									Token Validation
								</span>
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#374151', // Dark text
									marginBottom: '8px',
								}}
							>
								Used to validate ID tokens by checking the <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>iss</code> (issuer) claim matches the issuer URL.
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
								<span>🔒</span>
								<span>Ensures tokens were issued by the correct provider</span>
							</div>
						</div>

						{/* PingOne Format */}
						<div
							style={{
								padding: '12px',
								background: '#ffffff',
								border: '1px solid #93c5fd',
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
								<span style={{ fontSize: '16px' }}>🌐</span>
								<span
									style={{
										fontSize: '13px',
										fontWeight: '600',
										color: '#1e40af', // Dark blue text
									}}
								>
									PingOne Format
								</span>
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#374151', // Dark text
									marginBottom: '8px',
								}}
							>
								For PingOne, the issuer URL follows this format:
							</div>
							<div
								style={{
									padding: '8px',
									background: '#f3f4f6',
									borderRadius: '4px',
									marginBottom: '8px',
									fontFamily: 'monospace',
									fontSize: '11px',
									color: '#1f2937',
									wordBreak: 'break-all',
								}}
							>
								{exampleIssuerUrl}
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
								<span>💡</span>
								<span>
									If you provide an Environment ID, the issuer URL can be auto-generated
								</span>
							</div>
						</div>
					</div>

					{/* Optional Note */}
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
							<strong>💡 Note:</strong> The issuer URL is <strong>optional</strong>. If not provided,
							the application will use the Environment ID to construct the issuer URL automatically.
							However, providing it explicitly can be useful for:
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
							<li>Custom OIDC providers (non-PingOne)</li>
							<li>Testing with different issuer URLs</li>
							<li>Explicit configuration for clarity</li>
						</ul>
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
							{value
								? `Current issuer URL: ${value}`
								: environmentId
									? `Will use: ${exampleIssuerUrl} (from Environment ID)`
									: 'Enter issuer URL or use Environment ID to auto-generate'}
						</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default IssuerURLInputV8;

