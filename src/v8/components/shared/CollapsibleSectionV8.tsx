import React, { useEffect, useRef, useState } from 'react';

interface CollapsibleSectionProps {
	/** Unique identifier for localStorage persistence */
	id?: string;
	/** Section title */
	title: string;
	/** Optional emoji or icon */
	icon?: string;
	/** Whether section starts expanded */
	defaultExpanded?: boolean;
	/** Children content */
	children: React.ReactNode;
	/** Additional CSS classes */
	className?: string;
	/** Background color (default: white) */
	backgroundColor?: string;
	/** Border color (default: #e2e8f0) */
	borderColor?: string;
	/** Disable localStorage persistence */
	disablePersistence?: boolean;
	/** Callback when expanded state changes */
	onExpandedChange?: (expanded: boolean) => void;
}

/**
 * CollapsibleSection Component
 *
 * Reusable section with expand/collapse functionality, smooth animations,
 * and optional localStorage persistence.
 *
 * Features:
 * - Smooth 300ms expand/collapse animation
 * - localStorage state persistence (optional)
 * - Chevron indicator
 * - Customizable colors and styling
 * - Keyboard accessible
 *
 * @example
 * <CollapsibleSection
 *   id="step-1-config"
 *   title="Step 1: Configuration"
 *   icon="⚙️"
 *   defaultExpanded={true}
 * >
 *   {Your content here}
 * </CollapsibleSection>
 */
export const CollapsibleSectionV8: React.FC<CollapsibleSectionProps> = ({
	id,
	title,
	icon,
	defaultExpanded = false,
	children,
	className = '',
	backgroundColor = '#ffffff',
	borderColor = '#e2e8f0',
	disablePersistence = false,
	onExpandedChange,
}) => {
	const contentRef = useRef<HTMLDivElement>(null);
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

	// Load state from localStorage on mount
	useEffect(() => {
		if (id && !disablePersistence) {
			const stored = localStorage.getItem(`collapsible-section-${id}`);
			if (stored !== null) {
				const parsedState = stored === 'true';
				setIsExpanded(parsedState);
			}
		}
	}, [id, disablePersistence]);

	// Update height when expanded state or content changes
	useEffect(() => {
		if (contentRef.current) {
			if (isExpanded) {
				setContentHeight(contentRef.current.scrollHeight);
			} else {
				setContentHeight(0);
			}
		}
	}, [isExpanded, children]);

	// Recalculate height when window resizes
	useEffect(() => {
		const handleResize = () => {
			if (contentRef.current && isExpanded) {
				setContentHeight(contentRef.current.scrollHeight);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [isExpanded]);

	const toggleExpanded = () => {
		const newState = !isExpanded;
		setIsExpanded(newState);

		// Save to localStorage
		if (id && !disablePersistence) {
			localStorage.setItem(`collapsible-section-${id}`, String(newState));
		}

		// Call callback
		if (onExpandedChange) {
			onExpandedChange(newState);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleExpanded();
		}
	};

	return (
		<div
			className={`collapsible-section ${className}`}
			style={{
				backgroundColor,
				border: `1px solid ${borderColor}`,
				borderRadius: '12px',
				marginBottom: '1rem',
				overflow: 'hidden',
				transition: 'box-shadow 0.2s ease',
			}}
		>
			{/* Header */}
			<div
				role="button"
				tabIndex={0}
				onClick={toggleExpanded}
				onKeyDown={handleKeyDown}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '1rem 1.25rem',
					cursor: 'pointer',
					userSelect: 'none',
					transition: 'background-color 0.2s ease',
					backgroundColor: isExpanded ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = isExpanded
						? 'transparent'
						: 'rgba(0, 0, 0, 0.02)';
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
					{icon && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
					<h3
						style={{
							margin: 0,
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#334155',
						}}
					>
						{title}
					</h3>
				</div>

				{/* Chevron indicator */}
				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					style={{
						transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.3s ease',
					}}
				>
					<path
						d="M5 7.5L10 12.5L15 7.5"
						stroke="#64748b"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>

			{/* Content */}
			<div
				ref={contentRef}
				style={{
					height: contentHeight !== undefined ? `${contentHeight}px` : 'auto',
					overflow: 'hidden',
					transition: 'height 0.3s ease',
				}}
			>
				<div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>{children}</div>
			</div>
		</div>
	);
};

export default CollapsibleSectionV8;
