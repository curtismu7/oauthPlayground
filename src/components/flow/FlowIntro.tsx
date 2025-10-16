// src/components/flow/FlowIntro.tsx
import type { ReactNode } from 'react';
import styled from 'styled-components';

interface IntroContainerProps {
	$background?: string;
	$textColor?: string;
}

const Container = styled.div<IntroContainerProps>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
  align-items: center;
  color: ${({ $textColor }) => $textColor ?? 'white'};

  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

const HeroText = styled.div`
  text-align: left;

  h1 {
    margin: 0 0 0.75rem 0;
    font-size: 2.25rem;
    font-weight: 700;
  }

  p {
    margin: 0 0 1.25rem 0;
    font-size: 1.1rem;
    line-height: 1.6;
    opacity: 0.92;
  }
`;

const IllustrationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const IllustrationImage = styled.img`
  max-width: 260px;
  width: 100%;
  padding: 1rem;
  border-radius: 0.5rem;
`;

const WarningCard = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-top: 1.5rem;
  color: inherit;
`;

const WarningIcon = styled.div`
  font-size: 1.4rem;
  flex-shrink: 0;
  line-height: 1;
`;

const WarningContent = styled.div`
  h3 {
    margin: 0 0 0.35rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.55;
  }
`;

const CopyList = styled.ul`
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.95rem;
  line-height: 1.65;
  opacity: 0.92;
`;

const CopyListItem = styled.li`
  margin-bottom: 0.4rem;
`;

export interface FlowIntroProps {
	title: string;
	description: string;
	introCopy?: ReactNode;
	warningTitle?: string;
	warningBody?: ReactNode;
	bullets?: string[];
	illustration?: string;
	illustrationAlt?: string;
	warningIcon?: ReactNode;
	background?: string;
	textColor?: string;
}

const FlowIntro: React.FC<FlowIntroProps> = ({
	title,
	description,
	introCopy,
	warningTitle,
	warningBody,
	bullets,
	illustration,
	illustrationAlt = '',
	warningIcon,
	background,
	textColor,
}) => {
	return (
		<Container $background={background} $textColor={textColor}>
			<HeroText>
				<h1>{title}</h1>
				<p>{description}</p>
				{introCopy}
				{bullets?.length ? (
					<CopyList>
						{bullets.map((bullet) => (
							<CopyListItem key={bullet}>{bullet}</CopyListItem>
						))}
					</CopyList>
				) : null}
				{warningTitle || warningBody ? (
					<WarningCard>
						{warningIcon ? <WarningIcon>{warningIcon}</WarningIcon> : null}
						<WarningContent>
							{warningTitle ? <h3>{warningTitle}</h3> : null}
							{typeof warningBody === 'string' ? <p>{warningBody}</p> : warningBody}
						</WarningContent>
					</WarningCard>
				) : null}
			</HeroText>
			{illustration ? (
				<IllustrationWrapper>
					<IllustrationImage src={illustration} alt={illustrationAlt} />
				</IllustrationWrapper>
			) : null}
		</Container>
	);
};

export default FlowIntro;
