/**
 * @file DisplayModeDropdownV8.tsx
 * @module v8/components
 * @description Display mode dropdown with education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 * 
 * @example
 * <DisplayModeDropdownV8
 *   value={display}
 *   onChange={handleDisplayChange}
 * />
 */

import React, { useState } from 'react';
import { FiChevronDown, FiInfo } from 'react-icons/fi';

const MODULE_TAG = '[🖥️ DISPLAY-MODE-V8]';

export type DisplayMode = 'page' | 'popup' | 'touch' | 'wap';

export interface DisplayModeDropdownV8Props {
	value: DisplayMode | undefined;
	onChange: (mode: DisplayMode | undefined) => void;
	disabled?: boolean;
	className?: string;
}

interface DisplayModeOption {
	value: DisplayMode;
	label: string;
	icon: string;
	description: string;
	useCase: string;
	recommended?: boolean;
}

const DISPLAY_MODE_OPTIONS: Record<DisplayMode, DisplayModeOption> = {
	page: {
		value: 'page',
		label: 'Page (Full Redirect)',
		icon: '🖥️',
		description: 'Full page redirect to login screen',
		useCase: 'Standard web applications',
		recommended: true,
	},
	popup: {
		value: 'popup',
		label: 'Popup Window',
		icon: '🪟',
		description: 'Login in popup window',
		useCase: 'Embedded authentication, SPAs',
	},
	touch: {
		value: 'touch',
		label: 'Touch Interface',
		icon: '📱',
		description: 'Touch-optimized mobile interface',
		useCase: 'Mobile apps, tablets',
	},
	wap: {
		value: 'wap',
		label: 'WAP Interface',
		icon: '📟',
		description: 'WAP-optimized interface (legacy)',
		useCase: 'Legacy mobile browsers',
	},
};

export const DisplayModeDropdownV8: React.FC<DisplayModeDropdownV8Props> = ({
	value,
	onChange,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const selectedOption = value ? DISPLAY_MODE_OPTIONS[value] : null;

	const handleChange = (newMode: string) => {
		console.log(`${MODULE_TAG} Display mode changed`, { from: value, to: newMode });
		onChange(newMode === '' ? undefined : (newMode as DisplayMode));
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
					Display Mode <span style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</span>
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
					value={value || ''}
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
					<option value="">Default (page)</option>
					{Object.values(DISPLAY_MODE_OPTIONS).map((option) => (
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

			{/* Selected mode description */}
			{selectedOption && (
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
						📚 Display Mode Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						The <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '3px' }}>display</code> parameter controls how the authentication UI is displayed to the user.
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{Object.values(DISPLAY_MODE_OPTIONS).map((option) => {
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
							<strong>💡 Quick Tip:</strong> Use <strong>page</strong> for standard web apps, <strong>popup</strong> for embedded authentication in SPAs, <strong>touch</strong> for mobile apps. The <strong>wap</strong> mode is legacy and rarely used today.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DisplayModeDropdownV8;
