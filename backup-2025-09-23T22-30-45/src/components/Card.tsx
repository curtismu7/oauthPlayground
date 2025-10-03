import React from 'react';
import styled, { css } from 'styled-components';

type Accent = 'primary' | 'success' | 'danger' | 'warning' | 'info' | (string & {});

const CardContainer = styled.div<{ $accent?: Accent | undefined }>`
  background-color: #f0f8ff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  
  ${({ $accent }) => {
		const accent = $accent;
		if (!accent) return '';

		const accentColors = {
			primary: '#003087',
			success: '#28a745',
			danger: '#dc3545',
			warning: '#ffc107',
			info: '#17a2b8',
		};

		return css`
      border-top: 3px solid ${accentColors[(accent as keyof typeof accentColors)] || accentColors.primary};
    `;
	}}
`;

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  
  h2, h3, h4, h5, h6 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .subtitle {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
`;

const CardBody = styled.div`
  padding: 1.5rem;
  
  & > :last-child {
    margin-bottom: 0;
  }
`;

const CardFooter = styled.div`
  padding: 1rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  border-top: 1px solid ${({ theme }) => theme.colors.gray200};
  
  & > :last-child {
    margin-bottom: 0;
  }
`;

interface CardProps {
	children?: React.ReactNode;
	className?: string;
	accent?: Accent | undefined;
}

const Card = ({ children, className, accent }: CardProps) => {
	return (
		<CardContainer className={className} {...(accent !== undefined ? { $accent: accent } : {})}>
			{children}
		</CardContainer>
	);
};

export { Card, CardHeader, CardBody, CardFooter };

export default Card;
