import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiLoader } from 'react-icons/fi';

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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: ${({ $isVisible }) => $isVisible ? 1 : 0};
  visibility: ${({ $isVisible }) => $isVisible ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  animation: ${fadeIn} 0.3s ease;
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
`;

const SpinnerIcon = styled(FiLoader)`
  font-size: 2.5rem;
  color: #0070cc;
  animation: ${spin} 1s linear infinite;
`;

const SpinnerText = styled.p`
  margin: 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 200px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $progress }) => $progress}%;
    background: linear-gradient(90deg, #0070cc, #0056b3);
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
  message = "Loading page..." 
}) => {
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      setStartTime(Date.now());
      setProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(progressInterval);
    } else {
      setProgress(0);
      setStartTime(null);
    }
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
  }, [isVisible, startTime]);

  return (
    <SpinnerOverlay $isVisible={isVisible}>
      <SpinnerContainer>
        <SpinnerIcon />
        <SpinnerText>{message}</SpinnerText>
        <ProgressBar $progress={progress} />
      </SpinnerContainer>
    </SpinnerOverlay>
  );
};

export default PageChangeSpinner;
