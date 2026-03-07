// src/components/CodeExamplesDisplay.tsx

import { FiCheck, FiCode, FiCopy, FiDownload } from '@icons';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
	CodeExample,
	CodeExamplesConfig,
	CodeExamplesService,
	SupportedLanguage,
} from '../services/codeExamplesService';
import { logger } from '../utils/logger';

interface CodeExamplesDisplayProps {
	flowType: string;
	stepId: string;
	config?: Partial<CodeExamplesConfig>;
	className?: string;
}

const Container = styled.div`
	background: V9_COLORS.TEXT.WHITE;
	border-radius: 12px;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	overflow: hidden;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const LanguageSelector = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
`;

const LanguageButton = styled.button<{ $active: boolean }>`
	padding: 0.375rem 0.75rem;
	border: 1px solid ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.BLUE' : 'V9_COLORS.TEXT.GRAY_LIGHTER')};
	border-radius: 6px;
	background: ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.BLUE' : 'V9_COLORS.TEXT.WHITE')};
	color: ${({ $active }) => ($active ? 'V9_COLORS.TEXT.WHITE' : 'V9_COLORS.TEXT.GRAY_DARK')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;

	&:hover {
		background: ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.BLUE_DARK' : '#f3f4f6')};
		border-color: ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.BLUE_DARK' : 'V9_COLORS.TEXT.GRAY_LIGHT')};
	}
`;

const CodeContainer = styled.div`
	position: relative;
`;

const CodeHeader = styled.div`
	background: V9_COLORS.TEXT.GRAY_DARK;
	color: #f9fafb;
	padding: 0.75rem 1rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 0.875rem;
	font-weight: 500;
`;

const CodeTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CodeActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 4px;
	color: #f9fafb;
	font-size: 0.75rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
	}
`;

const CodeBlock = styled.pre`
	margin: 0;
	padding: 1.5rem;
	background: V9_COLORS.TEXT.GRAY_DARK;
	color: #f9fafb;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow: auto;
	max-height: 600px;
	white-space: pre;
	word-wrap: normal;
	overflow-wrap: normal;

	/* Custom scrollbar styling for better visibility */
	&::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	&::-webkit-scrollbar-track {
		background: V9_COLORS.TEXT.GRAY_MEDIUM;
		border-radius: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 6px;
		border: 2px solid V9_COLORS.TEXT.GRAY_MEDIUM;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}

	&::-webkit-scrollbar-corner {
		background: V9_COLORS.TEXT.GRAY_MEDIUM;
	}
`;

const DependenciesList = styled.div`
	background: #f3f4f6;
	padding: 0.75rem 1rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	font-size: 0.875rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const DependenciesTitle = styled.strong`
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-right: 0.5rem;
`;

const EmptyState = styled.div`
	padding: 3rem 1.5rem;
	text-align: center;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const ErrorState = styled.div`
	padding: 1.5rem;
	background: V9_COLORS.BG.ERROR;
	border: 1px solid V9_COLORS.BG.ERROR_BORDER;
	border-radius: 8px;
	color: V9_COLORS.PRIMARY.RED_DARK;
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

export const CodeExamplesDisplay: React.FC<CodeExamplesDisplayProps> = ({
	flowType,
	stepId,
	config,
	className,
}) => {
	const [selectedLanguages, setSelectedLanguages] = useState<SupportedLanguage[]>(['javascript']);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	const codeExamplesService = useMemo(() => new CodeExamplesService(config), [config]);

	const stepData = useMemo(() => {
		return codeExamplesService.getExamplesForStep(flowType, stepId);
	}, [codeExamplesService, flowType, stepId]);

	const filteredExamples = useMemo(() => {
		if (!stepData) return [];
		return codeExamplesService.filterExamplesByLanguage(stepData.examples, selectedLanguages);
	}, [stepData, selectedLanguages, codeExamplesService]);

	const handleLanguageToggle = (language: SupportedLanguage) => {
		setSelectedLanguages((prev) =>
			prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]
		);
	};

	const handleCopyCode = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopiedCode(code);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (err) {
			logger.error('CodeExamplesDisplay', 'Failed to copy code:', undefined, err as Error);
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

	return (
		<Container className={className}>
			<Header>
				<Title>
					<FiCode />
					{stepData.stepName} - Code Examples
				</Title>
				<LanguageSelector>
					{codeExamplesService.getSupportedLanguages().map((language) => (
						<LanguageButton
							key={language}
							$active={selectedLanguages.includes(language)}
							onClick={() => handleLanguageToggle(language)}
						>
							{getLanguageIcon(language)} {getLanguageDisplayName(language)}
						</LanguageButton>
					))}
				</LanguageSelector>
			</Header>

			{filteredExamples.length === 0 ? (
				<EmptyState>No examples selected. Choose one or more languages above.</EmptyState>
			) : (
				filteredExamples.map((example, index) => (
					<CodeContainer key={`${example.language}-${index}`}>
						<CodeHeader>
							<CodeTitle>
								{getLanguageIcon(example.language)} {example.title}
							</CodeTitle>
							<CodeActions>
								<ActionButton onClick={() => handleCopyCode(example.code)}>
									{copiedCode === example.code ? <FiCheck /> : <FiCopy />}
									{copiedCode === example.code ? 'Copied!' : 'Copy'}
								</ActionButton>
								<ActionButton onClick={() => handleDownloadCode(example)}>
									<FiDownload />
									Download
								</ActionButton>
							</CodeActions>
						</CodeHeader>
						<CodeBlock>{example.code}</CodeBlock>
						{example.dependencies && example.dependencies.length > 0 && (
							<DependenciesList>
								<DependenciesTitle>Dependencies:</DependenciesTitle>
								{example.dependencies.join(', ')}
							</DependenciesList>
						)}
					</CodeContainer>
				))
			)}
		</Container>
	);
};

export default CodeExamplesDisplay;
