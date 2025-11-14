// src/components/RogerGroceryLogo.tsx
import React from 'react';
import styled from 'styled-components';

const LogoWrapper = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 0.9rem;
	padding: 0.85rem 1.5rem;
	border-radius: 48px;
	background: linear-gradient(
		135deg,
		rgba(200, 16, 46, 0.95) 0%,
		rgba(255, 255, 255, 0.92) 48%,
		rgba(0, 40, 104, 0.95) 100%
	);
	box-shadow:
		0 16px 42px rgba(12, 24, 48, 0.28),
		inset 0 0 18px rgba(255, 255, 255, 0.25);
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		inset: 1px;
		border-radius: inherit;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.04) 0%,
			rgba(255, 255, 255, 0.08) 45%,
			rgba(255, 255, 255, 0.02) 100%
		);
		pointer-events: none;
	}

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 2px solid rgba(255, 255, 255, 0.25);
		pointer-events: none;
	}
`;

const Wordmark = styled.span`
	font-family: 'Montserrat', 'Poppins', 'Segoe UI', sans-serif;
	text-transform: uppercase;
	letter-spacing: 0.22em;
	font-weight: 800;
	color: #ffffff;
	font-size: 1.4rem;
	position: relative;
	z-index: 1;
	text-shadow: 0 3px 8px rgba(12, 24, 48, 0.35);

	strong {
		display: inline-block;
		margin-right: 0.55em;
		padding: 0.08em 0.5em;
		border-radius: 0.4em;
		background: rgba(0, 0, 0, 0.18);
		box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.2);
	}
`;

const Tagline = styled.span`
	font-family: 'Nunito', 'Segoe UI', sans-serif;
	font-size: 0.95rem;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 600;
	letter-spacing: 0.08em;
	position: relative;
	z-index: 1;

	&::before {
		content: '★';
		margin-right: 0.6rem;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.75);
		filter: drop-shadow(0 2px 4px rgba(12, 24, 48, 0.4));
	}
`;

const RogerGroceryLogo: React.FC = () => (
	<LogoWrapper>
		<Wordmark>
			<strong>CROGER</strong> Grocery
		</Wordmark>
		<Tagline>Shop Bold • Shop Local</Tagline>
	</LogoWrapper>
);

export default RogerGroceryLogo;

