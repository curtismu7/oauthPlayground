// src/v7m/ui/V7MInfoIcon.tsx

import { FiInfo } from '@icons';
import React from 'react';

type Props = {
	label: string; // aria-label
	title: string; // tooltip text
	onClick?: () => void; // optional to open a modal
};

export const V7MInfoIcon: React.FC<Props> = ({ label, title, onClick }) => {
	return (
		<button type="button" aria-label={label} title={title} onClick={onClick} style={btnStyle}>
			<FiInfo />
		</button>
	);
};

const btnStyle: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	border: 'none',
	background: 'transparent',
	color: '#0ea5e9',
	cursor: 'pointer',
	padding: 0,
	marginLeft: 6,
};
