// src/components/ColoredJsonDisplay.tsx
// Reusable component for displaying colored JSON with collapsible functionality using VS Code style

import React, { useState } from 'react';
import styled from 'styled-components';
import { VSCODE_COLORS } from '../services/codeHighlightingService';
import { FiChevronDown, FiChevronUp } from '../services/commonImportsService';
import { CopyButtonService } from '../services/copyButtonService';
import JSONHighlighter, { JSONData } from './JSONHighlighter';

interface ColoredJsonDisplayProps {
	data: unknown;
	label?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	maxHeight?: string;
	showCopyButton?: boolean;
}

// VS Code styles will be injected via styled-components in JsonContent

const JsonContainer = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
`;

const JsonHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.75rem;
	
	h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #1F2937;
		font-weight: 600;
	}
`;

const JsonHeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const JsonContentWrapper = styled.div<{ $isExpanded: boolean; $maxHeight?: string }>`
	position: relative;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
	
	${({ $isExpanded, $maxHeight }) =>
		!$isExpanded && $maxHeight
			? `
				max-height: ${$maxHeight};
				overflow-y: hidden;
				mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);
				-webkit-mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);
			`
			: $isExpanded
				? 'max-height: none; overflow-y: visible;'
				: ''}
`;

const StyledHighlighter = styled(JSONHighlighter)`
	background: ${VSCODE_COLORS.background};
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 1rem;
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-word;
	position: relative;
	overflow-x: auto;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
	margin: 0;
	color: ${VSCODE_COLORS.text};
`;

const CollapseButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	border-radius: 4px;
	border: 1px solid #d1d5db;
	background: white;
	color: #374151;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}
`;

export const ColoredJsonDisplay: React.FC<ColoredJsonDisplayProps> = ({
	data,
	label = 'JSON Response',
	collapsible = true,
	defaultCollapsed = false,
	maxHeight = '300px',
	showCopyButton = true,
}) => {
	const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

	const jsonString = JSON.stringify(data, null, 2);
	const normalizedData: JSONData =
		data === undefined ? ('No data to display' as JSONData) : (data as JSONData);

	return (
		<JsonContainer>
			<JsonHeader>
				<h3>{label}</h3>
				<JsonHeaderActions>
					{showCopyButton && (
						<CopyButtonService
							text={jsonString}
							label={label}
							size="sm"
							variant="secondary"
							showLabel={false}
						/>
					)}
					{collapsible && (
						<CollapseButton onClick={() => setIsExpanded(!isExpanded)}>
							{isExpanded ? (
								<>
									<FiChevronUp />
									Show Less
								</>
							) : (
								<>
									<FiChevronDown />
									Show More
								</>
							)}
						</CollapseButton>
					)}
				</JsonHeaderActions>
			</JsonHeader>
			<JsonContentWrapper $isExpanded={isExpanded} $maxHeight={maxHeight}>
				<StyledHighlighter data={normalizedData} />
			</JsonContentWrapper>
		</JsonContainer>
	);
};
