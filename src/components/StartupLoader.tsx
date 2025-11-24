/**
 * @file StartupLoader.tsx
 * @description Full-screen loading spinner that displays during app initialization
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const MODULE_TAG = '[🚀 STARTUP-LOADER]';

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
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 99999;
	animation: ${(props) => (props.$isFadingOut ? fadeOut : 'none')} 0.3s ease-out forwards;
`;

const Spinner = styled.div`
	width: 60px;
	height: 60px;
	border: 4px solid rgba(255, 255, 255, 0.3);
	border-top-color: white;
	border-radius: 50%;
	animation: ${spin} 1s linear infinite;
	margin-bottom: 24px;
`;

const Logo = styled.div`
	font-size: 48px;
	margin-bottom: 16px;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
`;

const Title = styled.h1`
	color: white;
	font-size: 28px;
	font-weight: 600;
	margin: 0 0 8px 0;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const Subtitle = styled.p`
	color: rgba(255, 255, 255, 0.9);
	font-size: 14px;
	margin: 0;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
	}, [isLoading, minDisplayTime, startTime]);

	if (!shouldShow) {
		return null;
	}

	return (
		<LoaderContainer $isFadingOut={isFadingOut}>
			<Logo>🔐</Logo>
			<Title>OAuth Playground</Title>
			<Subtitle>Initializing application...</Subtitle>
			<Spinner />
		</LoaderContainer>
	);
};

export default StartupLoader;

