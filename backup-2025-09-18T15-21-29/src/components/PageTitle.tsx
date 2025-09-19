 
import React from 'react';
import styled from 'styled-components';
import { usePageStyle } from '../contexts/PageStyleContext';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const TitleContainer = styled.div<{ $backgroundColor: string; $textColor: string }>`
  background: linear-gradient(135deg, ${({ $backgroundColor }) => $backgroundColor} 0%, ${({ $backgroundColor }) => $backgroundColor}dd 100%);
  color: ${({ $textColor }) => $textColor};
  padding: 2rem;
  margin: -1.5rem -1.5rem 2rem -1.5rem;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const TitleContent = styled.div`
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
  font-weight: 400;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ChildrenContainer = styled.div`
  margin-top: 1rem;
`;

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, children }) => {
  const { currentPageStyle } = usePageStyle();
  
  return (
    <TitleContainer 
      $backgroundColor={currentPageStyle.titleBackgroundColor}
      $textColor={currentPageStyle.titleTextColor}
    >
      <TitleContent>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {children && <ChildrenContainer>{children}</ChildrenContainer>}
      </TitleContent>
    </TitleContainer>
  );
};

export default PageTitle;
