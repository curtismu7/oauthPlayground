// src/components/CodeExamplesInline.tsx

import React, { useMemo, useState } from 'react';
import { FiCheck, FiChevronDown, FiCode, FiCopy } from 'react-icons/fi';
import styled from 'styled-components';
import {
	CodeExample,
	CodeExamplesConfig,
	CodeExamplesService,
	SupportedLanguage,
} from '../services/codeExamplesService';
import VSCodeCodeDisplay from './VSCodeCodeDisplay';

interface CodeExamplesInlineProps {
	flowType: string;
	stepId: string;
	config?: Partial<CodeExamplesConfig>;
	className?: string;
	compact?: boolean;
}

const Container = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	overflow: hidden;
`;

const ToggleButton = styled.button<{ $isOpen: boolean }>`
	width: 100%;
	padding: 0.75rem 1rem;
	background: ${({ $isOpen }) => ($isOpen ? '#e2e8f0' : '#f8fafc')};
	border: none;
	border-bottom: ${({ $isOpen }) => ($isOpen ? '1px solid #e2e8f0' : 'none')};
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	transition: all 0.2s ease;
	font-weight: 500;
	color: #374151;

	&:hover {
		background: #e2e8f0;
	}
`;

const ToggleContent = styled.div<{ $isOpen: boolean }>`
	max-height: ${({ $isOpen }) => ($isOpen ? '1000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease;
`;

const QuickCodePreview = styled.div`
	padding: 1rem;
	background: #1f2937;
	color: #f9fafb;
	border-radius: 6px;
	margin: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	overflow-y: auto;
	max-height: 300px;
	position: relative;

	/* Custom scrollbar styling */
	&::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	&::-webkit-scrollbar-track {
		background: #2d3748;
		border-radius: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 6px;
		border: 2px solid #2d3748;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}

	&::-webkit-scrollbar-corner {
		background: #2d3748;
	}
`;

const CopyButton = styled.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	padding: 0.25rem 0.5rem;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 4px;
	color: #f9fafb;
	font-size: 0.75rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
`;

const LanguageTabs = styled.div`
	display: flex;
	gap: 0.25rem;
	padding: 0.75rem 1rem 0;
	background: #f8fafc;
`;

const LanguageTab = styled.button<{ $active: boolean }>`
	padding: 0.375rem 0.75rem;
	background: ${({ $active }) => ($active ? '#3b82f6' : '#ffffff')};
	color: ${({ $active }) => ($active ? '#ffffff' : '#374151')};
	border: 1px solid ${({ $active }) => ($active ? '#3b82f6' : '#d1d5db')};
	border-radius: 6px 6px 0 0;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
	cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

	&:hover {
		background: ${({ $active, disabled }) =>
			disabled ? '#ffffff' : $active ? '#2563eb' : '#f3f4f6'};
	}
`;

const getLanguageDisplayName = (language: SupportedLanguage): string => {
	const names: Record<SupportedLanguage, string> = {
		javascript: 'JS',
		typescript: 'TS',
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

export const CodeExamplesInline: React.FC<CodeExamplesInlineProps> = ({
	flowType,
	stepId,
	config,
	className,
	compact = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
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

	const currentExample = useMemo<CodeExample | null>(() => {
		if (!stepData) return null;
		return (
			stepData.examples.find((example) => example.language === selectedLanguage) ||
			stepData.examples[0] ||
			null
		);
	}, [stepData, selectedLanguage]);

	const getQuickPreview = (code: string): string => {
		const lines = code.split('\n');
		return (
			lines.slice(0, 8).join('\n') + (lines.length > 8 ? '\n// ... (click to see full code)' : '')
		);
	};

	const handleCopyCode = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopiedCode(code);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (err) {
			console.error('Failed to copy code:', err);
		}
	};

	if (compact) {
		return (
			<Container className={className}>
				<ToggleButton $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
					<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiCode />
						Code Examples
					</span>
					<FiChevronDown
						style={{
							transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.2s ease',
						}}
					/>
				</ToggleButton>

				<ToggleContent $isOpen={isOpen}>
					<LanguageTabs>
						{(codeExamplesService.getSupportedLanguages() as SupportedLanguage[]).map((lang) => {
							const isAvailable = availableLanguages.includes(lang);
							return (
								<LanguageTab
									key={lang}
									$active={selectedLanguage === lang}
									onClick={() => isAvailable && setSelectedLanguage(lang)}
									disabled={!isAvailable}
								>
									{getLanguageIcon(lang)} {getLanguageDisplayName(lang)}
								</LanguageTab>
							);
						})}
					</LanguageTabs>

					<QuickCodePreview>
						<CopyButton
							onClick={() =>
								handleCopyCode(
									currentExample?.code ||
										'// Code examples will be loaded here\n// Select a language tab above\n// Click "Show Code Examples" to see full implementation'
								)
							}
						>
							{copiedCode ? <FiCheck /> : <FiCopy />}
							{copiedCode ? 'Copied!' : 'Copy'}
						</CopyButton>
						<pre>
							{currentExample
								? getQuickPreview(currentExample.code)
								: getQuickPreview(
										'// Code examples will be loaded here\n// Select a language tab above\n// Click "Show Code Examples" to see full implementation'
									)}
						</pre>
					</QuickCodePreview>
				</ToggleContent>
			</Container>
		);
	}

	return (
		<Container className={className}>
			<ToggleButton $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
				<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiCode />
					Code Examples ({flowType} - {stepId})
				</span>
				<FiChevronDown
					style={{
						transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
						transition: 'transform 0.2s ease',
					}}
				/>
			</ToggleButton>

			<ToggleContent $isOpen={isOpen}>
				<VSCodeCodeDisplay
					flowType={flowType}
					stepId={stepId}
					config={config ?? {}}
					className="inline-vscode-display"
				/>
			</ToggleContent>
		</Container>
	);
};

export default CodeExamplesInline;
