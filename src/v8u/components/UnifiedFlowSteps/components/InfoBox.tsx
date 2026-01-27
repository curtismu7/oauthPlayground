import React from 'react';
import styled from 'styled-components';

const InfoBoxContainer = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			return '#3b82f6';
		}};
	background: linear-gradient(
		135deg,
		${({ $variant }) => {
			if ($variant === 'warning') return '#fff7ed 0%, #fed7aa 100%';
			if ($variant === 'success') return '#f0fdf4 0%, #d1fae5 100%';
			return '#eff6ff 0%, #dbeafe 100%';
		}}
	);
`;

const _InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.h3`
	margin: 0 0 0.5rem 0;
	font-size: 1.1rem;
	font-weight: 600;
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#92400e';
			case 'success':
				return '#065f46';
			default:
				return '#1e3a8a';
		}
	}};
`;

const InfoText = styled.p`
	margin: 0 0 1rem 0;
	font-size: 0.95rem;
	line-height: 1.6;
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#78350f';
			case 'success':
				return '#047857';
			default:
				return '#374151';
		}
	}};
`;

const InfoList = styled.ul`
	margin: 0;
	padding-left: 1.5rem;
	font-size: 0.9rem;
	line-height: 1.6;
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#78350f';
			case 'success':
				return '#047857';
			default:
				return '#374151';
		}
	}};

	li {
		margin-bottom: 0.5rem;

		&:last-child {
			margin-bottom: 0;
		}

		strong {
			font-weight: 600;
		}
	}
`;

interface InfoBoxProps {
	variant?: 'info' | 'warning' | 'success';
	children: React.ReactNode;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ variant = 'info', children }) => {
	return <InfoBoxContainer $variant={variant}>{children}</InfoBoxContainer>;
};

export { InfoTitle, InfoText, InfoList };
