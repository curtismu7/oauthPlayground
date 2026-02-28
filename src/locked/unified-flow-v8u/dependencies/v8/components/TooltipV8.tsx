/**
 * @file TooltipV8.tsx
 * @module v8/components
 * @description Reusable tooltip component for UI guidance
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useState } from 'react';
import { FiInfo } from '@icons';

export interface TooltipV8Props {
	title: string;
	content: string | React.ReactNode;
	children?: React.ReactNode;
	position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TooltipV8: React.FC<TooltipV8Props> = ({
	title,
	content,
	children,
	position = 'bottom',
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const getPositionStyles = () => {
		switch (position) {
			case 'top':
				return {
					bottom: '100%',
					left: '50%',
					transform: 'translateX(-50%)',
					marginBottom: '8px',
				};
			case 'left':
				return {
					right: '100%',
					top: '50%',
					transform: 'translateY(-50%)',
					marginRight: '8px',
				};
			case 'right':
				return {
					left: '100%',
					top: '50%',
					transform: 'translateY(-50%)',
					marginLeft: '8px',
				};
			default:
				return {
					top: '100%',
					left: '50%',
					transform: 'translateX(-50%)',
					marginTop: '8px',
				};
		}
	};

	// Show tooltip on hover or click
	const shouldShowTooltip = isOpen || isHovered;

	return (
		<span
			style={{
				position: 'relative',
				display: 'inline',
				marginLeft: '2px',
				verticalAlign: 'middle',
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				onBlur={() => setTimeout(() => setIsOpen(false), 200)}
				style={{
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					padding: '0',
					margin: '0',
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: isHovered || isOpen ? '#3b82f6' : '#6b7280',
					transition: 'all 0.2s ease',
					verticalAlign: 'middle',
				}}
				aria-label={`Help: ${title}`}
			>
				<FiInfo size={16} />
			</button>

			{shouldShowTooltip && (
				<div
					style={{
						position: 'absolute',
						...getPositionStyles(),
						background: '#ffffff',
						border: '2px solid #3b82f6',
						borderRadius: '8px',
						padding: '12px',
						width: '300px',
						boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
						zIndex: 1000,
						animation: 'fadeIn 0.2s ease-in-out',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<style>{`
						@keyframes fadeIn {
							from {
								opacity: 0;
								transform: translateX(-50%) translateY(-5px);
							}
							to {
								opacity: 1;
								transform: translateX(-50%) translateY(0);
							}
						}
					`}</style>
					<h4
						style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}
					>
						{title}
					</h4>
					<div
						style={{
							fontSize: '13px',
							color: '#6b7280',
							lineHeight: '1.5',
							marginBottom: isOpen ? '8px' : '0',
						}}
					>
						{content}
					</div>
					{isOpen && (
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							style={{
								padding: '4px 8px',
								background: '#f3f4f6',
								border: '1px solid #d1d5db',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
								color: '#374151',
								fontWeight: '500',
								transition: 'background-color 0.2s ease',
							}}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLElement).style.backgroundColor = '#e5e7eb';
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
							}}
						>
							Close
						</button>
					)}
				</div>
			)}

			{children}
		</span>
	);
};

export default TooltipV8;
