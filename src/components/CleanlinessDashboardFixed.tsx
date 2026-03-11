import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

// PingOne UI Design System - Colors
const PING_ONE_COLORS = {
	primary: '#0066CC',
	primaryHover: '#0052A3',
	secondary: '#6C757D',
	success: '#28A745',
	warning: '#FFC107',
	danger: '#DC3545',
	info: '#17A2B8',
	light: '#F8F9FA',
	dark: '#343A40',
	background: '#FFFFFF',
	text: '#212529',
	textMuted: '#6C757D',
	border: '#DEE2E6',
};

// PingOne UI Design System - Typography
const PING_ONE_FONTS = {
	family: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
	sizes: {
		xs: '0.75rem',
		sm: '0.875rem',
		base: '1rem',
		lg: '1.125rem',
		xl: '1.25rem',
		'2xl': '1.5rem',
		'3xl': '1.875rem',
		'4xl': '2.25rem',
	},
	weights: {
		normal: 400,
		medium: 500,
		semibold: 600,
		bold: 700,
	},
};

// PingOne UI Design System - Spacing
const PING_ONE_SPACING = {
	1: '0.25rem',
	2: '0.5rem',
	3: '0.75rem',
	4: '1rem',
	5: '1.25rem',
	6: '1.5rem',
	8: '2rem',
	10: '2.5rem',
	12: '3rem',
	16: '4rem',
	20: '5rem',
};

// PingOne UI Design System - Borders & Shadows
const PING_ONE_BORDERS = {
	radius: {
		sm: '0.25rem',
		base: '0.375rem',
		md: '0.5rem',
		lg: '0.75rem',
		xl: '1rem',
	},
	shadow: {
		sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
		base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
		md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
		lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
	},
};

const DashboardContainer = styled.div`
	padding: ${PING_ONE_SPACING[8]};
	font-family: ${PING_ONE_FONTS.family};
	background: ${PING_ONE_COLORS.background};
	color: ${PING_ONE_COLORS.text};
	min-height: 100vh;
	line-height: 1.6;
`;

const Header = styled.h2`
	color: ${PING_ONE_COLORS.text};
	font-family: ${PING_ONE_FONTS.family};
	font-size: ${PING_ONE_FONTS.sizes['3xl']};
	font-weight: ${PING_ONE_FONTS.weights.semibold};
	margin-bottom: ${PING_ONE_SPACING[6]};
	text-align: center;
	letter-spacing: -0.025em;
`;

const Subheader = styled.p`
	color: ${PING_ONE_COLORS.textMuted};
	font-size: ${PING_ONE_FONTS.sizes.base};
	text-align: center;
	margin-bottom: ${PING_ONE_SPACING[8]};
`;

const MetricsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: ${PING_ONE_SPACING[6]};
	margin-bottom: ${PING_ONE_SPACING[10]};
`;

const MetricCard = styled.div`
	background: ${PING_ONE_COLORS.background};
	padding: ${PING_ONE_SPACING[6]};
	border-radius: ${PING_ONE_BORDERS.radius.lg};
	border: 1px solid ${PING_ONE_COLORS.border};
	box-shadow: ${PING_ONE_BORDERS.shadow.sm};
	transition: all 0.15s ease-in-out;

	&:hover {
		box-shadow: ${PING_ONE_BORDERS.shadow.md};
		transform: translateY(-2px);
	}
`;

const MetricTitle = styled.div`
	font-family: ${PING_ONE_FONTS.family};
	font-size: ${PING_ONE_FONTS.sizes.sm};
	font-weight: ${PING_ONE_FONTS.weights.medium};
	color: ${PING_ONE_COLORS.textMuted};
	margin-bottom: ${PING_ONE_SPACING[2]};
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const MetricValue = styled.div`
	font-family: ${PING_ONE_FONTS.family};
	font-size: ${PING_ONE_FONTS.sizes['2xl']};
	font-weight: ${PING_ONE_FONTS.weights.bold};
	color: ${PING_ONE_COLORS.primary};
`;

const ComponentList = styled.div`
	background: ${PING_ONE_COLORS.background};
	padding: ${PING_ONE_SPACING[6]};
	border-radius: ${PING_ONE_BORDERS.radius.lg};
	border: 1px solid ${PING_ONE_COLORS.border};
	box-shadow: ${PING_ONE_BORDERS.shadow.sm};
`;

const ComponentItem = styled.div`
	padding: ${PING_ONE_SPACING[3]};
	margin-bottom: ${PING_ONE_SPACING[2]};
	background: ${PING_ONE_COLORS.light};
	border-radius: ${PING_ONE_BORDERS.radius.base};
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: #e9ecef;
		transform: translateX(2px);
	}
`;

const ComponentName = styled.span`
	color: ${PING_ONE_COLORS.text};
	font-family: ${PING_ONE_FONTS.family};
	font-weight: ${PING_ONE_FONTS.weights.semibold};
	font-size: ${PING_ONE_FONTS.sizes.sm};
`;

const ComponentStats = styled.span`
	color: ${PING_ONE_COLORS.textMuted};
	font-family: ${PING_ONE_FONTS.mono};
	font-size: ${PING_ONE_FONTS.sizes.xs};
`;

const CleanlinessScore = styled.div<{ $score?: number }>`
	text-align: center;
	font-family: ${PING_ONE_FONTS.family};
	font-size: ${PING_ONE_FONTS.sizes['4xl']};
	font-weight: ${PING_ONE_FONTS.weights.bold};
	margin: ${PING_ONE_SPACING[8]} 0;
	padding: ${PING_ONE_SPACING[6]};
	border-radius: ${PING_ONE_BORDERS.radius.lg};
	transition: all 0.15s ease-in-out;

	color: ${(props) => {
		const score = props.$score || 0;
		if (score >= 80) return '#28A745';
		if (score >= 60) return '#FFC107';
		return '#DC3545';
	}};

	background: ${(props) => {
		const score = props.$score || 0;
		if (score >= 80) return 'rgba(40, 167, 69, 0.1)';
		if (score >= 60) return 'rgba(255, 193, 7, 0.1)';
		return 'rgba(220, 53, 69, 0.1)';
	}};

	border: 2px solid
		${(props) => {
			const score = props.$score || 0;
			if (score >= 80) return '#28A745';
			if (score >= 60) return '#FFC107';
			return '#DC3545';
		}};
`;

const UsageGuide = styled.div`
	margin-top: ${PING_ONE_SPACING[10]};
	padding: ${PING_ONE_SPACING[6]};
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	border-radius: ${PING_ONE_BORDERS.radius.lg};
	border: 1px solid ${PING_ONE_COLORS.border};
	box-shadow: ${PING_ONE_BORDERS.shadow.sm};
`;

const UsageGuideTitle = styled.h3`
	color: ${PING_ONE_COLORS.text};
	font-family: ${PING_ONE_FONTS.family};
	font-size: ${PING_ONE_FONTS.sizes.lg};
	font-weight: ${PING_ONE_FONTS.weights.semibold};
	margin-bottom: ${PING_ONE_SPACING[4]};
`;

const UsageGuideContent = styled.div`
	color: ${PING_ONE_COLORS.textMuted};
	font-family: ${PING_ONE_FONTS.family};
	font-size: ${PING_ONE_FONTS.sizes.sm};
	line-height: 1.6;

	p {
		margin-bottom: ${PING_ONE_SPACING[3]};
	}

	ul {
		margin: 0;
		padding-left: ${PING_ONE_SPACING[5]};
	}

	li {
		margin-bottom: ${PING_ONE_SPACING[2]};
	}
`;

export const CleanlinessDashboardFixed: React.FC = () => {
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
			// Check if component tracker is available
			if (typeof window !== 'undefined' && window.componentTracker) {
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
			<Header>🧹 Component Cleanliness Dashboard</Header>
			<Subheader>
				Monitor your application's performance and component health in real-time
			</Subheader>

			<MetricsGrid>
				<MetricCard>
					<MetricTitle>Total Components</MetricTitle>
					<MetricValue>{metrics.totalComponents}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricTitle>Total Renders</MetricTitle>
					<MetricValue>{metrics.totalRenders}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricTitle>Average Renders</MetricTitle>
					<MetricValue>{metrics.averageRenders.toFixed(1)}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricTitle>Memory Usage</MetricTitle>
					<MetricValue>{metrics.memoryUsage} MB</MetricValue>
				</MetricCard>
			</MetricsGrid>

			<CleanlinessScore $score={metrics.cleanlinessScore}>
				Cleanliness Score: {metrics.cleanlinessScore}%
			</CleanlinessScore>

			<ComponentList>
				<UsageGuideTitle>Top Components</UsageGuideTitle>
				{components.map((component) => (
					<ComponentItem key={component.name}>
						<ComponentName>{component.name}</ComponentName>
						<ComponentStats>
							Renders: {component.renderCount} | Props: {component.propCount} | Last:{' '}
							{formatTime(component.lastRender)}
						</ComponentStats>
					</ComponentItem>
				))}
				{components.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: PING_ONE_SPACING[6],
							color: PING_ONE_COLORS.textMuted,
						}}
					>
						No components tracked yet. Navigate through the app to see metrics.
					</div>
				)}
			</ComponentList>

			<UsageGuide>
				<UsageGuideTitle>📖 How to Use</UsageGuideTitle>
				<UsageGuideContent>
					<p>Navigate through different apps and flows to see real-time metrics</p>
					<p>Components with high render counts may need optimization</p>
					<p>Memory usage should remain stable (watch for leaks)</p>
					<p>Cleanliness score decreases with excessive renders and memory usage</p>
				</UsageGuideContent>
			</UsageGuide>
		</DashboardContainer>
	);
};
