/**
 * @file ViewModeControls.tsx
 * @description Reusable component for Full/Hidden view mode controls
 * @version 1.0.0
 */

import React from 'react';
import BootstrapButton from './bootstrap/BootstrapButton';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
	style?: React.CSSProperties;
}> = ({
	icon,
	size = 24,
	className = '',
	'aria-label': ariaLabel,
	'aria-hidden': ariaHidden,
	style,
}) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

export interface ViewModeControlsProps {
	viewMode: 'full' | 'hidden';
	onExpandAll: () => void;
	onCollapseAll: () => void;
	disabled?: boolean;
}

const ViewModeControls: React.FC<ViewModeControlsProps> = ({
	viewMode,
	onExpandAll,
	onCollapseAll,
	disabled = false,
}) => {
	return (
		<div
			style={{
				display: 'flex',
				gap: '0.5rem',
				alignItems: 'center',
			}}
		>
			<BootstrapButton
				variant={viewMode === 'full' ? 'primary' : 'secondary'}
				greyBorder={viewMode === 'full'}
				onClick={onExpandAll}
				title="Expand All - Expand all sections"
				disabled={disabled}
			>
				<MDIIcon icon="view-fullscreen" size={14} />
				Expand All
			</BootstrapButton>
			<BootstrapButton
				variant={viewMode === 'hidden' ? 'primary' : 'secondary'}
				greyBorder={viewMode === 'hidden'}
				onClick={onCollapseAll}
				title="Collapse All - Collapse all sections"
				disabled={disabled}
			>
				<MDIIcon icon="eye-off" size={14} />
				Collapse All
			</BootstrapButton>
		</div>
	);
};

export default ViewModeControls;
