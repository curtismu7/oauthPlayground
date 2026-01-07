/**
 * @file StartupLoader.tsx
 * @description Full-screen loading spinner that displays during app initialization
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const LoaderContainer = styled.div<{ $isFadingOut: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 99999;
	animation: ${(props) => (props.$isFadingOut ? fadeOut : 'none')} 0.3s ease-out forwards;
`;

const SpinnerContainer = styled.div`
	background: white;
	border-radius: 8px;
	padding: 16px 20px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	min-width: 160px;
	text-align: center;
`;

const Spinner = styled.div`
	width: 24px;
	height: 24px;
	border: 3px solid #e5e7eb;
	border-top-color: #3b82f6;
	border-radius: 50%;
	animation: ${spin} 1s linear infinite;
	margin: 0 auto 12px;
`;

const Title = styled.h1`
	color: #374151;
	font-size: 16px;
	font-weight: 600;
	margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
	color: #6b7280;
	font-size: 13px;
	margin: 0;
`;

interface StartupLoaderProps {
	/** Whether the app is still loading */
	isLoading: boolean;
	/** Minimum time to show loader (prevents flicker) in milliseconds */
	minDisplayTime?: number;
}

/**
 * StartupLoader - Full-screen loading spinner for app initialization
 *
 * Displays a branded loading screen with spinner until the app is fully initialized.
 * Includes a minimum display time to prevent flicker on fast loads.
 */
export const StartupLoader: React.FC<StartupLoaderProps> = ({
	isLoading,
	minDisplayTime = 800,
}) => {
	const [shouldShow, setShouldShow] = useState(true);
	const [isFadingOut, setIsFadingOut] = useState(false);
	const [startTime] = useState(Date.now());

	useEffect(() => {
		if (!isLoading) {
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, minDisplayTime - elapsed);

			// Wait for minimum display time, then fade out
			const timer = setTimeout(() => {
				setIsFadingOut(true);
				// Remove from DOM after fade animation
				setTimeout(() => {
					setShouldShow(false);
				}, 300);
			}, remaining);

			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isLoading, minDisplayTime, startTime]);

	if (!shouldShow) {
		return null;
	}

	return (
		<LoaderContainer $isFadingOut={isFadingOut}>
			<SpinnerContainer>
				<Spinner />
				<Title>Loading...</Title>
				<Subtitle>Initializing application</Subtitle>
			</SpinnerContainer>
		</LoaderContainer>
	);
};

export default StartupLoader;
