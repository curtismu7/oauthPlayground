// src/components/StepIndicator.tsx
// Visual indicator component showing what each OAuth step demonstrates
// Helps users understand what they're learning at each stage

import React from 'react';
import {
	FiBook,
	FiCheckCircle,
	FiGlobe,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiShield,
	FiUser,
} from '@icons';
import styled from 'styled-components';

export type StepType =
	| 'configuration'
	| 'authorization'
	| 'token-exchange'
	| 'refresh'
	| 'user-info'
	| 'validation'
	| 'completion'
	| 'pkce';

interface StepIndicatorProps {
	/** Type of step (determines icon and color) */
	type: StepType;
	/** Step number */
	stepNumber: number;
	/** What this step demonstrates */
	description: string;
	/** Optional learning concept */
	learning?: string;
	/** Step is completed */
	completed?: boolean;
	/** Step is currently active */
	active?: boolean;
}

const IndicatorContainer = styled.div<{ $completed?: boolean; $active?: boolean; $type: StepType }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	background: ${(props) => {
		if (props.$completed) return '#f0fdf4';
		if (props.$active) return '#eff6ff';
		return '#f9fafb';
	}};
	border: 1px solid ${(props) => {
		if (props.$completed) return '#86efac';
		if (props.$active) return '#93c5fd';
		switch (props.$type) {
			case 'configuration':
				return '#dbeafe';
			case 'authorization':
				return '#fef3c7';
			case 'token-exchange':
				return '#ddd6fe';
			case 'refresh':
				return '#fce7f3';
			case 'user-info':
				return '#e0f2fe';
			case 'validation':
				return '#fed7aa';
			case 'completion':
				return '#dcfce7';
			case 'pkce':
				return '#e0e7ff';
			default:
				return '#e5e7eb';
		}
	}};
	color: ${(props) => {
		if (props.$completed) return '#059669';
		if (props.$active) return '#2563eb';
		return '#4b5563';
	}};
	font-size: 0.875rem;
	transition: all 0.2s ease;
`;

const StepBadge = styled.div<{ $type: StepType; $completed?: boolean; $active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: ${(props) => {
		if (props.$completed) return '#10b981';
		if (props.$active) return '#3b82f6';
		switch (props.$type) {
			case 'configuration':
				return '#60a5fa';
			case 'authorization':
				return '#fbbf24';
			case 'token-exchange':
				return '#a78bfa';
			case 'refresh':
				return '#f472b6';
			case 'user-info':
				return '#38bdf8';
			case 'validation':
				return '#fb923c';
			case 'completion':
				return '#34d399';
			case 'pkce':
				return '#818cf8';
			default:
				return '#9ca3af';
		}
	}};
	color: white;
	font-weight: 600;
	font-size: 0.75rem;
`;

const StepInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
`;

const StepLabel = styled.div`
	font-weight: 500;
`;

const StepDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-style: italic;
`;

const LearningBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.375rem;
	background: #fef3c7;
	border: 1px solid #fcd34d;
	border-radius: 0.25rem;
	font-size: 0.7rem;
	color: #92400e;
	margin-left: 0.5rem;
`;

const getIcon = (type: StepType, completed?: boolean) => {
	if (completed) return <FiCheckCircle size={14} />;

	switch (type) {
		case 'configuration':
			return <FiBook size={14} />;
		case 'authorization':
			return <FiShield size={14} />;
		case 'token-exchange':
			return <FiKey size={14} />;
		case 'refresh':
			return <FiRefreshCw size={14} />;
		case 'user-info':
			return <FiUser size={14} />;
		case 'validation':
			return <FiLock size={14} />;
		case 'completion':
			return <FiCheckCircle size={14} />;
		case 'pkce':
			return <FiGlobe size={14} />;
		default:
			return <FiBook size={14} />;
	}
};

const getTypeLabel = (type: StepType): string => {
	switch (type) {
		case 'configuration':
			return 'Configuration';
		case 'authorization':
			return 'Authorization';
		case 'token-exchange':
			return 'Token Exchange';
		case 'refresh':
			return 'Token Refresh';
		case 'user-info':
			return 'User Info';
		case 'validation':
			return 'Validation';
		case 'completion':
			return 'Complete';
		case 'pkce':
			return 'PKCE';
		default:
			return 'Step';
	}
};

/**
 * StepIndicator - Visual indicator showing what each OAuth step demonstrates
 *
 * Helps users understand what they're learning at each stage of an OAuth flow.
 * Provides visual feedback and educational context.
 *
 * @example
 * ```tsx
 * <StepIndicator
 *   type="token-exchange"
 *   stepNumber={3}
 *   description="Exchange authorization code for access token"
 *   learning="Learn how tokens are securely exchanged server-side"
 *   active={true}
 * />
 * ```
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
	type,
	stepNumber,
	description,
	learning,
	completed = false,
	active = false,
}) => {
	return (
		<IndicatorContainer $type={type} $completed={completed} $active={active}>
			<StepBadge $type={type} $completed={completed} $active={active}>
				{completed ? getIcon(type, true) : stepNumber}
			</StepBadge>
			<StepInfo>
				<StepLabel>
					{getTypeLabel(type)}
					{learning && (
						<LearningBadge>
							<FiBook size={10} />
							{learning}
						</LearningBadge>
					)}
				</StepLabel>
				<StepDescription>{description}</StepDescription>
			</StepInfo>
		</IndicatorContainer>
	);
};

export default StepIndicator;
