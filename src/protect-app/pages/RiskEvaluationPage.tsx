import React, { useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useRisk } from '../contexts/RiskContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Risk Evaluation Page
 *
 * Page for performing real-time risk evaluations
 * with detailed analysis and recommendations.
 */
export const RiskEvaluationPage: React.FC = () => {
	const { currentTheme } = useTheme();
	const { state: riskState, evaluateRisk, getCurrentEvaluation } = useRisk();
	const [isEvaluating, setIsEvaluating] = useState(false);

	const handleEvaluateRisk = async () => {
		setIsEvaluating(true);
		try {
			const context = {
				ipAddress: '192.168.1.100',
				userAgent: navigator.userAgent,
				location: {
					country: 'United States',
					city: 'San Francisco',
					coordinates: { latitude: 37.7749, longitude: -122.4194 },
				},
				device: {
					type: 'desktop',
					os: 'macOS',
					browser: 'Chrome',
					fingerprint: 'mock-fingerprint',
				},
				session: {
					duration: Date.now() - (Date.now() - 3600000),
					pageViews: 15,
					authenticationMethod: 'password',
				},
			};

			await evaluateRisk('user-123', context);
		} catch (error) {
			console.error('Risk evaluation failed:', error);
		} finally {
			setIsEvaluating(false);
		}
	};

	const currentEvaluation = getCurrentEvaluation();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold" style={{ color: currentTheme.colors.text }}>
					Risk Evaluation
				</h1>
				<p className="text-lg mt-1" style={{ color: currentTheme.colors.textSecondary }}>
					Perform real-time risk assessments and analysis
				</p>
			</div>

			{currentEvaluation ? (
				<div
					className="p-6 rounded-lg"
					style={{
						backgroundColor: currentTheme.colors.surface,
						boxShadow: currentTheme.shadows.md,
					}}
				>
					<h2 className="text-xl font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
						Current Risk Score
					</h2>
					<div className="text-center">
						<div
							className="text-6xl font-bold mb-2"
							style={{
								color:
									currentEvaluation.score.value > 70
										? currentTheme.colors.error
										: currentEvaluation.score.value > 30
											? currentTheme.colors.warning
											: currentTheme.colors.success,
							}}
						>
							{currentEvaluation.score.value}
						</div>
						<div className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
							{currentEvaluation.score.level}
						</div>
					</div>
				</div>
			) : (
				<div
					className="p-6 rounded-lg text-center"
					style={{
						backgroundColor: currentTheme.colors.surface,
						boxShadow: currentTheme.shadows.md,
					}}
				>
					<div className="text-6xl mb-4" style={{ color: currentTheme.colors.textSecondary }}>
						🔍
					</div>
					<h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
						No Risk Evaluation Available
					</h3>
					<p className="mb-4" style={{ color: currentTheme.colors.textSecondary }}>
						Click the button below to perform a new risk evaluation
					</p>
				</div>
			)}

			<div className="flex justify-center">
				<button
					type="button"
					onClick={handleEvaluateRisk}
					disabled={isEvaluating || riskState.isLoading}
					className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
					style={{
						backgroundColor: currentTheme.colors.primary,
						color: currentTheme.colors.surface,
					}}
				>
					{isEvaluating || riskState.isLoading ? (
						<div className="flex items-center space-x-2">
							<LoadingSpinner size="sm" color="white" />
							<span>Evaluating...</span>
						</div>
					) : (
						'Evaluate Risk'
					)}
				</button>
			</div>
		</div>
	);
};
