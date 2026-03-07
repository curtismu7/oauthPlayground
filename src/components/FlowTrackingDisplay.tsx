// src/components/FlowTrackingDisplay.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FlowContext, flowTrackingService } from '../services/flowTrackingService';

const Container = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 8px;
	padding: 16px;
	margin: 16px 0;
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	font-size: 12px;
`;

const Title = styled.h3`
	margin: 0 0 12px 0;
	color: #1e293b;
	font-size: 14px;
	font-weight: 600;
`;

const Section = styled.div`
	margin-bottom: 12px;
`;

const SectionTitle = styled.div`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin-bottom: 4px;
`;

const Info = styled.div`
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin-left: 8px;
`;

const ErrorInfo = styled.div`
	color: V9_COLORS.PRIMARY.RED_DARK;
	margin-left: 8px;
`;

const Button = styled.button`
	background: V9_COLORS.PRIMARY.BLUE;
	color: white;
	border: none;
	border-radius: 4px;
	padding: 6px 12px;
	font-size: 12px;
	cursor: pointer;
	margin-right: 8px;
	margin-top: 8px;
	
	&:hover {
		background: V9_COLORS.PRIMARY.BLUE_DARK;
	}
`;

const LogoutUrlInfo = styled.div`
	background: V9_COLORS.BG.WARNING;
	border: 1px solid V9_COLORS.PRIMARY.YELLOW;
	border-radius: 4px;
	padding: 8px;
	margin-top: 8px;
	color: V9_COLORS.PRIMARY.YELLOW_DARK;
	font-size: 11px;
`;

const FlowTrackingDisplay: React.FC = () => {
	const [currentFlow, setCurrentFlow] = useState<FlowContext | null>(null);
	const [flowStats, setFlowStats] = useState<any>(null);
	const [logoutUrl, setLogoutUrl] = useState<string | null>(null);

	useEffect(() => {
		const updateDisplay = () => {
			const flow = flowTrackingService.getCurrentFlow();
			const stats = flowTrackingService.getFlowStats();
			setCurrentFlow(flow);
			setFlowStats(stats);

			// Check for logout URL in localStorage
			const keys = Object.keys(localStorage);
			const logoutKeys = keys.filter(
				(key) =>
					key.toLowerCase().includes('logout') ||
					localStorage.getItem(key)?.includes('authz-logout-callback')
			);

			if (logoutKeys.length > 0) {
				const logoutValue = localStorage.getItem(logoutKeys[0]);
				setLogoutUrl(logoutValue);
			}
		};

		updateDisplay();

		// Update every 2 seconds
		const interval = setInterval(updateDisplay, 2000);

		return () => clearInterval(interval);
	}, []);

	const handleReturnToFlow = () => {
		flowTrackingService.returnToCurrentFlow();
	};

	const handleClearFlow = () => {
		flowTrackingService.clearCurrentFlow();
		setCurrentFlow(null);
	};

	const handleClearHistory = () => {
		flowTrackingService.clearFlowHistory();
		setFlowStats((prev) => ({ ...prev, totalFlows: 0 }));
	};

	return (
		<Container>
			<Title>🔄 Flow Tracking Status</Title>

			<Section>
				<SectionTitle>Current Flow:</SectionTitle>
				{currentFlow ? (
					<Info>
						<div>
							<strong>Flow:</strong> {currentFlow.flowKey}
						</div>
						<div>
							<strong>Name:</strong> {currentFlow.flowName}
						</div>
						<div>
							<strong>Type:</strong> {currentFlow.flowType}
						</div>
						<div>
							<strong>Step:</strong> {currentFlow.currentStep || 0}
						</div>
						<div>
							<strong>Started:</strong> {new Date(currentFlow.timestamp).toLocaleTimeString()}
						</div>
						{currentFlow.sessionId && (
							<div>
								<strong>Session:</strong> {currentFlow.sessionId}
							</div>
						)}
					</Info>
				) : (
					<Info>No active flow</Info>
				)}
			</Section>

			{flowStats?.lastError && (
				<Section>
					<SectionTitle>Last Error:</SectionTitle>
					<ErrorInfo>
						<div>
							<strong>Type:</strong> {flowStats.lastError.errorType}
						</div>
						<div>
							<strong>Message:</strong> {flowStats.lastError.errorMessage}
						</div>
						<div>
							<strong>Flow:</strong> {flowStats.lastError.flowKey}
						</div>
						<div>
							<strong>Time:</strong> {new Date(flowStats.lastError.timestamp).toLocaleTimeString()}
						</div>
					</ErrorInfo>
				</Section>
			)}

			<Section>
				<SectionTitle>Flow History:</SectionTitle>
				<Info>Total flows: {flowStats?.totalFlows || 0}</Info>
			</Section>

			{logoutUrl && (
				<Section>
					<SectionTitle>Logout URL Found:</SectionTitle>
					<LogoutUrlInfo>
						{logoutUrl.includes('authz-logout-callback') ? '✅' : '⚠️'} {logoutUrl}
					</LogoutUrlInfo>
				</Section>
			)}

			<div>
				<Button onClick={handleReturnToFlow} disabled={!currentFlow}>
					Return to Flow
				</Button>
				<Button onClick={handleClearFlow} disabled={!currentFlow}>
					Clear Current Flow
				</Button>
				<Button onClick={handleClearHistory}>Clear History</Button>
			</div>
		</Container>
	);
};

export default FlowTrackingDisplay;
