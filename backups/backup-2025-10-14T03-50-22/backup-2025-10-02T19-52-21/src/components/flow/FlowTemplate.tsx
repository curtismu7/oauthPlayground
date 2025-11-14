// src/components/flow/FlowTemplate.tsx

import React from 'react';
import styled from 'styled-components';

interface FlowTemplateProps {
	title: string;
	subtitle?: string;
	description: string;
	badge?: React.ReactNode;
	headerActions?: React.ReactNode;
	highlights?: Array<{
		title: string;
		description: string;
		icon?: React.ReactNode;
		tone?: 'info' | 'success' | 'warning' | 'danger';
	}>;
	education?: React.ReactNode;
	children: React.ReactNode;
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const HeroCard = styled.section`
  background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%);
  color: white;
  border-radius: 1.5rem;
  padding: 3rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.45);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.45), transparent 45%);
    pointer-events: none;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 800px;
`;

const HeroTitle = styled.h1`
  font-size: 2.75rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
`;

const HeroFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`;

const BadgeContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  background: rgba(15, 118, 110, 0.18);
  color: #6ee7b7;
  border-radius: 999px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const EducationPanel = styled.aside`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
  padding: 1.75rem;
  position: sticky;
  top: 7rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: static;
    max-height: none;
  }
`;

const HighlightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
`;

const HighlightCard = styled.div<{ $tone: 'info' | 'success' | 'warning' | 'danger' }>`
  background: ${({ $tone }) => {
		switch ($tone) {
			case 'success':
				return 'linear-gradient(135deg, #ecfdf5, #d1fae5)';
			case 'warning':
				return 'linear-gradient(135deg, #fffbeb, #fef3c7)';
			case 'danger':
				return 'linear-gradient(135deg, #fef2f2, #fee2e2)';
			default:
				return 'linear-gradient(135deg, #eff6ff, #dbeafe)';
		}
	}};
  border-radius: 1rem;
  padding: 1.35rem;
  box-shadow: 0 14px 30px rgba(59, 130, 246, 0.12);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const HighlightIcon = styled.div`
  font-size: 1.45rem;
  line-height: 1;
  color: #1d4ed8;
`;

const HighlightContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #334155;
    line-height: 1.6;
    font-size: 0.95rem;
  }
`;

/**
 * FlowTemplate provides a reusable layout for flow pages, combining a hero,
 * optional highlights, educational sidebar, and the interactive flow content.
 */
const FlowTemplate: React.FC<FlowTemplateProps> = ({
	title,
	subtitle,
	description,
	badge,
	headerActions,
	highlights,
	education,
	children,
}) => {
	return (
		<PageContainer>
			<HeroCard>
				<HeroContent>
					{badge ? <BadgeContainer>{badge}</BadgeContainer> : null}
					<HeroTitle>{title}</HeroTitle>
					{subtitle ? <HeroSubtitle>{subtitle}</HeroSubtitle> : null}
					<HeroSubtitle>{description}</HeroSubtitle>
					{headerActions ? <HeroFooter>{headerActions}</HeroFooter> : null}
				</HeroContent>
			</HeroCard>

			{highlights && highlights.length > 0 ? (
				<HighlightsGrid>
					{highlights.map((item) => (
						<HighlightCard key={item.title} $tone={item.tone ?? 'info'}>
							{item.icon ? <HighlightIcon>{item.icon}</HighlightIcon> : null}
							<HighlightContent>
								<h3>{item.title}</h3>
								<p>{item.description}</p>
							</HighlightContent>
						</HighlightCard>
					))}
				</HighlightsGrid>
			) : null}

			<ContentGrid>
				<MainContent>{children}</MainContent>
				{education ? <EducationPanel>{education}</EducationPanel> : null}
			</ContentGrid>
		</PageContainer>
	);
};

export default FlowTemplate;
