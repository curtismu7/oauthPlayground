// src/components/ApiCallColorLegend.tsx
// Color legend component showing API call type classifications

import React from 'react';
import styled from 'styled-components';
import { type ApiCallType, ApiCallTypeDetector } from '../utils/apiCallTypeDetector';

const LegendContainer = styled.div`
	background: #ffffff;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	padding: 1.25rem;
	margin: 1rem 0;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const LegendTitle = styled.h4`
	margin: 0 0 1rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.5rem;

	&::before {
		content: '🎨';
		font-size: 1.25rem;
	}
`;

const LegendItems = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const LegendItem = styled.div<{ $callType: ApiCallType }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	border-radius: 8px;
	background: ${({ $callType }) => ApiCallTypeDetector.getColorTheme($callType).background};
	border: 2px solid ${({ $callType }) => ApiCallTypeDetector.getColorTheme($callType).border};
	transition: all 0.2s ease;

	&:hover {
		transform: translateX(4px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`;

const LegendIcon = styled.span`
	font-size: 1.5rem;
	line-height: 1;
	flex-shrink: 0;
`;

const LegendText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	flex: 1;

	strong {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	span {
		font-size: 0.8rem;
		color: #6b7280;
		line-height: 1.4;
	}
`;

interface ApiCallColorLegendProps {
	className?: string;
	compact?: boolean;
}

export const ApiCallColorLegend: React.FC<ApiCallColorLegendProps> = ({
	className,
	compact = false,
}) => {
	const callTypes = ApiCallTypeDetector.getAllCallTypes();

	if (compact) {
		return (
			<LegendContainer className={className} style={{ padding: '0.75rem' }}>
				<LegendTitle style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
					API Call Types
				</LegendTitle>
				<LegendItems style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem' }}>
					{callTypes.map((callType) => (
						<LegendItem
							key={callType.type}
							$callType={callType.type}
							style={{ padding: '0.5rem 0.75rem', flex: '0 1 auto' }}
							title={callType.description}
						>
							<LegendIcon style={{ fontSize: '1.25rem' }}>{callType.icon}</LegendIcon>
							<strong style={{ fontSize: '0.8rem' }}>{callType.displayName}</strong>
						</LegendItem>
					))}
				</LegendItems>
			</LegendContainer>
		);
	}

	return (
		<LegendContainer className={className}>
			<LegendTitle>API Call Types</LegendTitle>
			<LegendItems>
				{callTypes.map((callType) => (
					<LegendItem key={callType.type} $callType={callType.type}>
						<LegendIcon>{callType.icon}</LegendIcon>
						<LegendText>
							<strong>{callType.displayName}</strong>
							<span>{callType.description}</span>
						</LegendText>
					</LegendItem>
				))}
			</LegendItems>
		</LegendContainer>
	);
};

export default ApiCallColorLegend;
