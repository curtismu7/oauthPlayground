import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-top: 4px solid V9_COLORS.PRIMARY.BLUE;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled.div`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 14px;
  font-weight: 500;
`;

const LoadingSubtext = styled.div`
  color: V9_COLORS.TEXT.GRAY_LIGHT;
  font-size: 12px;
  margin-top: 0.5rem;
`;

interface ComponentLoaderProps {
	message?: string;
	subtext?: string;
}

export const ComponentLoader: React.FC<ComponentLoaderProps> = ({
	message = 'Loading component...',
	subtext = 'Please wait a moment',
}) => {
	return (
		<LoadingContainer>
			<Spinner />
			<LoadingText>{message}</LoadingText>
			<LoadingSubtext>{subtext}</LoadingSubtext>
		</LoadingContainer>
	);
};

export default ComponentLoader;
