/**
 * @file MFAInfoButtonV8.PingUI.tsx
 * @module v8/components
 * @description Ping UI migration of Info button component for MFA educational content
 * @version 8.0.0-PingUI
 * @since 2024-11-23
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 *
 * Provides "What's this?" style info buttons that display educational
 * content from MFAEducationServiceV8 in a modal or tooltip.
 */

import React, { useMemo, useState } from 'react';
import { MFAEducationServiceV8 } from '@/v8/services/mfaEducationServiceV8';

const MODULE_TAG = '[ℹ️ MFA-INFO-BUTTON-V8-PINGUI]';

// MDI Icon Mapping for React Icons → MDI CSS
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiExternalLink: 'mdi-open-in-new',
		FiInfo: 'mdi-information',
		FiX: 'mdi-close',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '' }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px` }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		></i>
	);
};

/**
 * Render formatted description with proper markdown parsing
 * Converts markdown-style text to JSX with proper lists and formatting
 */
const renderFormattedDescription = (description: string): React.ReactNode => {
	if (!description) return null;

	const lines = description.split('\n');
	const elements: React.ReactNode[] = [];
	let currentList: string[] = [];
	let currentParagraph: string[] = [];

	const flushList = () => {
		if (currentList.length > 0) {
			elements.push(
				<ul
					key={`list-${elements.length}`}
					style={{
						margin:
							'var(--ping-spacing-sm, 0.5rem) 0 var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem)',
						padding: 0,
						listStyle: 'disc',
					}}
				>
					{currentList.map((item, idx) => (
						<li
							key={idx}
							style={{
								margin: 'var(--ping-spacing-xs, 0.25rem) 0',
								paddingLeft: 'var(--ping-spacing-xs, 0.25rem)',
								lineHeight: '1.6',
							}}
						>
							{renderBoldText(item.trim())}
						</li>
					))}
				</ul>
			);
			currentList = [];
		}
	};

	const flushParagraph = () => {
		if (currentParagraph.length > 0) {
			const text = currentParagraph.join(' ').trim();
			if (text) {
				elements.push(
					<p
						key={`para-${elements.length}`}
						style={{ margin: '0 0 var(--ping-spacing-md, 1rem) 0' }}
					>
						{renderBoldText(text)}
					</p>
				);
			}
			currentParagraph = [];
		}
	};

	const renderBoldText = (text: string): React.ReactNode => {
		const parts: React.ReactNode[] = [];
		let lastIndex = 0;
		const boldRegex = /\*\*(.+?)\*\*/g;
		let match;

		while ((match = boldRegex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push(text.substring(lastIndex, match.index));
			}
			parts.push(
				<strong
					key={`bold-${parts.length}`}
					style={{ fontWeight: '600', color: 'var(--ping-text-color, #1a1a1a)' }}
				>
					{match[1]}
				</strong>
			);
			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < text.length) {
			parts.push(text.substring(lastIndex));
		}

		return parts.length > 0 ? parts : text;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (line.startsWith('- ')) {
			flushParagraph();
			currentList.push(line.substring(2));
		} else if (line === '') {
			flushList();
			flushParagraph();
		} else {
			flushList();
			currentParagraph.push(line);
		}
	}

	flushList();
	flushParagraph();

	return <>{elements}</>;
};

export interface MFAInfoButtonV8PingUIProps {
	/** Education content key from MFAEducationServiceV8 */
	contentKey: string;
	/** Display mode: tooltip (hover) or modal (click) */
	displayMode?: 'tooltip' | 'modal';
	/** Custom button label (default: icon only) */
	label?: string;
	/** Stop click/key events from bubbling to parent containers */
	stopPropagation?: boolean;
	/** Optional class for the trigger element */
	triggerClassName?: string;
	/** Optional inline style overrides for the trigger element */
	triggerStyle?: React.CSSProperties;
}

/**
 * MFA Info Button V8 - Ping UI Version
 *
 * Displays educational content from MFAEducationServiceV8 in either:
 * - Tooltip mode: Shows on hover (for quick reference)
 * - Modal mode: Shows on click (for detailed information)
 *
 * Ping UI enhancements:
 * - MDI icons with proper accessibility
 * - CSS variables for consistent theming
 * - 0.15s ease-in-out transitions
 * - .end-user-nano namespace scoping
 */
export const MFAInfoButtonV8PingUI: React.FC<MFAInfoButtonV8PingUIProps> = ({
	contentKey,
	displayMode = 'tooltip',
	label,
	stopPropagation = false,
	triggerClassName,
	triggerStyle,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	// Memoize education content to prevent unnecessary re-fetches on re-renders
	const content = useMemo(() => {
		return MFAEducationServiceV8.getContent(contentKey);
	}, [contentKey]);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		if (stopPropagation) {
			event.preventDefault();
			event.stopPropagation();
		}
		console.log(`${MODULE_TAG} Info button clicked`, { contentKey, displayMode, isOpen });
		if (displayMode === 'modal') {
			setIsOpen((prev) => {
				console.log(`${MODULE_TAG} Setting isOpen to`, !prev);
				return !prev;
			});
		}
	};

	const handleClose = React.useCallback(() => {
		console.log(`${MODULE_TAG} Closing modal`);
		setIsOpen(false);
	}, []);

	// Handle ESC key to close modal
	React.useEffect(() => {
		if (!isOpen || displayMode !== 'modal') return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, displayMode, handleClose]);

	// Show tooltip on hover (tooltip mode only)
	const shouldShowTooltip = displayMode === 'tooltip' && (isHovered || isOpen);

	// PING UI MIGRATION: Applied Ping UI CSS variables and transitions
	const commonStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 'var(--ping-spacing-xs, 0.25rem)',
		padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
		background:
			isHovered || isOpen
				? 'var(--ping-hover-color, #f1f3f4)'
				: 'var(--ping-secondary-color, #f8f9fa)',
		borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
		fontSize: '12px',
		color: 'var(--ping-primary-color, #0066cc)',
		fontWeight: '500',
		cursor: 'pointer',
		transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
		verticalAlign: 'middle',
		marginLeft: 'var(--ping-spacing-xs, 0.25rem)',
		border: `1px solid ${isHovered || isOpen ? 'var(--ping-border-color, #dee2e6)' : 'transparent'}`,
	};

	const handleFocus = () => setIsHovered(true);
	const handleBlur = () => setIsHovered(false);

	const mergedTriggerStyle = {
		...commonStyle,
		...(triggerStyle || {}),
	};

	const triggerElement = (
		<button
			type="button"
			aria-label={`Learn more: ${content.title}`}
			title={displayMode === 'modal' ? 'Click for more information' : content.title}
			onClick={handleClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onFocus={handleFocus}
			onBlur={handleBlur}
			style={mergedTriggerStyle}
			className={triggerClassName}
		>
			{/* PING UI MIGRATION: Replaced FiInfo with MDI icon */}
			<MDIIcon icon="FiInfo" size={14} ariaLabel="Information" />
			<span>{label || 'What is this?'}</span>
		</button>
	);

	// PING UI MIGRATION: Added .end-user-nano wrapper as required by pingui2.md
	return (
		<div className="end-user-nano">
			{/* Info Trigger */}
			{triggerElement}

			{/* Tooltip (hover mode) */}
			{shouldShowTooltip && (
				<div
					style={{
						position: 'fixed',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						background: 'var(--ping-secondary-color, #f8f9fa)',
						border: `2px solid var(--ping-primary-color, #0066cc)`,
						borderRadius: 'var(--ping-border-radius-lg, 0.5rem)',
						padding: 'var(--ping-spacing-md, 1rem)',
						width: '400px',
						maxWidth: '90vw',
						boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
						zIndex: 1000,
						transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					{/* Title with security level */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
							marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
						}}
					>
						<h4
							style={{
								margin: 0,
								fontSize: '16px',
								fontWeight: '600',
								color: 'var(--ping-text-color, #1a1a1a)',
							}}
						>
							{content.title}
						</h4>
						{content.securityLevel && (
							<span
								style={{
									fontSize: '18px',
									lineHeight: 1,
								}}
								title={`Security level: ${content.securityLevel}`}
							>
								{MFAEducationServiceV8.getSecurityLevelIcon(content.securityLevel)}
							</span>
						)}
					</div>

					{/* Description */}
					<div
						style={{
							margin: '0 0 var(--ping-spacing-sm, 0.5rem) 0',
							fontSize: '14px',
							color: 'var(--ping-text-color, #1a1a1a)',
							lineHeight: '1.6',
						}}
					>
						{renderFormattedDescription(content.description)}
					</div>

					{/* Security note */}
					{content.securityNote && (
						<div
							style={{
								padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
								background: 'var(--ping-warning-color, #ffc107)',
								border: `1px solid var(--ping-warning-color, #ffc107)`,
								borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
								marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							<p
								style={{
									margin: 0,
									fontSize: '13px',
									color: 'var(--ping-text-color, #1a1a1a)',
									fontWeight: '500',
								}}
							>
								🔒 {content.securityNote}
							</p>
						</div>
					)}

					{/* Learn more link */}
					{content.learnMoreUrl && (
						<a
							href={content.learnMoreUrl}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-xs, 0.25rem)',
								fontSize: '13px',
								color: 'var(--ping-primary-color, #0066cc)',
								textDecoration: 'none',
								fontWeight: '500',
								transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
							}}
						>
							<span>Learn more in PingOne docs</span>
							{/* PING UI MIGRATION: Replaced FiExternalLink with MDI icon */}
							<MDIIcon icon="FiExternalLink" size={12} ariaLabel="External link" />
						</a>
					)}
				</div>
			)}

			{/* Modal (click mode) */}
			{displayMode === 'modal' && isOpen && (
				<div
					role="button"
					tabIndex={0}
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 2000,
						transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
					}}
					onClick={handleClose}
				>
					<div
						role="button"
						tabIndex={0}
						style={{
							background: 'var(--ping-secondary-color, #f8f9fa)',
							borderRadius: 'var(--ping-border-radius-lg, 0.5rem)',
							padding: 'var(--ping-spacing-xl, 2rem)',
							width: '500px',
							maxWidth: '90vw',
							maxHeight: '80vh',
							overflow: 'auto',
							boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
							transition: 'var(--ping-transition-normal, 0.2s ease-in-out)',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								marginBottom: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<div style={{ flex: 1 }}>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--ping-spacing-sm, 0.5rem)',
										marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
									}}
								>
									<h3
										style={{
											margin: 0,
											fontSize: '20px',
											fontWeight: '600',
											color: 'var(--ping-text-color, #1a1a1a)',
										}}
									>
										{content.title}
									</h3>
									{content.securityLevel && (
										<span
											style={{
												fontSize: '20px',
												lineHeight: 1,
											}}
											title={`Security level: ${content.securityLevel}`}
										>
											{MFAEducationServiceV8.getSecurityLevelIcon(content.securityLevel)}
										</span>
									)}
								</div>
								{content.securityLevel && (
									<div
										style={{
											display: 'inline-block',
											padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
											background: MFAEducationServiceV8.getSecurityLevelColor(
												content.securityLevel
											),
											color: 'white',
											borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
											fontSize: '11px',
											fontWeight: '600',
											textTransform: 'uppercase',
											letterSpacing: '0.5px',
										}}
									>
										{content.securityLevel} Security
									</div>
								)}
							</div>
							<button
								type="button"
								onClick={handleClose}
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: 'var(--ping-spacing-xs, 0.25rem)',
									color: 'var(--ping-text-color, #1a1a1a)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
								}}
								aria-label="Close"
							>
								{/* PING UI MIGRATION: Replaced FiX with MDI icon */}
								<MDIIcon icon="FiX" size={24} ariaLabel="Close modal" />
							</button>
						</div>

						{/* Description */}
						<div
							style={{
								margin: '0 0 var(--ping-spacing-md, 1rem) 0',
								fontSize: '15px',
								color: 'var(--ping-text-color, #1a1a1a)',
								lineHeight: '1.7',
							}}
						>
							{renderFormattedDescription(content.description)}
						</div>

						{/* Security note */}
						{content.securityNote && (
							<div
								style={{
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									background: 'var(--ping-warning-color, #ffc107)',
									border: `1px solid var(--ping-warning-color, #ffc107)`,
									borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
									marginBottom: 'var(--ping-spacing-md, 1rem)',
								}}
							>
								<p
									style={{
										margin: 0,
										fontSize: '14px',
										color: 'var(--ping-text-color, #1a1a1a)',
										fontWeight: '500',
										lineHeight: '1.6',
									}}
								>
									🔒 <strong>Security Note:</strong> {content.securityNote}
								</p>
							</div>
						)}

						{/* Learn more link */}
						{content.learnMoreUrl && (
							<div
								style={{
									marginTop: 'var(--ping-spacing-xl, 2rem)',
									paddingTop: 'var(--ping-spacing-md, 1rem)',
									borderTop: `1px solid var(--ping-border-color, #dee2e6)`,
								}}
							>
								<a
									href={content.learnMoreUrl}
									target="_blank"
									rel="noopener noreferrer"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 'var(--ping-spacing-sm, 0.5rem)',
										padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
										background: 'var(--ping-secondary-color, #f8f9fa)',
										border: `1px solid var(--ping-primary-color, #0066cc)`,
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										fontSize: '14px',
										color: 'var(--ping-primary-color, #0066cc)',
										textDecoration: 'none',
										fontWeight: '500',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.background =
											'var(--ping-hover-color, #f1f3f4)';
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.background =
											'var(--ping-secondary-color, #f8f9fa)';
									}}
								>
									<span>📚 Learn more in PingOne documentation</span>
									{/* PING UI MIGRATION: Replaced FiExternalLink with MDI icon */}
									<MDIIcon icon="FiExternalLink" size={14} ariaLabel="External link" />
								</a>
							</div>
						)}

						{/* Close button */}
						<div
							style={{
								marginTop: 'var(--ping-spacing-xl, 2rem)',
								display: 'flex',
								justifyContent: 'flex-end',
							}}
						>
							<button
								type="button"
								onClick={handleClose}
								style={{
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-lg, 1.5rem)',
									background: 'var(--ping-secondary-color, #f8f9fa)',
									border: `1px solid var(--ping-border-color, #dee2e6)`,
									borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
									fontSize: '14px',
									color: 'var(--ping-text-color, #1a1a1a)',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLElement).style.background =
										'var(--ping-hover-color, #f1f3f4)';
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLElement).style.background =
										'var(--ping-secondary-color, #f8f9fa)';
								}}
							>
								Got it
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MFAInfoButtonV8PingUI;
