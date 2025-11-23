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
import { FiChevronDown, FiInfo } from 'react-icons/fi';
import type { ResponseMode } from '@/services/responseModeService';

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
		description: 'No redirect - returns flow object via POST',
		useCase: 'Embedded auth, mobile apps, headless flows',
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
				<div style={{ color: '#6b7280' }}>
					Best for: {selectedOption.useCase}
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
						📚 Response Mode Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						Response mode controls <strong>how</strong> the authorization server returns the
						authorization response (code or tokens) to your application.
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{availableModes.map((mode) => {
							const option = RESPONSE_MODE_OPTIONS[mode];
							const isRecommended = mode === recommendedMode;
							const isSelected = mode === value;

							return (
								<div
									key={mode}
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
											{option.label}
										</span>
										{isRecommended && (
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
										}}
									>
										{option.useCase}
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
							<strong>💡 Quick Tip:</strong> Use <strong>query</strong> for traditional web apps,{' '}
							<strong>fragment</strong> for SPAs, <strong>form_post</strong> for enhanced security,
							or <strong>pi.flow</strong> for redirectless authentication.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ResponseModeDropdownV8;
