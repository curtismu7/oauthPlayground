/**
 * @file DatabaseViewer.tsx
 * @description Database viewer component for displaying IndexedDB and SQLite data
 * @version 1.0.0
 * @since 2026-03-10
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
	DatabaseViewerService, 
	type DatabaseSchema, 
	type DatabaseTable, 
	type DatabaseQueryResult,
	type DatabaseViewerOptions 
} from '../services/databaseViewerService';
import { logger } from '../utils/logger';

const MODULE_TAG = '[🗄️ DB-VIEWER]';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	background: #ffffff;
	border-radius: 8px;
	overflow: hidden;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	background: #f8fafc;
	border-bottom: 1px solid #e2e8f0;
	gap: 12px;
`;

const DatabaseSelector = styled.select`
	padding: 6px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	font-size: 13px;
	color: #374151;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TableSelector = styled.select`
	padding: 6px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	font-size: 13px;
	color: #374151;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Controls = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const SearchInput = styled.input`
	padding: 6px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	font-size: 13px;
	color: #374151;
	min-width: 200px;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const ExportButton = styled.button`
	padding: 6px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	font-size: 13px;
	color: #374151;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const RefreshButton = styled.button`
	padding: 6px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	font-size: 13px;
	color: #374151;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Content = styled.div`
	flex: 1;
	overflow: auto;
	padding: 16px;
`;

const TableInfo = styled.div`
	margin-bottom: 16px;
	padding: 12px;
	background: #f8fafc;
	border-radius: 6px;
	border: 1px solid #e2e8f0;
`;

const TableGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
	margin-bottom: 16px;
`;

const TableCard = styled.div`
	padding: 16px;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.15s ease-in-out;

	&:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	&.selected {
		border-color: #3b82f6;
		background: #eff6ff;
	}
`;

const TableName = styled.h3`
	margin: 0 0 8px 0;
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
`;

const TableStats = styled.div`
	display: flex;
	gap: 16px;
	font-size: 13px;
	color: #6b7280;
`;

const Stat = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
`;

const DataTable = styled.div`
	overflow: auto;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #ffffff;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
`;

const TableHeader = styled.thead`
	background: #f8fafc;
	border-bottom: 1px solid #e2e8f0;
`;

const TableRow = styled.tr`
	&:nth-child(even) {
		background: #f9fafb;
	}

	&:hover {
		background: #eff6ff;
	}
`;

const TableCell = styled.td`
	padding: 8px 12px;
	border-bottom: 1px solid #f3f4f6;
	color: #374151;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 200px;
`;

const HeaderCell = styled.th`
	padding: 8px 12px;
	text-align: left;
	font-weight: 600;
	color: #374151;
	border-bottom: 1px solid #e2e8f0;
	white-space: nowrap;
`;

const Loading = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 200px;
	color: #6b7280;
	font-size: 14px;
`;

const Error = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 200px;
	color: #ef4444;
	font-size: 14px;
	text-align: center;
	padding: 0 16px;
`;

const Pagination = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	background: #f8fafc;
	border-top: 1px solid #e2e8f0;
	font-size: 13px;
`;

const PaginationControls = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const PaginationButton = styled.button<{ disabled?: boolean }>`
	padding: 4px 8px;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	background: ${props => props.disabled ? '#f9fafb' : '#ffffff'};
	color: ${props => props.disabled ? '#9ca3af' : '#374151'};
	cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
	font-size: 12px;

	&:hover:not(:disabled) {
		background: #f9fafb;
	}
`;

// ============================================================================
// INTERFACES
// ============================================================================

interface DatabaseViewerProps {
	className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DatabaseViewer: React.FC<DatabaseViewerProps> = ({ className = '' }) => {
	const [databases, setDatabases] = useState<DatabaseSchema[]>([]);
	const [selectedDatabase, setSelectedDatabase] = useState<DatabaseSchema | null>(null);
	const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
	const [queryResult, setQueryResult] = useState<DatabaseQueryResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(0);
	const [pageSize] = useState(50);

	// Load available databases on mount
	useEffect(() => {
		loadDatabases();
	}, []);

	// Load data when database or table selection changes
	useEffect(() => {
		if (selectedDatabase && selectedTable) {
			loadTableData();
		}
	}, [selectedDatabase, selectedTable, currentPage, searchTerm]);

	const loadDatabases = async () => {
		try {
			setLoading(true);
			setError(null);
			const dbSchemas = await DatabaseViewerService.getAvailableDatabases();
			setDatabases(dbSchemas);
			
			// Auto-select first database
			if (dbSchemas.length > 0 && !selectedDatabase) {
				setSelectedDatabase(dbSchemas[0]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load databases');
			logger.error(`${MODULE_TAG} Failed to load databases:`, err);
		} finally {
			setLoading(false);
		}
	};

	const loadTableData = async () => {
		if (!selectedDatabase || !selectedTable) return;

		try {
			setLoading(true);
			setError(null);

			const options: DatabaseViewerOptions = {
				limit: pageSize,
				offset: currentPage * pageSize,
				search: searchTerm || undefined,
			};

			const result = await DatabaseViewerService.queryTable(
				selectedDatabase.type,
				selectedTable.name,
				options
			);

			setQueryResult(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load table data');
			logger.error(`${MODULE_TAG} Failed to load table data:`, err);
		} finally {
			setLoading(false);
		}
	};

	const handleDatabaseChange = (dbName: string) => {
		const db = databases.find(d => d.name === dbName);
		if (db) {
			setSelectedDatabase(db);
			setSelectedTable(null);
			setQueryResult(null);
			setCurrentPage(0);
		}
	};

	const handleTableSelect = (table: DatabaseTable) => {
		setSelectedTable(table);
		setQueryResult(null);
		setCurrentPage(0);
	};

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setCurrentPage(0);
	};

	const handleExport = async (format: 'json' | 'csv') => {
		if (!selectedDatabase || !selectedTable) return;

		try {
			const data = await DatabaseViewerService.exportTable(
				selectedDatabase.type,
				selectedTable.name,
				format
			);

			const blob = new Blob([data], { 
				type: format === 'json' ? 'application/json' : 'text/csv' 
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${selectedDatabase.name}_${selectedTable.name}.${format}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to export data');
			logger.error(`${MODULE_TAG} Failed to export data:`, err);
		}
	};

	const handleRefresh = () => {
		if (selectedDatabase && selectedTable) {
			loadTableData();
		} else {
			loadDatabases();
		}
	};

	const renderTableGrid = () => {
		if (!selectedDatabase) return null;

		return (
			<TableGrid>
				{selectedDatabase.tables.map(table => (
					<TableCard
						key={table.name}
						onClick={() => handleTableSelect(table)}
						className={selectedTable?.name === table.name ? 'selected' : ''}
					>
						<TableName>{table.name}</TableName>
						<TableStats>
							<Stat>📊 {table.rowCount} rows</Stat>
							<Stat>📋 {table.columns.length} columns</Stat>
						</TableStats>
					</TableCard>
				))}
			</TableGrid>
		);
	};

	const renderDataTable = () => {
		if (!queryResult) return null;

		const totalPages = Math.ceil(queryResult.totalRows / pageSize);
		const startIndex = currentPage * pageSize;
		const endIndex = Math.min(startIndex + pageSize, queryResult.totalRows);

		return (
			<>
				<DataTable>
					<Table>
						<TableHeader>
							<tr>
								{queryResult.columns.map(column => (
									<HeaderCell key={column.name}>
										{column.name}
										{column.primaryKey && ' 🔑'}
									</HeaderCell>
								))}
							</tr>
						</TableHeader>
						<tbody>
							{queryResult.data.map((row, index) => (
								<TableRow key={index}>
									{queryResult.columns.map(column => (
										<TableCell key={column.name} title={String(row[column.name] || '')}>
											{formatCellValue(row[column.name])}
										</TableCell>
									))}
								</TableRow>
							))}
						</tbody>
					</Table>
				</DataTable>
				
				<Pagination>
					<div>
						Showing {startIndex + 1}-{endIndex} of {queryResult.totalRows} rows
					</div>
					<PaginationControls>
						<PaginationButton
							disabled={currentPage === 0}
							onClick={() => setCurrentPage(currentPage - 1)}
						>
							← Previous
						</PaginationButton>
						<span>
							Page {currentPage + 1} of {totalPages}
						</span>
						<PaginationButton
							disabled={currentPage >= totalPages - 1}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							Next →
						</PaginationButton>
					</PaginationControls>
				</Pagination>
			</>
		);
	};

	const formatCellValue = (value: unknown): string => {
		if (value === null || value === undefined) return 'NULL';
		if (typeof value === 'string') return value;
		if (typeof value === 'object') {
			try {
				return JSON.stringify(value);
			} catch {
				return '[Object]';
			}
		}
		return String(value);
	};

	return (
		<Container className={className}>
			<Header>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					<DatabaseSelector
						value={selectedDatabase?.name || ''}
						onChange={(e) => handleDatabaseChange(e.target.value)}
					>
						<option value="">Select Database</option>
						{databases.map(db => (
							<option key={db.name} value={db.name}>
								{db.name} ({db.type})
							</option>
						))}
					</DatabaseSelector>

					{selectedDatabase && (
						<TableSelector
							value={selectedTable?.name || ''}
							onChange={(e) => {
								const table = selectedDatabase.tables.find(t => t.name === e.target.value);
								if (table) handleTableSelect(table);
							}}
						>
							<option value="">Select Table</option>
							{selectedDatabase.tables.map(table => (
								<option key={table.name} value={table.name}>
									{table.name} ({table.rowCount} rows)
								</option>
							))}
						</TableSelector>
					)}
				</div>

				<Controls>
					<SearchInput
						placeholder="Search data..."
						value={searchTerm}
						onChange={(e) => handleSearch(e.target.value)}
					/>
					
					<ExportButton
						disabled={!selectedDatabase || !selectedTable}
						onClick={() => handleExport('json')}
					>
						📄 Export JSON
					</ExportButton>
					
					<ExportButton
						disabled={!selectedDatabase || !selectedTable}
						onClick={() => handleExport('csv')}
					>
						📊 Export CSV
					</ExportButton>
					
					<RefreshButton onClick={handleRefresh} disabled={loading}>
						🔄 Refresh
					</RefreshButton>
				</Controls>
			</Header>

			<Content>
				{loading && <Loading>Loading database...</Loading>}
				
				{error && <Error>{error}</Error>}
				
				{!loading && !error && !selectedTable && renderTableGrid()}
				
				{!loading && !error && selectedTable && (
					<>
						<TableInfo>
							<h3 style={{ margin: '0 0 8px 0' }}>
								{selectedTable.name}
							</h3>
							<div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
								<span>📊 {selectedTable.rowCount} total rows</span>
								<span>📋 {selectedTable.columns.length} columns</span>
								{queryResult && (
									<span>⏱️ Query: {queryResult.executionTime}ms</span>
								)}
							</div>
						</TableInfo>
						
						{renderDataTable()}
					</>
				)}
			</Content>
		</Container>
	);
};

export default DatabaseViewer;
