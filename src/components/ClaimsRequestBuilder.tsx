// src/components/ClaimsRequestBuilder.tsx
// Advanced OIDC Claims Request Builder - Request specific claims with essential/voluntary flags
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FiPlus, FiTrash2, FiInfo, FiCode, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export interface ClaimRequest {
	name: string;
	essential: boolean;
	value?: string;
	values?: string[];
}

export interface ClaimsRequestStructure {
	userinfo?: Record<string, ClaimRequest | null>;
	id_token?: Record<string, ClaimRequest | null>;
}

interface ClaimsRequestBuilderProps {
	value: ClaimsRequestStructure | null;
	onChange: (value: ClaimsRequestStructure | null) => void;
	collapsed?: boolean;
	onToggleCollapsed?: () => void;
}

const Container = styled.div`
	margin-bottom: 1.5rem;
`;

const Header = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
	}
`;

const HeaderLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HeaderIcon = styled.div`
	font-size: 1.25rem;
	color: #0284c7;
`;

const HeaderTitle = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #0c4a6e;
	text-align: left;
`;

const HeaderSubtitle = styled.div`
	font-size: 0.75rem;
	color: #0369a1;
	text-align: left;
	margin-top: 0.25rem;
`;

const Content = styled.div`
	border: 1px solid #e5e7eb;
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
	padding: 1.5rem;
	background: #ffffff;
`;

const TabContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	border-bottom: 2px solid #e5e7eb;
`;

const Tab = styled.button<{ $active: boolean }>`
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.$active ? '#0284c7' : '#6b7280'};
	background: ${props => props.$active ? '#f0f9ff' : 'transparent'};
	border: none;
	border-bottom: 2px solid ${props => props.$active ? '#0284c7' : 'transparent'};
	margin-bottom: -2px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		color: #0284c7;
		background: #f0f9ff;
	}
`;

const ClaimsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 1rem;
`;

const ClaimRow = styled.div`
	display: grid;
	grid-template-columns: 1fr auto auto auto;
	gap: 1rem;
	align-items: center;
	padding: 1rem;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
`;

const ClaimInput = styled.input`
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', monospace;

	&:focus {
		outline: none;
		border-color: #0284c7;
		box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
	}
`;

const EssentialToggle = styled.button<{ $essential: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	font-size: 0.75rem;
	font-weight: 500;
	color: ${props => props.$essential ? '#ffffff' : '#6b7280'};
	background: ${props => props.$essential ? '#dc2626' : '#ffffff'};
	border: 1px solid ${props => props.$essential ? '#dc2626' : '#d1d5db'};
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${props => props.$essential ? '#b91c1c' : '#f3f4f6'};
	}
`;

const DeleteButton = styled.button`
	padding: 0.5rem;
	color: #ef4444;
	background: transparent;
	border: none;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #fee2e2;
	}
`;

const AddButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.875rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #ffffff;
	background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);

	&:hover {
		background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
	}

	&:active {
		transform: translateY(0);
	}
`;

const AddClaimHelper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	margin-bottom: 0.75rem;
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	font-size: 0.8125rem;
	color: #0c4a6e;
	line-height: 1.5;
	
	svg {
		flex-shrink: 0;
		color: #0284c7;
	}
`;

const JSONPreview = styled.pre`
	padding: 1rem;
	background: #1e293b;
	color: #e2e8f0;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	line-height: 1.6;
	overflow-x: auto;
	margin-top: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	
	/* JSON Syntax Highlighting */
	.json-key {
		color: #7dd3fc; /* Light blue for keys */
	}
	
	.json-string {
		color: #86efac; /* Light green for string values */
	}
	
	.json-number {
		color: #fbbf24; /* Amber for numbers */
	}
	
	.json-boolean {
		color: #c084fc; /* Purple for booleans */
	}
	
	.json-null {
		color: #f87171; /* Red for null */
	}
	
	.json-punctuation {
		color: #94a3b8; /* Gray for punctuation */
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' }>`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${props => props.$variant === 'success' ? '#f0fdf4' : '#eff6ff'};
	border: 1px solid ${props => props.$variant === 'success' ? '#bbf7d0' : '#bfdbfe'};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: ${props => props.$variant === 'success' ? '#166534' : '#1e40af'};
	line-height: 1.5;
	margin-bottom: 1rem;
`;

const commonClaims = [
	{ name: 'email', description: 'Email address' },
	{ name: 'email_verified', description: 'Email verification status' },
	{ name: 'given_name', description: 'First name' },
	{ name: 'family_name', description: 'Last name' },
	{ name: 'name', description: 'Full name' },
	{ name: 'nickname', description: 'Nickname' },
	{ name: 'picture', description: 'Profile picture URL' },
	{ name: 'phone_number', description: 'Phone number' },
	{ name: 'phone_number_verified', description: 'Phone verification status' },
	{ name: 'address', description: 'Postal address' },
	{ name: 'birthdate', description: 'Date of birth' },
	{ name: 'gender', description: 'Gender' },
	{ name: 'locale', description: 'Locale preference' },
	{ name: 'zoneinfo', description: 'Timezone' },
	{ name: 'updated_at', description: 'Last profile update time' },
];

export const ClaimsRequestBuilder: React.FC<ClaimsRequestBuilderProps> = ({
	value,
	onChange,
	collapsed = false,
	onToggleCollapsed
}) => {
	const [activeTab, setActiveTab] = useState<'userinfo' | 'id_token'>('userinfo');
	const [showPreview, setShowPreview] = useState(false);

	const getClaims = useCallback((location: 'userinfo' | 'id_token'): Array<[string, ClaimRequest | null]> => {
		if (!value || !value[location]) return [];
		return Object.entries(value[location]!);
	}, [value]);

	const addClaim = useCallback((location: 'userinfo' | 'id_token') => {
		const newValue = value || {};
		const locationClaims = newValue[location] || {};
		
		onChange({
			...newValue,
			[location]: {
				...locationClaims,
				'': null // Empty string means voluntary with default behavior
			}
		});
	}, [value, onChange]);

	const updateClaim = useCallback((
		location: 'userinfo' | 'id_token',
		oldName: string,
		newName: string,
		essential: boolean
	) => {
		const newValue = value || {};
		const locationClaims = { ...(newValue[location] || {}) };
		
		delete locationClaims[oldName];
		locationClaims[newName] = essential ? { essential: true } : null;
		
		onChange({
			...newValue,
			[location]: locationClaims
		});
	}, [value, onChange]);

	const deleteClaim = useCallback((location: 'userinfo' | 'id_token', name: string) => {
		const newValue = value || {};
		const locationClaims = { ...(newValue[location] || {}) };
		
		delete locationClaims[name];
		
		// If no claims left, remove the location
		if (Object.keys(locationClaims).length === 0) {
			const { [location]: _, ...rest } = newValue;
			onChange(Object.keys(rest).length > 0 ? rest as ClaimsRequestStructure : null);
		} else {
			onChange({
				...newValue,
				[location]: locationClaims
			});
		}
	}, [value, onChange]);

	const jsonString = value ? JSON.stringify(value, null, 2) : '{}';
	
	// Syntax highlight JSON
	const highlightJSON = (json: string) => {
		return json
			.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
				let cls = 'json-string';
				if (/:$/.test(match)) {
					cls = 'json-key';
					match = match.slice(0, -1); // Remove the colon
					return `<span class="${cls}">${match}</span><span class="json-punctuation">:</span>`;
				}
				return `<span class="${cls}">${match}</span>`;
			})
			.replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
			.replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
			.replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>')
			.replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');
	};

	if (collapsed) {
		return (
			<Header onClick={onToggleCollapsed}>
				<HeaderLeft>
					<HeaderIcon><FiCode /></HeaderIcon>
					<div>
						<HeaderTitle>Advanced Claims Request Builder</HeaderTitle>
						<HeaderSubtitle>Request specific user claims (collapsed)</HeaderSubtitle>
					</div>
				</HeaderLeft>
				<HeaderIcon>▶</HeaderIcon>
			</Header>
		);
	}

	return (
		<Container>
			<Header onClick={onToggleCollapsed}>
				<HeaderLeft>
					<HeaderIcon><FiCode /></HeaderIcon>
					<div>
						<HeaderTitle>Advanced Claims Request Builder</HeaderTitle>
						<HeaderSubtitle>Request specific user claims with essential/voluntary flags</HeaderSubtitle>
					</div>
				</HeaderLeft>
				<HeaderIcon>▼</HeaderIcon>
			</Header>

			<Content>
				<InfoBox>
					<HeaderIcon><FiInfo /></HeaderIcon>
					<div>
						<strong>About Claims Requests:</strong> The <code>claims</code> parameter lets you request 
						specific user information beyond what's included by default in scopes. Mark claims as 
						<strong> essential</strong> (required) or leave them <strong>voluntary</strong> (optional).
						<div style={{ marginTop: '0.5rem' }}>
							Claims can be returned in the <strong>ID Token</strong> or fetched from the <strong>UserInfo endpoint</strong>.
						</div>
					</div>
				</InfoBox>

				<TabContainer>
					<Tab $active={activeTab === 'userinfo'} onClick={() => setActiveTab('userinfo')}>
						UserInfo Endpoint Claims
					</Tab>
					<Tab $active={activeTab === 'id_token'} onClick={() => setActiveTab('id_token')}>
						ID Token Claims
					</Tab>
				</TabContainer>

				<ClaimsList>
					{getClaims(activeTab).map(([name, claim], index) => {
						const isEssential = claim?.essential === true;
						return (
							<ClaimRow key={`${activeTab}-${index}`}>
								<ClaimInput
									type="text"
									value={name}
									onChange={(e) => updateClaim(activeTab, name, e.target.value, isEssential)}
									placeholder="claim_name"
								/>
								<EssentialToggle
									$essential={isEssential}
									onClick={() => updateClaim(activeTab, name, name, !isEssential)}
								>
									{isEssential ? <FiAlertCircle /> : <FiCheckCircle />}
									{isEssential ? 'Essential' : 'Voluntary'}
								</EssentialToggle>
								<DeleteButton onClick={() => deleteClaim(activeTab, name)}>
									<FiTrash2 />
								</DeleteButton>
							</ClaimRow>
						);
					})}
				</ClaimsList>

				<AddClaimHelper>
					<FiInfo />
					<div>
						<strong>Click the button below</strong> to add custom claims. Common OIDC claims: {commonClaims.slice(0, 5).map(c => c.name).join(', ')}, and more...
					</div>
				</AddClaimHelper>

				<AddButton onClick={() => addClaim(activeTab)}>
					<FiPlus /> Add Claim
				</AddButton>

				<InfoBox $variant="success" style={{ marginTop: '1rem' }}>
					<HeaderIcon><FiInfo /></HeaderIcon>
					<div>
						<strong>Common Claims:</strong> {commonClaims.map(c => c.name).join(', ')}
					</div>
				</InfoBox>

				{Object.keys(value || {}).length > 0 && (
					<>
						<AddButton 
							onClick={() => setShowPreview(!showPreview)}
							style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
						>
							<FiCode /> {showPreview ? 'Hide' : 'Show'} JSON Preview
						</AddButton>

						{showPreview && (
							<JSONPreview dangerouslySetInnerHTML={{ __html: highlightJSON(jsonString) }} />
						)}
					</>
				)}
			</Content>
		</Container>
	);
};

export default ClaimsRequestBuilder;

