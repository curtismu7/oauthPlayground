import React from 'react';

export interface BootstrapIconProps {
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	ariaLabel?: string;
}

/**
 * BootstrapIcon component for Ping UI
 * Uses Bootstrap Icons with proper naming convention
 */
export const BootstrapIcon: React.FC<BootstrapIconProps> = ({
	icon,
	size = 16,
	className = '',
	style = {},
	ariaLabel,
}) => {
	// Convert common icon names to Bootstrap Icons naming convention
	const getBootstrapIconName = (iconName: string): string => {
		const iconMap: Record<string, string> = {
			// Eye icons
			eye: 'eye',
			'eye-slash': 'eye-slash',
			'eye-off': 'eye-slash',

			// Action icons
			clipboard: 'clipboard',
			'clipboard-text': 'clipboard',
			download: 'download',
			copy: 'clipboard',

			// Chevron/caret icons
			'chevron-down': 'chevron-down',
			'chevron-right': 'chevron-right',
			'chevron-left': 'chevron-left',
			'chevron-up': 'chevron-up',

			// Question/help icons
			'question-circle': 'question-circle',
			'help-circle': 'question-circle',
			question: 'question-circle',

			// UI icons
			check: 'check',
			close: 'x',
			x: 'x',
			menu: 'list',
			settings: 'gear',
			gear: 'gear',

			// Status icons
			success: 'check-circle',
			error: 'x-circle',
			warning: 'exclamation-triangle',
			info: 'info-circle',

			// File icons
			file: 'file',
			folder: 'folder',
			document: 'file-text',
			image: 'image',

			// Navigation icons
			'arrow-left': 'arrow-left',
			'arrow-right': 'arrow-right',
			'arrow-up': 'arrow-up',
			'arrow-down': 'arrow-down',

			// Default fallback
		};

		return iconMap[iconName] || iconName;
	};

	const bootstrapIconName = getBootstrapIconName(icon);
	const iconClass = `bi bi-${bootstrapIconName} ${className}`.trim();

	const iconStyle: React.CSSProperties = {
		fontSize: `${size}px`,
		lineHeight: 1,
		...style,
	};

	return (
		<i
			className={iconClass}
			style={iconStyle}
			{...(ariaLabel && { 'aria-label': ariaLabel })}
			aria-hidden={!ariaLabel}
		/>
	);
};

export default BootstrapIcon;
