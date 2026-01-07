/**
 * @file WorkerTokenGaugeV8.tsx
 * @module v8/components
 * @description Cool gauge visualization for worker token status
 * @version 8.0.0
 * @since 2026-01-06
 *
 * Color coding:
 * - Green: > 20 minutes remaining
 * - Yellow: 5-20 minutes remaining
 * - Red: < 5 minutes remaining
 */

import React from 'react';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';

interface WorkerTokenGaugeV8Props {
	tokenStatus: TokenStatusInfo;
	size?: number; // Size in pixels (default: 120)
}

export const WorkerTokenGaugeV8: React.FC<WorkerTokenGaugeV8Props> = ({
	tokenStatus,
	size = 120,
}) => {
	// Calculate percentage and color based on minutes remaining
	const getGaugeData = () => {
		if (!tokenStatus.isValid || !tokenStatus.minutesRemaining) {
		return {
			percentage: 0,
			color: '#ef4444', // Red
			label: 'No Token',
		};
		}

		const minutes = tokenStatus.minutesRemaining;

		// Determine color based on thresholds
		let color: string;
		let label: string;
		if (minutes > 20) {
			color = '#10b981'; // Green
			label = 'Excellent';
		} else if (minutes >= 5) {
			color = '#f59e0b'; // Yellow/Orange
			label = 'Warning';
		} else {
			color = '#ef4444'; // Red
			label = 'Critical';
		}

		// Calculate percentage (assuming max is 60 minutes for full gauge)
		// But we'll show relative to a reasonable max (like 60 minutes)
		const maxMinutes = 60;
		const percentage = Math.min((minutes / maxMinutes) * 100, 100);

		return {
			percentage,
			color,
			label,
			minutes,
		};
	};

	const gaugeData = getGaugeData();
	const radius = 45;
	const circumference = 2 * Math.PI * radius;
	
	// Calculate stroke-dashoffset for the progress arc
	const strokeDashoffset = circumference - (gaugeData.percentage / 100) * circumference;

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				position: 'relative',
				width: size,
				height: size,
			}}
		>
			{/* SVG Gauge */}
			<svg
				width={size}
				height={size}
				style={{
					transform: 'rotate(-90deg)', // Start from top
				}}
			>
				{/* Background circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="#e5e7eb"
					strokeWidth="8"
					strokeLinecap="round"
				/>
				{/* Progress arc */}
				{tokenStatus.isValid && tokenStatus.minutesRemaining !== undefined && (
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={gaugeData.color}
						strokeWidth="8"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						style={{
							transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
						}}
					/>
				)}
			</svg>

			{/* Center content */}
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					textAlign: 'center',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{tokenStatus.isValid && tokenStatus.minutesRemaining !== undefined ? (
					<>
						<div
							style={{
								fontSize: size * 0.25,
								fontWeight: '700',
								color: gaugeData.color,
								lineHeight: '1',
								marginBottom: '4px',
							}}
						>
							{gaugeData.minutes}
						</div>
						<div
							style={{
								fontSize: size * 0.1,
								fontWeight: '600',
								color: '#6b7280',
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
							}}
						>
							MIN
						</div>
						<div
							style={{
								fontSize: size * 0.08,
								fontWeight: '500',
								color: gaugeData.color,
								marginTop: '2px',
								textTransform: 'uppercase',
							}}
						>
							{gaugeData.label}
						</div>
					</>
				) : (
					<>
						<div
							style={{
								fontSize: size * 0.15,
								fontWeight: '700',
								color: '#ef4444',
								lineHeight: '1',
							}}
						>
							⚠️
						</div>
						<div
							style={{
								fontSize: size * 0.08,
								fontWeight: '600',
								color: '#6b7280',
								marginTop: '4px',
								textTransform: 'uppercase',
							}}
						>
							No Token
						</div>
					</>
				)}
			</div>

			{/* Status indicator dot */}
			<div
				style={{
					position: 'absolute',
					bottom: size * 0.1,
					left: '50%',
					transform: 'translateX(-50%)',
					width: '12px',
					height: '12px',
					borderRadius: '50%',
					background: gaugeData.color,
					boxShadow: `0 0 8px ${gaugeData.color}40`,
					transition: 'background 0.3s ease, box-shadow 0.3s ease',
				}}
			/>
		</div>
	);
};

