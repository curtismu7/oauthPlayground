import React, { useState } from 'react';
import styled from 'styled-components';
import { COLORS } from '../platform/ColorStandards';

const SectionContainer = styled.div`
	margin-top: 2rem;
	border: 1px solid ${COLORS.BORDER.GRAY};
	border-radius: 8px;
	overflow: hidden;
`;

const SectionHeader = styled.div`
	background: ${COLORS.PRIMARY.RED_DARK};
	color: ${COLORS.TEXT.WHITE};
	padding: 1rem 1.5rem;
	font-size: 1.125rem;
	font-weight: 600;
`;

const SectionBody = styled.div`
	padding: 1.5rem;
	background: ${COLORS.BG.WHITE};
`;

const CodeBlock = styled.pre`
	background: ${COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 6px;
	padding: 1rem;
	overflow-x: auto;
	font-size: 0.875rem;
	line-height: 1.6;
	margin: 0;

	code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
		color: ${COLORS.TEXT.GRAY_DARK};
	}
`;

const ExampleTitle = styled.h4`
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: ${COLORS.TEXT.BLACK};
`;

const ExampleDescription = styled.p`
	margin: 0 0 1rem 0;
	color: ${COLORS.TEXT.GRAY_MEDIUM};
	font-size: 0.875rem;
	line-height: 1.5;
`;

const ExampleContainer = styled.div`
	&:not(:last-child) {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid ${COLORS.BORDER.GRAY};
	}
`;

const TabContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1rem;
	border-bottom: 2px solid ${COLORS.BORDER.GRAY};
`;

const Tab = styled.button<{ $active: boolean }>`
	padding: 0.5rem 1rem;
	border: none;
	background: ${props => props.$active ? COLORS.PRIMARY.RED_DARK : 'transparent'};
	color: ${props => props.$active ? COLORS.TEXT.WHITE : COLORS.TEXT.GRAY_MEDIUM};
	font-weight: ${props => props.$active ? '600' : '400'};
	font-size: 0.875rem;
	cursor: pointer;
	border-radius: 4px 4px 0 0;
	transition: all 0.2s ease;
	margin-bottom: -2px;
	border-bottom: 2px solid ${props => props.$active ? COLORS.PRIMARY.RED_DARK : 'transparent'};

	&:hover {
		background: ${props => props.$active ? COLORS.PRIMARY.RED_DARK : COLORS.BG.GRAY_LIGHT};
		color: ${props => props.$active ? COLORS.TEXT.WHITE : COLORS.TEXT.BLACK};
	}
`;

interface LanguageCode {
	javascript: string;
	dotnet: string;
	go: string;
}

interface CodeExample {
	title: string;
	description?: string;
	code: LanguageCode;
}

interface CodeExamplesSectionProps {
	examples: CodeExample[];
}

type Language = 'javascript' | 'dotnet' | 'go';

const languageLabels: Record<Language, string> = {
	javascript: 'JavaScript',
	dotnet: '.NET (C#)',
	go: 'Go'
};

export const CodeExamplesSection: React.FC<CodeExamplesSectionProps> = ({ examples }) => {
	const [activeLanguage, setActiveLanguage] = useState<Language>('javascript');

	return (
		<SectionContainer>
			<SectionHeader>Code Examples</SectionHeader>
			<SectionBody>
				<TabContainer>
					{(Object.keys(languageLabels) as Language[]).map((lang) => (
						<Tab
							key={lang}
							$active={activeLanguage === lang}
							onClick={() => setActiveLanguage(lang)}
						>
							{languageLabels[lang]}
						</Tab>
					))}
				</TabContainer>
				{examples.map((example, index) => (
					<ExampleContainer key={index}>
						<ExampleTitle>{example.title}</ExampleTitle>
						{example.description && <ExampleDescription>{example.description}</ExampleDescription>}
						<CodeBlock>
							<code>{example.code[activeLanguage]}</code>
						</CodeBlock>
					</ExampleContainer>
				))}
			</SectionBody>
		</SectionContainer>
	);
};
