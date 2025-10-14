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

const CommonClaimsContainer = styled.div`
	margin-bottom: 1.5rem;
	padding: 1rem;
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 2px solid #fbbf24;
	border-radius: 0.75rem;
`;

const CommonClaimsTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #92400e;
	margin-bottom: 0.75rem;
`;

const CommonClaimsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 0.5rem;
`;

const DraggableClaim = styled.div<{ $isDragging?: boolean }>`
	display: flex;
	flex-direction: column;
	padding: 0.75rem;
	background: white;
	border: 2px solid ${props => props.$isDragging ? '#3b82f6' : '#e5e7eb'};
	border-radius: 0.5rem;
	cursor: grab;
	transition: all 0.2s;
	opacity: ${props => props.$isDragging ? 0.5 : 1};

	&:hover {
		border-color: #3b82f6;
		background: #f0f9ff;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	}

	&:active {
		cursor: grabbing;
	}
`;

const ClaimName = styled.div`
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.8125rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
`;

const ClaimDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
`;

const ClaimCategory = styled.div`
	font-size: 0.6875rem;
	color: #9ca3af;
	text-transform: uppercase;
	letter-spacing: 0.025em;
	margin-top: 0.25rem;
	font-weight: 500;
`;

// Common OIDC/PingOne claims (alphabetically sorted)
const commonClaims = [
	{ name: 'address', description: 'Postal address (JSON object)', category: 'Address' },
	{ name: 'birthdate', description: 'Date of birth (YYYY-MM-DD)', category: 'Profile' },
	{ name: 'email', description: 'Email address', category: 'Contact' },
	{ name: 'email_verified', description: 'Email verification status', category: 'Contact' },
	{ name: 'family_name', description: 'Last name', category: 'Profile' },
	{ name: 'gender', description: 'Gender', category: 'Profile' },
	{ name: 'given_name', description: 'First name', category: 'Profile' },
	{ name: 'locale', description: 'Locale preference (e.g. en-US)', category: 'Locale' },
	{ name: 'middle_name', description: 'Middle name', category: 'Profile' },
	{ name: 'name', description: 'Full name', category: 'Profile' },
	{ name: 'nickname', description: 'Nickname', category: 'Profile' },
	{ name: 'phone_number', description: 'Phone number', category: 'Contact' },
	{ name: 'phone_number_verified', description: 'Phone verification status', category: 'Contact' },
	{ name: 'picture', description: 'Profile picture URL', category: 'Profile' },
	{ name: 'preferred_username', description: 'Preferred username', category: 'Profile' },
	{ name: 'profile', description: 'Profile page URL', category: 'Profile' },
	{ name: 'sub', description: 'Subject identifier (User ID)', category: 'Identity' },
	{ name: 'updated_at', description: 'Last profile update timestamp', category: 'Metadata' },
	{ name: 'website', description: 'Website URL', category: 'Profile' },
	{ name: 'zoneinfo', description: 'Timezone (e.g. America/New_York)', category: 'Locale' },
];

export const ClaimsRequestBuilder: React.FC<ClaimsRequestBuilderProps> = ({
	value,
	onChange,
	collapsed = false,
	onToggleCollapsed
}) => {
	const [activeTab, setActiveTab] = useState<'userinfo' | 'id_token'>('userinfo');
	const [showPreview, setShowPreview] = useState(false);
	const [draggedClaim, setDraggedClaim] = useState<string | null>(null);

	// Ensure at least one empty claim field exists by default
	React.useEffect(() => {
		if (!value || Object.keys(value).length === 0) {
			// Add one empty claim to the active tab
			onChange({
				[activeTab]: {
					'': null
				}
			});
		} else if (value && !value[activeTab]) {
			// If switching to a tab with no claims, add one empty claim
			onChange({
				...value,
				[activeTab]: {
					'': null
				}
			});
		}
	}, [activeTab]); // Run when tab changes

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

	// Drag and drop handlers
	const handleDragStart = useCallback((claimName: string) => (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('text/plain', claimName);
		setDraggedClaim(claimName);
	}, []);

	const handleDragEnd = useCallback(() => {
		setDraggedClaim(null);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}, []);

	const handleDrop = useCallback((location: 'userinfo' | 'id_token', currentName: string) => (e: React.DragEvent) => {
		e.preventDefault();
		const claimName = e.dataTransfer.getData('text/plain');
		if (claimName && claimName !== currentName) {
			// If dropping on an empty field, replace it
			if (currentName === '') {
				updateClaim(location, currentName, claimName, false);
			}
		}
		setDraggedClaim(null);
	}, [updateClaim]);

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
						specific user information beyond what's included by default in scopes. 
						<div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
							<strong>Understanding Claim Values:</strong>
							<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
								<li><code>null</code> = <strong>Voluntary</strong> (optional) - Authorization server will try to return this claim if available, but won't fail if it's missing</li>
								<li><code>{`{"essential": true}`}</code> = <strong>Essential</strong> (required) - Authorization server MUST return this claim or the request will fail</li>
							</ul>
						</div>
						<div style={{ marginTop: '0.75rem' }}>
							<strong>💡 Example JSON:</strong>
							<pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', overflowX: 'auto' }}>{`{
  "id_token": {
    "email": null,           ← Voluntary
    "name": {"essential": true}  ← Required
  }
}`}</pre>
						</div>
						<div style={{ marginTop: '0.75rem' }}>
							Claims can be returned in the <strong>ID Token</strong> (immediately with authentication) or fetched from the <strong>UserInfo endpoint</strong> (separate API call).
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
									onDragOver={handleDragOver}
									onDrop={handleDrop(activeTab, name)}
									placeholder="Type claim name (e.g. custom_attribute) or drag from below"
									title="Type a custom claim name (like PingOne custom attributes) or drag from the Common Claims list"
								/>
								<EssentialToggle
									$essential={isEssential}
									onClick={() => updateClaim(activeTab, name, name, !isEssential)}
									title={isEssential 
										? 'Essential (required) - JSON: {"essential": true} - Auth server MUST return this claim or fail'
										: 'Voluntary (optional) - JSON: null - Auth server will try to return this claim but won\'t fail if missing'}
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
						<strong>Type custom claim names</strong> (like PingOne custom attributes) in the input field above, or <strong>drag claims from below</strong>. 
						Click "Add Claim" to add additional fields.
					</div>
				</AddClaimHelper>

				{/* Common Claims - Draggable Grid */}
				<CommonClaimsContainer>
					<CommonClaimsTitle>
						<FiInfo />
						Common OIDC/PingOne Claims (Drag to Use)
					</CommonClaimsTitle>
					<CommonClaimsGrid>
						{commonClaims.map((claim) => (
							<DraggableClaim
								key={claim.name}
								draggable="true"
								onDragStart={handleDragStart(claim.name)}
								onDragEnd={handleDragEnd}
								$isDragging={draggedClaim === claim.name}
								title={`Drag "${claim.name}" to a claim input field above`}
							>
								<ClaimName>{claim.name}</ClaimName>
								<ClaimDescription>{claim.description}</ClaimDescription>
								<ClaimCategory>{claim.category}</ClaimCategory>
							</DraggableClaim>
						))}
					</CommonClaimsGrid>
				</CommonClaimsContainer>

				<AddButton onClick={() => addClaim(activeTab)}>
					<FiPlus /> Add Another Claim
				</AddButton>

				<div style={{ 
					marginTop: '1.5rem', 
					padding: '1rem', 
					background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
					border: '2px solid #fbbf24',
					borderRadius: '0.75rem',
					fontSize: '0.85rem'
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
						<FiInfo style={{ color: '#92400e', fontSize: '1.25rem' }} />
						<strong style={{ color: '#92400e' }}>JSON Format Guide:</strong>
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
						<div style={{ background: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fbbf24' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
								<FiCheckCircle style={{ color: '#059669' }} />
								<strong>Voluntary (Optional)</strong>
							</div>
							<code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'block' }}>
								"email": null
							</code>
							<div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
								Server tries to return this claim but won't fail if missing
							</div>
						</div>
						<div style={{ background: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fbbf24' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
								<FiAlertCircle style={{ color: '#dc2626' }} />
								<strong>Essential (Required)</strong>
							</div>
							<code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.75rem' }}>
								{`"email": {"essential": true}`}
							</code>
							<div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
								Server MUST return this claim or request fails
							</div>
						</div>
					</div>
				</div>

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

