/**
 * @file PageHeaderV8.tsx
 * @module v8/components/shared
 * @description Shared page header component for consistent styling across Unified and MFA flows
 * @version 1.0.0
 */

import React from 'react';

export interface PageHeaderProps {
	/** Title text (supports emojis) */
	title: string;
	/** Subtitle/description text */
	subtitle: string;
	/** CSS gradient string for background */
	gradient: string;
	/** Optional icon (can be emoji string or React element) */
	icon?: string | React.ReactNode;
	/** Text color (default: white for dark gradients, #0c4a6e for light gradients) */
	textColor?: string;
	/** Optional additional content to render in header (e.g., breadcrumbs) */
	children?: React.ReactNode;
	/** Whether to show decorative background pattern (default: true) */
	showDecorativePattern?: boolean;
	/** Optional custom styles for the container */
	style?: React.CSSProperties;
}

/**
 * Shared page header component with gradient background
 *
 * @example
 * // Unified Flow
 * <PageHeaderV8
 *   title="🎯 Unified OAuth/OIDC Flow"
 *   subtitle="Single UI for all OAuth 2.0, OAuth 2.1, and OpenID Connect flows"
 *   gradient="linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
 *   textColor="#0c4a6e"
 * />
 *
 * @example
 * // MFA Flow
 * <PageHeaderV8
 *   title="🔐 MFA Authentication"
 *   subtitle="Unified authentication flow for all MFA device types"
 *   gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
 *   textColor="white"
 * />
 */
export const PageHeaderV8: React.FC<PageHeaderProps> = ({
	title,
	subtitle,
	gradient,
	icon,
	textColor = 'white',
	children,
	showDecorativePattern = true,
	style = {},
}) => {
	return (
		<div
			style={{
				marginBottom: '32px',
				padding: '24px',
				background: gradient,
				borderRadius: '12px',
				color: textColor,
				position: 'relative',
				overflow: 'hidden',
				boxShadow: textColor === 'white' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : undefined,
				...style,
			}}
		>
			{/* Decorative background pattern */}
			{showDecorativePattern && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						right: 0,
						width: '300px',
						height: '100%',
						background:
							'radial-gradient(circle at top right, rgba(255,255,255,0.3) 0%, transparent 70%)',
						pointerEvents: 'none',
					}}
				/>
			)}

			{/* Content */}
			<div style={{ position: 'relative', zIndex: 1 }}>
				{/* Optional children (e.g., breadcrumbs) */}
				{children && <div style={{ marginBottom: '16px' }}>{children}</div>}

				{/* Title */}
				<h1
					style={{
						margin: '0 0 8px 0',
						fontSize: '32px',
						fontWeight: '700',
						color: textColor,
						display: 'flex',
						alignItems: 'center',
						gap: icon ? '12px' : '0',
					}}
				>
					{typeof icon === 'string' ? icon : icon}
					{title}
				</h1>

				{/* Subtitle */}
				<p
					style={{
						margin: 0,
						fontSize: '16px',
						color: textColor,
						opacity: 0.9,
					}}
				>
					{subtitle}
				</p>
			</div>
		</div>
	);
};

/**
 * Predefined gradient themes for common use cases
 */
export const PageHeaderGradients = {
	/** Light blue gradient - Unified OAuth/OIDC */
	unifiedOAuth: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
	/** Dark blue gradient - MFA Authentication */
	mfaAuth: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
	/** Green gradient - Success/Active states */
	success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
	/** Purple gradient - Special flows (SPIFFE/SPIRE, etc.) */
	special: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
	/** Orange gradient - Configuration/Settings */
	config: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
	/** Red gradient - Error/Danger states */
	danger: 'linear-gradient(135deg, #E31837 0%, #C4122E 100%)',
	/** Violet gradient - TOTP/Special MFA */
	violet: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
	/** Light green gradient - Status/Info */
	lightGreen: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
} as const;

/**
 * Predefined text colors for gradients
 */
export const PageHeaderTextColors = {
	/** White text - for dark gradients */
	white: 'white',
	/** Dark blue text - for light gradients */
	darkBlue: '#0c4a6e',
	/** Dark text - for very light gradients */
	dark: '#1f2937',
} as const;
