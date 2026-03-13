import React, { useEffect, useState } from 'react';
import { type CleanupMetrics, cleanupHistoryService } from '../services/cleanupHistoryService';

interface CleanupHistoryDashboardProps {
	className?: string;
}

export const CleanupHistoryDashboard: React.FC<CleanupHistoryDashboardProps> = ({
	className = '',
}) => {
	const [history, setHistory] = useState(cleanupHistoryService.getHistory());
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [showReport, setShowReport] = useState(false);

	useEffect(() => {
		setHistory(cleanupHistoryService.getHistory());
	}, []);

	const metrics: CleanupMetrics = history.metrics;
	const filteredSessions = selectedCategory
		? cleanupHistoryService.getSessionsByCategory(selectedCategory)
		: history.sessions;

	const formatHours = (hours: number): string => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	const getCategoryColor = (categoryId: string): string => {
		const category = history.categories.find((c) => c.id === categoryId);
		return category?.color || '#6C757D';
	};

	const getCategoryIcon = (categoryId: string): string => {
		const category = history.categories.find((c) => c.id === categoryId);
		return category?.icon || '📋';
	};

	const exportHistory = () => {
		const data = cleanupHistoryService.exportHistory();
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `cleanup-history-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div
			className={`cleanup-history-dashboard ${className}`}
			style={{
				padding: '2rem',
				fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				background: '#FFFFFF',
				color: '#212529',
				minHeight: '100vh',
				lineHeight: 1.6,
			}}
		>
			{/* Header */}
			<div
				style={{
					textAlign: 'center',
					marginBottom: '2rem',
				}}
			>
				<h1
					style={{
						fontSize: '2.5rem',
						fontWeight: 700,
						color: '#212529',
						marginBottom: '0.5rem',
						letterSpacing: '-0.025em',
					}}
				>
					🧹 100+ Hours Cleanup History
				</h1>
				<p
					style={{
						fontSize: '1.125rem',
						color: '#6C757D',
						marginBottom: '1rem',
					}}
				>
					Comprehensive tracking of code cleanup, migration, and optimization work
				</p>
				<div
					style={{
						display: 'flex',
						gap: '1rem',
						justifyContent: 'center',
						flexWrap: 'wrap',
					}}
				>
					<button
						type="button"
						onClick={() => setShowReport(!showReport)}
						style={{
							background: '#0066CC',
							color: '#FFFFFF',
							border: 'none',
							padding: '0.75rem 1.5rem',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							fontWeight: 500,
							cursor: 'pointer',
							transition: 'all 0.15s ease-in-out',
						}}
					>
						{showReport ? '📊 Hide Report' : '📊 Generate Report'}
					</button>
					<button
						type="button"
						onClick={exportHistory}
						style={{
							background: '#28A745',
							color: '#FFFFFF',
							border: 'none',
							padding: '0.75rem 1.5rem',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							fontWeight: 500,
							cursor: 'pointer',
							transition: 'all 0.15s ease-in-out',
						}}
					>
						📥 Export History
					</button>
				</div>
			</div>

			{/* Key Metrics */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
					gap: '1.5rem',
					marginBottom: '2.5rem',
				}}
			>
				<div
					style={{
						background: 'linear-gradient(135deg, #0066CC 0%, #0056B3 100%)',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						color: '#FFFFFF',
						textAlign: 'center',
					}}
				>
					<div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
						{metrics.totalHours}h
					</div>
					<div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Hours Worked</div>
				</div>

				<div
					style={{
						background: 'linear-gradient(135deg, #28A745 0%, #1E7E34 100%)',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						color: '#FFFFFF',
						textAlign: 'center',
					}}
				>
					<div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
						{metrics.filesModified}
					</div>
					<div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Files Modified</div>
				</div>

				<div
					style={{
						background: 'linear-gradient(135deg, #FFC107 0%, #E0A800 100%)',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						color: '#212529',
						textAlign: 'center',
					}}
				>
					<div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
						{metrics.issuesResolved}
					</div>
					<div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Issues Resolved</div>
				</div>

				<div
					style={{
						background: 'linear-gradient(135deg, #6F42C1 0%, #59359A 100%)',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						color: '#FFFFFF',
						textAlign: 'center',
					}}
				>
					<div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
						{metrics.completionPercentage.toFixed(1)}%
					</div>
					<div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Completion Progress</div>
				</div>
			</div>

			{/* Category Filter */}
			<div
				style={{
					marginBottom: '2rem',
				}}
			>
				<h3
					style={{
						fontSize: '1.25rem',
						fontWeight: 600,
						marginBottom: '1rem',
						color: '#212529',
					}}
				>
					Filter by Category
				</h3>
				<div
					style={{
						display: 'flex',
						gap: '0.5rem',
						flexWrap: 'wrap',
					}}
				>
					<button
						type="button"
						onClick={() => setSelectedCategory(null)}
						style={{
							background: selectedCategory === null ? '#212529' : '#F8F9FA',
							color: selectedCategory === null ? '#FFFFFF' : '#212529',
							border: '1px solid #DEE2E6',
							padding: '0.5rem 1rem',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							cursor: 'pointer',
							transition: 'all 0.15s ease-in-out',
						}}
					>
						All Categories
					</button>
					{history.categories.map((category) => (
						<button
							type="button"
							key={category.id}
							onClick={() => setSelectedCategory(category.id)}
							style={{
								background: selectedCategory === category.id ? category.color : '#F8F9FA',
								color: selectedCategory === category.id ? '#FFFFFF' : '#212529',
								border: `1px solid ${category.color}`,
								padding: '0.5rem 1rem',
								borderRadius: '0.375rem',
								fontSize: '0.875rem',
								cursor: 'pointer',
								transition: 'all 0.15s ease-in-out',
							}}
						>
							{category.icon} {category.name}
						</button>
					))}
				</div>
			</div>

			{/* Sessions List */}
			<div
				style={{
					background: '#FFFFFF',
					borderRadius: '0.75rem',
					border: '1px solid #DEE2E6',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						background: '#F8F9FA',
						padding: '1rem 1.5rem',
						borderBottom: '1px solid #DEE2E6',
					}}
				>
					<h3
						style={{
							fontSize: '1.125rem',
							fontWeight: 600,
							margin: 0,
							color: '#212529',
						}}
					>
						Cleanup Sessions ({filteredSessions.length})
					</h3>
				</div>

				<div style={{ maxHeight: '600px', overflowY: 'auto' }}>
					{filteredSessions.map((session) => (
						<button
							key={session.id}
							type="button"
							style={{
								padding: '1.5rem',
								borderBottom: '1px solid #F1F3F4',
								transition: 'background-color 0.15s ease-in-out',
								cursor: 'pointer',
								background: 'none',
								border: 'none',
								textAlign: 'left',
								width: '100%',
							}}
							onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F9FA')}
							onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'flex-start',
									marginBottom: '0.75rem',
								}}
							>
								<div>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.25rem',
										}}
									>
										<span
											style={{
												background: getCategoryColor(session.category.id),
												color: '#FFFFFF',
												padding: '0.25rem 0.5rem',
												borderRadius: '0.25rem',
												fontSize: '0.75rem',
												fontWeight: 500,
											}}
										>
											{getCategoryIcon(session.category.id)} {session.category.name}
										</span>
										<span
											style={{
												color: '#6C757D',
												fontSize: '0.875rem',
											}}
										>
											{new Date(session.date).toLocaleDateString()}
										</span>
									</div>
									<h4
										style={{
											fontSize: '1rem',
											fontWeight: 600,
											margin: 0,
											color: '#212529',
										}}
									>
										{session.description}
									</h4>
								</div>
								<div
									style={{
										textAlign: 'right',
										color: '#6C757D',
										fontSize: '0.875rem',
									}}
								>
									<div style={{ fontWeight: 600, color: '#212529' }}>
										{formatHours(session.duration)}
									</div>
									<div>v{session.version}</div>
								</div>
							</div>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
									gap: '1rem',
									marginBottom: '0.75rem',
								}}
							>
								<div>
									<div style={{ fontSize: '0.75rem', color: '#6C757D' }}>Files</div>
									<div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
										{session.filesModified}
									</div>
								</div>
								<div>
									<div style={{ fontSize: '0.75rem', color: '#6C757D' }}>Lines</div>
									<div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
										{session.linesOfCode.toLocaleString()}
									</div>
								</div>
								<div>
									<div style={{ fontSize: '0.75rem', color: '#6C757D' }}>Issues</div>
									<div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
										{session.issuesResolved}
									</div>
								</div>
								<div>
									<div style={{ fontSize: '0.75rem', color: '#6C757D' }}>Docs</div>
									<div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
										{session.documentation.length}
									</div>
								</div>
							</div>

							{session.achievements.length > 0 && (
								<div>
									<div style={{ fontSize: '0.75rem', color: '#6C757D', marginBottom: '0.25rem' }}>
										Key Achievements:
									</div>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
										{session.achievements.map((achievement, index) => (
											<span
												key={index}
												style={{
													background: '#E7F3FF',
													color: '#0066CC',
													padding: '0.25rem 0.5rem',
													borderRadius: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: 500,
												}}
											>
												✅ {achievement}
											</span>
										))}
									</div>
								</div>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Report Modal */}
			{showReport && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
					}}
				>
					<div
						style={{
							background: '#FFFFFF',
							borderRadius: '0.75rem',
							maxWidth: '800px',
							maxHeight: '80vh',
							overflow: 'auto',
							margin: '2rem',
							padding: '2rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '1.5rem',
							}}
						>
							<h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
								📊 Cleanup History Report
							</h2>
							<button
								type="button"
								onClick={() => setShowReport(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '1.5rem',
									cursor: 'pointer',
									color: '#6C757D',
								}}
							>
								×
							</button>
						</div>
						<pre
							style={{
								background: '#F8F9FA',
								padding: '1rem',
								borderRadius: '0.375rem',
								fontSize: '0.875rem',
								whiteSpace: 'pre-wrap',
								overflow: 'auto',
							}}
						>
							{cleanupHistoryService.generateReport()}
						</pre>
					</div>
				</div>
			)}
		</div>
	);
};

export default CleanupHistoryDashboard;
