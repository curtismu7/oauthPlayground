// src/services/copyButtonService.tsx
// Standardized copy button service with black popup and green checkmark

import React, { useCallback, useState } from 'react';

export interface CopyButtonProps {
	text: string;
	label?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'outline';
	showLabel?: boolean;
	className?: string;
}

// MDI Icon Helper Functions
interface MDIIconProps {
	icon: string;
	size?: number;
	color?: string;
	ariaLabel: string;
}

const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiCheck: 'mdi-check',
		FiCopy: 'mdi-content-copy',
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

// CSS Helper Functions
const getCopyButtonContainerStyles = () => ({
	position: 'relative' as const,
	display: 'inline-block',
});

const getCopyTooltipStyles = (visible: boolean, copied: boolean) => ({
	position: 'relative' as const,
	bottom: '100%',
	left: '50%',
	transform: 'translateX(-50%)',
	marginBottom: '8px',
	padding: '8px 12px',
	backgroundColor: copied ? '#10b981' : '#1f2937',
	color: 'white',
	borderRadius: '6px',
	fontSize: '0.75rem',
	fontWeight: '500',
	whiteSpace: 'nowrap',
	zIndex: 1000,
	opacity: visible ? 1 : 0,
	visibility: (visible ? 'visible' : 'hidden') as 'visible' | 'hidden',
	transition: 'all 0.2s ease',
	animation: visible ? 'fadeIn 0.2s ease' : 'none',
	boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

const getCopyTooltipArrowStyles = (copied: boolean) => ({
	content: '',
	position: 'absolute' as const,
	top: '100%',
	left: '50%',
	transform: 'translateX(-50%)',
	width: 0,
	height: 0,
	borderLeft: '6px solid transparent',
	borderRight: '6px solid transparent',
	borderTop: `6px solid ${copied ? '#10b981' : '#1f2937'}`,
});

// Icon component that switches between copy and check
const CopyIcon: React.FC<{ copied: boolean }> = ({ copied }) => {
	return copied ? (
		<MDIIcon icon="FiCheck" size={16} ariaLabel="Copied" />
	) : (
		<MDIIcon icon="FiCopy" size={16} ariaLabel="Copy" />
	);
};

// Main copy button component
export const CopyButtonService: React.FC<CopyButtonProps> = ({
	text,
	label = 'Copy',
	size = 'md',
	variant = 'primary',
	showLabel = true,
	className,
}) => {
	const [isCopied, setIsCopied] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(text);
			setIsCopied(true);
			setShowTooltip(true);

			// Reset after 2 seconds
			setTimeout(() => {
				setIsCopied(false);
				setShowTooltip(false);
			}, 2000);
		} catch (err) {
			console.error('Failed to copy text:', err);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				setIsCopied(true);
				setShowTooltip(true);
				setTimeout(() => {
					setIsCopied(false);
					setShowTooltip(false);
				}, 2000);
			} catch (fallbackErr) {
				console.error('Fallback copy failed:', fallbackErr);
			}
			document.body.removeChild(textArea);
		}
	}, [text]);

	const handleMouseEnter = useCallback(() => {
		if (!isCopied) {
			setShowTooltip(true);
		}
	}, [isCopied]);

	const handleMouseLeave = useCallback(() => {
		if (!isCopied) {
			setShowTooltip(false);
		}
	}, [isCopied]);

	const sizeStyles = {
		sm: { padding: '0.375rem 0.5rem', fontSize: '0.75rem', iconSize: '14px' },
		md: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', iconSize: '16px' },
		lg: { padding: '0.75rem 1rem', fontSize: '1rem', iconSize: '18px' },
	};

	const variantStyles = {
		primary: {
			backgroundColor: isCopied ? '#10b981' : '#3b82f6',
			color: 'white',
			border: 'none',
			hoverBackgroundColor: isCopied ? '#059669' : '#2563eb',
		},
		secondary: {
			backgroundColor: isCopied ? '#10b981' : '#6b7280',
			color: 'white',
			border: 'none',
			hoverBackgroundColor: isCopied ? '#059669' : '#4b5563',
		},
		outline: {
			backgroundColor: 'transparent',
			color: isCopied ? 'white' : '#374151',
			border: isCopied ? '1px solid #10b981' : '1px solid #d1d5db',
			hoverBackgroundColor: isCopied ? '#059669' : '#f9fafb',
		},
	};

	const currentSize = sizeStyles[size];
	const currentVariant = variantStyles[variant];

	return (
		<div style={getCopyButtonContainerStyles()} className={className}>
			<div style={getCopyTooltipStyles(showTooltip, isCopied)}>
				{isCopied ? 'Copied!' : `${label} item`}
				<div style={getCopyTooltipArrowStyles(isCopied)} />
			</div>
			<button
				type="button"
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '0.5rem',
					border: currentVariant.border,
					borderRadius: '6px',
					cursor: 'pointer',
					fontWeight: '500',
					transition: 'all 0.2s ease',
					position: 'relative',
					backgroundColor: currentVariant.backgroundColor,
					color: currentVariant.color,
					padding: currentSize.padding,
					fontSize: currentSize.fontSize,
				}}
				onClick={handleCopy}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				aria-label={isCopied ? 'Copied!' : `Copy ${label}`}
				onMouseOver={(e) => {
					if (!isCopied) {
						Object.assign(e.currentTarget.style, {
							backgroundColor: currentVariant.hoverBackgroundColor,
							transform: 'translateY(-1px)',
							boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
						});
					}
				}}
				onMouseOut={(e) => {
					if (!isCopied) {
						Object.assign(e.currentTarget.style, {
							backgroundColor: currentVariant.backgroundColor,
							transform: 'translateY(0)',
							boxShadow: 'none',
						});
					}
				}}
				onFocus={(e) => {
					Object.assign(e.currentTarget.style, {
						outline: 'none',
						boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
					});
				}}
				onBlur={(e) => {
					Object.assign(e.currentTarget.style, {
						boxShadow: 'none',
					});
				}}
				onMouseDown={(e) => {
					Object.assign(e.currentTarget.style, {
						transform: 'translateY(0)',
					});
				}}
			>
				<span style={{ fontSize: currentSize.iconSize, transition: 'transform 0.2s ease' }}>
					<CopyIcon copied={isCopied} />
				</span>
				{showLabel && !isCopied && label}
				{showLabel && isCopied && 'Copied'}
			</button>
		</div>
	);
};

// Utility function to create copy buttons for common use cases
export const createCopyButton = (
	text: string,
	label: string,
	options: Partial<CopyButtonProps> = {}
) => {
	return (
		<CopyButtonService
			text={text}
			label={label}
			size="sm"
			variant="outline"
			showLabel={false}
			{...options}
		/>
	);
};

// Pre-configured copy buttons for common scenarios
export const CopyButtonVariants = {
	identifier: (text: string, label: string) => (
		<CopyButtonService text={text} label={label} size="sm" variant="outline" showLabel={false} />
	),

	url: (text: string, label: string) => (
		<CopyButtonService text={text} label={label} size="md" variant="primary" showLabel={true} />
	),

	token: (text: string, label: string) => (
		<CopyButtonService text={text} label={label} size="sm" variant="secondary" showLabel={false} />
	),
};
