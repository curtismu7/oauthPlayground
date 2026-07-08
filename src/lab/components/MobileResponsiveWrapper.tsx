import React from 'react';
import styled from 'styled-components';

interface MobileResponsiveWrapperProps {
	children: React.ReactNode;
	className?: string;
}

const ResponsiveContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    padding: 0 0.75rem;
  }
  
  @media (max-width: 480px) {
    padding: 0 0.5rem;
  }
`;

const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const ResponsiveFlex = styled.div<{ $direction?: 'row' | 'column'; $wrap?: boolean }>`
  display: flex;
  flex-direction: ${(props) => props.$direction || 'row'};
  flex-wrap: ${(props) => (props.$wrap ? 'wrap' : 'nowrap')};
  gap: 1rem;
  align-items: ${(props) => (props.$direction === 'column' ? 'stretch' : 'flex-start')};
  
  @media (max-width: 768px) {
    flex-direction: ${(props) => (props.$direction === 'column' ? 'column' : 'column')};
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const ResponsiveCard = styled.div<{ $fullWidth?: boolean }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: ${(props) => (props.$fullWidth ? '100%' : 'auto')};
  
  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    border-radius: 6px;
  }
`;

const ResponsiveButton = styled.button<{
	$variant?: 'primary' | 'secondary' | 'outline';
	$fullWidth?: boolean;
}>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;
  width: ${(props) => (props.$fullWidth ? '100%' : 'auto')};
  font-size: 0.875rem;
  
  ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
			case 'secondary':
				return `
          background: #6b7280;
          border-color: #6b7280;
          color: white;
          
          &:hover {
            background: #4b5563;
            border-color: #4b5563;
          }
        `;
			default:
				return `
          background: transparent;
          border-color: #3b82f6;
          color: #3b82f6;
          
          &:hover {
            background: #f0f9ff;
            border-color: #2563eb;
            color: #2563eb;
          }
        `;
		}
	}}
  
  @media (max-width: 768px) {
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
    border-radius: 6px;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    border-radius: 4px;
  }
`;

const ResponsiveText = styled.div<{
	$size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	$weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}>`
  color: #1e293b;
  line-height: 1.5;
  
  ${(props) => {
		switch (props.$size) {
			case 'xs':
				return 'font-size: 0.75rem;';
			case 'sm':
				return 'font-size: 0.875rem;';
			case 'md':
				return 'font-size: 1rem;';
			case 'lg':
				return 'font-size: 1.125rem;';
			case 'xl':
				return 'font-size: 1.25rem;';
			default:
				return 'font-size: 0.875rem;';
		}
	}}
  
  ${(props) => {
		switch (props.$weight) {
			case 'normal':
				return 'font-weight: 400;';
			case 'medium':
				return 'font-weight: 500;';
			case 'semibold':
				return 'font-weight: 600;';
			case 'bold':
				return 'font-weight: 700;';
			default:
				return 'font-weight: 500;';
		}
	}}
  
  @media (max-width: 768px) {
    ${(props) => {
			switch (props.$size) {
				case 'xl':
					return 'font-size: 1.125rem;';
				case 'lg':
					return 'font-size: 1rem;';
				case 'md':
					return 'font-size: 0.875rem;';
				case 'sm':
					return 'font-size: 0.75rem;';
				default:
					return 'font-size: 0.6875rem;';
			}
		}}
  }
  
  @media (max-width: 480px) {
    ${(props) => {
			switch (props.$size) {
				case 'xl':
					return 'font-size: 1rem;';
				case 'lg':
					return 'font-size: 0.875rem;';
				case 'md':
					return 'font-size: 0.75rem;';
				case 'sm':
					return 'font-size: 0.6875rem;';
				default:
					return 'font-size: 0.625rem;';
			}
		}}
  }
`;

const ResponsiveSpacer = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  height: ${(props) => {
		switch (props.$size) {
			case 'sm':
				return '0.5rem';
			case 'md':
				return '1rem';
			case 'lg':
				return '1.5rem';
			default:
				return '1rem';
		}
	}};
  
  @media (max-width: 768px) {
    height: ${(props) => {
			switch (props.$size) {
				case 'sm':
					return '0.375rem';
				case 'md':
					return '0.75rem';
				case 'lg':
					return '1.125rem';
				default:
					return '0.75rem';
			}
		}};
  }
  
  @media (max-width: 480px) {
    height: ${(props) => {
			switch (props.$size) {
				case 'sm':
					return '0.25rem';
				case 'md':
					return '0.5rem';
				case 'lg':
					return '0.75rem';
				default:
					return '0.5rem';
			}
		}};
  }
`;

export const MobileResponsiveWrapper: React.FC<MobileResponsiveWrapperProps> = ({
	children,
	className,
}) => {
	return <ResponsiveContainer className={className}>{children}</ResponsiveContainer>;
};

export {
	ResponsiveContainer,
	ResponsiveGrid,
	ResponsiveFlex,
	ResponsiveCard,
	ResponsiveButton,
	ResponsiveText,
	ResponsiveSpacer,
};

export default MobileResponsiveWrapper;
