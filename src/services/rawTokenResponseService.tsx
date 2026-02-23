// src/services/rawTokenResponseService.tsx
import React from 'react';
import { ColoredTokenDisplay } from '../components/ColoredTokenDisplay';

// MDI Icon Helper Functions
interface MDIIconProps {
	icon: string;
	size?: number;
	color?: string;
	ariaLabel: string;
}

const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiCheckCircle: 'mdi-check-circle',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

const MDIIcon: React.FC<MDIIconProps> = ({ icon, size = 24, color, ariaLabel }) => {
	const iconClass = getMDIIconClass(icon);
	return (
		<span
			className={`mdi ${iconClass}`}
			style={{ fontSize: size, color: color }}
			role="img"
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
		></span>
	);
};

// CSS Helper Functions
const getResultsSectionStyles = () => ({
	margin: '2rem 0',
	padding: '1.5rem',
	background: '#f8fafc',
	border: '1px solid #e2e8f0',
	borderRadius: '12px',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
});

const getResultsHeadingStyles = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
	marginBottom: '1rem',
	fontSize: '1.125rem',
	fontWeight: '600',
	color: '#1f2937',
});

const getHelperTextStyles = () => ({
	marginBottom: '1.5rem',
	color: '#6b7280',
	fontSize: '0.875rem',
	lineHeight: '1.5',
});

const getIndividualTokensContainerStyles = () => ({
	marginBottom: '2rem',
});

const getRawResponseContainerStyles = () => ({
	marginTop: '2rem',
});

const getRawResponseTitleStyles = () => ({
	marginBottom: '1rem',
	color: '#374151',
	fontSize: '1rem',
	fontWeight: '600',
});

const getRawResponseDescriptionStyles = () => ({
	marginBottom: '1rem',
	color: '#6b7280',
	fontSize: '0.875rem',
});

interface RawTokenResponseServiceProps {
	tokens: Record<string, any>;
	onNavigateToTokenManagement?: () => void;
	showIndividualTokens?: boolean;
	children?: React.ReactNode; // For additional content after individual tokens
}

export const RawTokenResponseService: React.FC<RawTokenResponseServiceProps> = ({
	tokens,
	onNavigateToTokenManagement,
	showIndividualTokens = true,
	children,
}) => {
	// Check if we have any tokens
	const hasTokens =
		tokens &&
		Object.values(tokens).some((value) => value !== null && value !== undefined && value !== '');

	if (!hasTokens) {
		return (
			<div style={getResultsSectionStyles()}>
				<div style={getResultsHeadingStyles()}>
					<MDIIcon icon="FiCheckCircle" size={18} ariaLabel="Success" /> Token Response
				</div>
				<p style={getHelperTextStyles()}>Complete the authorization step to receive tokens.</p>
				<div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
					<p>Complete the authorization step to receive tokens</p>
				</div>
			</div>
		);
	}

	return (
		<div style={getResultsSectionStyles()}>
			<div style={getResultsHeadingStyles()}>
				<MDIIcon icon="FiCheckCircle" size={18} ariaLabel="Success" /> Token Response
			</div>
			<p style={getHelperTextStyles()}>
				Review the raw token response. Copy the JSON or open the token management tooling to inspect
				each token.
			</p>

			{/* Individual Token Displays (if enabled and children provided) */}
			{showIndividualTokens && children && (
				<div style={getIndividualTokensContainerStyles()}>{children}</div>
			)}

			{/* Raw Token Response */}
			<div style={getRawResponseContainerStyles()}>
				<h4 style={getRawResponseTitleStyles()}>Raw Token Response</h4>
				<p style={getRawResponseDescriptionStyles()}>
					Review the raw token response. Copy the JSON or open the token management tooling to
					inspect each token.
				</p>
				<ColoredTokenDisplay
					tokens={tokens}
					label="Raw Token Response"
					showCopyButton={true}
					showInfoButton={true}
					showOpenButton={true}
					onOpen={onNavigateToTokenManagement || (() => console.log('Opening token management...'))}
					height="200px"
				/>
			</div>
		</div>
	);
};

export default RawTokenResponseService;
