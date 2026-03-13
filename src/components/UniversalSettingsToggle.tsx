/**
 * @file UniversalSettingsToggle.tsx
 * @description Component for toggling between universal and local settings
 * @version 1.0.0
 * @since 2026-03-11
 *
 * Provides checkbox UI to switch between universal settings and flow-specific overrides
 * with visual indicators and reset functionality.
 */

import React from 'react';
import styled from 'styled-components';
import { useUniversalSettingsToggle } from '../hooks/useUniversalSettings';

// Styled Components
const ToggleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	background: var(--ping-bg-secondary, #f8fafc);
	border: 1px solid var(--ping-border-primary, #e2e8f0);
	border-radius: 8px;
	margin: 8px 0;
`;

const ToggleLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	color: var(--ping-text-primary, #1e293b);
	user-select: none;
`;

const Checkbox = styled.input<{ $hasOverride?: boolean }>`
	width: 18px;
	height: 18px;
	border: 2px solid ${(props) => (props.$hasOverride ? '#f59e0b' : 'var(--ping-border-primary, #cbd5e1)')};
	border-radius: 4px;
	background: ${(props) => (props.$hasOverride ? '#fef3c7' : 'var(--ping-bg-primary, #ffffff)')};
	cursor: pointer;
	position: relative;
	transition: all 0.15s ease-in-out;

	&:checked {
		background: var(--ping-bg-brand, #2563eb);
		border-color: var(--ping-bg-brand, #2563eb);
	}

	&:checked::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 12px;
		font-weight: bold;
	}

	&:hover {
		border-color: var(--ping-bg-brand, #2563eb);
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
	}
`;

const StatusText = styled.span<{ $hasOverride?: boolean }>`
	font-size: 12px;
	color: ${(props) => (props.$hasOverride ? '#f59e0b' : 'var(--ping-text-secondary, #64748b)')};
	font-weight: ${(props) => (props.$hasOverride ? '600' : '400')};
`;

const ResetButton = styled.button`
	padding: 4px 8px;
	background: var(--ping-bg-danger, #ef4444);
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 11px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s ease-in-out;
	opacity: 0.8;

	&:hover {
		opacity: 1;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}
`;

const InfoIcon = styled.span`
	font-size: 14px;
	color: var(--ping-text-secondary, #64748b);
	cursor: help;
	
	&:hover {
		color: var(--ping-bg-brand, #2563eb);
	}
`;

interface UniversalSettingsToggleProps {
	flowKey: string;
	flowName?: string;
	onToggleChange?: (useUniversal: boolean) => void;
	onResetComplete?: () => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Universal Settings Toggle Component
 *
 * Provides checkbox UI to switch between universal settings and flow-specific overrides.
 * Shows visual indicators when overrides are active and allows resetting to universal settings.
 */
export const UniversalSettingsToggle: React.FC<UniversalSettingsToggleProps> = ({
	flowKey,
	flowName,
	onToggleChange,
	onResetComplete,
	disabled = false,
	className,
}) => {
	const { useUniversal, hasOverride, onToggle, onReset } = useUniversalSettingsToggle(flowKey);

	const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		onToggle(checked);
		onToggleChange?.(checked);
	};

	const handleReset = async () => {
		const success = await onReset();
		if (success) {
			onResetComplete?.();
		}
	};

	const getLabelText = () => {
		if (hasOverride) {
			return useUniversal ? 'Use Universal Settings' : 'Using Local Override';
		}
		return 'Use Universal Settings';
	};

	const getStatusText = () => {
		if (hasOverride) {
			return useUniversal ? 'Universal settings active' : 'Local override active';
		}
		return 'No override configured';
	};

	return (
		<ToggleContainer className={className}>
			<ToggleLabel>
				<Checkbox
					type="checkbox"
					checked={useUniversal}
					onChange={handleToggle}
					disabled={disabled}
					$hasOverride={hasOverride}
				/>
				<span>{getLabelText()}</span>
				<InfoIcon title="Universal settings apply across all flows, while local overrides are specific to this flow">
					ℹ️
				</InfoIcon>
			</ToggleLabel>

			<StatusText $hasOverride={hasOverride}>{getStatusText()}</StatusText>

			{hasOverride && !useUniversal && (
				<ResetButton
					onClick={handleReset}
					disabled={disabled}
					title={`Reset ${flowName || flowKey} to universal settings`}
				>
					Reset to Universal
				</ResetButton>
			)}
		</ToggleContainer>
	);
};

export default UniversalSettingsToggle;
