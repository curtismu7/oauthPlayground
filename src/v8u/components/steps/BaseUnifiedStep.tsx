/**
 * @file BaseUnifiedStep.tsx
 * @description Base component for Unified flow steps
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React from 'react';
import type { FlowType } from '../../../v8/services/specVersionServiceV8';

// Base step styles
const stepContainerStyle: React.CSSProperties = {
	padding: '2rem',
	backgroundColor: '#ffffff',
	borderRadius: '0.75rem',
	boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
	marginBottom: '2rem',
};

const stepHeaderStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	marginBottom: '1.5rem',
	paddingBottom: '1rem',
	borderBottom: '2px solid #e2e8f0',
};

const stepNumberStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '3rem',
	height: '3rem',
	borderRadius: '50%',
	background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
	color: 'white',
	fontWeight: 'bold',
	fontSize: '1.25rem',
	marginRight: '1rem',
};

const stepTitleStyle: React.CSSProperties = {
	fontSize: '1.5rem',
	fontWeight: '700',
	color: '#1e293b',
	margin: 0,
};

const stepDescriptionStyle: React.CSSProperties = {
	color: '#64748b',
	marginTop: '0.5rem',
	fontSize: '0.875rem',
};

const contentStyle: React.CSSProperties = {
	marginTop: '1.5rem',
};

interface BaseUnifiedStepProps {
	title: string;
	description?: string;
	stepNumber: number;
	children: React.ReactNode;
	flowType?: FlowType;
	isCompleted?: boolean;
	isActive?: boolean;
}

export const BaseUnifiedStep: React.FC<BaseUnifiedStepProps> = ({
	title,
	description,
	stepNumber,
	children,
	flowType,
	isCompleted = false,
	isActive = false,
}) => {
	const getStepColor = () => {
		if (isCompleted) return '#10b981';
		if (isActive) return '#3b82f6';
		return '#94a3b8';
	};

	const stepColor = getStepColor();

	return (
		<div style={stepContainerStyle}>
			<div style={stepHeaderStyle}>
				<div
					style={{
						...stepNumberStyle,
						background: isActive
							? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
							: isCompleted
								? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
								: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
					}}
				>
					{stepNumber}
				</div>
				<div style={{ flex: 1 }}>
					<h2 style={{ ...stepTitleStyle, color: stepColor }}>{title}</h2>
					{description && <p style={stepDescriptionStyle}>{description}</p>}
					{flowType && (
						<span
							style={{
								display: 'inline-block',
								padding: '0.25rem 0.75rem',
								backgroundColor: '#f1f5f9',
								color: '#475569',
								borderRadius: '9999px',
								fontSize: '0.75rem',
								fontWeight: '500',
								marginTop: '0.5rem',
							}}
						>
							{flowType.toUpperCase()}
						</span>
					)}
				</div>
			</div>
			<div style={contentStyle}>{children}</div>
		</div>
	);
};
