/**
 * @file TOTPConfigurationPageV8.PingUI.tsx
 * @module v8/flows/types
 * @description TOTP Configuration Page - Ping UI version (icons only)
 * @version 8.0.0
 */

import React from 'react';

// MDI Icon component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	const style: React.CSSProperties = {
		width: size,
		height: size,
		fontSize: size,
		lineHeight: 1,
	};

	return (
		<span
			role="img"
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
			className={`mdi mdi-${icon} ${className}`}
			style={style}
		/>
	);
};

// Simple wrapper that just replaces icons
export const TOTPConfigurationPageV8: React.FC<Record<string, never>> = () => {
	// This is a placeholder - the actual component would be copied from the original
	// with all Fi* icons replaced by MDIIcon components
	return (
		<div className="end-user-nano">
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
				<MDIIcon icon="timer" size={24} aria-hidden={true} />
				<span>TOTP Configuration</span>
			</div>
		</div>
	);
};
