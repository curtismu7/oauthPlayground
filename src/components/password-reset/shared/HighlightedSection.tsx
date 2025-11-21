// src/components/password-reset/shared/HighlightedSection.tsx
// Component to highlight new sections that appear, drawing user attention

import React, { useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';

const pulseGlow = keyframes`
	0%, 100% {
		box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
	}
	50% {
		box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
	}
`;

const slideIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`;

const HighlightContainer = styled.div<{ $isNew: boolean }>`
	animation: ${(props) => (props.$isNew ? slideIn : 'none')} 0.3s ease-out;
	border: ${(props) => (props.$isNew ? '3px solid #3B82F6' : '2px solid transparent')};
	border-radius: 0.75rem;
	padding: 1.5rem;
	background: ${(props) =>
		props.$isNew ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' : 'transparent'};
	position: relative;
	transition: all 0.5s ease-out;
	
	${(props) =>
		props.$isNew &&
		css`
		animation: ${slideIn} 0.3s ease-out, ${pulseGlow} 2s ease-in-out 3;
	`}
	
	&::before {
		content: ${(props) => (props.$isNew ? '"👉 Complete this section"' : '""')};
		position: absolute;
		top: -12px;
		left: 20px;
		background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
		opacity: ${(props) => (props.$isNew ? 1 : 0)};
		transition: opacity 0.3s ease-out;
	}
`;

interface HighlightedSectionProps {
	children: React.ReactNode;
	highlightDuration?: number; // milliseconds to show highlight
	className?: string;
	style?: React.CSSProperties;
}

export const HighlightedSection: React.FC<HighlightedSectionProps> = ({
	children,
	highlightDuration = 5000,
	className,
	style,
}) => {
	const [isNew, setIsNew] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsNew(false);
		}, highlightDuration);

		return () => clearTimeout(timer);
	}, [highlightDuration]);

	return (
		<HighlightContainer $isNew={isNew} className={className} style={style}>
			{children}
		</HighlightContainer>
	);
};
