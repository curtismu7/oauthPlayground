import React from 'react';
import { UI_STANDARDS } from '@/v8/constants/uiStandardsV8';

interface CategorySummaryCardProps {
	title: string;
	description?: string;
	items: Array<{
		label: string;
		value: string | number;
		status?: 'success' | 'warning' | 'error' | 'info' | 'default';
		icon?: React.ReactNode;
	}>;
	className?: string;
	variant?: 'compact' | 'detailed';
	showProgress?: boolean;
	progressValue?: number;
	progressMax?: number;
}

export const CategorySummaryCardV8: React.FC<CategorySummaryCardProps> = ({
	title,
	description,
	items,
	className = '',
	variant = 'detailed',
	showProgress = false,
	progressValue = 0,
	progressMax = 100,
}) => {
	const getStatusColor = (status?: string) => {
		switch (status) {
			case 'success':
				return UI_STANDARDS.messageColors.success.border;
			case 'warning':
				return UI_STANDARDS.messageColors.warning.border;
			case 'error':
				return UI_STANDARDS.messageColors.error.border;
			case 'info':
				return UI_STANDARDS.messageColors.info.border;
			default:
				return UI_STANDARDS.colors.default;
		}
	};

	const getProgressPercentage = () => {
		return Math.min((progressValue / progressMax) * 100, 100);
	};

	return (
		<div className={`category-summary-card-v8 ${className}`}>
			<div className="card-header">
				<div className="header-content">
					<h3 className="card-title">{title}</h3>
					{description && <p className="card-description">{description}</p>}
				</div>
				{showProgress && (
					<div className="progress-container">
						<div className="progress-bar">
							<div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }} />
						</div>
						<span className="progress-text">
							{progressValue} / {progressMax}
						</span>
					</div>
				)}
			</div>

			<div className="items-grid">
				{items.map((item, index) => (
					<div key={index} className="summary-item">
						<div className="item-content">
							{item.icon && <div className="item-icon">{item.icon}</div>}
							<div className="item-details">
								<span className="item-label">{item.label}</span>
								<span className="item-value">{item.value}</span>
							</div>
							{variant === 'detailed' && (
								<div
									className="status-indicator"
									style={{ backgroundColor: getStatusColor(item.status) }}
								/>
							)}
						</div>
					</div>
				))}
			</div>

			<style>{`
				.category-summary-card-v8 {
					background: white;
					border: 1px solid ${UI_STANDARDS.colors.default};
					border-radius: ${UI_STANDARDS.borders.radius.md};
					padding: ${UI_STANDARDS.spacing.lg};
					box-shadow: ${UI_STANDARDS.shadows.sm};
					transition: all ${UI_STANDARDS.animations.duration.normal} ${UI_STANDARDS.animations.easing.default};
				}

				.category-summary-card-v8:hover {
					box-shadow: ${UI_STANDARDS.shadows.md};
					transform: translateY(-1px);
				}

				.card-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: ${UI_STANDARDS.spacing.lg};
					gap: ${UI_STANDARDS.spacing.md};
				}

				.header-content {
					flex: 1;
				}

				.card-title {
					margin: 0 0 ${UI_STANDARDS.spacing.xs} 0;
					font-size: ${UI_STANDARDS.typography.fontSizes.lg};
					font-weight: ${UI_STANDARDS.typography.fontWeights.semibold};
					color: ${UI_STANDARDS.colors.hover};
					line-height: ${UI_STANDARDS.typography.lineHeights.tight};
				}

				.card-description {
					margin: 0;
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					color: ${UI_STANDARDS.colors.default};
					line-height: ${UI_STANDARDS.typography.lineHeights.normal};
				}

				.progress-container {
					display: flex;
					align-items: center;
					gap: ${UI_STANDARDS.spacing.sm};
					flex-shrink: 0;
				}

				.progress-bar {
					width: 80px;
					height: 6px;
					background: ${UI_STANDARDS.colors.default};
					border-radius: 3px;
					overflow: hidden;
				}

				.progress-fill {
					height: 100%;
					background: ${UI_STANDARDS.colors.focus};
					transition: width ${UI_STANDARDS.animations.duration.normal} ${UI_STANDARDS.animations.easing.default};
				}

				.progress-text {
					font-size: ${UI_STANDARDS.typography.fontSizes.xs};
					font-weight: ${UI_STANDARDS.typography.fontWeights.medium};
					color: ${UI_STANDARDS.colors.hover};
					white-space: nowrap;
				}

				.items-grid {
					display: grid;
					gap: ${UI_STANDARDS.spacing.md};
				}

				.summary-item {
					display: flex;
					align-items: center;
					padding: ${UI_STANDARDS.spacing.sm};
					border-radius: ${UI_STANDARDS.borders.radius.sm};
					background: ${UI_STANDARDS.messageColors.info.background};
					border: 1px solid ${UI_STANDARDS.messageColors.info.border};
					transition: all ${UI_STANDARDS.animations.duration.fast} ${UI_STANDARDS.animations.easing.default};
				}

				.summary-item:hover {
					background: ${UI_STANDARDS.messageColors.info.background};
					border-color: ${UI_STANDARDS.colors.focus};
					transform: translateX(2px);
				}

				.item-content {
					display: flex;
					align-items: center;
					gap: ${UI_STANDARDS.spacing.sm};
					width: 100%;
				}

				.item-icon {
					flex-shrink: 0;
					width: 20px;
					height: 20px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 14px;
				}

				.item-details {
					flex: 1;
					display: flex;
					justify-content: space-between;
					align-items: center;
					min-width: 0;
				}

				.item-label {
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					color: ${UI_STANDARDS.colors.default};
					font-weight: ${UI_STANDARDS.typography.fontWeights.medium};
				}

				.item-value {
					font-size: ${UI_STANDARDS.typography.fontSizes.base};
					color: ${UI_STANDARDS.colors.hover};
					font-weight: ${UI_STANDARDS.typography.fontWeights.semibold};
				}

				.status-indicator {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					flex-shrink: 0;
				}

				.category-summary-card-v8.compact {
					padding: ${UI_STANDARDS.spacing.md};
				}

				.category-summary-card-v8.compact .card-header {
					margin-bottom: ${UI_STANDARDS.spacing.md};
				}

				.category-summary-card-v8.compact .card-title {
					font-size: ${UI_STANDARDS.typography.fontSizes.base};
				}

				.category-summary-card-v8.compact .items-grid {
					gap: ${UI_STANDARDS.spacing.sm};
				}

				.category-summary-card-v8.compact .summary-item {
					padding: ${UI_STANDARDS.spacing.xs};
				}

				@media (max-width: 768px) {
					.category-summary-card-v8 {
						padding: ${UI_STANDARDS.spacing.md};
					}

					.card-header {
						flex-direction: column;
						align-items: flex-start;
						gap: ${UI_STANDARDS.spacing.sm};
					}

					.progress-container {
						width: 100%;
					}

					.progress-bar {
						flex: 1;
					}

					.items-grid {
						grid-template-columns: 1fr;
					}

					.item-details {
						flex-direction: column;
						align-items: flex-start;
						gap: ${UI_STANDARDS.spacing.xs};
					}
				}
			`}</style>
		</div>
	);
};

export default CategorySummaryCardV8;
