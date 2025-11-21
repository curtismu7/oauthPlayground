// src/components/ApiCallList.tsx
// Reusable component to display API calls using EnhancedApiCallDisplay

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { type ApiCall, apiCallTrackerService } from '../services/apiCallTrackerService';
import type { EnhancedApiCallData } from '../services/enhancedApiCallDisplayService';
import { ApiCallColorLegend } from './ApiCallColorLegend';
import { EnhancedApiCallDisplay } from './EnhancedApiCallDisplay';

const Container = styled.div`
	margin: 24px 0;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding: 16px;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const CallCount = styled.span`
	background: #3b82f6;
	color: white;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 600;
`;

const ClearButton = styled.button`
	background: #ef4444;
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 6px;

	&:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 48px 32px;
	background: white;
	border: 2px dashed #e5e7eb;
	border-radius: 8px;
	color: #9ca3af;
	font-size: 14px;
`;

const CallsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
`;

interface ApiCallListProps {
	title?: string;
	showLegend?: boolean;
}

export const ApiCallList: React.FC<ApiCallListProps> = ({
	title = 'API Calls to PingOne',
	showLegend = true,
}) => {
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

	useEffect(() => {
		// Initial load
		setApiCalls(apiCallTrackerService.getApiCalls());

		// Subscribe to updates
		const unsubscribe = apiCallTrackerService.subscribe((calls) => {
			setApiCalls(calls);
		});

		return unsubscribe;
	}, []);

	const handleClearAll = () => {
		apiCallTrackerService.clearApiCalls();
	};

	// Convert ApiCall to EnhancedApiCallData
	const convertToEnhancedApiCallData = (call: ApiCall): EnhancedApiCallData => {
		return {
			method: call.method as EnhancedApiCallData['method'],
			url: call.url,
			actualPingOneUrl: call.actualPingOneUrl,
			callType: call.callType,
			headers: call.headers,
			body: call.body,
			queryParams: call.queryParams,
			response: call.response,
			timestamp: call.timestamp,
			duration: call.duration,
			stepName: call.step,
		};
	};

	return (
		<Container>
			<Header>
				<Title>
					{title}
					<CallCount>{apiCalls.length}</CallCount>
				</Title>
				<ClearButton onClick={handleClearAll} disabled={apiCalls.length === 0}>
					🗑️ Clear All
				</ClearButton>
			</Header>

			{showLegend && <ApiCallColorLegend compact />}

			{apiCalls.length === 0 ? (
				<EmptyState>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
					<div style={{ fontSize: '16px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
						No API calls recorded yet
					</div>
					<div style={{ fontSize: '14px' }}>API calls will appear here as they are made</div>
				</EmptyState>
			) : (
				<CallsContainer>
					{apiCalls.map((call) => (
						<EnhancedApiCallDisplay
							key={call.id}
							apiCall={convertToEnhancedApiCallData(call)}
							compact={true}
							options={{
								includeHeaders: true,
								includeBody: true,
								includeQueryParams: true,
								prettyPrint: true,
								showEducationalNotes: false,
								showFlowContext: false,
							}}
						/>
					))}
				</CallsContainer>
			)}
		</Container>
	);
};

export default ApiCallList;
