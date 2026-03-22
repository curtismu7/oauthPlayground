import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerWrapper = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	animation: ${spin} 1s linear infinite;
`;

interface SpinnerProps {
	size?: number;
	color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 16, color = '#0070CC' }) => {
	return (
		<SpinnerWrapper
			style={{ animation: `${spin} 1s linear infinite` }}
		>
			<i
				className="bi bi-question-circle"
				role="img"
				aria-label="Loading"
				style={{ fontSize: `${size}px`, color }}
			/>
		</SpinnerWrapper>
	);
};

export default Spinner;
