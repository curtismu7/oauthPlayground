// src/services/userComparisonService.tsx
// Service for comparing user states before and after operations

import React from 'react';
import styled from 'styled-components';

export interface UserState {
	id?: string;
	username?: string;
	email?: string;
	enabled?: boolean;
	account?: {
		status?: string;
		canAuthenticate?: boolean;
	};
	lifecycle?: {
		status?: string;
	};
	passwordState?: {
		status?: string;
		lastChangedAt?: string;
		forceChange?: boolean;
	};
	mfaEnabled?: boolean;
	lastSignOn?: {
		at?: string;
	};
	[key: string]: any;
}

export interface ComparisonResult {
	field: string;
	label: string;
	before: any;
	after: any;
	changed: boolean;
}

const ComparisonContainer = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-top: 1.5rem;
`;

const ComparisonTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ComparisonTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	background: white;
	border-radius: 0.5rem;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.thead`
	background: #f3f4f6;
	border-bottom: 2px solid #e5e7eb;
`;

const TableHeaderCell = styled.th`
	padding: 0.75rem 1rem;
	text-align: left;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ $changed?: boolean }>`
	border-bottom: 1px solid #e5e7eb;
	background: ${props => props.$changed ? '#fef3c7' : 'white'};
	
	&:last-child {
		border-bottom: none;
	}
	
	&:hover {
		background: ${props => props.$changed ? '#fde68a' : '#f9fafb'};
	}
`;

const TableCell = styled.td`
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	color: #1f2937;
`;

const FieldLabel = styled.div`
	font-weight: 500;
	color: #374151;
`;

const ValueDisplay = styled.div<{ $changed?: boolean }>`
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.8125rem;
	color: ${props => props.$changed ? '#92400e' : '#6b7280'};
	background: ${props => props.$changed ? '#fef3c7' : '#f3f4f6'};
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	display: inline-block;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const ChangeBadge = styled.span`
	background: #fbbf24;
	color: #78350f;
	font-size: 0.75rem;
	font-weight: 600;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	margin-left: 0.5rem;
`;

const NoChangesMessage = styled.div`
	text-align: center;
	padding: 2rem;
	color: #6b7280;
	font-style: italic;
`;

const SummaryBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const SummaryIcon = styled.div`
	font-size: 1.5rem;
`;

const SummaryText = styled.div`
	flex: 1;
	
	strong {
		color: #1e40af;
		font-weight: 600;
	}
`;

/**
 * Compare two user states and return differences
 */
export function compareUserStates(before: UserState, after: UserState): ComparisonResult[] {
	const comparisons: ComparisonResult[] = [];
	
	// Define fields to compare with labels
	const fieldsToCompare = [
		{ field: 'username', label: 'Username' },
		{ field: 'email', label: 'Email' },
		{ field: 'enabled', label: 'Enabled' },
		{ field: 'account.status', label: 'Account Status' },
		{ field: 'account.canAuthenticate', label: 'Can Authenticate' },
		{ field: 'lifecycle.status', label: 'Lifecycle Status' },
		{ field: 'passwordState.status', label: 'Password Status' },
		{ field: 'passwordState.lastChangedAt', label: 'Password Last Changed' },
		{ field: 'passwordState.forceChange', label: 'Force Password Change' },
		{ field: 'mfaEnabled', label: 'MFA Enabled' },
		{ field: 'lastSignOn.at', label: 'Last Sign On' },
	];
	
	fieldsToCompare.forEach(({ field, label }) => {
		const beforeValue = getNestedValue(before, field);
		const afterValue = getNestedValue(after, field);
		
		if (beforeValue !== undefined || afterValue !== undefined) {
			comparisons.push({
				field,
				label,
				before: beforeValue,
				after: afterValue,
				changed: !isEqual(beforeValue, afterValue),
			});
		}
	});
	
	return comparisons;
}

/**
 * Get nested object value by path (e.g., 'account.status')
 */
function getNestedValue(obj: any, path: string): any {
	return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Deep equality check
 */
function isEqual(a: any, b: any): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (typeof a !== typeof b) return false;
	
	if (typeof a === 'object') {
		return JSON.stringify(a) === JSON.stringify(b);
	}
	
	return false;
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
	if (value === undefined) return 'N/A';
	if (value === null) return 'null';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

/**
 * Check if a field is a critical password status change
 */
function isCriticalPasswordChange(field: string, value: any): boolean {
	return field === 'passwordState.status' && value === 'MUST_CHANGE_PASSWORD';
}

const DiffContainer = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 16px;
	box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
	margin-top: 1.5rem;
	overflow: hidden;
`;

const DiffHeader = styled.div<{ $isCollapsed: boolean }>`
	padding: 18px 20px;
	border-bottom: ${props => props.$isCollapsed ? 'none' : '1px solid #eef2f7'};
	display: flex;
	justify-content: space-between;
	align-items: center;
	cursor: pointer;
	user-select: none;
	transition: background 0.2s ease;
	
	&:hover {
		background: #f9fafb;
	}
`;

const DiffTitle = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const DiffBadge = styled.span<{ $type: 'changed' | 'ok' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border-radius: 999px;
	font-size: 12px;
	padding: 5px 9px;
	border: 1px solid #e5e7eb;
	color: #6b7280;
	font-weight: 500;
`;

const DiffDot = styled.span<{ $type: 'changed' | 'ok' }>`
	width: 8px;
	height: 8px;
	border-radius: 999px;
	background: ${props => props.$type === 'changed' ? '#f59e0b' : '#22c55e'};
`;

const DiffBody = styled.div`
	padding: 18px 20px;
`;

const DiffGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 16px;
	
	@media (min-width: 900px) {
		grid-template-columns: 1fr 1fr;
	}
`;

const DiffCard = styled.div<{ $side: 'before' | 'after' }>`
	background: ${props => props.$side === 'before' ? '#f9fafb' : '#ffffff'};
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 16px;
`;

const DiffCardTitle = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 12px;
`;

const DiffRow = styled.div<{ $changed?: boolean }>`
	display: grid;
	grid-template-columns: 120px 1fr;
	gap: 12px;
	align-items: center;
	margin-bottom: 10px;
	padding: 8px;
	border-radius: 8px;
	background: ${props => props.$changed ? '#e6ffed' : 'transparent'};
	border: ${props => props.$changed ? '1px solid #22c55e' : '1px solid transparent'};
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const DiffLabel = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
	text-transform: capitalize;
`;

const DiffValue = styled.div<{ $critical?: boolean }>`
	font-size: 0.875rem;
	color: ${props => props.$critical ? '#dc2626' : '#1f2937'};
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-weight: ${props => props.$critical ? '600' : 'normal'};
	word-break: break-word;
	padding: 6px 10px;
	background: ${props => props.$critical ? '#fef2f2' : '#ffffff'};
	border: 1px solid ${props => props.$critical ? '#fca5a5' : '#e5e7eb'};
	border-radius: 8px;
`;

const DiffTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
	margin-top: 16px;
`;

const DiffTableHead = styled.thead`
	th {
		padding: 10px 12px;
		border-bottom: 1px solid #eef2f7;
		text-align: left;
		font-size: 12px;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: #6b7280;
		font-weight: 600;
	}
`;

const DiffTableBody = styled.tbody``;

const DiffTableRow = styled.tr<{ $changed?: boolean }>`
	background: ${props => props.$changed ? '#e6ffed' : 'transparent'};
	
	td {
		padding: 10px 12px;
		border-bottom: 1px solid #eef2f7;
		text-align: left;
	}
`;

const ChevronIcon = styled.span<{ $isCollapsed: boolean }>`
	display: inline-flex;
	transition: transform 0.2s ease;
	transform: ${props => props.$isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
`;

const CriticalChangeCallout = styled.div`
	background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
	border: 2px solid #fca5a5;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 16px;
	display: flex;
	align-items: start;
	gap: 12px;
`;

const CalloutIcon = styled.div`
	font-size: 1.5rem;
	flex-shrink: 0;
`;

const CalloutContent = styled.div`
	flex: 1;
	
	strong {
		color: #dc2626;
		font-weight: 600;
		display: block;
		margin-bottom: 4px;
	}
	
	p {
		margin: 0;
		color: #991b1b;
		font-size: 0.875rem;
		line-height: 1.5;
	}
`;

/**
 * Render ONLY changed fields in a clean, highlighted format with collapsible design
 */
export const ChangedFieldsDisplay: React.FC<{
	before: UserState;
	after: UserState;
	operationName?: string;
}> = ({ before, after, operationName }) => {
	const [isCollapsed, setIsCollapsed] = React.useState(false);
	const comparisons = compareUserStates(before, after);
	const changedFields = comparisons.filter(c => c.changed);
	
	if (changedFields.length === 0) {
		return null; // Don't show anything if no changes
	}
	
	// Check if password status changed to MUST_CHANGE_PASSWORD
	const passwordStatusChange = changedFields.find(
		f => f.field === 'passwordState.status' && f.after === 'MUST_CHANGE_PASSWORD'
	);
	
	return (
		<DiffContainer>
			<DiffHeader $isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}>
				<DiffTitle>
					<ChevronIcon $isCollapsed={isCollapsed}>▼</ChevronIcon>
					Before ↔ After {operationName && `— ${operationName}`}
				</DiffTitle>
				<DiffBadge $type="changed">
					<DiffDot $type="changed" />
					{changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed
				</DiffBadge>
			</DiffHeader>
			
			{!isCollapsed && (
				<DiffBody>
					{passwordStatusChange && (
						<CriticalChangeCallout>
							<CalloutIcon>🔒</CalloutIcon>
							<CalloutContent>
								<strong>Password Status Changed to MUST_CHANGE_PASSWORD</strong>
								<p>
									The user's password status has been changed from "{formatValue(passwordStatusChange.before)}" 
									to "MUST_CHANGE_PASSWORD". The user will be required to change their password on their next sign-in 
									and cannot access their account until they do so.
								</p>
							</CalloutContent>
						</CriticalChangeCallout>
					)}
					<DiffGrid>
						{/* Before Card */}
						<DiffCard $side="before">
							<DiffCardTitle>Before (existing)</DiffCardTitle>
							{changedFields.map((comparison, index) => (
								<DiffRow key={`before-${index}`} $changed={true}>
									<DiffLabel>{comparison.label}</DiffLabel>
									<DiffValue>{formatValue(comparison.before)}</DiffValue>
								</DiffRow>
							))}
						</DiffCard>
						
						{/* After Card */}
						<DiffCard $side="after">
							<DiffCardTitle>After (updated)</DiffCardTitle>
							{changedFields.map((comparison, index) => {
								const isCritical = isCriticalPasswordChange(comparison.field, comparison.after);
								return (
									<DiffRow key={`after-${index}`} $changed={true}>
										<DiffLabel>{comparison.label}</DiffLabel>
										<DiffValue $critical={isCritical}>
											{formatValue(comparison.after)}
											{isCritical && ' 🔒'}
										</DiffValue>
									</DiffRow>
								);
							})}
						</DiffCard>
					</DiffGrid>
					
					{/* Diff Summary Table */}
					<DiffTable>
						<DiffTableHead>
							<tr>
								<th>Field</th>
								<th>Before</th>
								<th>After</th>
							</tr>
						</DiffTableHead>
						<DiffTableBody>
							{changedFields.map((comparison, index) => (
								<DiffTableRow key={index} $changed={true}>
									<td style={{ minWidth: '120px', textTransform: 'capitalize' }}>
										{comparison.label}
									</td>
									<td>{formatValue(comparison.before)}</td>
									<td>{formatValue(comparison.after)}</td>
								</DiffTableRow>
							))}
						</DiffTableBody>
					</DiffTable>
				</DiffBody>
			)}
		</DiffContainer>
	);
};

/**
 * Render full comparison component - uses the new modern design from HTML mockup
 */
export const UserComparisonDisplay: React.FC<{
	before: UserState;
	after: UserState;
	title?: string;
	operationName?: string;
}> = ({ before, after, title, operationName }) => {
	// Just render the new ChangedFieldsDisplay component
	return <ChangedFieldsDisplay before={before} after={after} operationName={operationName} />;
};

/**
 * Export service for use in other components
 */
export const userComparisonService = {
	compare: compareUserStates,
	formatValue,
	UserComparisonDisplay,
	ChangedFieldsDisplay,
};
