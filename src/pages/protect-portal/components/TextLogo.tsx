/**
 * @file TextLogo.tsx
 * @module protect-portal/components
 * @description Text-based logo component for corporate branding
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a text-based logo display for corporate branding
 * when image logos are not available or practical.
 */

import React from 'react';
import styled from 'styled-components';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LogoContainer = styled.div<{ width: string; height: string }>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-family: var(--brand-heading-font);
  border-radius: var(--brand-radius-sm);
  background: var(--brand-surface);
  border: 1px solid var(--brand-border);
  box-shadow: var(--brand-shadow-sm);
  transition: var(--brand-transition);

  &:hover {
    transform: scale(1.02);
    box-shadow: var(--brand-shadow-md);
  }
`;

const LogoText = styled.span<{ colors?: Record<string, string> }>`
  font-size: ${({ colors }) => (colors ? '1.25rem' : '1.1rem')};
  letter-spacing: ${({ colors }) => (colors ? '-0.025em' : '0')};
  
  ${({ colors }) => {
		if (!colors) return '';

		return Object.entries(colors)
			.map(([part, color]) => {
				if (part === 'fed') {
					return `color: ${color}; font-weight: 700;`;
				} else if (part === 'ex') {
					return `color: ${color}; font-weight: 700;`;
				} else if (part === 'american') {
					return `color: ${color}; font-weight: 700;`;
				} else if (part === 'airlines') {
					return `color: ${color}; font-weight: 700;`;
				}
				return `color: ${color}; font-weight: 600;`;
			})
			.join(' ');
	}}
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface TextLogoProps {
	text: string;
	colors?: Record<string, string>;
	width: string;
	height: string;
	alt?: string;
	className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const TextLogo: React.FC<TextLogoProps> = ({ text, colors, width, height, alt, className }) => {
	// For American Airlines "AMERICAN" with special styling
	if (text === 'AMERICAN' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span
						style={{
							color: colors.american || '#0033A0',
							fontWeight: 700,
							letterSpacing: '0.08em',
							fontSize: '1.15em',
						}}
					>
						AMERICAN
					</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For FedEx "FedEx" with special styling
	if (text === 'FedEx' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span
						style={{
							color: colors.fed || '#4D148C',
							fontWeight: 700,
							letterSpacing: '0.05em',
							fontSize: '1.1em',
						}}
					>
						Fed
					</span>
					<span
						style={{
							color: colors.ex || '#FF6600',
							fontWeight: 700,
							letterSpacing: '0.05em',
							fontSize: '1.1em',
						}}
					>
						Ex
					</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For Bank of America "BANK OF AMERICA" with special styling
	if (text === 'BANK OF AMERICA' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span
						style={{
							color: colors.bank || '#012169',
							fontWeight: 700,
							letterSpacing: '0.02em',
							fontSize: '0.9em',
						}}
					>
						BANK
					</span>
					<span
						style={{
							color: colors.of || '#E31837',
							fontWeight: 700,
							letterSpacing: '0.02em',
							fontSize: '0.9em',
							margin: '0 0.2em',
						}}
					>
						OF
					</span>
					<span
						style={{
							color: colors.america || '#012169',
							fontWeight: 700,
							letterSpacing: '0.02em',
							fontSize: '0.9em',
						}}
					>
						AMERICA
					</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For PingIdentity "PingIdentity" with special styling
	if (text === 'PingIdentity' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span
						style={{
							color: colors.ping || '#0066CC',
							fontWeight: 700,
							letterSpacing: '0.02em',
							fontSize: '1.0em',
						}}
					>
						Ping
					</span>
					<span
						style={{
							color: colors.identity || '#003366',
							fontWeight: 700,
							letterSpacing: '0.02em',
							fontSize: '1.0em',
						}}
					>
						Identity
					</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For Southwest Airlines "SOUTHWEST" with special styling
	if (text === 'SOUTHWEST' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span
						style={{
							color: colors.southwest || '#2E4BB1',
							fontWeight: 700,
							letterSpacing: '0.05em',
							fontSize: '1.1em',
						}}
					>
						SOUTHWEST
					</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For United Airlines "UNITED" with special styling
	if (text === 'UNITED' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span
						style={{
							color: colors.united || '#0033A0',
							fontWeight: 700,
							letterSpacing: '0.1em',
							fontSize: '1.2em',
						}}
					>
						UNITED
					</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For FedEx, split into "Fed" and "Ex" with different colors
	if (text === 'FedEx' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span style={{ color: colors?.fed, fontWeight: 800 }}>Fed</span>
					<span style={{ color: colors?.ex, fontWeight: 600 }}>Ex</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For Bank of America with special styling
	if (text === 'Bank of America' && colors) {
		return (
			<LogoContainer width={width} height={height} className={className} title={alt}>
				<LogoText>
					<span
						style={{
							color: colors?.bank || '#012169',
							fontWeight: 700,
							letterSpacing: '0.02em',
							fontSize: '1.0em',
						}}
					>
						Bank of America
					</span>
				</LogoText>
			</LogoContainer>
		);
	}

	// For simple text logos (AA, UA, SW)
	return (
		<LogoContainer width={width} height={height} className={className} title={alt}>
			<LogoText>
				<span style={{ color: colors ? colors[text.toLowerCase()] : 'inherit' }}>{text}</span>
			</LogoText>
		</LogoContainer>
	);
};

export default TextLogo;
