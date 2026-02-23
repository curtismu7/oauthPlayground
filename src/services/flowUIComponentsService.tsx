// src/services/flowUIComponentsService.tsx
// Service for centralized common UI components used across all flows

import React from 'react';

// MDI Icon Helper Functions
interface MDIIconProps {
	icon: string;
	size?: number;
	color?: string;
	ariaLabel: string;
}

const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert-triangle',
		FiCheckCircle: 'mdi-check-circle',
		FiInfo: 'mdi-information',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

const MDIIcon: React.FC<MDIIconProps> = ({ icon, size = 24, color, ariaLabel }) => {
	const iconClass = getMDIIconClass(icon);
	return (
		<span
			className={`mdi ${iconClass}`}
			style={{ fontSize: size, color: color }}
			role="img"
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
		></span>
	);
};

export interface FlowUIComponentsConfig {
	theme?: 'blue' | 'green' | 'purple' | 'gray';
	size?: 'small' | 'medium' | 'large';
	enableAnimations?: boolean;
}

// CSS Helper Functions
const getInfoBoxStyles = (variant?: 'info' | 'warning' | 'success' | 'error') => {
	const variantStyles = {
		info: {
			background: '#eff6ff',
			borderColor: '#3b82f6',
		},
		warning: {
			background: '#fef3c7',
			borderColor: '#f59e0b',
		},
		success: {
			background: '#d1fae5',
			borderColor: '#10b981',
		},
		error: {
			background: '#fee2e2',
			borderColor: '#ef4444',
		},
	};
	const style = variantStyles[variant || 'info'];
	return {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '1rem',
		padding: '1.5rem',
		borderRadius: '0.75rem',
		background: style.background,
		border: `1px solid ${style.borderColor}`,
		marginBottom: '1.5rem',
		transition: 'all 0.2s ease',
	};
};

const getInfoIconStyles = (variant?: 'info' | 'warning' | 'success' | 'error') => {
	const variantStyles = {
		info: '#3b82f6',
		warning: '#f59e0b',
		success: '#10b981',
		error: '#ef4444',
	};
	return {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '2rem',
		height: '2rem',
		borderRadius: '50%',
		background: variantStyles[variant || 'info'],
		color: 'white',
		flexShrink: 0,
	};
};

const getParameterGridStyles = (columns?: number) => ({
	display: 'grid',
	gridTemplateColumns: `repeat(${columns || 2}, 1fr)`,
	gap: '0.75rem 1rem',
	alignItems: 'start',
	margin: '1rem 0',
});

const getButtonStyles = (
	variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success',
	size?: 'small' | 'medium' | 'large'
) => {
	const sizeStyles = {
		small: '0.5rem 1rem',
		medium: '0.625rem 1.25rem',
		large: '0.875rem 2rem',
	};

	const variantStyles = {
		primary: {
			background: '#3b82f6',
			color: 'white',
			borderColor: '#2563eb',
		},
		secondary: {
			background: '#6b7280',
			color: 'white',
			borderColor: '#4b5563',
		},
		danger: {
			background: '#ef4444',
			color: 'white',
			borderColor: '#dc2626',
		},
		outline: {
			background: 'transparent',
			color: '#6b7280',
			borderColor: '#d1d5db',
		},
		success: {
			background: '#10b981',
			color: 'white',
			borderColor: '#059669',
		},
	};

	const style = variantStyles[variant || 'secondary'];

	return {
		padding: sizeStyles[size || 'medium'],
		border: `1px solid ${style.borderColor}`,
		borderRadius: '0.5rem',
		background: style.background,
		color: style.color,
		cursor: 'pointer',
		fontWeight: '500',
		transition: 'all 0.15s ease-in-out',
	};
};

// Additional CSS Helper Functions
const getInfoTitleStyles = () => ({
	fontSize: '1.125rem',
	fontWeight: '600',
	color: '#1f2937',
	margin: '0 0 0.5rem 0',
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
});

const getInfoTextStyles = () => ({
	color: '#4b5563',
	margin: 0,
	lineHeight: '1.6',
});

const getInfoListStyles = () => ({
	margin: '1rem 0 0 0',
	paddingLeft: '1.5rem',
	color: '#4b5563',
});

const getParameterLabelStyles = () => ({
	fontWeight: '500',
	color: '#4b5563',
	fontSize: '0.875rem',
});

const getParameterValueStyles = () => ({
	fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
	fontSize: '0.875rem',
	color: '#064e3b',
	wordBreak: 'break-word' as const,
	background: '#f0fdf4',
	padding: '0.5rem',
	borderRadius: '0.375rem',
	border: '1px solid #16a34a',
});

const getActionRowStyles = () => ({
	display: 'flex',
	gap: '1rem',
	justifyContent: 'flex-start',
	margin: '1.5rem 0',
	flexWrap: 'wrap' as const,
});

const getGeneratedContentBoxStyles = () => ({
	background: '#ffffff',
	border: '1px solid #e5e7eb',
	borderRadius: '0.75rem',
	padding: '1.5rem',
	marginBottom: '1.5rem',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
});

const getGeneratedLabelStyles = () => ({
	fontSize: '1rem',
	fontWeight: '600',
	color: '#1f2937',
	marginBottom: '1rem',
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
});

const getCardStyles = (variant?: 'default' | 'elevated' | 'outlined') => {
	const baseStyles = {
		background: '#ffffff',
		borderRadius: '0.75rem',
		padding: '1.5rem',
		marginBottom: '1.5rem',
	};

	switch (variant) {
		case 'elevated':
			return {
				...baseStyles,
				boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
				border: '1px solid #e5e7eb',
			};
		case 'outlined':
			return {
				...baseStyles,
				border: '2px solid #e5e7eb',
				boxShadow: 'none',
			};
		default:
			return {
				...baseStyles,
				border: '1px solid #e5e7eb',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
			};
	}
};

const getSectionDividerStyles = () => ({
	height: '1px',
	background: 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
	margin: '2rem 0',
});

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
				return <MDIIcon icon="FiAlertTriangle" size={20} ariaLabel="Warning" />;
			case 'success':
				return <MDIIcon icon="FiCheckCircle" size={20} ariaLabel="Success" />;
			case 'error':
				return <MDIIcon icon="FiAlertTriangle" size={20} ariaLabel="Error" />;
			default:
				return <MDIIcon icon="FiInfo" size={20} ariaLabel="Information" />;
		}
	};

	return (
		<div style={getInfoBoxStyles(variant)}>
			<div style={getInfoIconStyles(variant)}>{getIcon()}</div>
			<div>
				<h3 style={getInfoTitleStyles()}>{title}</h3>
				{children}
			</div>
		</div>
	);
};

export interface ParameterGridProps {
	children: React.ReactNode;
	columns?: number;
}

export const ParameterGridComponent: React.FC<ParameterGridProps> = ({ children, columns = 2 }) => {
	return <div style={getParameterGridStyles(columns)}>{children}</div>;
};

export interface ActionRowProps {
	children: React.ReactNode;
	justify?: 'start' | 'center' | 'end' | 'space-between';
}

export const ActionRowComponent: React.FC<ActionRowProps> = ({ children, justify = 'start' }) => {
	const justifyContent =
		justify === 'start'
			? 'flex-start'
			: justify === 'center'
				? 'center'
				: justify === 'end'
					? 'flex-end'
					: 'space-between';

	return <div style={{ ...getActionRowStyles(), justifyContent }}>{children}</div>;
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
	const buttonStyles = getButtonStyles(variant, size);

	if (href) {
		return (
			<a
				href={href}
				target={target}
				style={{ ...buttonStyles, textDecoration: 'none', display: 'inline-block' }}
				onClick={disabled ? undefined : onClick}
			>
				{children}
			</a>
		);
	}

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			style={{
				...buttonStyles,
				...(disabled ? { opacity: 0.5, cursor: 'not-allowed', transform: 'none' } : {}),
			}}
		>
			{children}
		</button>
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
		<div style={getGeneratedContentBoxStyles()}>
			<div style={getGeneratedLabelStyles()}>
				{icon}
				{label}
			</div>
			{children}
		</div>
	);
};

export interface CardProps {
	variant?: 'default' | 'elevated' | 'outlined';
	children: React.ReactNode;
}

export const CardComponent: React.FC<CardProps> = ({ variant = 'default', children }) => {
	return <div style={getCardStyles(variant)}>{children}</div>;
};

export class FlowUIComponentsService {
	static createComponents() {
		return {
			InfoBox: InfoBoxComponent,
			ParameterGrid: ParameterGridComponent,
			ParameterLabel: ({ children }: { children: React.ReactNode }) => (
				<div style={getParameterLabelStyles()}>{children}</div>
			),
			ParameterValue: ({ children }: { children: React.ReactNode }) => (
				<div style={getParameterValueStyles()}>{children}</div>
			),
			ActionRow: ActionRowComponent,
			Button: ButtonComponent,
			GeneratedContentBox: GeneratedContentBoxComponent,
			Card: CardComponent,
			SectionDivider: () => <div style={getSectionDividerStyles()} />,
			InfoList: ({ children }: { children: React.ReactNode }) => (
				<ul style={getInfoListStyles()}>{children}</ul>
			),
			InfoText: ({ children }: { children: React.ReactNode }) => (
				<p style={getInfoTextStyles()}>{children}</p>
			),
			InfoTitle: ({ children }: { children: React.ReactNode }) => (
				<h3 style={getInfoTitleStyles()}>{children}</h3>
			),

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
