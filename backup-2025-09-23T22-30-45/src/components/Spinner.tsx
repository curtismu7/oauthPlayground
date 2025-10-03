import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FiLoader } from 'react-icons/fi';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerWrapper = styled.div<{ size?: number; color?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ${spin} 1s linear infinite;

  svg {
    font-size: ${({ size }) => size || 16}px;
    color: ${({ color, theme }) => color || theme?.colors?.primary || '#0070CC'};
  }
`;

interface SpinnerProps {
	size?: number;
	color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 16, color }) => {
	return (
		<SpinnerWrapper size={size} color={color}>
			<FiLoader />
		</SpinnerWrapper>
	);
};

export default Spinner;
