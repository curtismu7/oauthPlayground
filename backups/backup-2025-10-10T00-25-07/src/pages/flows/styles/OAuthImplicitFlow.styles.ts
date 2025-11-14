// src/pages/flows/styles/OAuthImplicitFlow.styles.ts
import React from 'react';
import styled from 'styled-components';

import { CollapsibleIcon } from '../../../components/CollapsibleIcon';

// Main layout components
export const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

export const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

export const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

// Step header components
export const StepHeader = styled.div`
	background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

export const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

export const VersionBadge = styled.span`
	align-self: flex-start;
	background: rgba(249, 115, 22, 0.2);
	border: 1px solid #fb923c;
	color: #fed7aa;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
`;

export const StepHeaderTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`;

export const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
`;

export const StepHeaderRight = styled.div`
	text-align: right;
`;

export const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

export const StepTotal = styled.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.05em;
`;

// Content wrapper
export const StepContentWrapper = styled.div`
	padding: 2rem;
	background: #ffffff;
`;

// Collapsible sections
export const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

export const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-weight: 600;
	color: #7c2d12;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #fed7aa 0%, #f97316 100%);
	}
`;

type CollapsibleToggleIconProps = Omit<React.ComponentProps<typeof CollapsibleIcon>, 'isExpanded'> & {
	$collapsed?: boolean;
};

const CollapsibleToggleIconBase: React.FC<CollapsibleToggleIconProps> = ({ $collapsed, ...rest }) => (
	<CollapsibleIcon isExpanded={!$collapsed} {...rest} />
);

export const CollapsibleToggleIcon = styled(CollapsibleToggleIconBase)`
	color: #ea580c;
	transition: color 0.2s ease;

	svg {
		width: 1.5rem;
		height: 1.5rem;
	}
`;

export const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
{{ ... }}
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

// Info boxes and alerts
export const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'danger' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			if ($variant === 'danger') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'danger') return '#fee2e2';
			return '#dbeafe';
		}};
`;

export const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0 0 0.5rem 0;
`;

export const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

export const StrongText = styled.strong`
	color: #0f172a;
	font-weight: 600;
`;

export const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #334155;
	line-height: 1.5;
	margin: 0.5rem 0 0;
	padding-left: 1.5rem;
`;

// Action components
export const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`;

export const Button = styled.button<{
	$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.disabled ? 0.6 : 1)};

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #f97316;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #ea580c;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #22c55e;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #16a34a;
		}
	`}

	${({ $variant }) =>
		$variant === 'secondary' &&
		`
		background-color: #0ea5e9;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #0284c7;
		}
	`}

	${({ $variant }) =>
		$variant === 'danger' &&
		`
		background-color: #ef4444;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #dc2626;
		}
	`}

	${({ $variant }) =>
		$variant === 'outline' &&
		`
		background-color: transparent;
		color: #7c2d12;
		border-color: #fed7aa;
		&:hover:not(:disabled) {
			background-color: #ffedd5;
			border-color: #f97316;
		}
	`}
`;

export const HighlightedActionButton = styled(Button)<{ $priority: 'primary' | 'success' }>`
	position: relative;
	background:
		${({ $priority }) =>
			$priority === 'primary'
				? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
				: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'};
	box-shadow:
		${({ $priority }) =>
			$priority === 'primary'
				? '0 6px 18px rgba(249, 115, 22, 0.35)'
				: '0 6px 18px rgba(234, 88, 12, 0.35)'};
	color: #ffffff;
	padding-right: 2.5rem;

	&:hover {
		transform: scale(1.02);
	}

	&:disabled {
		background:
			${({ $priority }) =>
				$priority === 'primary'
					? 'linear-gradient(135deg, rgba(249,115,22,0.6) 0%, rgba(234,88,12,0.6) 100%)'
					: 'linear-gradient(135deg, rgba(251,146,60,0.6) 0%, rgba(249,115,22,0.6) 100%)'};
		box-shadow: none;
	}
`;

export const HighlightBadge = styled.span`
	position: absolute;
	top: -10px;
	right: -10px;
	background: #f97316;
	color: #ffffff;
	border-radius: 9999px;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
`;

// Code and content display
export const CodeBlock = styled.pre`
	background-color: #1e293b;
	border: 1px solid #334155;
	border-radius: 0.5rem;
	padding: 1.25rem;
	font-size: 0.875rem;
	color: #e2e8f0;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	line-height: 1.5;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const GeneratedContentBox = styled.div`
	background-color: #fff7ed;
	border: 1px solid #fb923c;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

export const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #ea580c;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

// Parameter display
export const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

export const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #ea580c;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

export const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #7c2d12;
	word-break: break-all;
	background-color: #ffedd5;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #fed7aa;
`;

// Flow diagram components
export const FlowDiagram = styled.div`
	margin: 1.5rem 0;
`;

export const FlowStep = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;
	padding: 1rem;
	background-color: #f8fafc;
	border-radius: 0.5rem;
	border-left: 4px solid #f97316;
`;

export const FlowStepNumber = styled.div`
	background-color: #f97316;
	color: white;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 0.875rem;
	flex-shrink: 0;
`;

export const FlowStepContent = styled.div`
	flex: 1;
`;

// Section components
export const SectionDivider = styled.div`
	height: 1px;
	background-color: #e2e8f0;
	margin: 2rem 0;
`;

export const ResultsSection = styled.div`
	margin-top: 2rem;
`;

export const ResultsHeading = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

export const HelperText = styled.p`
	font-size: 0.875rem;
	color: #64748b;
	margin: 0 0 1rem 0;
	line-height: 1.5;
`;

// Explanation components
export const ExplanationSection = styled.div`
	margin: 1.5rem 0;
`;

export const ExplanationHeading = styled.h4`
	font-size: 1.1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

// Next steps component
export const NextSteps = styled.div<{ steps: string[] }>`
	margin: 1rem 0;
	& > div {
		margin-bottom: 0.5rem;
		padding-left: 1rem;
		position: relative;
		&::before {
			content: '•';
			position: absolute;
			left: 0;
			color: #f97316;
			font-weight: bold;
		}
	}
`;
