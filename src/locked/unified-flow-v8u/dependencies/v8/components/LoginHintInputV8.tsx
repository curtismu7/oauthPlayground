/**
 * @file LoginHintInputV8.tsx
 * @module v8/components
 * @description Login hint input with education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <LoginHintInputV8
 *   value={loginHint}
 *   onChange={handleLoginHintChange}
 * />
 */

import { FiInfo, FiUser } from '@icons';
import React, { useEffect, useRef, useState } from 'react';

const MODULE_TAG = '[👤 LOGIN-HINT-V8]';

export interface LoginHintInputV8Props {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
}

export const LoginHintInputV8: React.FC<LoginHintInputV8Props> = ({
	value,
	onChange,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const [displayValue, setDisplayValue] = useState(value); // Debounced value for display
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Debounce the display value - only update after user stops typing for 500ms
	useEffect(() => {
		// Clear existing timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Set new timer to update display value after user stops typing
		debounceTimerRef.current = setTimeout(() => {
			setDisplayValue(value);
		}, 500); // 500ms delay

		// Cleanup on unmount
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [value]);

	const handleChange = (newValue: string) => {
		console.log(`${MODULE_TAG} Login hint changed`, { value: newValue });
		onChange(newValue);
		// Don't update displayValue immediately - let debounce handle it
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
					Login Hint <span style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</span>
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

			{/* Input field */}
			<div style={{ position: 'relative' }}>
				<FiUser
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
					placeholder="user@example.com or username"
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

			{/* Description - Only show after user stops typing (debounced) */}
			{displayValue?.trim() && (
				<div
					style={{
						marginTop: '8px',
						padding: '8px 12px',
						background: '#f0fdf4', // Light green background
						border: '1px solid #86efac',
						borderRadius: '4px',
						fontSize: '12px',
						color: '#166534', // Dark green text - high contrast
					}}
				>
					✅ Login form will be pre-filled with: <strong>{displayValue}</strong>
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
						📚 Login Hint Guide
					</h4>
					<p
						style={{
							fontSize: '13px',
							color: '#1e40af', // Dark blue text
							marginBottom: '12px',
							lineHeight: '1.5',
						}}
					>
						The{' '}
						<code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '3px' }}>
							login_hint
						</code>{' '}
						parameter pre-fills the username or email field in the login form, improving user
						experience when you already know who's logging in.
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{/* Use Cases */}
						<div
							style={{
								padding: '12px',
								background: '#ffffff', // White background
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
							}}
						>
							<div
								style={{
									fontSize: '13px',
									fontWeight: '600',
									color: '#1f2937', // Dark text
									marginBottom: '6px',
								}}
							>
								💡 When to Use
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
								<li>User clicked "Login as user@example.com"</li>
								<li>Switching accounts (already know the email)</li>
								<li>Re-authentication after session timeout</li>
								<li>Account linking flows</li>
							</ul>
						</div>

						{/* Examples */}
						<div
							style={{
								padding: '12px',
								background: '#ffffff', // White background
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
							}}
						>
							<div
								style={{
									fontSize: '13px',
									fontWeight: '600',
									color: '#1f2937', // Dark text
									marginBottom: '6px',
								}}
							>
								📝 Examples
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#374151', // Dark text
									lineHeight: '1.6',
								}}
							>
								<div style={{ marginBottom: '6px' }}>
									<code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>
										login_hint=user@example.com
									</code>
									<div style={{ color: '#6b7280', marginTop: '2px' }}>Pre-fills email field</div>
								</div>
								<div>
									<code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>
										login_hint=john.doe
									</code>
									<div style={{ color: '#6b7280', marginTop: '2px' }}>Pre-fills username field</div>
								</div>
							</div>
						</div>

						{/* Important Notes */}
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
									lineHeight: '1.5',
								}}
							>
								<strong>⚠️ Important:</strong> This is a <em>hint</em>, not a requirement. The user
								can still change the username/email in the login form. It's purely for convenience.
							</div>
						</div>
					</div>

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
								lineHeight: '1.5',
							}}
						>
							<strong>✅ UX Benefit:</strong> Saves users time by pre-filling the login form.
							Especially useful in account switching scenarios or when you already know the user's
							identity.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default LoginHintInputV8;
