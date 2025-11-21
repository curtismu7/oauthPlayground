// src/components/ApiCallTable.tsx
// Table component to display tracked API calls with full details

import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiCode, FiFileText } from 'react-icons/fi';
import styled from 'styled-components';
import type { ApiCall } from '../services/apiCallTrackerService';
import JSONHighlighter, { type JSONData } from './JSONHighlighter';

const TableContainer = styled.div`
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	overflow: hidden;
	margin-top: 0;
	width: 100%;
`;

const TableHeader = styled.div`
	background: #f9fafb;
	padding: 1rem 1.5rem;
	border-bottom: 2px solid #e5e7eb;
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}
`;

const ClearButton = styled.button`
	padding: 0.5rem 1rem;
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.2s;
	
	&:hover {
		background: #dc2626;
	}
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	table-layout: auto;
`;

const TableHead = styled.thead`
	background: #f3f4f6;
	
	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ $isExpanded?: boolean }>`
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	transition: background 0.2s;
	
	&:hover {
		background: #f9fafb;
	}
	
	${(props) =>
		props.$isExpanded &&
		`
		background: #f9fafb;
	`}
`;

const TableCell = styled.td`
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	color: #111827;
`;

const MethodBadge = styled.span<{ $method: string }>`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	
	${(props) => {
		switch (props.$method) {
			case 'GET':
				return 'background: #dbeafe; color: #1e40af;';
			case 'POST':
				return 'background: #dcfce7; color: #166534;';
			case 'PUT':
				return 'background: #fef3c7; color: #92400e;';
			case 'DELETE':
				return 'background: #fee2e2; color: #991b1b;';
			default:
				return 'background: #f3f4f6; color: #374151;';
		}
	}}
`;

const StatusBadge = styled.span<{ $status: number }>`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	
	${(props) => {
		if (props.$status >= 200 && props.$status < 300) {
			return 'background: #dcfce7; color: #166534;';
		} else if (props.$status >= 400) {
			return 'background: #fee2e2; color: #991b1b;';
		} else {
			return 'background: #fef3c7; color: #92400e;';
		}
	}}
`;

const ExpandableContent = styled.div<{ $isExpanded: boolean }>`
	display: ${(props) => (props.$isExpanded ? 'block' : 'none')};
	padding: 1rem 1.5rem;
	background: white;
	border-top: 1px solid #e5e7eb;
`;

const Section = styled.div`
	margin-bottom: 1.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CodeBlock = styled.pre`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 4px;
	padding: 1rem;
	overflow-x: auto;
	font-size: 0.8125rem;
	line-height: 1.5;
	margin: 0;
`;

const KeyValueList = styled.dl`
	margin: 0;
	
	dt {
		font-weight: 600;
		color: #374151;
		margin-top: 0.5rem;
		
		&:first-child {
			margin-top: 0;
		}
	}
	
	dd {
		margin: 0.25rem 0 0 1rem;
		color: #6b7280;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.8125rem;
		word-break: break-all;
	}
`;

const EmptyState = styled.div`
	padding: 3rem;
	text-align: center;
	color: #6b7280;
	
	p {
		margin: 0;
		font-size: 0.875rem;
	}
`;

interface ApiCallTableProps {
	apiCalls: ApiCall[];
	onClear?: () => void;
}

export const ApiCallTable: React.FC<ApiCallTableProps> = ({ apiCalls, onClear }) => {
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

	const toggleRow = (id: string) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedRows(newExpanded);
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3,
		});
	};

	const formatDuration = (ms?: number) => {
		if (!ms) return '-';
		return `${ms.toFixed(0)}ms`;
	};

	return (
		<TableContainer>
			<TableHeader>
				<h3>API Calls to PingOne ({apiCalls.length})</h3>
				{onClear && apiCalls.length > 0 && <ClearButton onClick={onClear}>Clear All</ClearButton>}
			</TableHeader>
			{apiCalls.length === 0 ? (
				<EmptyState>
					<p>No API calls yet. API calls will appear here as you interact with the application.</p>
				</EmptyState>
			) : (
				<Table>
					<TableHead>
						<tr>
							<th style={{ width: '40px' }}></th>
							<th style={{ width: '80px' }}>Method</th>
							<th style={{ minWidth: '400px' }}>URL</th>
							<th style={{ width: '100px' }}>Status</th>
							<th style={{ width: '120px' }}>Time</th>
							<th style={{ width: '100px' }}>Duration</th>
						</tr>
					</TableHead>
					<TableBody>
						{apiCalls.map((call) => {
							const isExpanded = expandedRows.has(call.id);
							return (
								<React.Fragment key={call.id}>
									<TableRow $isExpanded={isExpanded} onClick={() => toggleRow(call.id)}>
										<TableCell>{isExpanded ? <FiChevronDown /> : <FiChevronRight />}</TableCell>
										<TableCell>
											<MethodBadge $method={call.method}>{call.method}</MethodBadge>
										</TableCell>
										<TableCell>
											<div
												style={{
													fontFamily: 'Monaco, Menlo, monospace',
													fontSize: '0.8125rem',
													wordBreak: 'break-all',
													whiteSpace: 'normal',
													overflowWrap: 'break-word',
													maxWidth: '100%',
												}}
											>
												{call.actualPingOneUrl || call.url}
											</div>
											{call.actualPingOneUrl && call.url !== call.actualPingOneUrl && (
												<div
													style={{
														fontSize: '0.75rem',
														color: '#6b7280',
														marginTop: '0.25rem',
														fontStyle: 'italic',
													}}
												>
													Proxy: {call.url}
												</div>
											)}
										</TableCell>
										<TableCell>
											{call.response ? (
												<StatusBadge $status={call.response.status}>
													{call.response.status}
												</StatusBadge>
											) : (
												<span style={{ color: '#6b7280' }}>Pending</span>
											)}
										</TableCell>
										<TableCell>
											<small style={{ color: '#6b7280' }}>{formatTime(call.timestamp)}</small>
										</TableCell>
										<TableCell>
											<small style={{ color: '#6b7280' }}>{formatDuration(call.duration)}</small>
										</TableCell>
									</TableRow>
									{isExpanded && (
										<tr>
											<TableCell colSpan={6} style={{ padding: 0 }}>
												<ExpandableContent $isExpanded={true}>
													{call.actualPingOneUrl && call.url !== call.actualPingOneUrl && (
														<Section>
															<SectionTitle>API URLs</SectionTitle>
															<KeyValueList>
																<dt>PingOne API:</dt>
																<dd
																	style={{
																		fontFamily: 'Monaco, Menlo, monospace',
																		fontSize: '0.875rem',
																	}}
																>
																	{call.actualPingOneUrl}
																</dd>
																<dt>Proxy URL:</dt>
																<dd
																	style={{
																		fontFamily: 'Monaco, Menlo, monospace',
																		fontSize: '0.875rem',
																	}}
																>
																	{call.url}
																</dd>
															</KeyValueList>
														</Section>
													)}
													{call.queryParams && Object.keys(call.queryParams).length > 0 && (
														<Section>
															<SectionTitle>Query Parameters</SectionTitle>
															<KeyValueList>
																{Object.entries(call.queryParams).map(([key, value]) => (
																	<React.Fragment key={key}>
																		<dt>{key}:</dt>
																		<dd>{String(value)}</dd>
																	</React.Fragment>
																))}
															</KeyValueList>
														</Section>
													)}
													{call.headers && Object.keys(call.headers).length > 0 && (
														<Section>
															<SectionTitle>
																<FiFileText /> Request Headers
															</SectionTitle>
															<KeyValueList>
																{Object.entries(call.headers).map(([key, value]) => (
																	<React.Fragment key={key}>
																		<dt>{key}:</dt>
																		<dd>
																			{key.toLowerCase().includes('authorization') ||
																			key.toLowerCase().includes('secret')
																				? '***REDACTED***'
																				: String(value)}
																		</dd>
																	</React.Fragment>
																))}
															</KeyValueList>
														</Section>
													)}
													{call.body && (
														<Section>
															<SectionTitle>
																<FiCode /> Request Body
															</SectionTitle>
															{typeof call.body === 'object' && call.body !== null ? (
																<JSONHighlighter data={call.body as JSONData} />
															) : (
																<CodeBlock>
																	{typeof call.body === 'string'
																		? call.body
																		: JSON.stringify(call.body, null, 2)}
																</CodeBlock>
															)}
														</Section>
													)}
													{call.response && (
														<>
															{call.response.headers &&
																Object.keys(call.response.headers).length > 0 && (
																	<Section>
																		<SectionTitle>
																			<FiFileText /> Response Headers
																		</SectionTitle>
																		<KeyValueList>
																			{Object.entries(call.response.headers).map(([key, value]) => (
																				<React.Fragment key={key}>
																					<dt>{key}:</dt>
																					<dd>{String(value)}</dd>
																				</React.Fragment>
																			))}
																		</KeyValueList>
																	</Section>
																)}
															<Section>
																<SectionTitle>
																	<FiCode /> Response Body
																</SectionTitle>
																{call.response.data ? (
																	<JSONHighlighter data={call.response.data as JSONData} />
																) : call.response.error ? (
																	<CodeBlock style={{ color: '#dc2626' }}>
																		{call.response.error}
																	</CodeBlock>
																) : (
																	<CodeBlock>{call.response.statusText}</CodeBlock>
																)}
															</Section>
														</>
													)}
												</ExpandableContent>
											</TableCell>
										</tr>
									)}
								</React.Fragment>
							);
						})}
					</TableBody>
				</Table>
			)}
		</TableContainer>
	);
};
