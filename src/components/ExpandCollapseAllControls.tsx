/**
 * @file ExpandCollapseAllControls.tsx
 * @description Expand/Collapse All Controls Component with PingOne UI
 * @version 1.0.0
 * @since 2025-02-23
 *
 * Renders two buttons: Expand all / Collapse all for sections on a page.
 * Uses PingOne UI styling and Bootstrap icons.
 */

import React from 'react';
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';

interface ExpandCollapseAllControlsProps {
	pageKey: string;
	sectionIds: string[];
	allExpanded: boolean;
	allCollapsed: boolean;
	onExpandAll: () => void;
	onCollapseAll: () => void;
	className?: string;
	disabled?: boolean;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'pills' | 'outline';
}

/**
 * Expand/Collapse All Controls Component
 *
 * Provides buttons to expand or collapse all sections on a page.
 * Styled with PingOne UI and Bootstrap icons.
 */
export const ExpandCollapseAllControls: React.FC<ExpandCollapseAllControlsProps> = ({
	pageKey,
	sectionIds,
	allExpanded,
	allCollapsed,
	onExpandAll,
	onCollapseAll,
	className = '',
	disabled = false,
	size = 'md',
	variant = 'default',
}) => {
	const getButtonClasses = (isPrimary: boolean) => {
		const baseClasses = 'btn';
		const sizeClasses = {
			sm: 'btn-sm',
			md: '',
			lg: 'btn-lg',
		}[size];

		let variantClasses = '';
		if (variant === 'pills') {
			variantClasses = isPrimary ? 'btn-primary' : 'btn-outline-primary';
		} else if (variant === 'outline') {
			variantClasses = isPrimary ? 'btn-primary' : 'btn-outline-secondary';
		} else {
			variantClasses = isPrimary ? 'btn-primary' : 'btn-secondary';
		}

		return `${baseClasses} ${sizeClasses} ${variantClasses}`;
	};

	const getButtonGroupClasses = () => {
		const baseClasses = 'btn-group';
		const sizeClasses = {
			sm: 'btn-group-sm',
			md: '',
			lg: 'btn-group-lg',
		}[size];

		return `${baseClasses} ${sizeClasses} ${className}`;
	};

	return (
		<div
			className={getButtonGroupClasses()}
			role="toolbar"
			aria-label={`Section controls for ${pageKey}`}
		>
			<button
				type="button"
				className={getButtonClasses(false)}
				onClick={onExpandAll}
				disabled={disabled || allExpanded}
				aria-label="Expand all sections"
				title={allExpanded ? 'All sections are already expanded' : 'Expand all sections'}
			>
				<BootstrapIcon
					icon={getBootstrapIconName('chevron-down')}
					size={16}
					className="me-1"
					aria-hidden={true}
				/>
				Expand all
				<span className="visually-hidden">({sectionIds.length} sections)</span>
			</button>

			<button
				type="button"
				className={getButtonClasses(false)}
				onClick={onCollapseAll}
				disabled={disabled || allCollapsed}
				aria-label="Collapse all sections"
				title={allCollapsed ? 'All sections are already collapsed' : 'Collapse all sections'}
			>
				<BootstrapIcon
					icon={getBootstrapIconName('chevron-up')}
					size={16}
					className="me-1"
					aria-hidden={true}
				/>
				Collapse all
				<span className="visually-hidden">({sectionIds.length} sections)</span>
			</button>
		</div>
	);
};

/**
 * Compact version for tight spaces
 */
export const ExpandCollapseAllControlsCompact: React.FC<
	Omit<ExpandCollapseAllControlsProps, 'size' | 'variant'>
> = (props) => {
	return <ExpandCollapseAllControls {...props} size="sm" variant="outline" />;
};

/**
 * Pills version for modern UI
 */
export const ExpandCollapseAllControlsPills: React.FC<
	Omit<ExpandCollapseAllControlsProps, 'size' | 'variant'>
> = (props) => {
	return <ExpandCollapseAllControls {...props} size="sm" variant="pills" />;
};

export default ExpandCollapseAllControls;
