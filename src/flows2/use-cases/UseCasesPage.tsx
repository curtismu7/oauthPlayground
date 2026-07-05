// src/flows2/use-cases/UseCasesPage.tsx
//
// Scenario-first index over the flows2 flows (route /v2/use-cases). Renders the
// 7 themes in learning order; each theme shows a row of use-case chips. Clicking
// a chip expands its scenario + lessons and offers "Run this flow", which
// navigates to the flow route with ?usecase=<id> so the flow page can show a
// UseCaseBanner. Free-roam: no gating, no persistence.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { tokens } from '../framework/tokens';
import { Pill, Action } from '../framework/primitives';
import {
	useCaseThemes,
	useCasesByTheme,
	type UseCase,
} from '../content/useCases';

const Page = styled.div`
	max-width: 960px;
	margin: 0 auto;
	padding: 2rem 1.25rem 4rem;
	color: ${tokens.color.text};
`;

const PageTitle = styled.h1`
	margin: 0 0 0.35rem;
	font-size: 1.6rem;
	color: ${tokens.color.primary};
`;

const Intro = styled.p`
	margin: 0 0 2rem;
	font-size: 0.95rem;
	line-height: 1.55;
	color: ${tokens.color.textMuted};
`;

const ThemeSection = styled.section`
	margin-bottom: 2.25rem;
`;

const ThemeHead = styled.div`
	display: flex;
	align-items: baseline;
	gap: 0.6rem;
	margin-bottom: 0.15rem;
`;

const ThemeOrder = styled.span`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.85rem;
	font-weight: 700;
	color: ${tokens.color.accentHover};
`;

const ThemeTitle = styled.h2`
	margin: 0;
	font-size: 1.15rem;
	color: ${tokens.color.text};
`;

const ThemeBlurb = styled.p`
	margin: 0 0 0.85rem;
	font-size: 0.86rem;
	color: ${tokens.color.textMuted};
`;

const Chips = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const Card = styled.div`
	margin-top: 0.85rem;
	padding: 1rem 1.15rem;
	background: ${tokens.color.bgSubtle};
	border: 1px solid ${tokens.color.border};
	border-radius: 10px;
`;

const Scenario = styled.p`
	margin: 0 0 0.75rem;
	font-size: 0.9rem;
	line-height: 1.55;
	color: ${tokens.color.textSecondary};
`;

const Lessons = styled.ul`
	margin: 0 0 1rem;
	padding-left: 1.15rem;
	font-size: 0.85rem;
	line-height: 1.55;
	color: ${tokens.color.text};
`;

export const UseCasesPage: React.FC = () => {
	const navigate = useNavigate();
	const [openId, setOpenId] = useState<string | null>(null);
	const themes = [...useCaseThemes].sort((a, b) => a.order - b.order);

	const run = (useCase: UseCase) => {
		navigate(`${useCase.flowRoute}?usecase=${useCase.id}`);
	};

	return (
		<Page>
			<PageTitle>Use Cases</PageTitle>
			<Intro>
				Read top-to-bottom to learn OAuth → OIDC, or jump straight to the task
				you have. Each chip opens a real-world scenario and launches the flow
				that teaches it.
			</Intro>

			{themes.map((theme) => {
				const cases = useCasesByTheme(theme.id);
				return (
					<ThemeSection key={theme.id}>
						<ThemeHead>
							<ThemeOrder>{theme.order}</ThemeOrder>
							<ThemeTitle>{theme.title}</ThemeTitle>
						</ThemeHead>
						<ThemeBlurb>{theme.blurb}</ThemeBlurb>
						<Chips>
							{cases.map((uc) => (
								<Pill
									key={uc.id}
									type="button"
									$active={openId === uc.id}
									onClick={() =>
										setOpenId(openId === uc.id ? null : uc.id)
									}
								>
									{uc.title}
								</Pill>
							))}
						</Chips>
						{cases
							.filter((uc) => uc.id === openId)
							.map((uc) => (
								<Card key={uc.id}>
									<Scenario>{uc.scenario}</Scenario>
									<Lessons>
										{uc.lessons.map((lesson) => (
											<li key={lesson}>{lesson}</li>
										))}
									</Lessons>
									<Action type="button" onClick={() => run(uc)}>
										Run this flow →
									</Action>
								</Card>
							))}
					</ThemeSection>
				);
			})}
		</Page>
	);
};

export default UseCasesPage;
