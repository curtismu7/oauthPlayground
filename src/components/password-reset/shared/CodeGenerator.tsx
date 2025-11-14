// src/components/password-reset/shared/CodeGenerator.tsx
// Shared code generator component for password reset tabs

import React, { useState } from 'react';
import {
	getVSCodeStyles,
	highlightCode,
	VSCODE_COLORS,
} from '../../../services/codeHighlightingService';
import {
	FiChevronDown,
	FiChevronUp,
	FiCode,
	FiCopy,
	styled,
} from '../../../services/commonImportsService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';

const CodeGeneratorSection = styled.div`
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-top: 2rem;
`;

const CodeHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
`;

const HeaderLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CodeTitle = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1F2937;
	margin: 0;
`;

const CodeActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const CollapseToggle = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 0.375rem;
	border: 1px solid #d1d5db;
	background: #ffffff;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		border-color: #9ca3af;
	}
`;

const CodeButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #D1D5DB;
	border-radius: 0.375rem;
	background: #ffffff;
	color: #374151;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		background: #F3F4F6;
		border-color: #9CA3AF;
	}
`;

const CodeContainer = styled.div<{ $isExpanded: boolean }>`
	position: relative;
	max-height: ${(props) => (props.$isExpanded ? 'none' : '300px')};
	overflow: ${(props) => (props.$isExpanded ? 'visible' : 'hidden')};
	transition: max-height 0.3s ease;
	margin-bottom: 1rem;
	
	${(props) =>
		!props.$isExpanded &&
		`
		mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);
	`}
`;

const CodeBlock = styled.pre`
	background: ${VSCODE_COLORS.background};
	padding: 1rem;
	color: ${VSCODE_COLORS.text};
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 0;
	white-space: pre;
	word-wrap: normal;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	
	${getVSCodeStyles()}
	
	code {
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		white-space: pre;
		word-wrap: normal;
		overflow-wrap: normal;
		
		& * {
			font-family: inherit !important;
			font-size: inherit !important;
			line-height: inherit !important;
		}
	}
`;

const CodeCollapseButton = styled.button`
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
	margin-bottom: 1rem;
	
	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}
`;

interface CodeGeneratorProps {
	code: string;
	onGenerate: () => void;
}

export const CodeGenerator: React.FC<CodeGeneratorProps> = ({ code, onGenerate }) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const [copied, setCopied] = useState(false);
	const [showCode, setShowCode] = useState(!!code);
	const [isCollapsed, setIsCollapsed] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			v4ToastManager.showSuccess('Code copied to clipboard!');
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy code:', error);
			v4ToastManager.showError('Failed to copy code to clipboard');
		}
	};

	const handleGenerate = () => {
		onGenerate();
		setShowCode(true);
		setIsExpanded(true);
	};

	const toggleCollapse = () => {
		setIsCollapsed(prev => !prev);
	};

	if (!showCode) {
		return (
			<CodeGeneratorSection>
				<CodeHeader>
					<HeaderLeft>
						<CollapseToggle
							type="button"
							onClick={toggleCollapse}
							aria-label={isCollapsed ? 'Expand code generator' : 'Collapse code generator'}
							aria-expanded={!isCollapsed}
						>
							{isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
						</CollapseToggle>
						<CodeTitle>
							<FiCode />
							JavaScript Code Generator
						</CodeTitle>
					</HeaderLeft>
					<CodeActions>
						<CodeButton onClick={handleGenerate}>
							<FiCode />
							Generate Code
						</CodeButton>
					</CodeActions>
				</CodeHeader>
				{!isCollapsed && (
					<p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>
						Generate sample JavaScript to call this PingOne API.
					</p>
				)}
			</CodeGeneratorSection>
		);
	}

	return (
		<CodeGeneratorSection>
			<CodeHeader>
				<HeaderLeft>
					<CollapseToggle
						type="button"
						onClick={toggleCollapse}
						aria-label={isCollapsed ? 'Expand code generator' : 'Collapse code generator'}
						aria-expanded={!isCollapsed}
					>
						{isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
					</CollapseToggle>
					<CodeTitle>
						<FiCode />
						JavaScript Code Generator
					</CodeTitle>
				</HeaderLeft>
				<CodeActions>
					<CodeButton onClick={handleGenerate}>
						<FiCode />
						Regenerate Code
					</CodeButton>
				</CodeActions>
			</CodeHeader>
			{!isCollapsed && code && (
				<>
					<CodeContainer $isExpanded={isExpanded}>
						<CodeBlock>
							<code
								className="language-javascript"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: highlightCode returns sanitized HTML for syntax highlighting
								dangerouslySetInnerHTML={{ __html: highlightCode(code, 'javascript') }}
							/>
						</CodeBlock>
					</CodeContainer>
					{!isExpanded && (
						<CodeCollapseButton onClick={() => setIsExpanded(true)}>
							<FiChevronDown />
							Show More
						</CodeCollapseButton>
					)}
					{isExpanded && (
						<CodeCollapseButton onClick={() => setIsExpanded(false)}>
							<FiChevronUp />
							Show Less
						</CodeCollapseButton>
					)}
					<CodeActions>
						<CodeButton onClick={handleCopy}>
							<FiCopy />
							{copied ? 'Copied!' : 'Copy Code'}
						</CodeButton>
						<CodeButton onClick={() => setShowCode(false)}>Hide Code</CodeButton>
					</CodeActions>
				</>
			)}
		</CodeGeneratorSection>
	);
};
