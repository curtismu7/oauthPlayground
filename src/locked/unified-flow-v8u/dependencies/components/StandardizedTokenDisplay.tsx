// src/components/StandardizedTokenDisplay.tsx
// Standardized token display component for all device flows
// Maintains consistent format, order, and functionality across all device types

import React from 'react';
import InlineTokenDisplay from './InlineTokenDisplay';

interface StandardizedTokenDisplayProps {
	tokens: {
		access_token?: string;
		id_token?: string;
		refresh_token?: string;
	} | null;
	/** Optional background color (rgba or hex) - adapts to device theme */
	backgroundColor?: string;
	/** Optional border color (hex) - adapts to device theme */
	borderColor?: string;
	/** Optional text color - for themed containers */
	textColor?: string;
	/** Optional header text color - defaults to white or black based on background */
	headerTextColor?: string;
}

/**
 * Standardized token display for all device flows
 *
 * Features:
 * - Consistent order: Access Token → ID Token → Refresh Token
 * - Consistent spacing: 0.75rem gap, 0.75rem padding
 * - Consistent styling: 0.5rem border-radius, subtle borders
 * - Each token section has its own header
 * - Independent sizing - NOT tied to QR code sections
 * - Shows tokens whenever they exist (not just when authorized)
 * - Same functionality: defaultMasked={false}, allowMaskToggle={true}
 */
const StandardizedTokenDisplay: React.FC<StandardizedTokenDisplayProps> = ({
	tokens,
	backgroundColor = 'rgba(0, 0, 0, 0.4)',
	borderColor = '#374151',
	textColor,
	headerTextColor,
}) => {
	if (!tokens || (!tokens.access_token && !tokens.id_token && !tokens.refresh_token)) {
		return null;
	}

	// Determine header text color if not provided
	const defaultHeaderColor =
		headerTextColor ||
		(backgroundColor.includes('rgba(0, 0, 0') || backgroundColor === '#000000'
			? '#ffffff'
			: '#1e293b');

	// Use light grey border - consistent with app styling (lighter grey for subtle appearance)
	const lightGreyBorder = '#e5e7eb';

	// Container with reasonable max-width, centered
	const wrapperStyle: React.CSSProperties = {
		position: 'relative',
		width: '100%',
		maxWidth: '800px',
		margin: '0 auto',
		padding: '0.5rem',
		boxSizing: 'border-box',
		backgroundColor: 'transparent',
		zIndex: 1,
	};

	const containerStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem',
		width: '100%',
		margin: '0',
		padding: '0',
		boxSizing: 'border-box',
	};

	return (
		<div style={wrapperStyle}>
			<div style={containerStyle}>
				{tokens.access_token && (
					<div
						style={{
							background: backgroundColor,
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: `1px solid ${lightGreyBorder}`,
							width: '100%',
							maxWidth: '100%',
							marginBottom: '0.5rem',
							boxSizing: 'border-box',
						}}
					>
						<div
							style={{
								fontSize: '0.875rem',
								fontWeight: '600',
								color: defaultHeaderColor,
								marginBottom: '0.5rem',
								paddingBottom: '0.5rem',
								borderBottom: `1px solid ${lightGreyBorder}`,
							}}
						>
							Access Token
						</div>
						<InlineTokenDisplay
							label="Access Token"
							token={tokens.access_token}
							tokenType="access"
							isOIDC={!!tokens.id_token}
							flowKey="device-authorization"
							defaultMasked={false}
							allowMaskToggle={false}
						/>
					</div>
				)}
				{tokens.id_token && (
					<div
						style={{
							background: backgroundColor,
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: `1px solid ${lightGreyBorder}`,
							width: '100%',
							maxWidth: '100%',
							marginBottom: '0.5rem',
							boxSizing: 'border-box',
						}}
					>
						<div
							style={{
								fontSize: '0.875rem',
								fontWeight: '600',
								color: defaultHeaderColor,
								marginBottom: '0.5rem',
								paddingBottom: '0.5rem',
								borderBottom: `1px solid ${lightGreyBorder}`,
							}}
						>
							ID Token
						</div>
						<InlineTokenDisplay
							label="ID Token"
							token={tokens.id_token}
							tokenType="id"
							isOIDC={true}
							flowKey="device-authorization"
							defaultMasked={false}
							allowMaskToggle={false}
						/>
					</div>
				)}
				{tokens.refresh_token && (
					<div
						style={{
							background: backgroundColor,
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: `1px solid ${lightGreyBorder}`,
							width: '100%',
							maxWidth: '100%',
							marginBottom: '0.5rem',
							boxSizing: 'border-box',
						}}
					>
						<div
							style={{
								fontSize: '0.875rem',
								fontWeight: '600',
								color: defaultHeaderColor,
								marginBottom: '0.5rem',
								paddingBottom: '0.5rem',
								borderBottom: `1px solid ${lightGreyBorder}`,
							}}
						>
							Refresh Token
						</div>
						<InlineTokenDisplay
							label="Refresh Token"
							token={tokens.refresh_token}
							tokenType="refresh"
							isOIDC={!!tokens.id_token}
							flowKey="device-authorization"
							defaultMasked={false}
							allowMaskToggle={false}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default StandardizedTokenDisplay;
