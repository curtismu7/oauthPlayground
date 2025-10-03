import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
	FiActivity,
	FiTrendingUp,
	FiTrendingDown,
	FiZap,
	FiDownload,
	FiClock,
	FiMonitor,
} from 'react-icons/fi';
import { PerformanceMonitor } from '../components/PerformanceMonitor';
import { useLazyLoadingMetrics } from '../hooks/useLazyLoading';
import { logger } from '../utils/logger';

// Styled components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DashboardTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

const DashboardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
`;

const DashboardSubtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const MetricLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray700};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetricIcon = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ color }) => color};
  color: white;
  font-size: 16px;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const MetricUnit = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray500};
  margin-left: 0.25rem;
`;

const MetricDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.5;
`;

const MetricTrend = styled.div<{ trend: 'up' | 'down' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ trend }) => {
		switch (trend) {
			case 'up':
				return '#16a34a';
			case 'down':
				return '#dc2626';
			default:
				return '#6b7280';
		}
	}};
  margin-top: 0.5rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
`;

const PerformanceSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${({ variant, theme }) =>
		variant === 'primary' ? theme.colors.primary : theme.colors.gray300};
  background: ${({ variant, theme }) => (variant === 'primary' ? theme.colors.primary : 'white')};
  color: ${({ variant, theme }) => (variant === 'primary' ? 'white' : theme.colors.gray700)};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ variant, theme }) =>
			variant === 'primary' ? theme.colors.primaryDark : theme.colors.gray100};
    transform: translateY(-1px);
  }
`;

// Performance Dashboard Component
export const PerformanceDashboard: React.FC = () => {
	const [performanceData, setPerformanceData] = useState({
		loadTime: 0,
		renderTime: 0,
		memoryUsage: 0,
		bundleSize: 509.51, // From build output
		chunkCount: 7,
		cacheHitRate: 0,
		errorRate: 0,
	});

	const lazyLoadingMetrics = useLazyLoadingMetrics();

	// Update performance data
	useEffect(() => {
		const updatePerformanceData = () => {
			const navigation = performance.getEntriesByType(
				'navigation'
			)[0] as PerformanceNavigationTiming;
			const paint = performance.getEntriesByType('paint');

			const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
			const renderTime =
				paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0;

			// Memory usage (if available)
			const memoryUsage = (performance as any).memory
				? (performance as any).memory.usedJSHeapSize / 1024 / 1024
				: 0;

			// Cache hit rate (simulated)
			const cacheHitRate = Math.random() * 100;

			// Error rate from lazy loading metrics
			const errorRate =
				lazyLoadingMetrics.totalErrors > 0
					? (lazyLoadingMetrics.totalErrors /
							(lazyLoadingMetrics.loadedComponents + lazyLoadingMetrics.totalErrors)) *
						100
					: 0;

			setPerformanceData({
				loadTime,
				renderTime,
				memoryUsage,
				bundleSize: 509.51,
				chunkCount: 7,
				cacheHitRate,
				errorRate,
			});
		};

		updatePerformanceData();
		const interval = setInterval(updatePerformanceData, 5000); // Update every 5 seconds

		return () => clearInterval(interval);
	}, [lazyLoadingMetrics]);

	const handleRefreshMetrics = () => {
		logger.info('[PerformanceDashboard] Refreshing performance metrics');
		// Force update of performance data
		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
		const paint = performance.getEntriesByType('paint');

		const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
		const renderTime =
			paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0;

		setPerformanceData((prev) => ({
			...prev,
			loadTime,
			renderTime,
		}));
	};

	const handleClearMetrics = () => {
		logger.info('[PerformanceDashboard] Clearing performance metrics');
		lazyLoadingMetrics.clearMetrics();
		setPerformanceData((prev) => ({
			...prev,
			errorRate: 0,
		}));
	};

	return (
		<DashboardContainer>
			<DashboardHeader>
				<DashboardIcon>
					<FiMonitor />
				</DashboardIcon>
				<div>
					<DashboardTitle>Performance Dashboard</DashboardTitle>
					<DashboardSubtitle>
						Monitor application performance, lazy loading metrics, and optimization insights
					</DashboardSubtitle>
				</div>
			</DashboardHeader>

			<MetricsGrid>
				<MetricCard>
					<MetricHeader>
						<MetricLabel>Load Time</MetricLabel>
						<MetricIcon color="#3b82f6">
							<FiClock />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>
						{performanceData.loadTime.toFixed(0)}
						<MetricUnit>ms</MetricUnit>
					</MetricValue>
					<MetricDescription>Time to load the application</MetricDescription>
					<MetricTrend trend={performanceData.loadTime < 1000 ? 'up' : 'down'}>
						{performanceData.loadTime < 1000 ? <FiTrendingUp /> : <FiTrendingDown />}
						{performanceData.loadTime < 1000 ? 'Good' : 'Slow'}
					</MetricTrend>
				</MetricCard>

				<MetricCard>
					<MetricHeader>
						<MetricLabel>Render Time</MetricLabel>
						<MetricIcon color="#10b981">
							<FiZap />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>
						{performanceData.renderTime.toFixed(0)}
						<MetricUnit>ms</MetricUnit>
					</MetricValue>
					<MetricDescription>First contentful paint time</MetricDescription>
					<MetricTrend trend={performanceData.renderTime < 500 ? 'up' : 'down'}>
						{performanceData.renderTime < 500 ? <FiTrendingUp /> : <FiTrendingDown />}
						{performanceData.renderTime < 500 ? 'Fast' : 'Slow'}
					</MetricTrend>
				</MetricCard>

				<MetricCard>
					<MetricHeader>
						<MetricLabel>Bundle Size</MetricLabel>
						<MetricIcon color="#8b5cf6">
							<FiDownload />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>
						{performanceData.bundleSize.toFixed(1)}
						<MetricUnit>kB</MetricUnit>
					</MetricValue>
					<MetricDescription>Total application size (optimized)</MetricDescription>
					<MetricTrend trend="up">
						<FiTrendingUp />
						Optimized
					</MetricTrend>
				</MetricCard>

				<MetricCard>
					<MetricHeader>
						<MetricLabel>Chunk Count</MetricLabel>
						<MetricIcon color="#f59e0b">
							<FiActivity />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{performanceData.chunkCount}</MetricValue>
					<MetricDescription>Code-split chunks for better caching</MetricDescription>
					<MetricTrend trend="up">
						<FiTrendingUp />
						Optimized
					</MetricTrend>
				</MetricCard>

				<MetricCard>
					<MetricHeader>
						<MetricLabel>Memory Usage</MetricLabel>
						<MetricIcon color="#ef4444">
							<FiMonitor />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>
						{performanceData.memoryUsage.toFixed(1)}
						<MetricUnit>MB</MetricUnit>
					</MetricValue>
					<MetricDescription>JavaScript heap size</MetricDescription>
					<MetricTrend trend={performanceData.memoryUsage < 50 ? 'up' : 'down'}>
						{performanceData.memoryUsage < 50 ? <FiTrendingUp /> : <FiTrendingDown />}
						{performanceData.memoryUsage < 50 ? 'Low' : 'High'}
					</MetricTrend>
				</MetricCard>

				<MetricCard>
					<MetricHeader>
						<MetricLabel>Loaded Components</MetricLabel>
						<MetricIcon color="#06b6d4">
							<FiZap />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{lazyLoadingMetrics.loadedComponents}</MetricValue>
					<MetricDescription>Lazy-loaded components</MetricDescription>
					<MetricTrend trend="up">
						<FiTrendingUp />
						Active
					</MetricTrend>
				</MetricCard>
			</MetricsGrid>

			<PerformanceSection>
				<SectionTitle>Real-time Performance Monitor</SectionTitle>
				<PerformanceMonitor />
			</PerformanceSection>

			<Actions>
				<ActionButton variant="primary" onClick={handleRefreshMetrics}>
					Refresh Metrics
				</ActionButton>
				<ActionButton variant="secondary" onClick={handleClearMetrics}>
					Clear Metrics
				</ActionButton>
			</Actions>
		</DashboardContainer>
	);
};

export default PerformanceDashboard;
