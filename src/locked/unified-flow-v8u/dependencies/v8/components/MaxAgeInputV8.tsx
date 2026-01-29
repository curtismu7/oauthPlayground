/**
 * @file MaxAgeInputV8.tsx
 * @module v8/components
 * @description Max age input with education for V8 flows
 * @version 8.0.0
 * @since 2024-11-22
 *
 * @example
 * <MaxAgeInputV8
 *   value={maxAge}
 *   onChange={handleMaxAgeChange}
 * />
 */

import React, { useState } from 'react';
import { FiClock, FiInfo } from 'react-icons/fi';

const MODULE_TAG = '[⏱️ MAX-AGE-V8]';

export interface MaxAgeInputV8Props {
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	disabled?: boolean;
	className?: string;
}

const PRESET_VALUES = [
	{ seconds: 0, label: 'Immediate (0s)', description: 'Force fresh login every time' },
	{ seconds: 300, label: '5 minutes', description: 'Recent authentication required' },
	{ seconds: 900, label: '15 minutes', description: 'Short session timeout' },
	{ seconds: 1800, label: '30 minutes', description: 'Medium session timeout' },
	{ seconds: 3600, label: '1 hour', description: 'Standard session timeout' },
];

export const MaxAgeInputV8: React.FC<MaxAgeInputV8Props> = ({
	value,
	onChange,
	disabled = false,
	className = '',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const [customValue, setCustomValue] = useState<string>(value?.toString() || '');

	const handlePresetChange = (seconds: number | string) => {
		console.log(`${MODULE_TAG} Max age changed`, { seconds });
		if (seconds === '') {
			onChange(undefined);
			setCustomValue('');
		} else {
			const numValue = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
			onChange(numValue);
			setCustomValue(numValue.toString());
		}
	};

	const handleCustomChange = (inputValue: string) => {
		setCustomValue(inputValue);
		if (inputValue === '') {
			onChange(undefined);
		} else {
			const numValue = parseInt(inputValue, 10);
			if (!Number.isNaN(numValue) && numValue >= 0) {
				onChange(numValue);
			}
		}
	};

	const formatDuration = (seconds: number): string => {
		if (seconds === 0) return 'Immediate re-authentication';
		if (seconds < 60) return `${seconds} seconds`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
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
					Max Age <span style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</span>
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

			{/* Preset dropdown */}
			<div style={{ marginBottom: '8px' }}>
				<select
					value={
						value !== undefined && PRESET_VALUES.some((p) => p.seconds === value) ? value : 'custom'
					}
					onChange={(e) => {
						const val = e.target.value;
						if (val === 'custom' || val === '') {
							// Keep current custom value
						} else {
							handlePresetChange(parseInt(val, 10));
						}
					}}
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
					<option value="">No limit (default)</option>
					{PRESET_VALUES.map((preset) => (
						<option key={preset.seconds} value={preset.seconds}>
							⏱️ {preset.label}
						</option>
					))}
					<option value="custom">✏️ Custom value...</option>
				</select>
			</div>

			{/* Custom input (shown when custom is selected or value doesn't match presets) */}
			{(value === undefined || !PRESET_VALUES.some((p) => p.seconds === value)) && (
				<div style={{ position: 'relative', marginBottom: '8px' }}>
					<FiClock
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
						type="number"
						value={customValue}
						onChange={(e) => handleCustomChange(e.target.value)}
						disabled={disabled}
						placeholder="Enter seconds (e.g., 300 for 5 minutes)"
						min="0"
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
			)}

			{/* Description */}
			{value !== undefined && (
				<div
					style={{
						marginTop: '8px',
						padding: '8px 12px',
						background: value === 0 ? '#fef3c7' : '#f0fdf4', // Light yellow or green
						border: `1px solid ${value === 0 ? '#fbbf24' : '#86efac'}`,
						borderRadius: '4px',
						fontSize: '12px',
						color: value === 0 ? '#92400e' : '#166534', // Dark brown or green - high contrast
					}}
				>
					{value === 0 ? (
						<>
							🔒 <strong>Force fresh login:</strong> User must authenticate every time
						</>
					) : (
						<>
							⏱️ <strong>Max session age:</strong> {formatDuration(value)} - forces re-auth if
							session is older
						</>
					)}
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
						📚 Max Age Guide
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
							max_age
						</code>{' '}
						parameter specifies the maximum time (in seconds) since the user last authenticated. If
						the user's session is older than this, they must re-authenticate.
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
								🔒 When to Use
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
									<strong>Banking/Finance:</strong> Require fresh auth for transactions
								</li>
								<li>
									<strong>Sensitive Operations:</strong> Password changes, account deletion
								</li>
								<li>
									<strong>Compliance:</strong> PSD2, HIPAA, SOC2 requirements
								</li>
								<li>
									<strong>Step-up Auth:</strong> Elevate security for specific actions
								</li>
							</ul>
						</div>

						{/* How it Works */}
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
								⚙️ How It Works
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#374151', // Dark text
									lineHeight: '1.6',
								}}
							>
								<ol style={{ margin: 0, paddingLeft: '20px' }}>
									<li>
										You set{' '}
										<code
											style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}
										>
											max_age=300
										</code>{' '}
										(5 minutes)
									</li>
									<li>Server checks when user last authenticated</li>
									<li>If &gt; 5 minutes ago, forces fresh login</li>
									<li>
										Server returns{' '}
										<code
											style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}
										>
											auth_time
										</code>{' '}
										claim in ID token
									</li>
									<li>Your app can verify the timestamp</li>
								</ol>
							</div>
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
								📝 Common Values
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#374151', // Dark text
									lineHeight: '1.6',
								}}
							>
								{PRESET_VALUES.map((preset) => (
									<div key={preset.seconds} style={{ marginBottom: '6px' }}>
										<code
											style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}
										>
											max_age={preset.seconds}
										</code>
										<span style={{ color: '#6b7280', marginLeft: '8px' }}>
											{preset.description}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Security Note */}
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
								<strong>🔐 Security:</strong> Setting{' '}
								<code style={{ background: '#fde68a', padding: '2px 4px', borderRadius: '3px' }}>
									max_age=0
								</code>{' '}
								forces immediate re-authentication, even if the user has an active session. Use this
								for highly sensitive operations.
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
							<strong>✅ Best Practice:</strong> Use{' '}
							<code style={{ background: '#d1fae5', padding: '2px 4px', borderRadius: '3px' }}>
								max_age
							</code>{' '}
							for sensitive operations like money transfers, password changes, or account deletion.
							Leave empty for normal login flows.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MaxAgeInputV8;
