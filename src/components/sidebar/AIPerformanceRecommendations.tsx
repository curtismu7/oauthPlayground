/**
 * AIPerformanceRecommendations - AI-powered performance recommendations
 * Phase 5: AI Features
 * 
 * Provides:
 * - AI-generated performance recommendations
 * - Automated performance analysis
 * - Code optimization suggestions
 * - Performance insights and trends
 */

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiZap, FiActivity, FiCpu, FiHardDrive } from 'react-icons/fi';
import { useAI } from './AIProvider';

// Performance recommendation types
interface Recommendation {
	id: string;
	type: 'optimization' | 'warning' | 'info' | 'critical';
	title: string;
	description: string;
	impact: 'high' | 'medium' | 'low';
	effort: 'low' | 'medium' | 'high';
	codeExample?: string;
	appliedAt?: number;
	aiGenerated: boolean;
	confidence: number;
	category: 'rendering' | 'memory' | 'network' | 'accessibility' | 'bundle';
}

interface PerformanceMetrics {
	renderTime: number;
	renderCount: number;
	averageRenderTime: number;
	maxRenderTime: number;
	memoryUsage: number;
	memoryPeak: number;
	interactionTime: number;
	interactionCount: number;
	averageInteractionTime: number;
	bundleSize: number;
	networkRequests: number;
	accessibilityScore: number;
}

interface AIPerformanceRecommendationsProps {
	metrics: PerformanceMetrics;
	onApplyRecommendation?: (recommendation: Recommendation) => void;
	onDismissRecommendation?: (id: string) => void;
}

const AIPerformanceRecommendations: React.FC<AIPerformanceRecommendationsProps> = ({
	metrics,
	onApplyRecommendation,
	onDismissRecommendation,
}) => {
	const { getPerformanceRecommendations } = useAI();
	const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [selectedImpact, setSelectedImpact] = useState<string>('all');

	// Generate recommendations
	const generateRecommendations = useCallback(async () => {
		setIsAnalyzing(true);
		try {
			const aiRecommendations = await getPerformanceRecommendations(metrics);
			setRecommendations(aiRecommendations);
		} catch (error) {
			console.error('Failed to generate AI recommendations:', error);
		} finally {
			setIsAnalyzing(false);
		}
	}, [metrics, getPerformanceRecommendations]);

	// Auto-generate recommendations when metrics change
	useEffect(() => {
		if (metrics.renderCount > 0) {
			generateRecommendations();
		}
	}, [metrics, generateRecommendations]);

	// Apply recommendation
	const handleApplyRecommendation = useCallback(async (recommendation: Recommendation) => {
		try {
			// In a real implementation, this would apply the optimization
			console.log('Applying recommendation:', recommendation);
			
			setAppliedRecommendations(prev => new Set(prev).add(recommendation.id));
			setRecommendations(prev => prev.map(r => 
				r.id === recommendation.id 
					? { ...r, appliedAt: Date.now() }
					: r
			));
			
			onApplyRecommendation?.(recommendation);
		} catch (error) {
			console.error('Failed to apply recommendation:', error);
		}
	}, [onApplyRecommendation]);

	// Dismiss recommendation
	const handleDismissRecommendation = useCallback((id: string) => {
		setRecommendations(prev => prev.filter(r => r.id !== id));
		onDismissRecommendation?.( id);
	}, [onDismissRecommendation]);

	// Filter recommendations
	const filteredRecommendations = recommendations.filter(recommendation => {
		if (selectedCategory !== 'all' && recommendation.category !== selectedCategory) {
			return false;
		}
		if (selectedImpact !== 'all' && recommendation.impact !== selectedImpact) {
			return false;
		}
		return true;
	});

	// Get impact color
	const getImpactColor = (impact: string) => {
		switch (impact) {
			case 'high': return '#ef4444';
			case 'medium': return '#f59e0b';
			case 'low': return '#3b82f6';
			default: return '#6b7280';
		}
	};

	// Get type icon
	const getTypeIcon = (type: string) => {
		switch (type) {
			case 'critical': return <FiAlertTriangle />;
			case 'warning': return <FiAlertTriangle />;
			case 'optimization': return <FiZap />;
			case 'info': return <FiCheckCircle />;
			default: return <FiActivity />;
		}
	};

	// Get category icon
	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'rendering': return <FiActivity />;
			case 'memory': return <FiHardDrive />;
			case 'network': return <FiCpu />;
			case 'accessibility': return <FiCheckCircle />;
			case 'bundle': return <FiZap />;
			default: return <FiActivity />;
		}
	};

	// Calculate performance score
	const calculatePerformanceScore = useCallback(() => {
		let score = 100;
		
		// Rendering performance (40%)
		if (metrics.averageRenderTime > 33) score -= 40;
		else if (metrics.averageRenderTime > 16) score -= 20;
		
		// Memory usage (25%)
		if (metrics.memoryUsage > 100 * 1024 * 1024) score -= 25;
		else if (metrics.memoryUsage > 50 * 1024 * 1024) score -= 12;
		
		// Interaction performance (20%)
		if (metrics.averageInteractionTime > 300) score -= 20;
		else if (metrics.averageInteractionTime > 100) score -= 10;
		
		// Bundle size (10%)
		if (metrics.bundleSize > 100 * 1024) score -= 10;
		else if (metrics.bundleSize > 50 * 1024) score -= 5;
		
		// Accessibility (5%)
		if (metrics.accessibilityScore < 80) score -= 5;
		
		return Math.max(0, score);
	}, [metrics]);

	const performanceScore = calculatePerformanceScore();

	// Get health status
	const getHealthStatus = () => {
		if (performanceScore >= 90) return { status: 'excellent', color: '#22c55e' };
		if (performanceScore >= 70) return { status: 'good', color: '#3b82f6' };
		if (performanceScore >= 50) return { status: 'warning', color: '#f59e0b' };
		return { status: 'critical', color: '#ef4444' };
	};

	const healthStatus = getHealthStatus();

	return (
		<div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiTrendingUp />
					AI Performance Recommendations
				</h2>
				<button
					onClick={generateRecommendations}
					disabled={isAnalyzing}
					style={{
						padding: '0.5rem 1rem',
						border: '1px solid #d1d5db',
						borderRadius: '0.5rem',
						background: isAnalyzing ? '#f3f4f6' : '#3b82f6',
						color: isAnalyzing ? '#6b7280' : 'white',
						cursor: isAnalyzing ? 'not-allowed' : 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					{isAnalyzing ? (
						<>
							<FiActivity style={{ animation: 'spin 1s linear infinite' }} />
							Analyzing...
						</>
					) : (
						<>
							<FiZap />
							Generate Recommendations
						</>
					)}
				</button>
			</div>

			{/* Performance Score */}
			<div style={{
				background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
				border: '1px solid #0ea5e9',
				borderRadius: '0.5rem',
				padding: '1rem',
				marginBottom: '1rem',
			}}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0c4a6e' }}>
							Performance Score
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
							AI-powered analysis
						</div>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '2rem', fontWeight: 'bold', color: healthStatus.color }}>
							{performanceScore}
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
							{healthStatus.status.toUpperCase()}
						</div>
					</div>
				</div>
				
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Render Time</div>
						<div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#0c4a6e' }}>
							{metrics.averageRenderTime.toFixed(1)}ms
						</div>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Memory</div>
						<div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#0c4a6e' }}>
							{(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
						</div>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Interactions</div>
						<div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#0c4a6e' }}>
							{metrics.interactionCount}
						</div>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Bundle Size</div>
						<div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#0c4a6e' }}>
							{(metrics.bundleSize / 1024).toFixed(0)}KB
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
				<div>
					<label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Category</label>
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						style={{
							padding: '0.5rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
						}}
					>
						<option value="all">All Categories</option>
						<option value="rendering">Rendering</option>
						<option value="memory">Memory</option>
						<option value="network">Network</option>
						<option value="accessibility">Accessibility</option>
						<option value="bundle">Bundle</option>
					</select>
				</div>
				
				<div>
					<label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Impact</label>
					<select
						value={selectedImpact}
						onChange={(e) => setSelectedImpact(e.target.value)}
						style={{
							padding: '0.5rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
						}}
					>
						<option value="all">All Impacts</option>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</div>
			</div>

			{/* Recommendations */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
				{filteredRecommendations.length === 0 && !isAnalyzing && (
					<div style={{
						textAlign: 'center',
						padding: '2rem',
						color: '#6b7280',
						background: '#f9fafb',
						borderRadius: '0.5rem',
					}}>
						<FiTrendingUp size={48} style={{ marginBottom: '1rem' }} />
						<p>No recommendations available</p>
						<p style={{ fontSize: '0.875rem' }}>
							{recommendations.length === 0 
								? 'Click "Generate Recommendations" to analyze performance'
								: 'No recommendations match current filters'
							}
						</p>
					</div>
				)}

				{filteredRecommendations.map((recommendation) => (
					<div
						key={recommendation.id}
						style={{
							border: `1px solid ${recommendation.appliedAt ? '#22c55e' : '#e5e7eb'}`,
							borderRadius: '0.5rem',
							padding: '1rem',
							background: recommendation.appliedAt ? '#f0fdf4' : 'white',
							position: 'relative',
							opacity: recommendation.appliedAt ? 0.7 : 1,
						}}
					>
						{recommendation.appliedAt && (
							<div style={{
								position: 'absolute',
								top: '0.5rem',
								right: '0.5rem',
								padding: '0.25rem 0.5rem',
								background: '#22c55e',
								color: 'white',
								borderRadius: '0.25rem',
								fontSize: '0.75rem',
								fontWeight: '600',
							}}>
								Applied
							</div>
						)}
						
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
							<div style={{ color: getImpactColor(recommendation.impact) }}>
								{getTypeIcon(recommendation.type)}
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
									{recommendation.title}
								</div>
								<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
									{recommendation.description}
								</div>
							</div>
						</div>

						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
							<span style={{
								padding: '0.25rem 0.5rem',
								background: '#f3f4f6',
								borderRadius: '0.25rem',
								fontSize: '0.75rem',
								color: '#374151',
							}}>
								{recommendation.category}
							</span>
							<span style={{
								padding: '0.25rem 0.5rem',
								background: getImpactColor(recommendation.impact),
								color: 'white',
								borderRadius: '0.25rem',
								fontSize: '0.75rem',
								fontWeight: '600',
							}}>
								{recommendation.impact.toUpperCase()}
							</span>
							<span style={{
								padding: '0.25rem 0.5rem',
								background: '#f3f4f6',
								borderRadius: '0.25rem',
								fontSize: '0.75rem',
								color: '#374151',
							}}>
								{recommendation.effort.toUpperCase()}
							</span>
						</div>

						{recommendation.codeExample && (
							<div style={{ marginBottom: '0.75rem' }}>
								<div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
									Code Example:
								</div>
								<pre
									style={{
										background: '#1f2937',
										color: '#f9fafb',
										padding: '1rem',
										borderRadius: '0.375rem',
										overflow: 'auto',
										fontSize: '0.875rem',
										lineHeight: '1.5',
									}}
								>
									<code>{recommendation.codeExample}</code>
								</pre>
							</div>
						)}

						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
								{getCategoryIcon(recommendation.category)}
								<span>AI Generated</span>
								<span>•</span>
								<span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
							</div>
							
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								{!recommendation.appliedAt && (
									<button
										onClick={() => handleApplyRecommendation(recommendation)}
										style={{
											padding: '0.375rem 0.75rem',
											border: '1px solid #22c55e',
											borderRadius: '0.375rem',
											background: '#22c55e',
											color: 'white',
											cursor: 'pointer',
											fontSize: '0.875rem',
										}}
									>
										Apply
									</button>
								)}
								<button
									onClick={() => handleDismissRecommendation(recommendation.id)}
									style={{
										padding: '0.375rem 0.75rem',
										border: '1px solid #d1d5db',
										borderRadius: '0.375rem',
										background: '#f3f4f6',
										color: '#374151',
										cursor: 'pointer',
										fontSize: '0.875rem',
									}}
								>
									Dismiss
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Summary Stats */}
			{recommendations.length > 0 && (
				<div style={{
					background: '#f9fafb',
					border: '1px solid #e5e7eb',
					borderRadius: '0.5rem',
					padding: '1rem',
					marginTop: '1rem',
				}}>
					<div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
						Recommendation Summary
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
						<div style={{ textAlign: 'center' }}>
							<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
								{recommendations.length}
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								Total Recommendations
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
								{appliedRecommendations.size}
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								Applied
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
								{Math.round(recommendations.filter(r => r.confidence > 0.8).length)}
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								High Confidence
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AIPerformanceRecommendations;
