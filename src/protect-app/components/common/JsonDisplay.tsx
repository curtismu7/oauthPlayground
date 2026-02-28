/**
 * @file JsonDisplay.tsx
 * @module protect-app/components/common
 * @description Collapsible JSON display component for API data
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Follows SWE-15 principles:
 * - Single Responsibility: Only displays JSON data with collapsible functionality
 * - Interface Segregation: Minimal props, focused functionality
 * - Dependency Inversion: Depends on theme abstraction, not concrete implementation
 */

import React, { useState } from 'react';
import { FiCheck, FiChevronDown, FiChevronRight, FiCopy } from '@icons';
import { useTheme } from '../../contexts/ThemeContext';

interface JsonDisplayProps {
	/** JSON data to display */
	data: unknown;
	/** Section title */
	title: string;
	/** Whether to show copy button */
	showCopy?: boolean;
	/** Maximum height for the display */
	maxHeight?: string;
	/** Whether to start expanded */
	defaultExpanded?: boolean;
}

export const JsonDisplay: React.FC<JsonDisplayProps> = ({
	data,
	title,
	showCopy = true,
	maxHeight = '200px',
	defaultExpanded = false,
}) => {
	const { currentTheme } = useTheme();
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const [copied, setCopied] = useState(false);

	const formatJson = (obj: unknown): string => {
		try {
			return JSON.stringify(obj, null, 2);
		} catch {
			return String(obj);
		}
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(formatJson(data));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy JSON:', error);
		}
	};

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<div className="border-b" style={{ borderColor: currentTheme.colors.textSecondary }}>
			{/* Header */}
			<div className="flex items-center justify-between p-3">
				<button
					type="button"
					className="flex items-center space-x-2 text-left flex-1"
					onClick={toggleExpanded}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							toggleExpanded();
						}
					}}
					style={{
						backgroundColor: 'transparent',
						border: 'none',
						color: currentTheme.colors.textSecondary,
						cursor: 'pointer',
						outline: 'none',
					}}
				>
					<span className="text-xs">
						{isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
					</span>
					<h4
						className="text-xs font-semibold uppercase tracking-wider"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						{title}
					</h4>
				</button>

				{showCopy && (
					<button
						type="button"
						onClick={handleCopy}
						className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors"
						style={{
							backgroundColor: copied
								? `${currentTheme.colors.success}20`
								: `${currentTheme.colors.primary}20`,
							color: copied ? currentTheme.colors.success : currentTheme.colors.primary,
							border: 'none',
							cursor: 'pointer',
							outline: 'none',
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleCopy();
							}
						}}
					>
						{copied ? <FiCheck size={10} /> : <FiCopy size={10} />}
						<span>{copied ? 'Copied!' : 'Copy'}</span>
					</button>
				)}
			</div>

			{/* Collapsible Content */}
			{isExpanded && (
				<div className="p-3">
					<pre
						className="text-xs p-2 rounded overflow-x-auto"
						style={{
							backgroundColor: `${currentTheme.colors.background}50`,
							color: currentTheme.colors.text,
							border: `1px solid ${currentTheme.colors.textSecondary}30`,
							maxHeight: maxHeight,
							overflow: 'auto',
							fontFamily: 'Monaco, Consolas, "Courier New", monospace',
							lineHeight: '1.4',
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}
					>
						{formatJson(data)}
					</pre>
				</div>
			)}
		</div>
	);
};
