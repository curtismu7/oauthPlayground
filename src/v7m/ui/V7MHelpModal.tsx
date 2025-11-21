// src/v7m/ui/V7MHelpModal.tsx
import React from 'react';

type Props = {
	open: boolean;
	title: string;
	icon?: React.ReactNode;
	onClose: () => void;
	children: React.ReactNode;
	themeColor?: string; // hex color to match header conventions
};

export const V7MHelpModal: React.FC<Props> = ({
	open,
	title,
	icon,
	onClose,
	children,
	themeColor = '#3b82f6',
}) => {
	if (!open) return null;
	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="v7m-help-title"
			style={backdropStyle}
			onClick={onClose}
		>
			<div style={modalStyle} onClick={(e) => e.stopPropagation()}>
				<div style={{ ...headerStyle, backgroundColor: themeColor }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						{icon}
						<h2 id="v7m-help-title" style={{ margin: 0, fontSize: 18, color: '#fff' }}>
							{title}
						</h2>
					</div>
					<button onClick={onClose} aria-label="Close" style={closeBtnStyle}>
						×
					</button>
				</div>
				<div style={contentStyle}>{children}</div>
			</div>
		</div>
	);
};

const backdropStyle: React.CSSProperties = {
	position: 'fixed',
	inset: 0,
	background: 'rgba(0,0,0,0.4)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 1000,
};
const modalStyle: React.CSSProperties = {
	width: 'min(720px, 90vw)',
	maxHeight: '80vh',
	background: '#fff',
	borderRadius: 8,
	overflow: 'hidden',
	boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};
const headerStyle: React.CSSProperties = {
	padding: '12px 16px',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
};
const closeBtnStyle: React.CSSProperties = {
	border: 'none',
	background: 'transparent',
	color: '#fff',
	fontSize: 24,
	cursor: 'pointer',
	lineHeight: 1,
};
const contentStyle: React.CSSProperties = {
	padding: 16,
	overflow: 'auto',
};
