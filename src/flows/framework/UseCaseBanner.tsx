// src/flows/framework/UseCaseBanner.tsx
//
// Context strip shown on a flow page when it was reached from the /v2/use-cases
// page (via ?usecase=<id>). Ties the flow back to its real-world use case and
// lists the concepts to watch for. Renders null when there is no valid param, so
// flows reached directly are unaffected. Additive: a flow opts in by rendering
// <UseCaseBanner /> once near the top.

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { tokens } from './tokens';
import { getUseCase } from '../content/useCases';

const Banner = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0 0 1rem;
	padding: 0.85rem 1rem;
	background: ${tokens.color.accentBg};
	border: 1px solid ${tokens.color.primaryBorder};
	border-left: 3px solid ${tokens.color.accent};
	border-radius: 0 8px 8px 0;
`;

const Header = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 1rem;
`;

const Title = styled.p`
	margin: 0;
	font-size: 0.9rem;
	font-weight: 700;
	color: ${tokens.color.primary};
`;

const Eyebrow = styled.span`
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${tokens.color.accentHover};
`;

const Lessons = styled.ul`
	margin: 0;
	padding-left: 1.1rem;
	font-size: 0.82rem;
	line-height: 1.5;
	color: ${tokens.color.textSecondary};
`;

const Dismiss = styled.button`
	flex: none;
	border: none;
	background: transparent;
	color: ${tokens.color.textMuted};
	font-size: 1rem;
	line-height: 1;
	cursor: pointer;
	padding: 0.1rem 0.3rem;
	&:hover {
		color: ${tokens.color.text};
	}
`;

export const UseCaseBanner: React.FC = () => {
	const [params] = useSearchParams();
	const [dismissed, setDismissed] = useState(false);
	const useCase = getUseCase(params.get('usecase') ?? '');

	if (!useCase || dismissed) {
		return null;
	}

	return (
		<Banner aria-label="Use case context">
			<Header>
				<div>
					<Eyebrow>Learning</Eyebrow>
					<Title>{useCase.title}</Title>
				</div>
				<Dismiss
					type="button"
					aria-label="Dismiss use-case context"
					onClick={() => setDismissed(true)}
				>
					×
				</Dismiss>
			</Header>
			<Lessons>
				{useCase.lessons.map((lesson) => (
					<li key={lesson}>{lesson}</li>
				))}
			</Lessons>
		</Banner>
	);
};
