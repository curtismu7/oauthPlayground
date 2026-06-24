// src/flows2/framework/CodeBlock.tsx
//
// Dark monospace code display with a copy-to-clipboard button. JsonView wraps
// CodeBlock to pretty-print arbitrary data. Both match the code box style in FlowResult.

import React, { useState } from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
`;

const LabelRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
`;

const BlockLabel = styled.div`
	font-size: 0.8rem;
	font-weight: 700;
	color: ${tokens.color.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;

const CopyButton = styled.button<{ $copied: boolean }>`
	font-size: 0.75rem;
	font-weight: 600;
	padding: 0.2rem 0.55rem;
	border-radius: ${tokens.radius.sm};
	cursor: pointer;
	border: 1px solid ${({ $copied }) => ($copied ? tokens.color.successBorder : tokens.color.borderSubtle)};
	background: ${({ $copied }) => ($copied ? tokens.color.successBg : tokens.color.bgSubtle)};
	color: ${({ $copied }) => ($copied ? tokens.color.successHover : tokens.color.textMuted)};
	transition: all 0.15s ease;
	white-space: nowrap;
`;

const Pre = styled.pre`
	margin: 0;
	background: ${tokens.color.codeBg};
	color: ${tokens.color.codeText};
	border: 1px solid ${tokens.color.codeBorder};
	border-radius: ${tokens.radius.lg};
	padding: ${tokens.space.lg};
	font-size: 0.8rem;
	line-height: 1.5;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-word;
`;

export interface CodeBlockProps {
	value: string;
	label?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ value, label }) => {
	const [copied, setCopied] = useState(false);
	const [copyError, setCopyError] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(value).then(() => {
			setCopied(true);
			setCopyError(false);
			setTimeout(() => setCopied(false), 1800);
		}).catch(() => {
			setCopyError(true);
			setTimeout(() => setCopyError(false), 2000);
		});
	};

	return (
		<Wrap>
			{(label ?? true) && (
				<LabelRow>
					{label && <BlockLabel>{label}</BlockLabel>}
					<CopyButton $copied={copied} onClick={handleCopy}>
						{copyError ? 'Copy failed' : copied ? 'Copied' : 'Copy'}
					</CopyButton>
				</LabelRow>
			)}
			<Pre>{value}</Pre>
		</Wrap>
	);
};

export interface JsonViewProps {
	data: unknown;
	label?: string;
}

export const JsonView: React.FC<JsonViewProps> = ({ data, label }) => {
	const text = JSON.stringify(data, null, 2);
	return <CodeBlock value={text} label={label} />;
};
