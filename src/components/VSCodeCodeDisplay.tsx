// src/components/VSCodeCodeDisplay.tsx

import Prism from 'prismjs';
import React, { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiCopy, FiDownload } from 'react-icons/fi';
import styled from 'styled-components';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-python';
import {
	CodeExample,
	CodeExamplesConfig,
	CodeExamplesService,
	SupportedLanguage,
} from '../services/codeExamplesService';

// VS Code-inspired color scheme
const vscodeColors = {
	background: '#ffffff',
	text: '#000000',
	lineNumber: '#237893',
	comment: '#6a9955',
	keyword: '#0000ff',
	string: '#a31515',
	number: '#09885a',
	function: '#795e26',
	variable: '#001080',
	type: '#267f99',
	operator: '#000000',
	bracket: '#000000',
};

const Container = styled.div`
	background: ${vscodeColors.background};
	border-radius: 8px;
	border: 1px solid #e1e4e8;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
	background: #f8f9fa;
	padding: 0.75rem 1rem;
	border-bottom: 1px solid #e1e4e8;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #24292e;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const LanguageSelector = styled.div`
	display: flex;
	gap: 0.25rem;
	flex-wrap: wrap;
`;

const LanguageButton = styled.button<{ $active: boolean }>`
	padding: 0.25rem 0.5rem;
	border: 1px solid ${({ $active }) => ($active ? '#0366d6' : '#d1d5db')};
	border-radius: 4px;
	background: ${({ $active }) => ($active ? '#0366d6' : '#ffffff')};
	color: ${({ $active }) => ($active ? '#ffffff' : '#24292e')};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $active }) => ($active ? '#0256cc' : '#f6f8fa')};
		border-color: ${({ $active }) => ($active ? '#0256cc' : '#c7ccd1')};
	}
`;

const CodeContainer = styled.div`
	position: relative;
	max-height: 500px;
`;

const CodeHeader = styled.div`
	background: #f6f8fa;
	color: #586069;
	padding: 0.5rem 1rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 0.875rem;
	font-weight: 500;
	border-bottom: 1px solid #e1e4e8;
`;

const CodeTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
`;

const CodeActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	background: rgba(255, 255, 255, 0.8);
	border: 1px solid #d1d5db;
	border-radius: 4px;
	color: #24292e;
	font-size: 0.75rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f6f8fa;
		border-color: #c7ccd1;
	}
`;

const CodeBlock = styled.pre`
	margin: 0;
	padding: 1rem;
	background: ${vscodeColors.background};
	color: ${vscodeColors.text};
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow: auto;
	max-height: 400px;
	border: none;
	white-space: pre;

	/* Custom scrollbar styling */
	&::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 6px;
		border: 2px solid #f1f1f1;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: #a1a1a1;
	}

	&::-webkit-scrollbar-corner {
		background: #f1f1f1;
	}
`;

const CodeContent = styled.code`
	font-family: inherit;
	font-size: inherit;
	line-height: inherit;
	white-space: pre;
	word-wrap: normal;
	overflow-wrap: normal;
	
	/* Allow Prism.js classes to override */
	& * {
		font-family: inherit !important;
		font-size: inherit !important;
		line-height: inherit !important;
	}
	
	/* VS Code Light Theme syntax highlighting overrides */
	.token.comment,
	.token.prolog,
	.token.doctype,
	.token.cdata {
		color: #6a9955;
	}
	
	.token.punctuation {
		color: #000000;
	}
	
	.token.property,
	.token.tag,
	.token.constant,
	.token.symbol,
	.token.deleted {
		color: #0000ff;
	}
	
	.token.boolean,
	.token.number {
		color: #09885a;
	}
	
	.token.selector,
	.token.attr-name,
	.token.string,
	.token.char,
	.token.builtin,
	.token.inserted {
		color: #a31515;
	}
	
	.token.operator,
	.token.entity,
	.token.url,
	.token.variable {
		color: #000000;
	}
	
	.token.atrule,
	.token.attr-value,
	.token.function,
	.token.class-name {
		color: #795e26;
	}
	
	.token.keyword {
		color: #0000ff;
	}
	
	.token.regex,
	.token.important {
		color: #811f3f;
	}
`;

const DependenciesList = styled.div`
	background: #f6f8fa;
	padding: 0.75rem 1rem;
	border-top: 1px solid #e1e4e8;
	font-size: 0.875rem;
	color: #586069;
`;

const DependenciesTitle = styled.strong`
	color: #24292e;
	margin-right: 0.5rem;
`;

const ErrorState = styled.div`
	padding: 1.5rem;
	background: #ffeef0;
	border: 1px solid #f85149;
	border-radius: 6px;
	color: #cf222e;
	text-align: center;
`;

const getLanguageDisplayName = (language: SupportedLanguage): string => {
	const names: Record<SupportedLanguage, string> = {
		javascript: 'JavaScript',
		typescript: 'TypeScript',
		go: 'Go',
		ruby: 'Ruby',
		python: 'Python',
		'ping-sdk': 'Ping SDK',
	};
	return names[language];
};

const getLanguageIcon = (language: SupportedLanguage): string => {
	const icons: Record<SupportedLanguage, string> = {
		javascript: '🟨',
		typescript: '🔷',
		go: '🐹',
		ruby: '💎',
		python: '🐍',
		'ping-sdk': '🔐',
	};
	return icons[language];
};

// Basic syntax highlighting function using Prism.js
const highlightCode = (code: string, language: SupportedLanguage): JSX.Element => {
	let prismLanguage = language;

	// Map ping-sdk to typescript for highlighting
	if (language === 'ping-sdk') {
		prismLanguage = 'typescript';
	}

	// Use Prism.js to highlight the code
	const highlighted = Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);

	return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

interface VSCodeCodeDisplayProps {
	flowType: string;
	stepId: string;
	config?: Partial<CodeExamplesConfig>;
	className?: string;
}

export const VSCodeCodeDisplay: React.FC<VSCodeCodeDisplayProps> = ({
	flowType,
	stepId,
	config,
	className,
}) => {
	const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	const codeExamplesService = useMemo(() => new CodeExamplesService(config), [config]);

	const stepData = useMemo(() => {
		return codeExamplesService.getExamplesForStep(flowType, stepId);
	}, [codeExamplesService, flowType, stepId]);

	const availableLanguages = useMemo<SupportedLanguage[]>(() => {
		if (!stepData) {
			return [];
		}
		return stepData.examples.map((example) => example.language);
	}, [stepData]);

	useEffect(() => {
		if (!stepData || availableLanguages.length === 0) {
			return;
		}
		if (!availableLanguages.includes(selectedLanguage)) {
			setSelectedLanguage(availableLanguages[0]);
		}
	}, [stepData, availableLanguages, selectedLanguage]);

	const currentExample = useMemo<CodeExample | null>(() => {
		if (!stepData) return null;
		return (
			stepData.examples.find((example) => example.language === selectedLanguage) ||
			stepData.examples[0] ||
			null
		);
	}, [stepData, selectedLanguage]);

	const handleCopyCode = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopiedCode(code);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (err) {
			console.error('Failed to copy code:', err);
		}
	};

	const handleDownloadCode = (example: CodeExample) => {
		const extension =
			example.language === 'typescript'
				? 'ts'
				: example.language === 'javascript'
					? 'js'
					: example.language === 'go'
						? 'go'
						: example.language === 'ruby'
							? 'rb'
							: example.language === 'ping-sdk'
								? 'ts'
								: 'py';

		const filename = `${example.title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
		const blob = new Blob([example.code], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	if (!stepData) {
		return (
			<Container className={className}>
				<ErrorState>No code examples available for this step.</ErrorState>
			</Container>
		);
	}

	if (!currentExample) {
		return (
			<Container className={className}>
				<ErrorState>No code examples available for the selected language.</ErrorState>
			</Container>
		);
	}

	return (
		<Container className={className}>
			<Header>
				<Title>
					<FiCopy />
					{stepData.stepName} - VS Code Style Code Examples
				</Title>
				<LanguageSelector>
					{codeExamplesService.getSupportedLanguages().map((language) => {
						const isAvailable = availableLanguages.includes(language);
						return (
							<LanguageButton
								key={language}
								$active={selectedLanguage === language}
								onClick={() => isAvailable && setSelectedLanguage(language)}
								disabled={!isAvailable}
							>
								{getLanguageIcon(language)} {getLanguageDisplayName(language)}
							</LanguageButton>
						);
					})}
				</LanguageSelector>
			</Header>

			<CodeContainer>
				<CodeHeader>
					<CodeTitle>
						{getLanguageIcon(currentExample.language)} {currentExample.title}
					</CodeTitle>
					<CodeActions>
						<ActionButton onClick={() => handleCopyCode(currentExample.code)}>
							{copiedCode === currentExample.code ? <FiCheck /> : <FiCopy />}
							{copiedCode === currentExample.code ? 'Copied!' : 'Copy'}
						</ActionButton>
						<ActionButton onClick={() => handleDownloadCode(currentExample)}>
							<FiDownload />
							Download
						</ActionButton>
					</CodeActions>
				</CodeHeader>
				<CodeBlock>
					<CodeContent>{highlightCode(currentExample.code, currentExample.language)}</CodeContent>
				</CodeBlock>
				{currentExample.dependencies && currentExample.dependencies.length > 0 && (
					<DependenciesList>
						<DependenciesTitle>Dependencies:</DependenciesTitle>
						{currentExample.dependencies.join(', ')}
					</DependenciesList>
				)}
			</CodeContainer>
		</Container>
	);
};

export default VSCodeCodeDisplay;
