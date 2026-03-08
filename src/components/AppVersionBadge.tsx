
import React from 'react';
import styled from 'styled-components';
import packageJson from '../../package.json';

interface AppVersionBadgeProps {
	type: 'app' | 'mfa' | 'unified' | 'protect';
	showIcon?: boolean;
}

const BadgeContainer = styled.div<{ $color: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.625rem;
	border-radius: 0.375rem;
	background: ${(props) => props.$color};
	color: white;
	font-size: 0.75rem;
	font-weight: 600;
	white-space: nowrap;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}
`;

const IconWrapper = styled.span`
	display: flex;
	align-items: center;
	font-size: 0.875rem;
`;

const VersionText = styled.span`
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	letter-spacing: 0.025em;
`;

const APP_COLORS = {
	app: 'V9_COLORS.PRIMARY.BLUE', // Blue
	mfa: '#8b5cf6', // Purple
	unified: 'V9_COLORS.PRIMARY.GREEN', // Green
	protect: 'V9_COLORS.PRIMARY.YELLOW', // Amber
};

const APP_LABELS = {
	app: 'APP',
	mfa: 'MFA',
	unified: 'V8U',
	protect: 'PROTECT',
};

const APP_ICONS = {
	app: '📦',
	mfa: '🛡️',
	unified: '📚',
	protect: '⚡',
};

export const AppVersionBadge: React.FC<AppVersionBadgeProps> = ({ type, showIcon = true }) => {
	const getVersion = () => {
		switch (type) {
			case 'app':
				return packageJson.version;
			case 'mfa':
				return packageJson.mfaV8Version;
			case 'unified':
				return packageJson.unifiedV8uVersion;
			case 'protect':
				return packageJson.protectPortalVersion;
			default:
				return packageJson.version;
		}
	};

	const Icon = APP_ICONS[type];
	const color = APP_COLORS[type];
	const label = APP_LABELS[type];
	const version = getVersion();

	return (
		<BadgeContainer $color={color} title={`${label} Version ${version}`}>
			{showIcon && (
				<IconWrapper>
					<span style={{ fontSize: '14px' }}>{Icon}</span>
				</IconWrapper>
			)}
			<VersionText>
				{label} v{version}
			</VersionText>
		</BadgeContainer>
	);
};

export default AppVersionBadge;
