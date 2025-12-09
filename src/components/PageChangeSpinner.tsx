import React, { useEffect, useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
`;

const SpinnerOverlay = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  animation: ${fadeIn} 0.3s ease;
`;

const SpinnerContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  text-align: center;
`;

const SpinnerIcon = styled(FiLoader)`
  font-size: 24px;
  color: #3b82f6;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 12px;
  display: block;
`;

const SpinnerText = styled.p`
  margin: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 160px;
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin: 8px auto 0;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $progress }) => $progress}%;
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`;

interface PageChangeSpinnerProps {
	isVisible: boolean;
	message?: string;
}

const PageChangeSpinner: React.FC<PageChangeSpinnerProps> = ({
	isVisible,
	message = 'Loading page...',
}) => {
	const [progress, setProgress] = useState(0);
	const [startTime, setStartTime] = useState<number | null>(null);

	useEffect(() => {
		if (isVisible) {
			setStartTime(Date.now());
			setProgress(0);

			// Simulate progress
			const progressInterval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 90) return prev;
					return prev + Math.random() * 15;
				});
			}, 200);

			return () => clearInterval(progressInterval);
		} else {
			setProgress(0);
			setStartTime(null);
		}
		return undefined;
	}, [isVisible]);

	// Ensure minimum display time
	useEffect(() => {
		if (isVisible && startTime) {
			const minDisplayTime = 800; // 800ms minimum
			const elapsed = Date.now() - startTime;

			if (elapsed < minDisplayTime) {
				const timer = setTimeout(() => {
					// This will be handled by the parent component
				}, minDisplayTime - elapsed);

				return () => clearTimeout(timer);
			}
		}
		return undefined;
	}, [isVisible, startTime]);

	return (
		<SpinnerOverlay $isVisible={isVisible}>
			<SpinnerContainer>
				<SpinnerIcon />
				<SpinnerText>{message}</SpinnerText>
				{progress > 0 && <ProgressBar $progress={progress} />}
			</SpinnerContainer>
		</SpinnerOverlay>
	);
};

export default PageChangeSpinner;
