// src/components/LearningTooltip.tsx
// Learning Mode Tooltip Component - Explains OAuth concepts inline
// Used throughout flows to help users understand OAuth/OIDC concepts

import React, { useEffect, useRef, useState } from 'react';
import { FiAlertCircle, FiBook, FiCheckCircle, FiInfo, FiShield } from 'react-icons/fi';
import styled from 'styled-components';

export type TooltipVariant = 'info' | 'learning' | 'warning' | 'success' | 'security';

interface LearningTooltipProps {
	/** Educational content explaining the OAuth concept */
	content: React.ReactNode;
	/** Tooltip variant/type */
	variant?: TooltipVariant;
	/** Optional title */
	title?: string;
	/** Children element that triggers the tooltip */
	children: React.ReactNode;
	/** Placement relative to trigger */
	placement?: 'top' | 'bottom' | 'left' | 'right';
	/** Show icon with tooltip */
	showIcon?: boolean;
}

const TooltipContainer = styled.span`
	position: relative;
	display: inline-flex;
	align-items: center;
`;

const TooltipTrigger = styled.span`
	cursor: help;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	color: ${(props) => {
		switch (props['data-variant']) {
			case 'security':
				return '#dc2626'; // red
			case 'warning':
				return '#d97706'; // orange
			case 'success':
				return '#059669'; // green
			case 'learning':
				return '#2563eb'; // blue
			default:
				return '#6b7280'; // gray
		}
	}};
	
	&:hover {
		opacity: 0.8;
	}
`;

const TooltipContent = styled.div<{ $placement: string; $variant: TooltipVariant }>`
	position: absolute;
	z-index: 1000;
	min-width: 250px;
	max-width: 400px;
	padding: 1rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	font-size: 0.875rem;
	line-height: 1.5;
	color: #374151;
	
	${(props) => {
		switch (props.$placement) {
			case 'top':
				return `
					bottom: calc(100% + 8px);
					left: 50%;
					transform: translateX(-50%);
					&::after {
						content: '';
						position: absolute;
						top: 100%;
						left: 50%;
						transform: translateX(-50%);
						border: 6px solid transparent;
						border-top-color: white;
					}
				`;
			case 'bottom':
				return `
					top: calc(100% + 8px);
					left: 50%;
					transform: translateX(-50%);
					&::after {
						content: '';
						position: absolute;
						bottom: 100%;
						left: 50%;
						transform: translateX(-50%);
						border: 6px solid transparent;
						border-bottom-color: white;
					}
				`;
			case 'left':
				return `
					right: calc(100% + 8px);
					top: 50%;
					transform: translateY(-50%);
					&::after {
						content: '';
						position: absolute;
						left: 100%;
						top: 50%;
						transform: translateY(-50%);
						border: 6px solid transparent;
						border-left-color: white;
					}
				`;
			case 'right':
				return `
					left: calc(100% + 8px);
					top: 50%;
					transform: translateY(-50%);
					&::after {
						content: '';
						position: absolute;
						right: 100%;
						top: 50%;
						transform: translateY(-50%);
						border: 6px solid transparent;
						border-right-color: white;
					}
				`;
			default:
				return '';
		}
	}}
	
	/* Variant-specific styling */
	${(props) => {
		switch (props.$variant) {
			case 'security':
				return `
					border-left: 4px solid #dc2626;
					background: #fef2f2;
				`;
			case 'warning':
				return `
					border-left: 4px solid #d97706;
					background: #fffbeb;
				`;
			case 'success':
				return `
					border-left: 4px solid #059669;
					background: #f0fdf4;
				`;
			case 'learning':
				return `
					border-left: 4px solid #2563eb;
					background: #eff6ff;
				`;
			default:
				return `
					border-left: 4px solid #6b7280;
					background: #f9fafb;
				`;
		}
	}}
`;

const TooltipTitle = styled.div`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const TooltipText = styled.div`
	color: #4b5563;
`;

const getIcon = (variant: TooltipVariant) => {
	switch (variant) {
		case 'security':
			return <FiShield size={16} />;
		case 'warning':
			return <FiAlertCircle size={16} />;
		case 'success':
			return <FiCheckCircle size={16} />;
		case 'learning':
			return <FiBook size={16} />;
		default:
			return <FiInfo size={16} />;
	}
};

/**
 * LearningTooltip - Educational tooltip component for OAuth/OIDC concepts
 *
 * Provides contextual explanations when users hover over OAuth-related elements.
 * Perfect for helping users understand OAuth flows, concepts, and best practices.
 *
 * @example
 * ```tsx
 * <LearningTooltip
 *   variant="learning"
 *   title="OAuth 2.0 Authorization Code"
 *   content="The authorization code flow is the most secure OAuth flow for server-side apps. It uses a short-lived code that's exchanged for tokens server-side."
 *   placement="top"
 * >
 *   <span>Authorization Code Flow</span>
 * </LearningTooltip>
 * ```
 */
export const LearningTooltip: React.FC<LearningTooltipProps> = ({
	content,
	variant = 'info',
	title,
	children,
	placement = 'top',
	showIcon = true,
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const containerRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsVisible(false);
			}
		};

		if (isVisible) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isVisible]);

	return (
		<TooltipContainer
			ref={containerRef}
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}
		>
			<TooltipTrigger data-variant={variant}>
				{children}
				{showIcon && getIcon(variant)}
			</TooltipTrigger>
			{isVisible && (
				<TooltipContent $placement={placement} $variant={variant}>
					{title && (
						<TooltipTitle>
							{getIcon(variant)}
							{title}
						</TooltipTitle>
					)}
					<TooltipText>{content}</TooltipText>
				</TooltipContent>
			)}
		</TooltipContainer>
	);
};

export default LearningTooltip;
