/**
 * @file MFAInfoButtonV8.tsx
 * @module v8/components
 * @description Info button component for MFA educational content
 * @version 8.0.0
 * @since 2024-11-23
 *
 * Provides "What's this?" style info buttons that display educational
 * content from MFAEducationServiceV8 in a modal or tooltip.
 *
 * @example
 * <MFAInfoButtonV8 contentKey="factor.sms" />
 * <MFAInfoButtonV8 contentKey="device.enrollment" displayMode="modal" />
 */

import React, { useMemo, useState } from 'react';
import { FiExternalLink, FiInfo, FiX } from 'react-icons/fi';
import { MFAEducationServiceV8 } from '@/v8/services/mfaEducationServiceV8';

const MODULE_TAG = '[ℹ️ MFA-INFO-BUTTON-V8]';

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
						margin: '8px 0 12px 20px',
						padding: 0,
						listStyle: 'disc',
					}}
				>
					{currentList.map((item, idx) => (
						<li
							key={idx}
							style={{
								margin: '4px 0',
								paddingLeft: '4px',
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
					<p key={`para-${elements.length}`} style={{ margin: '0 0 12px 0' }}>
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
				<strong key={`bold-${parts.length}`} style={{ fontWeight: '600', color: '#1f2937' }}>
					{match[1]}
				</strong>
			);
			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < text.length) {
			parts.push(text.substring(lastIndex));
		}

		return parts.length > 0 ? <>{parts}</> : text;
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

export interface MFAInfoButtonV8Props {
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
 * MFA Info Button V8
 *
 * Displays educational content from MFAEducationServiceV8 in either:
 * - Tooltip mode: Shows on hover (for quick reference)
 * - Modal mode: Shows on click (for detailed information)
 */
export const MFAInfoButtonV8: React.FC<MFAInfoButtonV8Props> = ({
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

	// Note: size prop is kept for backwards compatibility but not used in new "What is this?" style

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		if (stopPropagation) {
			event.preventDefault();
			event.stopPropagation();
		}
		console.log(`${MODULE_TAG} Info button clicked`, { contentKey, displayMode });
		if (displayMode === 'modal') {
			setIsOpen((prev) => !prev);
		}
	};

	const handleClose = () => {
		setIsOpen(false);
	};

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
	}, [isOpen, displayMode]);

	// Show tooltip on hover (tooltip mode only)
	const shouldShowTooltip = displayMode === 'tooltip' && (isHovered || isOpen);

	const commonStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '4px',
		padding: '4px 8px',
		background: isHovered || isOpen ? '#dbeafe' : '#eff6ff',
		borderRadius: '4px',
		fontSize: '12px',
		color: '#1e40af', // Dark blue text on light background
		fontWeight: '500',
		cursor: 'pointer',
		transition: 'all 0.2s ease',
		verticalAlign: 'middle',
		marginLeft: '6px',
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
			<FiInfo size={14} />
			<span>{label || 'What is this?'}</span>
		</button>
	);

	return (
		<>
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
						background: '#ffffff' /* Light background */,
						border: '2px solid #3b82f6',
						borderRadius: '8px',
						padding: '16px',
						width: '400px',
						maxWidth: '90vw',
						boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
						zIndex: 1000,
						animation: 'fadeIn 0.2s ease-in-out',
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<style>{`
						@keyframes fadeIn {
							from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
							to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
						}
					`}</style>

					{/* Title with security level */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
						<h4
							style={{
								margin: 0,
								fontSize: '16px',
								fontWeight: '600',
								color: '#1f2937' /* Dark text */,
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
							margin: '0 0 12px 0',
							fontSize: '14px',
							color: '#6b7280' /* Dark text on light background */,
							lineHeight: '1.6',
						}}
					>
						{renderFormattedDescription(content.description)}
					</div>

					{/* Security note */}
					{content.securityNote && (
						<div
							style={{
								padding: '10px 12px',
								background: '#fef3c7' /* Light yellow background */,
								border: '1px solid #f59e0b',
								borderRadius: '6px',
								marginBottom: '12px',
							}}
						>
							<p
								style={{
									margin: 0,
									fontSize: '13px',
									color: '#92400e' /* Dark text on light background */,
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
								gap: '4px',
								fontSize: '13px',
								color: '#3b82f6',
								textDecoration: 'none',
								fontWeight: '500',
							}}
						>
							<span>Learn more in PingOne docs</span>
							<FiExternalLink size={12} />
						</a>
					)}
				</div>
			)}

			{/* Modal (click mode) */}
			{displayMode === 'modal' && isOpen && (
				<div
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
						animation: 'fadeIn 0.2s ease-in-out',
					}}
					onClick={handleClose}
				>
					<div
						style={{
							background: '#ffffff' /* Light background */,
							borderRadius: '12px',
							padding: '24px',
							width: '500px',
							maxWidth: '90vw',
							maxHeight: '80vh',
							overflow: 'auto',
							boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
							animation: 'slideUp 0.3s ease-out',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<style>{`
							@keyframes slideUp {
								from { opacity: 0; transform: translateY(20px); }
								to { opacity: 1; transform: translateY(0); }
							}
						`}</style>

						{/* Header */}
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								marginBottom: '16px',
							}}
						>
							<div style={{ flex: 1 }}>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
								>
									<h3
										style={{
											margin: 0,
											fontSize: '20px',
											fontWeight: '600',
											color: '#1f2937' /* Dark text */,
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
											padding: '4px 8px',
											background: MFAEducationServiceV8.getSecurityLevelColor(
												content.securityLevel
											),
											color: 'white',
											borderRadius: '4px',
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
									padding: '4px',
									color: '#6b7280' /* Dark text */,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
								aria-label="Close"
							>
								<FiX size={24} />
							</button>
						</div>

						{/* Description */}
						<div
							style={{
								margin: '0 0 16px 0',
								fontSize: '15px',
								color: '#374151' /* Dark text */,
								lineHeight: '1.7',
							}}
						>
							{renderFormattedDescription(content.description)}
						</div>

						{/* Security note */}
						{content.securityNote && (
							<div
								style={{
									padding: '12px 16px',
									background: '#fef3c7' /* Light yellow background */,
									border: '1px solid #f59e0b',
									borderRadius: '8px',
									marginBottom: '16px',
								}}
							>
								<p
									style={{
										margin: 0,
										fontSize: '14px',
										color: '#92400e' /* Dark text */,
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
								style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}
							>
								<a
									href={content.learnMoreUrl}
									target="_blank"
									rel="noopener noreferrer"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '6px',
										padding: '10px 16px',
										background: '#eff6ff' /* Light blue background */,
										border: '1px solid #3b82f6',
										borderRadius: '6px',
										fontSize: '14px',
										color: '#1e40af' /* Dark blue text */,
										textDecoration: 'none',
										fontWeight: '500',
										transition: 'all 0.2s ease',
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.background = '#dbeafe';
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.background = '#eff6ff';
									}}
								>
									<span>📚 Learn more in PingOne documentation</span>
									<FiExternalLink size={14} />
								</a>
							</div>
						)}

						{/* Close button */}
						<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
							<button
								type="button"
								onClick={handleClose}
								style={{
									padding: '10px 20px',
									background: '#f3f4f6' /* Light grey background */,
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									color: '#374151' /* Dark text */,
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLElement).style.background = '#e5e7eb';
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLElement).style.background = '#f3f4f6';
								}}
							>
								Got it
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default MFAInfoButtonV8;
