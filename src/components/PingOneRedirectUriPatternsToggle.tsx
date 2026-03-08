// src/components/PingOneRedirectUriPatternsToggle.tsx


import React from 'react';
import styled from 'styled-components';
import { pingOneConfigService } from '../services/pingoneConfigService';

const Container = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.75rem;
`;

const Title = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0;
`;

const ToggleContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

const Toggle = styled.button<{ $active: boolean }>`
	position: relative;
	width: 3rem;
	height: 1.5rem;
	background-color: ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_LIGHTER')};
	border: none;
	border-radius: 9999px;
	cursor: pointer;
	transition: background-color 0.2s;
	
	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
	
	span {
		position: absolute;
		top: 0.125rem;
		left: ${({ $active }) => ($active ? '1.625rem' : '0.125rem')};
		width: 1.25rem;
		height: 1.25rem;
		background-color: white;
		border-radius: 50%;
		transition: left 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`;

const Description = styled.p`
	font-size: 0.875rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin: 0;
	line-height: 1.5;
`;

interface PingOneRedirectUriPatternsToggleProps {
	className?: string;
}

const PingOneRedirectUriPatternsToggle: React.FC<PingOneRedirectUriPatternsToggleProps> = ({
	className,
}) => {
	const config = pingOneConfigService.loadConfig();

	const handleToggle = () => {
		const newConfig = {
			...config,
			allowRedirectUriPatterns: !config.allowRedirectUriPatterns,
		};
		pingOneConfigService.saveConfig(newConfig);
	};

	return (
		<Container className={className}>
			<Header>
				<span style={{ fontSize: '16px' }}>🌐</span>
				<Title>Allow Redirect URI Patterns</Title>
			</Header>

			<ToggleContainer>
				<Toggle
					$active={config.allowRedirectUriPatterns || false}
					onClick={handleToggle}
					aria-pressed={config.allowRedirectUriPatterns || false}
					role="switch"
					aria-label="Allow Redirect URI Patterns"
				>
					<span />
				</Toggle>
			</ToggleContainer>

			<Description>
				Enable wildcard redirect URIs (recommended for developer sandbox only).
			</Description>
		</Container>
	);
};

export default PingOneRedirectUriPatternsToggle;
