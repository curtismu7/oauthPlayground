/**
 * @file ResponseModeDropdownV8.tsx
 * @module v8/components
 * @description Response mode dropdown with education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <ResponseModeDropdownV8
 *   value={responseMode}
 *   onChange={handleResponseModeChange}
 *   flowType="oauth-authz"
 *   responseType="code"
 * />
 */

import React, { useState } from 'react';
import { FiChevronDown, FiInfo } from '@icons';
import type { ResponseMode } from '../../services/responseModeService.ts';

const MODULE_TAG = '[🔗 RESPONSE-MODE-V8]';

export interface ResponseModeDropdownV8Props {
	value: ResponseMode;
	onChange: (mode: ResponseMode) => void;
	flowType: 'oauth-authz' | 'implicit' | 'hybrid';
	responseType?: string;
	disabled?: boolean;
	className?: string;
}

interface ResponseModeOption {
	value: ResponseMode;
	label: string;
	icon: string;
	description: string;
	useCase: string;
	recommended?: boolean;
}

const RESPONSE_MODE_OPTIONS: Record<ResponseMode, ResponseModeOption> = {
	query: {
		value: 'query',
		label: 'Query String',
		icon: '🔗',
		description: 'Code/tokens in URL query string (?code=abc)',
		useCase: 'Traditional web apps with server-side handling',
	},
	fragment: {
		value: 'fragment',
		label: 'URL Fragment',
		icon: '🧩',
		description: 'Code/tokens in URL fragment (#access_token=xyz)',
		useCase: 'SPAs and client-side apps',
	},
	form_post: {
		value: 'form_post',
		label: 'Form POST',
		icon: '📝',
		description: 'Code/tokens via HTTP POST (not in URL)',
		useCase: 'Secure transmission without URL exposure',
	},
	'pi.flow': {
		value: 'pi.flow',
		label: 'Redirectless (PingOne)',
		icon: '⚡',
		description: 'PingOne pi.flow - no redirect, returns flow object via POST',
		useCase:
			'For companies who want to control the UI themselves. Perfect for embedded auth, mobile apps, and headless flows where you need full control over the authentication user experience.',
	},
};

/**
 * Get available response modes for a flow type
 */
const getAvailableModes = (flowType: string): ResponseMode[] => {
	switch (flowType) {
		case 'oauth-authz':
			return ['query', 'fragment', 'form_post', 'pi.flow'];
		case 'implicit':
			return ['fragment', 'form_post'];
		case 'hybrid':
			return ['fragment', 'query', 'form_post'];
		default:
			return ['query', 'fragment', 'form_post', 'pi.flow'];
	}
};

/**
 * Get recommended response mode for a flow type
 */
const getRecommendedMode = (flowType: string): ResponseMode => {
	switch (flowType) {
		case 'oauth-authz':
			return 'query';
		case 'implicit':
			return 'fragment';
		case 'hybrid':
			return 'fragment';
		default:
			return 'query';
	}
};

export const ResponseModeDropdownV8: React.FC<ResponseModeDropdownV8Props> = ({
	value,
	onChange,
	flowType,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const availableModes = getAvailableModes(flowType);
	const recommendedMode = getRecommendedMode(flowType);
	const selectedOption = RESPONSE_MODE_OPTIONS[value];

	const handleChange = (newMode: ResponseMode) => {
		console.log(`${MODULE_TAG} Response mode changed`, { from: value, to: newMode, flowType });
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
					Response Mode
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
					onChange={(e) => handleChange(e.target.value as ResponseMode)}
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
					{availableModes.map((mode) => {
						const option = RESPONSE_MODE_OPTIONS[mode];
						const isRecommended = mode === recommendedMode;
						return (
							<option key={mode} value={mode}>
								{option.icon} {option.label}
								{isRecommended ? ' (Recommended)' : ''}
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

			{/* Selected mode description */}
			<div
				style={{
					marginTop: '8px',
					padding: '8px 12px',
					background: '#f9fafb', // Light grey background
					border: '1px solid #e5e7eb',
					borderRadius: '4px',
					fontSize: '12px',
					color: '#374151', // Dark text on light background
				}}
			>
				<div style={{ fontWeight: '600', marginBottom: '4px' }}>
					{selectedOption.icon} {selectedOption.description}
				</div>
				<div style={{ color: '#6b7280' }}>Best for: {selectedOption.useCase}</div>
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
							How does PingOne return the response?
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
						OAuth uses the <strong>response_mode</strong> parameter to control how PingOne returns
						authorization data to your application:
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{availableModes.map((mode) => {
							const option = RESPONSE_MODE_OPTIONS[mode];
							const isSelected = mode === value;

							// Get example and usage info based on mode
							let example: string | null = null;
							let usageInfo: Array<{ icon: string; text: string }> = [];

							if (mode === 'query') {
								example = 'https://app.com/callback?code=abc123&state=xyz';
								usageInfo = [{ icon: '✅', text: 'Used by: Authorization Code Flow (default)' }];
							} else if (mode === 'fragment') {
								example = 'https://app.com/callback#access_token=xyz&token_type=Bearer';
								usageInfo = [
									{ icon: '✅', text: 'Used by: Implicit Flow (required), Hybrid Flow (default)' },
									{ icon: '🔒', text: 'More secure - fragment never sent to server' },
								];
							} else if (mode === 'form_post') {
								example = 'POST /callback HTTP/1.1\ncode=abc123&state=xyz';
								usageInfo = [
									{ icon: '⚙️', text: 'Advanced option - requires server-side handling' },
									{ icon: '🔒', text: 'Most secure - no data in URL at all' },
								];
							} else if (mode === 'pi.flow') {
								example =
									'POST /flows\n{"status": "USERNAME_PASSWORD_REQUIRED", "resumeUrl": "..."}';
								usageInfo = [
									{ icon: '🎨', text: 'For companies who want to control the UI themselves' },
									{
										icon: '✅',
										text: 'Perfect for embedded auth, mobile apps, and headless flows',
									},
									{ icon: '🔒', text: 'No redirect - returns flow object via POST' },
								];
							}

							return (
								<div
									key={mode}
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
									{example && (
										<div
											style={{
												padding: '8px',
												background: '#f3f4f6',
												borderRadius: '4px',
												marginBottom: '8px',
												fontFamily: 'monospace',
												fontSize: '11px',
												color: '#1f2937',
												whiteSpace: 'pre-wrap',
												wordBreak: 'break-all',
											}}
										>
											{example}
										</div>
									)}
									<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
										{usageInfo.map((info, idx) => (
											<div
												key={idx}
												style={{
													fontSize: '11px',
													color: '#1e40af',
													display: 'flex',
													alignItems: 'center',
													gap: '6px',
												}}
											>
												<span>{info.icon}</span>
												<span>{info.text}</span>
											</div>
										))}
									</div>
								</div>
							);
						})}
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
							This flow uses: {RESPONSE_MODE_OPTIONS[value]?.label || 'query'} (default for{' '}
							{flowType === 'oauth-authz'
								? 'authorization code'
								: flowType === 'implicit'
									? 'implicit'
									: 'hybrid'}
							)
						</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default ResponseModeDropdownV8;
