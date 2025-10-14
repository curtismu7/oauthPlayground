import styled from 'styled-components';
import { ThemeType } from '../../types/token-inspector';
import { Card } from '../Card';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.lg};
`;

export const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
`;

export const TokenDisplay = styled.pre`
  background-color: #f0fdf4; /* Light green for generated content */
  border: 1px solid #16a34a;
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borderRadius.md};
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: ${({ theme }: { theme: ThemeType }) => theme.spacing.md} 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ${({ theme }: { theme: ThemeType }) => theme.fonts.monospace};
  
  code {
    font-family: inherit;
  }
`;

export const TokenHeader = styled.pre`
  background-color: #000000;
  color: #ffffff;
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borderRadius.md};
  border: 2px solid #374151;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: ${({ theme }: { theme: ThemeType }) => theme.spacing.md} 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ${({ theme }: { theme: ThemeType }) => theme.fonts.monospace};
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3);
  
  code {
    font-family: inherit;
    color: #ffffff;
  }
`;

export const TokenPayload = styled.pre`
  background-color: #ffffff;
  color: #000000;
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borderRadius.md};
  border: 2px solid #e5e7eb;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: ${({ theme }: { theme: ThemeType }) => theme.spacing.md} 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ${({ theme }: { theme: ThemeType }) => theme.fonts.monospace};
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  
  code {
    font-family: inherit;
    color: #000000;
  }
`;

export const CardHeader = styled.div`
  padding: ${({ theme }: { theme: ThemeType }) => `${theme.spacing.md} ${theme.spacing.md} 0`};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

export const CardBody = styled.div`
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
`;

export const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }: { theme: ThemeType }) => theme.spacing.sm};
  padding: ${({ theme }: { theme: ThemeType }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borderRadius.sm};
  border: 1px solid transparent;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  
  ${({
		variant = 'primary',
		theme,
	}: {
		variant?: 'primary' | 'secondary' | 'danger';
		theme: ThemeType;
	}) => {
		switch (variant) {
			case 'secondary':
				return `
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray700};
          border-color: ${theme.colors.gray300};
          
          &:hover {
            background-color: ${theme.colors.gray200};
          }
        `;
			case 'danger':
				return `
          background-color: ${theme.colors.danger};
          color: white;
          
          &:hover {
            background-color: #c82333;
          }
        `;
			default: // primary
				return `
          background-color: ${theme.colors.primary};
          color: white;
          
          &:hover {
            background-color: #0069d9;
          }
        `;
		}
	}}
`;

export const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }: { theme: ThemeType }) => theme.spacing.lg};
  margin: ${({ theme }: { theme: ThemeType }) => theme.spacing.lg} 0;
`;

export const TokenPartCard = styled(Card)`
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.lg};
  
  h4 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.gray800};
  }
`;

export const TokenValidationCard = styled(Card)`
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.lg};
`;

export const ValidationStatus = styled.div<{ valid?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }: { theme: ThemeType }) => theme.spacing.sm};
  color: ${({ theme, valid }: { theme: ThemeType; valid?: boolean }) =>
		valid ? theme.colors.success : theme.colors.danger};
  font-weight: 500;
  margin: ${({ theme }: { theme: ThemeType }) => theme.spacing.sm} 0;
`;

export const ClaimsTable = styled.div`
  margin-top: 1rem;
`;

export const ClaimRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${({ theme }: { theme: ThemeType }) => theme.colors.gray200};
  
  &:last-child {
    border-bottom: none;
  }
  
  strong {
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.gray900};
  }
  
  div {
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.gray700};
    font-size: 0.875rem;
    line-height: 1.4;
    
    &.json {
      font-family: ${({ theme }: { theme: ThemeType }) => theme.fonts.monospace};
    }
  }
`;
