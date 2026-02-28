import React, { useState } from 'react';
import { FiCheckCircle, FiChevronDown, FiChevronUp } from '@icons';
import styled from 'styled-components';

interface TutorialStepProps {
	stepNumber: number;
	title: string;
	description: string;
	codeExample?: string;
	completed?: boolean;
	onToggle?: () => void;
	children?: React.ReactNode;
	actionButton?: {
		label: string;
		onClick: () => void;
		icon?: React.ReactNode;
	};
}

const StepContainer = styled.div<{ $completed?: boolean }>`
  border: 2px solid ${({ $completed, theme }) =>
		$completed ? theme.colors.success : theme.colors.gray300};
  border-radius: 0.75rem;
  background: white;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const StepHeader = styled.div<{ $clickable?: boolean }>`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};

  &:hover {
    background-color: ${({ $clickable, theme }) =>
			$clickable ? theme.colors.gray50 : 'transparent'};
  }
`;

const StepNumber = styled.div<{ $completed?: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: ${({ $completed, theme }) =>
		$completed ? theme.colors.success : theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 1rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.25rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
  }
`;

const StepActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray400};
    cursor: not-allowed;
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray500};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

const StepBody = styled.div`
  padding: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray900};
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.monospace};
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1rem 0;

  code {
    font-family: inherit;
  }
`;

const TutorialStep: React.FC<TutorialStepProps> = ({
	stepNumber,
	title,
	description,
	codeExample,
	completed = false,
	onToggle,
	children,
	actionButton,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const hasExpandableContent = children || codeExample;

	return (
		<StepContainer $completed={completed}>
			<StepHeader
				$clickable={hasExpandableContent}
				onClick={hasExpandableContent ? () => setIsExpanded(!isExpanded) : undefined}
			>
				<StepNumber $completed={completed}>
					{completed ? <FiCheckCircle size={16} /> : stepNumber}
				</StepNumber>

				<StepContent>
					<h3>{title}</h3>
					<p>{description}</p>
				</StepContent>

				<StepActions>
					{actionButton && (
						<ActionButton
							onClick={(e) => {
								e.stopPropagation();
								actionButton.onClick();
							}}
						>
							{actionButton.icon}
							{actionButton.label}
						</ActionButton>
					)}

					{hasExpandableContent && (
						<ExpandButton>
							{isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
						</ExpandButton>
					)}
				</StepActions>
			</StepHeader>

			{isExpanded && hasExpandableContent && (
				<StepBody>
					{children}
					{codeExample && (
						<CodeBlock>
							<code>{codeExample}</code>
						</CodeBlock>
					)}
				</StepBody>
			)}
		</StepContainer>
	);
};

export default TutorialStep;
