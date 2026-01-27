import React, { useCallback, useEffect, useState } from 'react';

interface PerformanceMetrics {
	componentLoadTime: number;
	memoryUsage: number;
	renderTime: number;
	networkRequests: number;
	errorCount: number;
	timestamp: number;
}

interface PerformanceMonitorV8Props {
	enabled?: boolean;
	interval?: number;
	maxHistory?: number;
	onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
	showAlerts?: boolean;
	className?: string;
}

export const PerformanceMonitorV8: React.FC<PerformanceMonitorV8Props> = ({
	enabled = true,
	interval = 5000,
	maxHistory = 100,
	onMetricsUpdate,
	showAlerts = true,
	className = '',
}) => {
	const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
	const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
	const [isMonitoring, setIsMonitoring] = useState(false);

	const getMemoryUsage = useCallback(() => {
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			return {
				used: memory.usedJSHeapSize,
				total: memory.totalJSHeapSize,
				limit: memory.jsHeapSizeLimit,
			};
		}
		return null;
	}, []);

	const getNetworkRequests = useCallback(() => {
		if ('performance' in window && 'getEntriesByType' in performance) {
			const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
			return entries.filter(
				(entry) =>
					entry.name.includes('component') ||
					entry.name.includes('lazy') ||
					entry.name.includes('chunk')
			).length;
		}
		return 0;
	}, []);

	const collectMetrics = useCallback(() => {
		const memory = getMemoryUsage();
		const networkRequests = getNetworkRequests();

		const newMetrics: PerformanceMetrics = {
			componentLoadTime: 0, // Would be populated by actual component load times
			memoryUsage: memory?.used || 0,
			renderTime: 0, // Would be populated by actual render times
			networkRequests,
			errorCount: 0, // Would be populated by error tracking
			timestamp: Date.now(),
		};

		setCurrentMetrics(newMetrics);
		setMetrics((prev) => {
			const updated = [...prev, newMetrics];
			return updated.slice(-maxHistory);
		});

		onMetricsUpdate?.(newMetrics);

		// Check for performance alerts
		if (showAlerts) {
			if (memory && memory.used > memory.total * 0.8) {
				console.warn('⚠️ High memory usage detected:', memory);
			}
			if (networkRequests > 50) {
				console.warn('⚠️ High network request count:', networkRequests);
			}
		}
	}, [getMemoryUsage, getNetworkRequests, maxHistory, onMetricsUpdate, showAlerts]);

	useEffect(() => {
		if (!enabled) return;

		setIsMonitoring(true);
		const intervalId = setInterval(collectMetrics, interval);

		return () => {
			clearInterval(intervalId);
			setIsMonitoring(false);
		};
	}, [enabled, interval, collectMetrics]);

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const _formatTime = (ms: number) => {
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const getPerformanceGrade = () => {
		if (!currentMetrics) return 'N/A';

		const memory = getMemoryUsage();
		const memoryScore = memory ? (1 - memory.used / memory.total) * 100 : 100;
		const networkScore = Math.max(0, 100 - currentMetrics.networkRequests * 2);

		const overallScore = (memoryScore + networkScore) / 2;

		if (overallScore >= 80) return 'A';
		if (overallScore >= 60) return 'B';
		if (overallScore >= 40) return 'C';
		return 'D';
	};

	const getGradeColor = (grade: string) => {
		switch (grade) {
			case 'A':
				return '#28a745';
			case 'B':
				return '#ffc107';
			case 'C':
				return '#fd7e14';
			case 'D':
				return '#dc3545';
			default:
				return '#6c757d';
		}
	};

	if (!enabled) return null;

	return (
		<div className={`performance-monitor-v8 ${className}`}>
			<div className="monitor-header">
				<h3>📊 Performance Monitor</h3>
				<div className="monitor-status">
					<span className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}></span>
					{isMonitoring ? 'Monitoring' : 'Stopped'}
				</div>
			</div>

			{currentMetrics && (
				<div className="current-metrics">
					<div className="metric-card">
						<div className="metric-label">Memory Usage</div>
						<div className="metric-value">{formatBytes(currentMetrics.memoryUsage)}</div>
						<div className="metric-progress">
							<div
								className="progress-bar"
								style={{
									width: `${getMemoryUsage() ? (getMemoryUsage()!.used / getMemoryUsage()!.total) * 100 : 0}%`,
								}}
							/>
						</div>
					</div>

					<div className="metric-card">
						<div className="metric-label">Network Requests</div>
						<div className="metric-value">{currentMetrics.networkRequests}</div>
						<div className="metric-trend">
							{metrics.length > 1 && (
								<span
									className={
										currentMetrics.networkRequests > metrics[metrics.length - 2].networkRequests
											? 'trend-up'
											: 'trend-down'
									}
								>
									{currentMetrics.networkRequests > metrics[metrics.length - 2].networkRequests
										? '↑'
										: '↓'}
								</span>
							)}
						</div>
					</div>

					<div className="metric-card">
						<div className="metric-label">Performance Grade</div>
						<div
							className="grade-badge"
							style={{ backgroundColor: getGradeColor(getPerformanceGrade()) }}
						>
							{getPerformanceGrade()}
						</div>
					</div>
				</div>
			)}

			{metrics.length > 1 && (
				<div className="metrics-history">
					<h4>📈 Performance History</h4>
					<div className="history-chart">
						{metrics.slice(-10).map((metric, _index) => (
							<div key={metric.timestamp} className="history-item">
								<div className="history-time">
									{new Date(metric.timestamp).toLocaleTimeString()}
								</div>
								<div className="history-memory">{formatBytes(metric.memoryUsage)}</div>
								<div className="history-requests">{metric.networkRequests}</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="monitor-actions">
				<button onClick={collectMetrics} className="action-btn">
					🔄 Refresh
				</button>
				<button onClick={() => setMetrics([])} className="action-btn">
					🗑️ Clear History
				</button>
				<button
					onClick={() => {
						const data = JSON.stringify(metrics, null, 2);
						const blob = new Blob([data], { type: 'application/json' });
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = url;
						a.download = `performance-metrics-${Date.now()}.json`;
						a.click();
						URL.revokeObjectURL(url);
					}}
					className="action-btn"
				>
					📥 Export Data
				</button>
			</div>

			<style>{`
        .performance-monitor-v8 {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .monitor-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }

        .monitor-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6c757d;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.active {
          background: #28a745;
          animation: pulse 2s infinite;
        }

        .status-indicator.inactive {
          background: #6c757d;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .current-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 12px;
        }

        .metric-label {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .metric-progress {
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: #007bff;
          transition: width 0.3s ease;
        }

        .metric-trend {
          font-size: 14px;
        }

        .trend-up {
          color: #dc3545;
        }

        .trend-down {
          color: #28a745;
        }

        .grade-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .metrics-history {
          margin-bottom: 20px;
        }

        .metrics-history h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .history-chart {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 12px;
          max-height: 200px;
          overflow-y: auto;
        }

        .history-item {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          padding: 4px 0;
          font-size: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .history-item:last-child {
          border-bottom: none;
        }

        .history-time {
          color: #6c757d;
        }

        .history-memory {
          color: #2d3748;
          font-weight: 500;
        }

        .history-requests {
          color: #2d3748;
          font-weight: 500;
        }

        .monitor-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 6px 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .action-btn:hover {
          background: #0056b3;
        }

        @media (max-width: 768px) {
          .current-metrics {
            grid-template-columns: 1fr;
          }
          
          .history-item {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          
          .monitor-actions {
            flex-direction: column;
          }
        }
      `}</style>
		</div>
	);
};

export default PerformanceMonitorV8;
