// src/services/flowUIComponentsService.tsx
// Service for centralized common UI components used across all flows

import { FiAlertTriangle, FiCheckCircle, FiInfo } from '@icons';
import React from 'react';
import styled from 'styled-components';

export interface FlowUIComponentsConfig {
	theme?: 'blue' | 'green' | 'purple' | 'gray';
	size?: 'small' | 'medium' | 'large';
	enableAnimations?: boolean;
}

const InfoBox = styled.div<{
	$variant?: 'info' | 'warning' | 'success' | 'error';
	$theme?: string;
}>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.5rem;
	border-radius: 0.75rem;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#d1fae5';
			case 'error':
				return '#fee2e2';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
	margin-bottom: 1.5rem;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
`;

const InfoIcon = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
	color: white;
	flex-shrink: 0;
`;

const InfoTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.p`
	color: #4b5563;
	margin: 0;
	line-height: 1.6;
`;

const InfoList = styled.ul`
	margin: 1rem 0 0 0;
	padding-left: 1.5rem;
	color: #4b5563;

	li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}
`;

const ParameterGrid = styled.div<{ $columns?: number }>`
	display: grid;
	grid-template-columns: repeat(${({ $columns }) => $columns || 2}, 1fr);
	gap: 0.75rem 1rem;
	align-items: start;
	margin: 1rem 0;
`;

const ParameterLabel = styled.div`
	font-weight: 500;
	color: #4b5563;
	font-size: 0.875rem;
`;

const ParameterValue = styled.div`
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background: #f0fdf4; /* Light green for generated content */
	padding: 0.5rem;
	border-radius: 0.375rem;
	border: 1px solid #16a34a;
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-start;
	margin: 1.5rem 0;
	flex-wrap: wrap;
`;

const Button = styled.button<{
	$variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
	$size?: 'small' | 'medium' | 'large';
}>`
	padding: ${({ $size }) => {
		switch ($size) {
			case 'small':
				return '0.5rem 1rem';
			case 'large':
				return '0.875rem 2rem';
			default:
				return '0.75rem 1.5rem';
		}
	}};
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: ${({ $size }) => ($size === 'small' ? '0.875rem' : '1rem')};
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border: none;
	text-decoration: none;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: linear-gradient(135deg, #3b82f6, #2563eb);
					color: white;
					&:hover {
						background: linear-gradient(135deg, #2563eb, #1d4ed8);
						transform: translateY(-1px);
					}
				`;
			case 'success':
				return `
					background: linear-gradient(135deg, #10b981, #059669);
					color: white;
					&:hover {
						background: linear-gradient(135deg, #059669, #047857);
						transform: translateY(-1px);
					}
				`;
			case 'danger':
				return `
					background: linear-gradient(135deg, #ef4444, #dc2626);
					color: white;
					&:hover {
						background: linear-gradient(135deg, #dc2626, #b91c1c);
						transform: translateY(-1px);
					}
				`;
			case 'outline':
				return `
					background: transparent;
					color: #4b5563;
					border: 1px solid #d1d5db;
					&:hover {
						background: #f9fafb;
						border-color: #9ca3af;
					}
				`;
			default:
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover {
						background: #e5e7eb;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}
`;

const GeneratedContentBox = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const GeneratedLabel = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Card = styled.div<{ $variant?: 'default' | 'elevated' | 'outlined' }>`
	background: #ffffff;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;

	${({ $variant }) => {
		switch ($variant) {
			case 'elevated':
				return `
					box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
					border: 1px solid #e5e7eb;
				`;
			case 'outlined':
				return `
					border: 2px solid #e5e7eb;
					box-shadow: none;
				`;
			default:
				return `
					border: 1px solid #e5e7eb;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
				`;
		}
	}}
`;

const SectionDivider = styled.div`
	height: 1px;
	background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
	margin: 2rem 0;
`;

export interface InfoBoxProps {
	variant?: 'info' | 'warning' | 'success' | 'error';
	title: string;
	children: React.ReactNode;
	icon?: React.ReactNode;
}

export const InfoBoxComponent: React.FC<InfoBoxProps> = ({
	variant = 'info',
	title,
	children,
	icon,
}) => {
	const getIcon = () => {
		if (icon) return icon;
		switch (variant) {
			case 'warning':
				return <FiAlertTriangle size={20} />;
			case 'success':
				return <FiCheckCircle size={20} />;
			case 'error':
				return <FiAlertTriangle size={20} />;
			default:
				return <FiInfo size={20} />;
		}
	};

	return (
		<InfoBox $variant={variant}>
			<InfoIcon $variant={variant}>{getIcon()}</InfoIcon>
			<div>
				<InfoTitle>{title}</InfoTitle>
				{children}
			</div>
		</InfoBox>
	);
};

export interface ParameterGridProps {
	children: React.ReactNode;
	columns?: number;
}

export const ParameterGridComponent: React.FC<ParameterGridProps> = ({ children, columns = 2 }) => {
	return <ParameterGrid $columns={columns}>{children}</ParameterGrid>;
};

export interface ActionRowProps {
	children: React.ReactNode;
	justify?: 'start' | 'center' | 'end' | 'space-between';
}

export const ActionRowComponent: React.FC<ActionRowProps> = ({ children, justify = 'start' }) => {
	return (
		<ActionRow
			style={{
				justifyContent:
					justify === 'start'
						? 'flex-start'
						: justify === 'center'
							? 'center'
							: justify === 'end'
								? 'flex-end'
								: 'space-between',
			}}
		>
			{children}
		</ActionRow>
	);
};

export interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
	size?: 'small' | 'medium' | 'large';
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	href?: string;
	target?: string;
}

export const ButtonComponent: React.FC<ButtonProps> = ({
	variant = 'secondary',
	size = 'medium',
	children,
	onClick,
	disabled = false,
	type = 'button',
	href,
	target,
}) => {
	if (href) {
		return (
			<Button
				as="a"
				href={href}
				target={target}
				$variant={variant}
				$size={size}
				disabled={disabled}
			>
				{children}
			</Button>
		);
	}

	return (
		<Button type={type} onClick={onClick} disabled={disabled} $variant={variant} $size={size}>
			{children}
		</Button>
	);
};

export interface GeneratedContentBoxProps {
	label: string;
	children: React.ReactNode;
	icon?: React.ReactNode;
}

export const GeneratedContentBoxComponent: React.FC<GeneratedContentBoxProps> = ({
	label,
	children,
	icon,
}) => {
	return (
		<GeneratedContentBox>
			<GeneratedLabel>
				{icon}
				{label}
			</GeneratedLabel>
			{children}
		</GeneratedContentBox>
	);
};

export interface CardProps {
	variant?: 'default' | 'elevated' | 'outlined';
	children: React.ReactNode;
}

export const CardComponent: React.FC<CardProps> = ({ variant = 'default', children }) => {
	return <Card $variant={variant}>{children}</Card>;
};

export class FlowUIComponentsService {
	static createComponents() {
		return {
			InfoBox: InfoBoxComponent,
			ParameterGrid: ParameterGridComponent,
			ParameterLabel,
			ParameterValue,
			ActionRow: ActionRowComponent,
			Button: ButtonComponent,
			GeneratedContentBox: GeneratedContentBoxComponent,
			Card: CardComponent,
			SectionDivider,
			InfoList,
			InfoText,
			InfoTitle,

			// Utility functions
			copyToClipboard: async (text: string) => {
				try {
					await navigator.clipboard.writeText(text);
					return true;
				} catch (error) {
					console.error('Failed to copy to clipboard:', error);
					return false;
				}
			},

			showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
				// This would integrate with the toast system
				console.log(`[${type.toUpperCase()}] ${message}`);
			},
		};
	}

	static getDefaultConfig(): FlowUIComponentsConfig {
		return {
			theme: 'blue',
			size: 'medium',
			enableAnimations: true,
		};
	}
}

export default FlowUIComponentsService;
