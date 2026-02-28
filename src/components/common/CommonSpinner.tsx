/**
 * @file CommonSpinner.tsx
 * @module components/common
 * @description Unified spinner component for Production apps
 * @version 1.0.0
 */

import React from 'react';
import { FiLoader, FiX } from '@icons';
import styled, { keyframes } from 'styled-components';
import type { CommonSpinnerProps, SpinnerSize, SpinnerTheme } from '@/types/spinner';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

// Theme configurations
const themeConfig: Record<SpinnerTheme, { primary: string; secondary: string; text: string }> = {
	blue: {
		primary: '#3b82f6',
		secondary: '#dbeafe',
		text: '#1e40af',
	},
	green: {
		primary: '#10b981',
		secondary: '#d1fae5',
		text: '#065f46',
	},
	orange: {
		primary: '#f59e0b',
		secondary: '#fed7aa',
		text: '#92400e',
	},
	purple: {
		primary: '#8b5cf6',
		secondary: '#e9d5ff',
		text: '#6b21a8',
	},
};

// Size configurations
const sizeConfig: Record<SpinnerSize, { icon: number; container: string; fontSize: string }> = {
	sm: { icon: 16, container: '24px', fontSize: '12px' },
	md: { icon: 20, container: '32px', fontSize: '14px' },
	lg: { icon: 24, container: '40px', fontSize: '16px' },
	xl: { icon: 32, container: '48px', fontSize: '18px' },
};

// Styled components
const SpinnerContainer = styled.div<{
	$variant: 'inline' | 'modal' | 'overlay';
	$theme: SpinnerTheme;
	$size: SpinnerSize;
	$show: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $size }) => ($size === 'sm' ? '8px' : $size === 'md' ? '12px' : '16px')};
  
  /* Variant styles */
  ${({ $variant, $theme }) => {
		switch ($variant) {
			case 'inline':
				return `
          display: inline-flex;
          padding: 8px 16px;
          border-radius: 6px;
          background: ${themeConfig[$theme].secondary}20;
          border: 1px solid ${themeConfig[$theme].primary}30;
        `;
			case 'modal':
				return `
          flex-direction: column;
          padding: 32px;
          border-radius: 12px;
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid ${themeConfig[$theme].primary}20;
          min-width: 280px;
          max-width: 400px;
        `;
			case 'overlay':
				return `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 10000;
          flex-direction: column;
        `;
			default:
				return '';
		}
	}}
  
  /* Animation */
  animation: ${({ $show }) => ($show ? fadeIn : fadeOut)} 0.3s ease-out;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};
`;

const SpinnerIcon = styled.div<{
	$size: SpinnerSize;
	$theme: SpinnerTheme;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => sizeConfig[$size].container};
  height: ${({ $size }) => sizeConfig[$size].container};
  animation: ${spin} 1s linear infinite;
  
  svg {
    font-size: ${({ $size }) => sizeConfig[$size].icon}px;
    color: ${({ $theme }) => themeConfig[$theme].primary};
  }
`;

const SpinnerText = styled.div<{
	$size: SpinnerSize;
	$theme: SpinnerTheme;
}>`
  font-weight: 500;
  color: ${({ $theme }) => themeConfig[$theme].text};
  font-size: ${({ $size }) => sizeConfig[$size].fontSize};
  text-align: center;
  line-height: 1.4;
`;

const ProgressContainer = styled.div<{
	$size: SpinnerSize;
	$theme: SpinnerTheme;
}>`
  width: 100%;
  margin-top: 16px;
`;

const ProgressBar = styled.div<{
	$theme: SpinnerTheme;
	$progress: number;
}>`
  height: 4px;
  background: ${({ $theme }) => themeConfig[$theme].secondary};
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${({ $progress }) => $progress}%;
    background: ${({ $theme }) => themeConfig[$theme].primary};
    transition: width 0.3s ease-out;
  }
`;

const DismissButton = styled.button<{
	$theme: SpinnerTheme;
}>`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: ${({ $theme }) => themeConfig[$theme].text};
  opacity: 0.6;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
  
  svg {
    font-size: 16px;
  }
`;

/**
 * Unified spinner component for Production applications
 */
export const CommonSpinner: React.FC<CommonSpinnerProps> = ({
	message = 'Loading...',
	size = 'md',
	theme = 'blue',
	variant = 'inline',
	showProgress = false,
	progress = 0,
	allowDismiss = false,
	onDismiss,
	className,
}) => {
	const handleDismiss = () => {
		if (onDismiss) {
			onDismiss();
		}
	};

	return (
		<SpinnerContainer
			$variant={variant}
			$theme={theme}
			$size={size}
			$show={true}
			className={className}
		>
			{allowDismiss && variant === 'modal' && (
				<DismissButton $theme={theme} onClick={handleDismiss}>
					<FiX />
				</DismissButton>
			)}

			<SpinnerIcon $size={size} $theme={theme}>
				<FiLoader />
			</SpinnerIcon>

			{message && (
				<SpinnerText $size={size} $theme={theme}>
					{message}
				</SpinnerText>
			)}

			{showProgress && variant !== 'inline' && (
				<ProgressContainer $size={size} $theme={theme}>
					<ProgressBar $theme={theme} $progress={Math.min(100, Math.max(0, progress))} />
				</ProgressContainer>
			)}
		</SpinnerContainer>
	);
};

export default CommonSpinner;
