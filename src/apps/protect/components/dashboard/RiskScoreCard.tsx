import React from 'react';
import { RiskEvaluation } from '../../contexts/RiskContext';
import { useTheme } from '../../contexts/ThemeContext';

interface RiskScoreCardProps {
	evaluation: RiskEvaluation;
}

/**
 * Risk Score Card Component
 *
 * Displays the current risk score with visual indicators.
 */
export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ evaluation }) => {
	const { currentTheme } = useTheme();

	const getRiskColor = (score: number) => {
		if (score > 70) return currentTheme.colors.error;
		if (score > 30) return currentTheme.colors.warning;
		return currentTheme.colors.success;
	};

	const getRiskLevel = (score: number) => {
		if (score > 70) return 'HIGH';
		if (score > 30) return 'MEDIUM';
		return 'LOW';
	};

	return (
		<div
			className="p-6 rounded-xl"
			style={{
				backgroundColor: currentTheme.colors.surface,
				boxShadow: currentTheme.shadows.lg,
			}}
		>
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
						Risk Score
					</h3>
					<div className="flex items-baseline space-x-2">
						<div
							className="text-4xl font-bold"
							style={{ color: getRiskColor(evaluation.score.value) }}
						>
							{evaluation.score.value}
						</div>
						<div
							className="text-sm font-medium"
							style={{ color: getRiskColor(evaluation.score.value) }}
						>
							{getRiskLevel(evaluation.score.value)}
						</div>
					</div>
					<p className="text-sm mt-2" style={{ color: currentTheme.colors.textSecondary }}>
						Confidence: {evaluation.score.confidence}%
					</p>
				</div>
				<div className="text-6xl" style={{ color: getRiskColor(evaluation.score.value) }}>
					🛡️
				</div>
			</div>
		</div>
	);
};
