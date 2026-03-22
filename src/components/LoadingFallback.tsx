/**
 * @file LoadingFallback.tsx
 * @module components
 * @description Loading fallback component for lazy loaded components
 * @version 9.15.1
 * @since 2026-03-06
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #0070CC;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled.div`
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
`;

const LoadingSubtext = styled.div`
  color: #9ca3af;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  text-align: center;
`;

interface LoadingFallbackProps {
	message?: string;
	subtext?: string;
	size?: 'small' | 'medium' | 'large';
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
	message = 'Loading...',
	subtext = 'Please wait while we prepare this component',
	size = 'medium',
}) => {
	const spinnerSize = {
		small: '24px',
		medium: '40px',
		large: '56px',
	}[size];

	return (
		<LoadingContainer>
			<Spinner style={{ width: spinnerSize, height: spinnerSize }} />
			<LoadingText>{message}</LoadingText>
			{subtext && <LoadingSubtext>{subtext}</LoadingSubtext>}
		</LoadingContainer>
	);
};

export default LoadingFallback;
