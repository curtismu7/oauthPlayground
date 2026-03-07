// src/components/InlineDocumentation.tsx - Enhanced inline documentation

import { FiBook, FiChevronDown, FiChevronRight, FiCode, FiExternalLink, FiInfo } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';

const DocContainer = styled.div`
  margin: 1rem 0;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  background: #f9fafb;
`;

const DocHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  background: #f3f4f6;
  border-radius: 8px 8px 0 0;
  
  &:hover {
    background: V9_COLORS.TEXT.GRAY_LIGHTER;
  }
`;

const DocTitle = styled.h4`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const DocChevron = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 2px solid V9_COLORS.PRIMARY.BLUE;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
  margin-left: auto;

  svg {
    font-size: 1.25rem;
    color: V9_COLORS.PRIMARY.BLUE;
  }

  &:hover {
    background: #dbeafe;
    border-color: V9_COLORS.PRIMARY.BLUE_DARK;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    
    svg {
      color: V9_COLORS.PRIMARY.BLUE_DARK;
    }
  }
  
  &:active {
    transform: scale(1.05);
  }
`;

const DocContent = styled.div<{ $isExpanded: boolean }>`
  padding: ${({ $isExpanded }) => ($isExpanded ? '1rem' : '0')};
  max-height: ${({ $isExpanded }) => ($isExpanded ? '500px' : '0')};
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  border-radius: 0 0 8px 8px;
`;

const DocSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DocSectionTitle = styled.h5`
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const DocText = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const DocCode = styled.pre`
  background: #f3f4f6;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 0.5rem 0;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const DocLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: V9_COLORS.PRIMARY.BLUE;
  text-decoration: none;
  font-size: 0.8rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface InlineDocumentationProps {
	title: string;
	type: 'oauth' | 'oidc' | 'security' | 'troubleshooting';
	children: React.ReactNode;
	defaultExpanded?: boolean;
	specLink?: string;
}

export const InlineDocumentation: React.FC<InlineDocumentationProps> = ({
	title,
	type,
	children,
	defaultExpanded = false,
	specLink,
}) => {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	const getTypeIcon = () => {
		switch (type) {
			case 'oauth':
				return '';
			case 'oidc':
				return '';
			case 'security':
				return '';
			case 'troubleshooting':
				return '';
			default:
				return '';
		}
	};

	return (
		<DocContainer>
			<DocHeader onClick={() => setIsExpanded(!isExpanded)}>
				<span style={{ fontSize: '1.1em' }}>{getTypeIcon()}</span>
				<FiInfo />
				<DocTitle>{title}</DocTitle>
				<DocChevron>{isExpanded ? <FiChevronDown /> : <FiChevronRight />}</DocChevron>
			</DocHeader>

			<DocContent $isExpanded={isExpanded}>
				{children}

				{specLink && (
					<DocSection>
						<DocLink href={specLink} target="_blank" rel="noopener noreferrer">
							<FiExternalLink />
							View Specification
						</DocLink>
					</DocSection>
				)}
			</DocContent>
		</DocContainer>
	);
};

interface QuickReferenceProps {
	title: string;
	items: Array<{
		term: string;
		definition: string;
		example?: string;
	}>;
}

export const QuickReference: React.FC<QuickReferenceProps> = ({ title, items }) => {
	return (
		<DocSection>
			<DocSectionTitle>{title}</DocSectionTitle>
			{items.map((item, index) => (
				<div key={index} style={{ marginBottom: '0.75rem' }}>
					<div
						style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'V9_COLORS.TEXT.GRAY_DARK' }}
					>
						{item.term}
					</div>
					<DocText>{item.definition}</DocText>
					{item.example && <DocCode>{item.example}</DocCode>}
				</div>
			))}
		</DocSection>
	);
};

interface TroubleshootingGuideProps {
	issue: string;
	symptoms: string[];
	solutions: Array<{
		title: string;
		steps: string[];
		code?: string;
	}>;
}

export const TroubleshootingGuide: React.FC<TroubleshootingGuideProps> = ({
	issue,
	symptoms,
	solutions,
}) => {
	return (
		<DocSection>
			<DocSectionTitle> Troubleshooting: {issue}</DocSectionTitle>

			<div style={{ marginBottom: '1rem' }}>
				<strong style={{ fontSize: '0.8rem', color: 'V9_COLORS.PRIMARY.RED_DARK' }}>
					Symptoms:
				</strong>
				<ul
					style={{
						margin: '0.25rem 0',
						paddingLeft: '1.5rem',
						fontSize: '0.8rem',
						color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
					}}
				>
					{symptoms && symptoms.length > 0 ? (
						symptoms.map((symptom, index) => <li key={index}>{symptom}</li>)
					) : (
						<li>No specific symptoms identified</li>
					)}
				</ul>
			</div>

			<div>
				<strong style={{ fontSize: '0.8rem', color: 'V9_COLORS.PRIMARY.GREEN_DARK' }}>
					Solutions:
				</strong>
				{solutions && solutions.length > 0 ? (
					solutions.map((solution, index) => (
						<div key={index} style={{ margin: '0.5rem 0' }}>
							<div
								style={{
									fontWeight: 'bold',
									fontSize: '0.8rem',
									color: 'V9_COLORS.TEXT.GRAY_DARK',
								}}
							>
								{solution.title}
							</div>
							<ol
								style={{
									margin: '0.25rem 0',
									paddingLeft: '1.5rem',
									fontSize: '0.75rem',
									color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
								}}
							>
								{solution.steps && solution.steps.length > 0 ? (
									solution.steps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)
								) : (
									<li>No specific steps available</li>
								)}
							</ol>
							{solution.code && <DocCode>{solution.code}</DocCode>}
						</div>
					))
				) : (
					<div style={{ fontSize: '0.8rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
						No solutions available
					</div>
				)}
			</div>
		</DocSection>
	);
};

interface CodeExampleProps {
	title: string;
	language: string;
	code: string;
	explanation?: string;
}

export const CodeExample: React.FC<CodeExampleProps> = ({ title, language, code, explanation }) => {
	return (
		<DocSection>
			<DocSectionTitle>
				<FiCode style={{ marginRight: '0.25rem' }} />
				{title}
			</DocSectionTitle>
			{explanation && <DocText>{explanation}</DocText>}
			<DocCode>{code}</DocCode>
		</DocSection>
	);
};

interface SpecificationReferenceProps {
	section: string;
	title: string;
	description: string;
	link: string;
}

export const SpecificationReference: React.FC<SpecificationReferenceProps> = ({
	section,
	title,
	description,
	link,
}) => {
	return (
		<DocSection>
			<DocSectionTitle>
				<FiBook style={{ marginRight: '0.25rem' }} />
				{section}: {title}
			</DocSectionTitle>
			<DocText>{description}</DocText>
			<DocLink href={link} target="_blank" rel="noopener noreferrer">
				<FiExternalLink />
				Read Specification
			</DocLink>
		</DocSection>
	);
};

export default InlineDocumentation;
