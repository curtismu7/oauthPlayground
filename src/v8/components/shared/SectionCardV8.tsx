import React from 'react';
import { UI_STANDARDS } from '@/v8/constants/uiStandardsV8';

interface SectionCardProps {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	className?: string;
	icon?: React.ReactNode;
	variant?: 'default' | 'compact' | 'elevated';
	borderColor?: string;
	backgroundColor?: string;
}

export const SectionCardV8: React.FC<SectionCardProps> = ({
	title,
	subtitle,
	children,
	className = '',
	icon,
	variant = 'default',
	borderColor,
	backgroundColor,
}) => {
	const getVariantStyles = () => {
		switch (variant) {
			case 'compact':
				return {
					padding: `${UI_STANDARDS.spacing.md}`,
					borderRadius: '8px',
				};
			case 'elevated':
				return {
					padding: `${UI_STANDARDS.spacing.lg}`,
					borderRadius: '12px',
					boxShadow: UI_STANDARDS.shadows.md,
				};
			default:
				return {
					padding: `${UI_STANDARDS.spacing.lg}`,
					borderRadius: '8px',
					boxShadow: UI_STANDARDS.shadows.sm,
				};
		}
	};

	return (
		<div className={`section-card-v8 ${className}`} style={getVariantStyles()}>
			{(title || icon) && (
				<div className="section-header">
					{icon && <div className="section-icon">{icon}</div>}
					<div className="section-title-content">
						{title && <h3 className="section-title">{title}</h3>}
						{subtitle && <p className="section-subtitle">{subtitle}</p>}
					</div>
				</div>
			)}
			<div className="section-content">{children}</div>

			<style>{`
				.section-card-v8 {
					background: ${backgroundColor || UI_STANDARDS.messageColors.info.background};
					border: 1px solid ${borderColor || UI_STANDARDS.messageColors.info.border};
					transition: all ${UI_STANDARDS.animations.duration.normal} ${UI_STANDARDS.animations.easing.default};
				}

				.section-card-v8:hover {
					box-shadow: ${UI_STANDARDS.shadows.md};
					transform: translateY(-1px);
				}

				.section-header {
					display: flex;
					align-items: flex-start;
					gap: ${UI_STANDARDS.spacing.md};
					margin-bottom: ${UI_STANDARDS.spacing.md};
				}

				.section-icon {
					flex-shrink: 0;
					width: 24px;
					height: 24px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 18px;
				}

				.section-title-content {
					flex: 1;
				}

				.section-title {
					margin: 0 0 ${UI_STANDARDS.spacing.xs} 0;
					font-size: ${UI_STANDARDS.typography.fontSizes.lg};
					font-weight: ${UI_STANDARDS.typography.fontWeights.semibold};
					color: ${UI_STANDARDS.colors.hover};
					line-height: ${UI_STANDARDS.typography.lineHeights.tight};
				}

				.section-subtitle {
					margin: 0;
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					color: ${UI_STANDARDS.colors.default};
					line-height: ${UI_STANDARDS.typography.lineHeights.normal};
				}

				.section-content {
					color: ${UI_STANDARDS.colors.hover};
					font-size: ${UI_STANDARDS.typography.fontSizes.base};
					line-height: ${UI_STANDARDS.typography.lineHeights.normal};
				}

				.section-content > *:first-child {
					margin-top: 0;
				}

				.section-content > *:last-child {
					margin-bottom: 0;
				}

				@media (max-width: 768px) {
					.section-card-v8 {
						padding: ${UI_STANDARDS.spacing.md} !important;
					}

					.section-title {
						font-size: ${UI_STANDARDS.typography.fontSizes.base};
					}

					.section-subtitle {
						font-size: ${UI_STANDARDS.typography.fontSizes.xs};
					}

					.section-content {
						font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					}
				}
			`}</style>
		</div>
	);
};

export default SectionCardV8;
