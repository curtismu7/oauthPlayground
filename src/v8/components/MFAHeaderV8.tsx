/**
 * @file MFAHeaderV8.tsx
 * @module v8/components
 * @description Reusable header component for all MFA pages with navigation
 * @version 8.2.0
 *
 * This component provides:
 * - Consistent header bar with title and description
 * - Navigation buttons (MFA Hub, Device Registration, Device Management, Reporting)
 * - Back to Main button
 * - Show API Calls checkbox
 * - Restart Flow button (optional)
 */

import React from 'react';
import { MFANavigationV8 } from './MFANavigationV8';

export interface MFAHeaderV8Props {
	/** Page title */
	title: string;
	/** Page description/subtitle */
	description?: string;
	/** Version tag (e.g., "V8", "MFA Flow V8") */
	versionTag?: string;
	/** Current page identifier for navigation highlighting */
	currentPage?: 'hub' | 'registration' | 'management' | 'reporting' | 'settings';
	/** Show restart flow button */
	showRestartFlow?: boolean;
	/** Handler for restart flow action */
	onRestartFlow?: () => void;
	/** Show back to main button */
	showBackToMain?: boolean;
	/** Header background color gradient (default: green) */
	headerColor?: 'green' | 'blue' | 'purple' | 'orange';
	/** Optional step badge (e.g., "1/4") */
	stepBadge?: {
		current: number;
		total: number;
	};
}

const HEADER_COLORS = {
	green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
	blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
	purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
	orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
};

/**
 * MFA Header Component
 * Provides consistent header and navigation across all MFA pages
 */
export const MFAHeaderV8: React.FC<MFAHeaderV8Props> = ({
	title,
	description,
	versionTag = 'V8',
	currentPage,
	showRestartFlow = false,
	onRestartFlow,
	showBackToMain = true,
	headerColor = 'green',
	stepBadge,
}) => {
	const headerGradient = HEADER_COLORS[headerColor];

	return (
		<>
			<div className="mfa-header-v8">
				<div className="flow-header" style={{ background: headerGradient }}>
					<div className="header-content">
						<div className="header-left">
							<div>
								<div className="version-tag">{versionTag}</div>
								<h1>{title}</h1>
								{description && <p>{description}</p>}
							</div>
						</div>
						{stepBadge && (
							<div className="header-right">
								<div className="step-badge">
									<span className="step-number">{stepBadge.current}</span>
									<span className="step-divider">/</span>
									<span className="step-total">{stepBadge.total}</span>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Navigation */}
				<MFANavigationV8
					currentPage={currentPage}
					showRestartFlow={showRestartFlow}
					onRestartFlow={onRestartFlow}
					showBackToMain={showBackToMain}
				/>
			</div>

			<style>{`
				.mfa-header-v8 {
					margin-bottom: 0;
				}

				.flow-header {
					padding: 12px 20px;
					margin-bottom: 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.header-left {
					display: flex;
					align-items: flex-start;
					gap: 20px;
					flex: 1;
				}

				.version-tag {
					font-size: 11px;
					font-weight: 700;
					color: rgba(255, 255, 255, 0.9);
					letter-spacing: 1.5px;
					text-transform: uppercase;
					padding-top: 2px;
				}

				.flow-header h1 {
					font-size: 20px;
					font-weight: 700;
					margin: 0 0 2px 0;
					color: #ffffff;
				}

				.flow-header p {
					font-size: 13px;
					color: rgba(255, 255, 255, 0.95);
					margin: 0;
				}

				.header-right {
					display: flex;
					align-items: center;
				}

				.step-badge {
					background: rgba(255, 255, 255, 0.95);
					padding: 12px 20px;
					border-radius: 24px;
					display: flex;
					align-items: center;
					gap: 8px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				.step-number {
					font-size: 18px;
					font-weight: 700;
					color: #10b981;
				}

				.step-divider {
					font-size: 12px;
					color: #999;
					font-weight: 500;
				}

				.step-total {
					font-size: 14px;
					font-weight: 600;
					color: #666;
				}

				@media (max-width: 600px) {
					.flow-header {
						padding: 20px;
					}

					.flow-header h1 {
						font-size: 20px;
					}
				}
			`}</style>
		</>
	);
};

