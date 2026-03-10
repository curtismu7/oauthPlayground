import React, { useState, useEffect, useCallback } from 'react';

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

interface ComponentMetrics {
	name: string;
	renderCount: number;
	propCount: number;
	lastRender: number;
}

interface Metrics {
	totalComponents: number;
	totalRenders: number;
	averageRenders: number;
	memoryUsage: number;
	cleanlinessScore: number;
}

export const CleanlinessDashboardFixed: React.FC = () => {
	const [metrics, setMetrics] = useState<Metrics>({
		totalComponents: 0,
		totalRenders: 0,
		averageRenders: 0,
		memoryUsage: 0,
		cleanlinessScore: 100,
	});

	const [components, setComponents] = useState<ComponentMetrics[]>([]);

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

	const getScoreColor = (score: number) => {
		if (score >= 80) return '#28A745';
		if (score >= 60) return '#FFC107';
		return '#DC3545';
	};

	const getScoreBackground = (score: number) => {
		if (score >= 80) return 'rgba(40, 167, 69, 0.1)';
		if (score >= 60) return 'rgba(255, 193, 7, 0.1)';
		return 'rgba(220, 53, 69, 0.1)';
	};

	return (
		<div
			style={{
				padding: '2rem',
				fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				background: '#FFFFFF',
				color: '#212529',
				minHeight: '100vh',
				lineHeight: 1.6,
			}}
		>
			<h2
				style={{
					color: '#212529',
					fontSize: '1.875rem',
					fontWeight: 600,
					marginBottom: '1.5rem',
					textAlign: 'center',
					letterSpacing: '-0.025em',
				}}
			>
				🧹 Component Cleanliness Dashboard
			</h2>

			<p
				style={{
					color: '#6C757D',
					fontSize: '1rem',
					textAlign: 'center',
					marginBottom: '2rem',
				}}
			>
				Monitor your application's performance and component health in real-time
			</p>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: '1.5rem',
					marginBottom: '2.5rem',
				}}
			>
				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Total Components
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.totalComponents}
					</div>
				</div>

				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Total Renders
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.totalRenders}
					</div>
				</div>

				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Average Renders
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.averageRenders.toFixed(1)}
					</div>
				</div>

				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Memory Usage
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.memoryUsage} MB
					</div>
				</div>
			</div>

			<div
				style={{
					textAlign: 'center',
					fontSize: '2.25rem',
					fontWeight: 700,
					margin: '2rem 0',
					padding: '1.5rem',
					borderRadius: '0.75rem',
					transition: 'all 0.15s ease-in-out',
					color: getScoreColor(metrics.cleanlinessScore),
					background: getScoreBackground(metrics.cleanlinessScore),
					border: `2px solid ${getScoreColor(metrics.cleanlinessScore)}`,
				}}
			>
				Cleanliness Score: {metrics.cleanlinessScore}%
			</div>

			<div
				style={{
					background: '#FFFFFF',
					padding: '1.5rem',
					borderRadius: '0.75rem',
					border: '1px solid #DEE2E6',
					boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				}}
			>
				<h3
					style={{
						color: '#212529',
						fontSize: '1.125rem',
						fontWeight: 600,
						marginBottom: '1rem',
					}}
				>
					Top Components
				</h3>
				{components.map((component) => (
					<div
						key={component.name}
						style={{
							padding: '0.75rem',
							marginBottom: '0.5rem',
							background: '#F8F9FA',
							borderRadius: '0.375rem',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							transition: 'all 0.15s ease-in-out',
						}}
					>
						<span
							style={{
								color: '#212529',
								fontWeight: 600,
								fontSize: '0.875rem',
							}}
						>
							{component.name}
						</span>
						<span
							style={{
								color: '#6C757D',
								fontFamily:
									'"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
								fontSize: '0.75rem',
							}}
						>
							Renders: {component.renderCount} | Props: {component.propCount} | Last:{' '}
							{formatTime(component.lastRender)}
						</span>
					</div>
				))}
				{components.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: '1.5rem',
							color: '#6C757D',
						}}
					>
						No components tracked yet. Navigate through the app to see metrics.
					</div>
				)}
			</div>

			<div
				style={{
					marginTop: '2.5rem',
					padding: '1.5rem',
					background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
					borderRadius: '0.75rem',
					border: '1px solid #DEE2E6',
					boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				}}
			>
				<h3
					style={{
						color: '#212529',
						fontSize: '1.125rem',
						fontWeight: 600,
						marginBottom: '1rem',
					}}
				>
					📖 How to Use
				</h3>
				<div
					style={{
						color: '#6C757D',
						fontSize: '0.875rem',
						lineHeight: 1.6,
					}}
				>
					<p>Navigate through different apps and flows to see real-time metrics</p>
					<p>Components with high render counts may need optimization</p>
					<p>Memory usage should remain stable (watch for leaks)</p>
					<p>Cleanliness score decreases with excessive renders and memory usage</p>
				</div>
			</div>
		</div>
	);
};
