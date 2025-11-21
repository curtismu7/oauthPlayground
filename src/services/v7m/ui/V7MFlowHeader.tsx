// src/services/v7m/ui/V7MFlowHeader.tsx
import React from 'react';

type Props = {
	title: string;
	subtitle?: string;
	right?: React.ReactNode;
	variant?: 'oauth' | 'oidc';
};

export const V7MFlowHeader: React.FC<Props> = ({ title, subtitle, right, variant = 'oauth' }) => {
	return (
		<div
			style={{
				padding: '16px 20px',
				color: '#fff',
				background: variant === 'oidc' ? '#2563eb' : '#16a34a',
				borderRadius: 12,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			}}
		>
			<div>
				<div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
				{subtitle && <div style={{ opacity: 0.9 }}>{subtitle}</div>}
			</div>
			{right}
		</div>
	);
};
