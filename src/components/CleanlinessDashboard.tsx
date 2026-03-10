import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useComponentTracker } from '../hooks/useComponentTracker';

// Type declaration for window.componentTracker
declare global {
	interface Window {
		componentTracker?: {
			generateReport: () => {
				totalComponents: number;
				totalRenders: number;
				averageRendersPerComponent: number;
				memoryUsage?: number;
			};
			getMetrics: () => Array<{
				name: string;
				renderCount: number;
				propCount: number;
				lastRender: number;
			}>;
		};
	}
}

const DashboardContainer = styled.div`
	padding: 20px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #1a1a1a;
	color: #00ff00;
	min-height: 100vh;
`;

const Header = styled.h2`
	color: #00ff00;
	margin-bottom: 20px;
	text-align: center;
`;

const MetricsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 20px;
	margin-bottom: 30px;
`;

const MetricCard = styled.div`
	background: #2a2a2a;
	border: 1px solid #00ff00;
	border-radius: 8px;
	padding: 15px;
`;

const MetricTitle = styled.h3`
	color: #00ff00;
	margin: 0 0 10px 0;
	font-size: 14px;
`;

const MetricValue = styled.div`
	color: #ffffff;
	font-size: 24px;
	font-weight: bold;
	margin-bottom: 5px;
`;

const MetricDescription = styled.div`
	color: #888888;
	font-size: 12px;
`;

const ComponentList = styled.div`
	background: #2a2a2a;
	border: 1px solid #00ff00;
	border-radius: 8px;
	padding: 15px;
	max-height: 400px;
	overflow-y: auto;
`;

const ComponentItem = styled.div`
	padding: 8px;
	margin-bottom: 5px;
	background: #333333;
	border-radius: 4px;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const ComponentName = styled.span`
	color: #00ff00;
	font-weight: bold;
`;

const ComponentStats = styled.span`
	color: #ffffff;
	font-size: 12px;
`;

const Button = styled.button`
	background: #00ff00;
	color: #1a1a1a;
	border: none;
	padding: 10px 20px;
	border-radius: 4px;
	cursor: pointer;
	font-family: inherit;
	margin: 10px 5px;

	&:hover {
		background: #00cc00;
	}
`;

const CleanlinessScore = styled.div<{ $score?: number }>`
	text-align: center;
	font-size: 48px;
	font-weight: bold;
	margin: 20px 0;
	color: ${(props) => {
		const score = props.$score || 0;
		if (score >= 80) return '#00ff00';
		if (score >= 60) return '#ffff00';
		return '#ff0000';
	}};
`;

export const CleanlinessDashboard: React.FC = () => {
	useComponentTracker('CleanlinessDashboard');

	const [metrics, setMetrics] = useState({
		totalComponents: 0,
		totalRenders: 0,
		averageRenders: 0,
		memoryUsage: 0,
		cleanlinessScore: 100,
	});

	const [components, setComponents] = useState<
		Array<{
			name: string;
			renderCount: number;
			propCount: number;
			lastRender: number;
		}>
	>([]);

	const updateMetrics = useCallback(() => {
		try {
			if (window.componentTracker) {
				const report = window.componentTracker.generateReport();
				const componentMetrics = window.componentTracker.getMetrics();

				setMetrics({
					totalComponents: report.totalComponents,
					totalRenders: report.totalRenders,
					averageRenders: report.averageRendersPerComponent,
					memoryUsage: report.memoryUsage ? Math.round(report.memoryUsage / 1024 / 1024) : 0,
					cleanlinessScore: Math.max(
						0,
						100 -
							report.averageRendersPerComponent * 2 -
							(report.memoryUsage ? report.memoryUsage / 10 : 0)
					),
				});

				setComponents(
					componentMetrics.slice(0, 10).map((comp) => ({
						name: comp.name,
						renderCount: comp.renderCount,
						propCount: comp.propCount,
						lastRender: comp.lastRender,
					}))
				);
			} else {
				// Component tracker not available, show default state
				setMetrics({
					totalComponents: 0,
					totalRenders: 0,
					averageRenders: 0,
					memoryUsage: 0,
					cleanlinessScore: 100,
				});
				setComponents([]);
			}
		} catch (error) {
			console.error('CleanlinessDashboard: Error updating metrics', error);
			// Set safe defaults on error
			setMetrics({
				totalComponents: 0,
				totalRenders: 0,
				averageRenders: 0,
				memoryUsage: 0,
				cleanlinessScore: 100,
			});
			setComponents([]);
		}
	}, []);

	useEffect(() => {
		updateMetrics();
		const interval = setInterval(updateMetrics, 2000);
		return () => clearInterval(interval);
	}, [updateMetrics]);

	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	return (
		<DashboardContainer>
			<Header>🧹 Real-Time Cleanliness Dashboard</Header>

			<CleanlinessScore $score={metrics.cleanlinessScore}>
				{metrics.cleanlinessScore}% Clean
			</CleanlinessScore>

			<MetricsGrid>
				<MetricCard>
					<MetricTitle>📊 Active Components</MetricTitle>
					<MetricValue>{metrics.totalComponents}</MetricValue>
					<MetricDescription>Components currently tracked</MetricDescription>
				</MetricCard>

				<MetricCard>
					<MetricTitle>🔄 Total Renders</MetricTitle>
					<MetricValue>{metrics.totalRenders}</MetricValue>
					<MetricDescription>Combined render count</MetricDescription>
				</MetricCard>

				<MetricCard>
					<MetricTitle>📈 Average Renders</MetricTitle>
					<MetricValue>{metrics.averageRenders.toFixed(1)}</MetricValue>
					<MetricDescription>Renders per component</MetricDescription>
				</MetricCard>

				<MetricCard>
					<MetricTitle>🧠 Memory Usage</MetricTitle>
					<MetricValue>{metrics.memoryUsage} MB</MetricValue>
					<MetricDescription>Current heap size</MetricDescription>
				</MetricCard>
			</MetricsGrid>

			<div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
				<Button onClick={updateMetrics}>🔄 Refresh</Button>
				<Button onClick={() => window.componentTracker?.reset()}>🗑️ Reset</Button>
				<Button
					onClick={() => console.log('Full Report:', window.componentTracker?.generateReport())}
				>
					📋 Log Report
				</Button>
			</div>

			<ComponentList>
				<MetricTitle>🎯 Top Components (by renders)</MetricTitle>
				{components.map((component, index) => (
					<ComponentItem key={index}>
						<ComponentName>{component.name}</ComponentName>
						<ComponentStats>
							Renders: {component.renderCount} | Props: {component.propCount} | Last:{' '}
							{formatTime(component.lastRender)}
						</ComponentStats>
					</ComponentItem>
				))}
				{components.length === 0 && (
					<div style={{ textAlign: 'center', padding: '20px', color: '#888888' }}>
						No components tracked yet. Navigate through the app to see metrics.
					</div>
				)}
			</ComponentList>

			<div
				style={{ marginTop: '30px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}
			>
				<MetricTitle>📖 How to Use</MetricTitle>
				<div style={{ color: '#cccccc', fontSize: '14px', lineHeight: '1.5' }}>
					<p>• Navigate through different apps and flows to see real-time metrics</p>
					<p>• Components with high render counts may need optimization</p>
					<p>• Memory usage should remain stable (watch for leaks)</p>
					<p>• Cleanliness score decreases with excessive renders and memory usage</p>
				</div>
			</div>
		</DashboardContainer>
	);
};
