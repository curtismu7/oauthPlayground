// src/services/v7m/ui/V7MCollapsibleHeader.tsx
import React, { useState } from 'react';
import { FiPackage } from 'react-icons/fi';

type Theme = 'orange' | 'blue' | 'yellow' | 'green' | 'highlight';

type Props = {
	title: string;
	subtitle?: string;
	theme?: Theme;
	icon?: React.ReactNode;
	defaultOpen?: boolean;
	children?: React.ReactNode;
};

const themeColor: Record<Theme, string> = {
	orange: '#f97316',
	blue: '#3b82f6',
	yellow: '#f59e0b',
	green: '#16a34a',
	highlight: '#0ea5e9',
};

export const V7MCollapsibleHeader: React.FC<Props> = ({
	title,
	subtitle,
	theme = 'highlight',
	icon = <FiPackage color="#fff" />,
	defaultOpen = true,
	children,
}) => {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<section style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
			<header
				onClick={() => setOpen(!open)}
				style={{
					cursor: 'pointer',
					padding: '10px 12px',
					background: themeColor[theme],
					color: '#fff',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
					{icon}
					<div style={{ fontWeight: 600 }}>{title}</div>
					{subtitle && <div style={{ opacity: 0.9 }}>{subtitle}</div>}
				</div>
				<div style={{ opacity: 0.9 }}>{open ? '−' : '+'}</div>
			</header>
			{open && <div style={{ padding: 12, background: '#fff' }}>{children}</div>}
		</section>
	);
};
