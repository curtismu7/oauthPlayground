// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/ErrorBoundaryTest.tsx
// V7.1 Error Boundary Test - Test component to demonstrate error boundary functionality

import React, { useState } from 'react';
import styled from 'styled-components';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import { UI_CONSTANTS } from '../constants/uiConstants';
import { FlowErrorBoundary } from './FlowErrorBoundary';

const TestContainer = styled.div`
  padding: ${UI_CONSTANTS.SPACING['2XL']};
  background: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BACKGROUND};
  border: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BORDER};
  border-radius: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BORDER_RADIUS};
  margin: ${UI_CONSTANTS.SPACING.LG};
`;

const TestButton = styled.button`
  padding: ${UI_CONSTANTS.SPACING.MD} ${UI_CONSTANTS.SPACING.LG};
  margin: ${UI_CONSTANTS.SPACING.SM};
  border: none;
  border-radius: ${UI_CONSTANTS.BUTTON.PRIMARY_BORDER_RADIUS};
  background: ${UI_CONSTANTS.BUTTON.PRIMARY_BACKGROUND};
  color: ${UI_CONSTANTS.BUTTON.PRIMARY_COLOR};
  font-size: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_WEIGHT};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:hover {
    box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_HOVER_SHADOW};
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
  }
  
  &:active {
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_ACTIVE};
  }
`;

const TestTitle = styled.h3`
  margin: 0 0 ${UI_CONSTANTS.SPACING.LG} 0;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.XL};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.BOLD};
  color: ${UI_CONSTANTS.COLORS.GRAY_900};
`;

const TestDescription = styled.p`
  margin: 0 0 ${UI_CONSTANTS.SPACING.LG} 0;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.BASE};
  color: ${UI_CONSTANTS.COLORS.GRAY_600};
  line-height: ${UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.RELAXED};
`;

// Component that throws an error
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
	if (shouldThrow) {
		throw new Error('This is a test error to demonstrate the error boundary functionality!');
	}

	return (
		<div>
			<p>✅ Component is working correctly!</p>
		</div>
	);
};

// Test component
export const ErrorBoundaryTest: React.FC = () => {
	const [shouldThrow, setShouldThrow] = useState(false);
	const [errorCount, setErrorCount] = useState(0);

	const handleThrowError = () => {
		setShouldThrow(true);
		setErrorCount((prev) => prev + 1);
	};

	const handleReset = () => {
		setShouldThrow(false);
		setErrorCount(0);
	};

	const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
		console.log('Error boundary caught error:', error, errorInfo);
	};

	const handleRetry = () => {
		console.log('Error boundary retry triggered');
		setShouldThrow(false);
	};

	return (
		<TestContainer>
			<TestTitle>Error Boundary Test</TestTitle>
			<TestDescription>
				This component demonstrates the error boundary functionality. Click the button below to
				trigger an error and see how the error boundary handles it.
			</TestDescription>

			<div>
				<TestButton onClick={handleThrowError}>🚨 Trigger Error</TestButton>
				<TestButton onClick={handleReset}>🔄 Reset Test</TestButton>
			</div>

			<p>Error count: {errorCount}</p>

			<FlowErrorBoundary
				flowName="Error Boundary Test"
				onError={handleError}
				onRetry={handleRetry}
				onReset={handleReset}
				showDetails={true}
			>
				<ErrorThrowingComponent shouldThrow={shouldThrow} />
			</FlowErrorBoundary>
		</TestContainer>
	);
};

export default ErrorBoundaryTest;
