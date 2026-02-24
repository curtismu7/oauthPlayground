/**
 * @file StandardHeaderWithViewMode.tsx
 * @description StandardHeader component with integrated Full/Hidden view mode controls
 * @version 1.0.0
 */

import React from 'react';
import StandardHeader from './StandardHeader';
import ViewModeControls from './ViewModeControls';

export interface StandardHeaderWithViewModeProps {
	title: string;
	description: string;
	icon: string;
	viewMode: 'full' | 'hidden';
	onExpandAll: () => void;
	onCollapseAll: () => void;
	disabled?: boolean;
	badge?: {
		text: string;
		variant: 'success' | 'warning' | 'error' | 'info';
	};
	isCollapsible?: boolean;
	isCollapsed?: boolean;
	onToggle?: () => void;
	hiddenHeaderStyle?: React.CSSProperties;
	children?: React.ReactNode;
}

const StandardHeaderWithViewMode: React.FC<StandardHeaderWithViewModeProps> = ({
	title,
	description,
	icon,
	viewMode,
	onExpandAll,
	onCollapseAll,
	disabled = false,
	badge,
	isCollapsible = false,
	isCollapsed = false,
	onToggle,
	hiddenHeaderStyle,
	children,
}) => {
	const headerStyle = React.useMemo(() => {
		const baseStyle = {
			borderBottom: '1px solid var(--pingone-border-primary)',
			padding: viewMode === 'hidden' ? '0.5rem 0' : '2rem 0',
			position: 'relative' as const,
			overflow: 'hidden',
		};

		if (viewMode === 'hidden' && hiddenHeaderStyle) {
			return { ...baseStyle, ...hiddenHeaderStyle };
		}

		return baseStyle;
	}, [viewMode, hiddenHeaderStyle]);

	return (
		<div style={headerStyle}>
			<StandardHeader
				title={title}
				description={viewMode === 'full' ? description : ''}
				icon={icon}
				badge={badge}
				isCollapsible={isCollapsible}
				isCollapsed={isCollapsed}
				onToggle={onToggle}
			>
				{viewMode === 'full' && (
					<ViewModeControls
						viewMode={viewMode}
						onExpandAll={onExpandAll}
						onCollapseAll={onCollapseAll}
						disabled={disabled}
					/>
				)}
			</StandardHeader>

			{children && viewMode === 'full' && <div style={{ marginTop: '1rem' }}>{children}</div>}
		</div>
	);
};

export default StandardHeaderWithViewMode;
