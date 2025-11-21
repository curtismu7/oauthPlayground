/**
 * @file ResourcesAPIFlowV8.tsx
 * @module v8/flows
 * @description Educational flow for PingOne Resources API
 * @version 8.0.0
 * @since 2024-11-20
 * 
 * Teaches developers how to use the PingOne Resources API to manage
 * OAuth 2.0 resources, scopes, and resource attributes.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { FiBook, FiCode, FiExternalLink, FiInfo, FiKey, FiLayers, FiShield } from 'react-icons/fi';

const MODULE_TAG = '[📚 RESOURCES-API-V8]';

// Styled Components
const Container = styled.div`
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 2rem;
`;

const ContentWrapper = styled.div`
	max-width: 1200px;
	margin: 0 auto;
`;

const Header = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
	margin: 0 0 0.5rem 0;
	color: #1f2937;
	font-size: 2rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #6b7280;
	font-size: 1.125rem;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const Card = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}
`;

const CardIcon = styled.div<{ $color: string }>`
	width: 3rem;
	height: 3rem;
	border-radius: 0.75rem;
	background: ${props => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
	margin: 0 0 0.5rem 0;
	color: #1f2937;
	font-size: 1.25rem;
`;

const CardDescription = styled.p`
	margin: 0;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const Modal = styled.div<{ $isOpen: boolean }>`
	display: ${props => props.$isOpen ? 'flex' : 'none'};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	max-width: 800px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid #e5e7eb;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h2`
	margin: 0;
	color: #1f2937;
	font-size: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const ModalBody = styled.div`
	padding: 1.5rem;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	color: #6b7280;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.375rem;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: #1f2937;
	}
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-size: 0.875rem;
	margin: 1rem 0;
`;

const InfoBox = styled.div<{ $variant: 'info' | 'success' | 'warning' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	display: flex;
	gap: 0.75rem;

	${props => {
		switch (props.$variant) {
			case 'success':
				return `
					background: #f0fdf4;
					border: 1px solid #86efac;
					color: #166534;
				`;
			case 'warning':
				return `
					background: #fef3c7;
					border: 1px solid #fde68a;
					color: #92400e;
				`;
			default:
				return `
					background: #eff6ff;
					border: 1px solid #bfdbfe;
					color: #1e40af;
				`;
		}
	}}
`;

const StepList = styled.ol`
	margin: 1rem 0;
	padding-left: 1.5rem;
	
	li {
		margin-bottom: 0.75rem;
		line-height: 1.6;
	}
`;

const ExternalLink = styled.a`
	color: #3b82f6;
	text-decoration: none;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	
	&:hover {
		text-decoration: underline;
	}
`;

interface ModalData {
	title: string;
	icon: React.ReactNode;
	content: React.ReactNode;
}

export const ResourcesAPIFlowV8: React.FC = () => {
	const [activeModal, setActiveModal] = useState<string | null>(null);

	console.log(`${MODULE_TAG} Initializing Resources API educational flow`);

	const modals: Record<string, ModalData> = {
		overview: {
			title: 'Resources API Overview',
			icon: <FiBook size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<strong>What are Resources?</strong>
							<p style={{ margin: '0.5rem 0 0 0' }}>
								Resources in PingOne represent protected APIs or services that require OAuth 2.0 authorization.
								They define what scopes are available and what access tokens can do.
							</p>
						</div>
					</InfoBox>

					<h3>Real-World Analogy: Building Access Control</h3>
					<p>Think of resources like buildings in a corporate campus:</p>
					<StepList>
						<li><strong>Resource (Building):</strong> "Engineering Building", "HR Building", "Finance Building"</li>
						<li><strong>Scopes (Room Access):</strong> "enter:lobby", "enter:offices", "enter:server-room"</li>
						<li><strong>Audience (Building ID):</strong> The unique identifier on your access badge</li>
						<li><strong>Attributes (Badge Info):</strong> Your name, department, clearance level printed on badge</li>
					</StepList>

					<h3>Concrete Example: E-Commerce Platform</h3>
					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Scenario:</strong> You're building an e-commerce platform with multiple APIs
						</div>
					</InfoBox>

					<CodeBlock>{`// Resource 1: Product Catalog API
Name: "Product Catalog API"
Audience: "https://api.acme-shop.com/products"
Scopes:
  - read:products (Browse product listings)
  - write:products (Add/edit products - admin only)
  - manage:inventory (Update stock levels)

// Resource 2: Order Management API  
Name: "Order Management API"
Audience: "https://api.acme-shop.com/orders"
Scopes:
  - read:orders (View order history)
  - create:orders (Place new orders)
  - cancel:orders (Cancel pending orders)
  - refund:orders (Process refunds - admin only)

// Resource 3: Customer Profile API
Name: "Customer Profile API"
Audience: "https://api.acme-shop.com/customers"
Scopes:
  - read:profile (View own profile)
  - update:profile (Edit own profile)
  - read:all-customers (Admin: view all customers)
  - update:payment-methods (Manage payment cards)`}</CodeBlock>

					<h3>How It Works in Practice</h3>
					<CodeBlock>{`// Mobile App requests product browsing + ordering
Requested Scopes: "read:products create:orders read:profile"

// Admin Dashboard requests full access
Requested Scopes: "write:products manage:inventory refund:orders read:all-customers"

// Customer Service App requests order management
Requested Scopes: "read:orders cancel:orders read:all-customers"

// Each app gets a token with ONLY the permissions it needs!`}</CodeBlock>

					<h3>Key Concepts</h3>
					<StepList>
						<li><strong>Resource:</strong> A protected API or service (e.g., "Product Catalog API", "Order Management API")</li>
						<li><strong>Scope:</strong> A specific permission within a resource (e.g., "read:products", "create:orders")</li>
						<li><strong>Audience:</strong> The identifier for the resource in access tokens (aud claim)</li>
						<li><strong>Resource Attributes:</strong> Custom claims to include in access tokens (e.g., customer tier, region)</li>
					</StepList>

					<h3>API Endpoints</h3>
					<CodeBlock>{`GET /environments/{environmentId}/resources
POST /environments/{environmentId}/resources
GET /environments/{environmentId}/resources/{resourceId}
PUT /environments/{environmentId}/resources/{resourceId}
DELETE /environments/{environmentId}/resources/{resourceId}`}</CodeBlock>

					<ExternalLink 
						href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#resources" 
						target="_blank"
						rel="noopener noreferrer"
					>
						View Full API Documentation <FiExternalLink size={14} />
					</ExternalLink>
				</>
			),
		},
		createResource: {
			title: 'Create a Resource',
			icon: <FiLayers size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							Creating a resource defines a protected API that applications can request access to.
						</div>
					</InfoBox>

					<h3>Real-World Example: Healthcare Portal</h3>
					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Scenario:</strong> You're building a healthcare system with separate APIs for different functions.
						</div>
					</InfoBox>

					<h4>Resource 1: Patient Records API</h4>
					<CodeBlock>{`POST https://api.pingone.com/v1/environments/{envId}/resources
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "Patient Records API",
  "description": "Access to patient medical records and history",
  "type": "CUSTOM",
  "audience": "https://api.healthsystem.com/patient-records",
  "accessTokenValiditySeconds": 1800  // 30 minutes - sensitive data
}`}</CodeBlock>

					<h4>Resource 2: Appointment Scheduling API</h4>
					<CodeBlock>{`POST https://api.pingone.com/v1/environments/{envId}/resources
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "Appointment Scheduling API",
  "description": "Book and manage patient appointments",
  "type": "CUSTOM",
  "audience": "https://api.healthsystem.com/appointments",
  "accessTokenValiditySeconds": 3600  // 1 hour - less sensitive
}`}</CodeBlock>

					<h4>Resource 3: Billing API</h4>
					<CodeBlock>{`POST https://api.pingone.com/v1/environments/{envId}/resources
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "Billing and Insurance API",
  "description": "Process payments and insurance claims",
  "type": "CUSTOM",
  "audience": "https://api.healthsystem.com/billing",
  "accessTokenValiditySeconds": 1800  // 30 minutes - financial data
}`}</CodeBlock>

					<h3>More Examples by Industry</h3>

					<h4>Banking Application</h4>
					<CodeBlock>{`// Accounts API
{
  "name": "Banking Accounts API",
  "audience": "https://api.mybank.com/accounts",
  "accessTokenValiditySeconds": 900  // 15 min - highly sensitive
}

// Transfers API
{
  "name": "Money Transfer API", 
  "audience": "https://api.mybank.com/transfers",
  "accessTokenValiditySeconds": 600  // 10 min - transactions
}

// Statements API
{
  "name": "Account Statements API",
  "audience": "https://api.mybank.com/statements",
  "accessTokenValiditySeconds": 3600  // 1 hour - read-only
}`}</CodeBlock>

					<h4>SaaS Platform</h4>
					<CodeBlock>{`// User Management
{
  "name": "User Management API",
  "audience": "https://api.saas-platform.com/users",
  "accessTokenValiditySeconds": 3600
}

// Analytics API
{
  "name": "Analytics and Reporting API",
  "audience": "https://api.saas-platform.com/analytics", 
  "accessTokenValiditySeconds": 7200  // 2 hours - read-heavy
}

// Webhooks API
{
  "name": "Webhook Configuration API",
  "audience": "https://api.saas-platform.com/webhooks",
  "accessTokenValiditySeconds": 3600
}`}</CodeBlock>

					<h3>Step-by-Step Guide</h3>
					<StepList>
						<li>Get a worker token with <code>p1:create:resource</code> scope</li>
						<li>Make a POST request to the resources endpoint</li>
						<li>Provide a unique name and audience identifier</li>
						<li>Set appropriate token lifetime based on sensitivity</li>
						<li>Optionally define custom resource attributes</li>
					</StepList>

					<h3>Example Response</h3>
					<CodeBlock>{`{
  "id": "abc123-resource-id",
  "name": "Patient Records API",
  "description": "Access to patient medical records and history",
  "type": "CUSTOM",
  "audience": "https://api.healthsystem.com/patient-records",
  "accessTokenValiditySeconds": 1800,
  "createdAt": "2024-11-20T10:00:00Z"
}`}</CodeBlock>

					<InfoBox $variant="warning">
						<FiInfo size={20} />
						<div>
							<strong>Token Lifetime Guidelines:</strong>
							<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li><strong>Highly Sensitive (5-15 min):</strong> Financial transactions, medical records</li>
								<li><strong>Moderate (30-60 min):</strong> User data updates, order processing</li>
								<li><strong>Low Sensitivity (1-2 hours):</strong> Read-only data, public content</li>
							</ul>
						</div>
					</InfoBox>

					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Best Practice:</strong> Use descriptive names and unique audience values.
							The audience will appear in the <code>aud</code> claim of access tokens.
						</div>
					</InfoBox>
				</>
			),
		},
		createScopes: {
			title: 'Define Resource Scopes',
			icon: <FiKey size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							Scopes define granular permissions within a resource. Applications request specific scopes,
							and users consent to them during authorization.
						</div>
					</InfoBox>

					<h3>Real-World Example: Social Media Platform</h3>
					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Scenario:</strong> Building a social media platform like Twitter/X with different permission levels
						</div>
					</InfoBox>

					<h4>Resource: Social Media API</h4>
					<CodeBlock>{`Audience: "https://api.socialhub.com/v1"

// Scope 1: Read public posts (anyone)
POST /resources/{resourceId}/scopes
{
  "name": "read:posts",
  "description": "View public posts and timelines"
}

// Scope 2: Create posts (authenticated users)
POST /resources/{resourceId}/scopes
{
  "name": "write:posts",
  "description": "Create, edit, and delete own posts"
}

// Scope 3: Read private messages (user's own)
POST /resources/{resourceId}/scopes
{
  "name": "read:messages",
  "description": "Read your private messages"
}

// Scope 4: Send messages (authenticated users)
POST /resources/{resourceId}/scopes
{
  "name": "write:messages",
  "description": "Send private messages to other users"
}

// Scope 5: Manage followers (user's own)
POST /resources/{resourceId}/scopes
{
  "name": "manage:followers",
  "description": "Follow/unfollow users, manage your followers"
}

// Scope 6: Moderate content (moderators only)
POST /resources/{resourceId}/scopes
{
  "name": "moderate:content",
  "description": "Remove posts, ban users, review reports"
}

// Scope 7: Analytics access (business accounts)
POST /resources/{resourceId}/scopes
{
  "name": "read:analytics",
  "description": "View post performance and engagement metrics"
}`}</CodeBlock>

					<h3>How Different Apps Use These Scopes</h3>
					<CodeBlock>{`// Mobile App (regular user)
Requested: "read:posts write:posts read:messages write:messages manage:followers"
Result: User can browse, post, message, and follow

// Third-Party Analytics Tool (business account)
Requested: "read:posts read:analytics"
Result: Can read posts and view metrics, but cannot post or message

// Moderation Dashboard (moderator)
Requested: "read:posts moderate:content"
Result: Can view all content and take moderation actions

// Read-Only Bot (public data scraper)
Requested: "read:posts"
Result: Can only view public posts, nothing else`}</CodeBlock>

					<h3>E-Commerce Example: Order Management</h3>
					<CodeBlock>{`Resource: "Order Management API"
Audience: "https://api.shop.com/orders"

// Customer App Scopes
"read:own-orders"     → View your order history
"create:orders"       → Place new orders
"cancel:orders"       → Cancel pending orders (within 24h)

// Customer Service Scopes
"read:all-orders"     → View any customer's orders
"update:orders"       → Modify order details
"refund:orders"       → Process refunds

// Warehouse App Scopes
"read:orders"         → View orders to fulfill
"update:order-status" → Mark as shipped/delivered

// Analytics Dashboard Scopes
"read:order-metrics"  → View sales analytics (no PII)`}</CodeBlock>

					<h3>Creating Scopes - Complete Example</h3>
					<CodeBlock>{`POST https://api.pingone.com/v1/environments/{envId}/resources/{resourceId}/scopes
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "read:own-orders",
  "description": "View your own order history and details",
  "schemaAttributes": []
}`}</CodeBlock>

					<InfoBox $variant="warning">
						<FiInfo size={20} />
						<div>
							<strong>Security Tip:</strong> Follow the principle of least privilege.
							Only grant the minimum scopes needed for each application. Separate read and write operations.
						</div>
					</InfoBox>

					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<strong>Try It in PingOne:</strong>
							<ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li>Go to PingOne Admin Console</li>
								<li>Navigate to Connections → Resources</li>
								<li>Create a new resource or select existing</li>
								<li>Click "Scopes" tab → "Add Scope"</li>
								<li>Enter scope name and description</li>
								<li>Save and test in your OAuth flow!</li>
							</ol>
						</div>
					</InfoBox>
				</>
			),
		},
		resourceAttributes: {
			title: 'Resource Attributes',
			icon: <FiCode size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							Resource attributes are custom claims added to access tokens. They provide additional
							context about the user or authorization.
						</div>
					</InfoBox>

					<h3>Real-World Example: Multi-Tenant SaaS Platform</h3>
					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Scenario:</strong> You run a project management SaaS serving multiple companies.
							Each API call needs to know which company's data to access.
						</div>
					</InfoBox>

					<h4>Problem Without Attributes</h4>
					<CodeBlock>{`// Your API receives a token
{
  "sub": "user123",
  "scope": "read:projects write:tasks"
}

// Your API must make ANOTHER call to get tenant info
GET /api/users/user123/tenant
Response: { "tenantId": "acme-corp", "role": "admin" }

// Now you can check permissions and access data
// This is SLOW and adds latency!`}</CodeBlock>

					<h4>Solution With Resource Attributes</h4>
					<CodeBlock>{`// Step 1: Add attributes to your resource
POST /resources/{resourceId}/attributes
{
  "name": "tenant_id",
  "value": "\${user.tenant_id}"
}

POST /resources/{resourceId}/attributes
{
  "name": "role",
  "value": "\${user.role}"
}

POST /resources/{resourceId}/attributes
{
  "name": "subscription_tier",
  "value": "\${user.subscription_tier}"
}`}</CodeBlock>

					<h4>Resulting Token (With Attributes)</h4>
					<CodeBlock>{`{
  "sub": "user123",
  "aud": "https://api.projectmanager.com/v1",
  "scope": "read:projects write:tasks",
  "tenant_id": "acme-corp",           // ✅ No extra API call needed!
  "role": "admin",                    // ✅ Immediate authorization check
  "subscription_tier": "enterprise",  // ✅ Feature access control
  "exp": 1700000000
}

// Your API can now:
// 1. Immediately know which tenant's data to access
// 2. Check role-based permissions instantly
// 3. Enable/disable features based on subscription tier
// All without additional database queries!`}</CodeBlock>

					<h3>More Real-World Examples</h3>

					<h4>Healthcare: Patient Context</h4>
					<CodeBlock>{`// Add patient context to tokens
Attributes:
- "facility_id": "\${user.facility_id}"
- "department": "\${user.department}"
- "license_type": "\${user.license_type}"
- "can_prescribe": "\${user.can_prescribe}"

// Resulting Token
{
  "sub": "dr.smith",
  "scope": "read:patient-records write:prescriptions",
  "facility_id": "hospital-north",
  "department": "cardiology",
  "license_type": "MD",
  "can_prescribe": true
}

// API instantly knows:
// - Which hospital's records to show
// - Which department for access control
// - Whether doctor can write prescriptions`}</CodeBlock>

					<h4>E-Commerce: Customer Tier</h4>
					<CodeBlock>{`// Add customer tier and region
Attributes:
- "customer_tier": "\${user.customer_tier}"
- "region": "\${user.region}"
- "loyalty_points": "\${user.loyalty_points}"

// Resulting Token
{
  "sub": "customer456",
  "scope": "read:products create:orders",
  "customer_tier": "gold",
  "region": "US-WEST",
  "loyalty_points": 5420
}

// API can:
// - Show tier-specific pricing (gold = 15% off)
// - Filter products by region availability
// - Display loyalty points without DB query`}</CodeBlock>

					<h4>Banking: Account Context</h4>
					<CodeBlock>{`// Add account and authorization context
Attributes:
- "account_type": "\${user.account_type}"
- "kyc_verified": "\${user.kyc_verified}"
- "transaction_limit": "\${user.transaction_limit}"
- "country_code": "\${user.country_code}"

// Resulting Token
{
  "sub": "customer789",
  "scope": "read:accounts create:transfers",
  "account_type": "premium",
  "kyc_verified": true,
  "transaction_limit": 50000,
  "country_code": "US"
}

// API can:
// - Enforce transaction limits immediately
// - Block transfers if KYC not verified
// - Apply country-specific regulations
// - Show premium features`}</CodeBlock>

					<h3>Performance Benefits</h3>
					<StepList>
						<li><strong>Reduced Latency:</strong> No extra database queries for user context</li>
						<li><strong>Fewer API Calls:</strong> All needed data in one token</li>
						<li><strong>Offline Validation:</strong> APIs can make decisions without calling PingOne</li>
						<li><strong>Scalability:</strong> Less load on user database</li>
					</StepList>

					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Pro Tip:</strong> Include data that changes rarely (role, tier, region) but avoid
							frequently changing data (balance, points) that could become stale.
						</div>
					</InfoBox>

					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<strong>Try It in PingOne:</strong>
							<ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li>Go to PingOne Admin Console</li>
								<li>Navigate to Connections → Resources</li>
								<li>Select your resource → "Attributes" tab</li>
								<li>Click "Add Attribute"</li>
								<li>Enter name and value (use <code>${'${user.fieldName}'}</code> syntax)</li>
								<li>Test and see the claim in your access token!</li>
							</ol>
						</div>
					</InfoBox>
				</>
			),
		},
		integration: {
			title: 'Integration with Auth Flows',
			icon: <FiShield size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							Resources integrate seamlessly with OAuth 2.0 authorization flows.
							Applications request scopes, and PingOne issues tokens with the appropriate audience.
						</div>
					</InfoBox>

					<h3>Authorization Code Flow Example</h3>
					<CodeBlock>{`// Step 1: Authorization Request
GET https://auth.pingone.com/{envId}/as/authorize?
  client_id=your-client-id
  &response_type=code
  &redirect_uri=https://app.example.com/callback
  &scope=openid read:users write:users  // Request resource scopes
  &resource=https://api.example.com/users  // Specify resource audience

// Step 2: Token Exchange
POST https://auth.pingone.com/{envId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=auth-code-here
&redirect_uri=https://app.example.com/callback
&client_id=your-client-id
&client_secret=your-client-secret

// Step 3: Receive Access Token
{
  "access_token": "eyJhbGc...",  // Contains aud and scopes
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid read:users write:users"
}`}</CodeBlock>

					<h3>Using the Access Token</h3>
					<CodeBlock>{`// Call your protected API
GET https://api.example.com/users/123
Authorization: Bearer eyJhbGc...

// Your API validates:
// 1. Token signature
// 2. Token expiration
// 3. Audience matches (aud claim)
// 4. Required scopes are present`}</CodeBlock>

					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Integration Complete!</strong> Your application can now request specific
							permissions and receive properly scoped access tokens.
						</div>
					</InfoBox>
				</>
			),
		},
		pingoneScopes: {
			title: 'PingOne Access Control Scopes',
			icon: <FiKey size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<strong>What are PingOne Access Control Scopes?</strong>
							<p style={{ margin: '0.5rem 0 0 0' }}>
								PingOne has built-in platform scopes like <code>p1:read:user</code> and <code>p1:update:user</code> 
								that control access to user data. You can create custom variants to limit access to specific attributes.
							</p>
						</div>
					</InfoBox>

					<h3>Custom PingOne Scopes</h3>
					<p>Create custom scopes using the pattern:</p>
					<CodeBlock>{`p1:read:user:{suffix}
p1:update:user:{suffix}`}</CodeBlock>

					<h3>Real-World Example: HR System</h3>
					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Scenario:</strong> Your HR application needs different permission levels for different roles.
						</div>
					</InfoBox>

					<h4>Step 1: Create Custom Scopes in PingOne</h4>
					<CodeBlock>{`// Scope 1: Email-only updates (for self-service portal)
Name: p1:update:user:email-only
Description: Allow users to update only their email address
Attributes: email

// Scope 2: Basic profile read (for employee directory)
Name: p1:read:user:basic-profile
Description: Read basic employee information
Attributes: name, email, title, department

// Scope 3: Full HR access (for HR admins)
Name: p1:update:user:hr-full
Description: Full access to employee data
Attributes: name, email, title, department, salary, manager, startDate`}</CodeBlock>

					<h4>Step 2: Use in Your Application</h4>
					<CodeBlock>{`// Self-Service Portal - Request email-only scope
GET /as/authorize?
  client_id=self-service-portal
  &scope=openid p1:update:user:email-only
  &response_type=code
  &redirect_uri=https://portal.company.com/callback

// Employee Directory - Request basic profile
GET /as/authorize?
  client_id=employee-directory
  &scope=openid p1:read:user:basic-profile
  &response_type=code
  &redirect_uri=https://directory.company.com/callback

// HR Admin Portal - Request full access
GET /as/authorize?
  client_id=hr-admin-portal
  &scope=openid p1:update:user:hr-full
  &response_type=code
  &redirect_uri=https://hr.company.com/callback`}</CodeBlock>

					<h4>Step 3: Resulting Access Tokens</h4>
					<CodeBlock>{`// Self-Service Portal Token (email-only)
{
  "sub": "user123",
  "scope": "openid p1:update:user:email-only",
  "email": "john.doe@company.com",  // Can update
  // Other attributes NOT included - cannot update
}

// Employee Directory Token (basic profile)
{
  "sub": "user123",
  "scope": "openid p1:read:user:basic-profile",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "title": "Software Engineer",
  "department": "Engineering"
  // salary, manager NOT included - cannot read
}

// HR Admin Token (full access)
{
  "sub": "user123",
  "scope": "openid p1:update:user:hr-full",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "title": "Software Engineer",
  "department": "Engineering",
  "salary": 120000,
  "manager": "jane.smith@company.com",
  "startDate": "2020-01-15"
  // All attributes included - full access
}`}</CodeBlock>

					<h3>More Real-World Examples</h3>

					<h4>Healthcare Application</h4>
					<CodeBlock>{`// Patient Portal - View own medical records
p1:read:user:patient-records
Attributes: name, dateOfBirth, medicalRecordNumber, allergies

// Nurse Station - Update vital signs only
p1:update:user:vitals-only
Attributes: bloodPressure, heartRate, temperature, weight

// Doctor Portal - Full medical access
p1:read:user:medical-full
p1:update:user:medical-full
Attributes: All medical fields including diagnoses, prescriptions, notes`}</CodeBlock>

					<h4>Financial Services</h4>
					<CodeBlock>{`// Customer App - View account balance
p1:read:user:account-balance
Attributes: accountNumber, balance, lastTransaction

// Teller System - Process transactions
p1:update:user:transactions
Attributes: balance, transactionHistory, accountStatus

// Compliance Team - Read-only audit access
p1:read:user:audit-full
Attributes: All fields for compliance review (read-only)`}</CodeBlock>

					<h4>Education Platform</h4>
					<CodeBlock>{`// Student Portal - View grades and schedule
p1:read:user:student-info
Attributes: name, studentId, courses, grades, schedule

// Teacher Portal - Update grades only
p1:update:user:grades-only
Attributes: grades, attendance, comments

// Registrar - Full academic access
p1:update:user:academic-full
Attributes: All academic fields including transcripts, enrollment`}</CodeBlock>

					<InfoBox $variant="warning">
						<FiInfo size={20} />
						<div>
							<strong>Try It Yourself!</strong>
							<ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li>Log into your PingOne admin console</li>
								<li>Navigate to Connections → Resources</li>
								<li>Find the "PingOne API" resource</li>
								<li>Click "Scopes" tab</li>
								<li>Create a custom scope like <code>p1:update:user:email-only</code></li>
								<li>Add only the "email" attribute</li>
								<li>Test in your OAuth flow!</li>
							</ol>
						</div>
					</InfoBox>

					<h3>Key Benefits</h3>
					<StepList>
						<li><strong>Principle of Least Privilege:</strong> Users only see/modify what they need</li>
						<li><strong>Data Privacy:</strong> Sensitive fields hidden from unauthorized apps</li>
						<li><strong>Compliance:</strong> Meet regulatory requirements (HIPAA, GDPR, etc.)</li>
						<li><strong>Security:</strong> Reduce attack surface by limiting data exposure</li>
						<li><strong>Flexibility:</strong> Different apps get different permission levels</li>
					</StepList>

					<ExternalLink 
						href="https://docs.pingidentity.com/r/en-us/pingone/p1_c_scopes_and_roles" 
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn More: Access Services Through Scopes and Roles <FiExternalLink size={14} />
					</ExternalLink>
				</>
			),
		},
		customClaims: {
			title: 'Custom Claims in Tokens',
			icon: <FiCode size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<strong>What are Custom Claims?</strong>
							<p style={{ margin: '0.5rem 0 0 0' }}>
								Custom claims are additional data fields you add to access tokens or ID tokens.
								They provide context about the user, tenant, or authorization without requiring extra API calls.
							</p>
						</div>
					</InfoBox>

					<h3>Access Token vs ID Token Claims</h3>
					<CodeBlock>{`// ID Token - User Identity Information
{
  "sub": "user123",
  "email": "john@example.com",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://...",
  // Custom claims for user profile
  "department": "Engineering",
  "employee_id": "EMP-12345",
  "hire_date": "2020-01-15"
}

// Access Token - Authorization Context
{
  "sub": "user123",
  "aud": "https://api.example.com",
  "scope": "read:projects write:tasks",
  // Custom claims for authorization
  "tenant_id": "acme-corp",
  "role": "admin",
  "subscription_tier": "enterprise",
  "region": "us-west"
}`}</CodeBlock>

					<InfoBox $variant="warning">
						<FiInfo size={20} />
						<div>
							<strong>Key Difference:</strong>
							<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li><strong>ID Token:</strong> WHO the user is (identity, profile data)</li>
								<li><strong>Access Token:</strong> WHAT the user can do (permissions, context)</li>
							</ul>
						</div>
					</InfoBox>

					<h3>Real-World Example: Multi-Tenant SaaS</h3>
					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Scenario:</strong> Project management platform serving multiple companies
						</div>
					</InfoBox>

					<h4>Step 1: Add Custom Claims to ID Token</h4>
					<CodeBlock>{`// In PingOne Admin Console:
// 1. Go to Connections → Applications → [Your App]
// 2. Click "Attribute Mapping" tab
// 3. Add custom mappings:

// Map user attributes to ID token claims
employee_id → \${user.employeeId}
department → \${user.department}
manager_email → \${user.manager}
office_location → \${user.officeLocation}

// Result: ID Token with custom claims
{
  "sub": "user123",
  "email": "john@acme.com",
  "name": "John Doe",
  "employee_id": "EMP-12345",      // ✅ Custom claim
  "department": "Engineering",      // ✅ Custom claim
  "manager_email": "jane@acme.com", // ✅ Custom claim
  "office_location": "San Francisco" // ✅ Custom claim
}`}</CodeBlock>

					<h4>Step 2: Add Custom Claims to Access Token</h4>
					<CodeBlock>{`// In PingOne Admin Console:
// 1. Go to Connections → Resources → [Your API Resource]
// 2. Click "Attributes" tab
// 3. Add resource attributes:

POST /resources/{resourceId}/attributes
{
  "name": "tenant_id",
  "value": "\${user.tenantId}"
}

POST /resources/{resourceId}/attributes
{
  "name": "role",
  "value": "\${user.role}"
}

POST /resources/{resourceId}/attributes
{
  "name": "subscription_tier",
  "value": "\${user.subscriptionTier}"
}

POST /resources/{resourceId}/attributes
{
  "name": "max_projects",
  "value": "\${user.maxProjects}"
}

// Result: Access Token with custom claims
{
  "sub": "user123",
  "aud": "https://api.projectmanager.com",
  "scope": "read:projects write:tasks",
  "tenant_id": "acme-corp",        // ✅ Custom claim
  "role": "admin",                 // ✅ Custom claim
  "subscription_tier": "enterprise", // ✅ Custom claim
  "max_projects": 100              // ✅ Custom claim
}`}</CodeBlock>

					<h3>Healthcare Example: Patient Context</h3>
					<CodeBlock>{`// ID Token - Doctor's Profile
{
  "sub": "dr.smith",
  "email": "dr.smith@hospital.com",
  "name": "Dr. Sarah Smith",
  "license_number": "MD-123456",    // Custom claim
  "specialization": "Cardiology",   // Custom claim
  "facility_id": "hospital-north",  // Custom claim
  "can_prescribe": true             // Custom claim
}

// Access Token - Authorization Context
{
  "sub": "dr.smith",
  "aud": "https://api.healthsystem.com/patient-records",
  "scope": "read:patient-records write:prescriptions",
  "facility_id": "hospital-north",  // Which hospital's data
  "department": "cardiology",       // Which department
  "license_type": "MD",             // Authorization level
  "can_prescribe": true,            // Permission flag
  "max_prescription_days": 90       // Business rule
}

// Your API can now:
// ✅ Show only patients from hospital-north
// ✅ Filter by cardiology department
// ✅ Allow prescription writing (can_prescribe=true)
// ✅ Enforce 90-day prescription limit
// All without database queries!`}</CodeBlock>

					<h3>E-Commerce Example: Customer Tier</h3>
					<CodeBlock>{`// ID Token - Customer Profile
{
  "sub": "customer456",
  "email": "customer@example.com",
  "name": "Jane Customer",
  "customer_since": "2019-03-15",   // Custom claim
  "loyalty_tier": "gold",           // Custom claim
  "preferred_language": "en-US",    // Custom claim
  "marketing_consent": true         // Custom claim
}

// Access Token - Shopping Context
{
  "sub": "customer456",
  "aud": "https://api.shop.com",
  "scope": "read:products create:orders",
  "customer_tier": "gold",          // Pricing tier
  "region": "US-WEST",              // Shipping/inventory
  "loyalty_points": 5420,           // Rewards balance
  "discount_percentage": 15,        // Gold tier discount
  "free_shipping": true,            // Tier benefit
  "priority_support": true          // Tier benefit
}

// Your API can:
// ✅ Apply 15% gold tier discount automatically
// ✅ Show free shipping at checkout
// ✅ Display loyalty points balance
// ✅ Enable priority support chat
// ✅ Filter products by region availability`}</CodeBlock>

					<h3>Banking Example: Account Context</h3>
					<CodeBlock>{`// ID Token - Customer Identity
{
  "sub": "customer789",
  "email": "customer@email.com",
  "name": "Bob Customer",
  "kyc_verified": true,             // Custom claim
  "kyc_level": "enhanced",          // Custom claim
  "customer_since": "2015-06-20",   // Custom claim
  "preferred_branch": "downtown"    // Custom claim
}

// Access Token - Transaction Context
{
  "sub": "customer789",
  "aud": "https://api.bank.com/accounts",
  "scope": "read:accounts create:transfers",
  "account_type": "premium",        // Account tier
  "kyc_verified": true,             // Compliance check
  "transaction_limit_daily": 50000, // Business rule
  "international_transfers": true,  // Feature flag
  "country_code": "US",             // Regulatory context
  "risk_score": "low"               // Fraud prevention
}

// Your API can:
// ✅ Block transfers if kyc_verified=false
// ✅ Enforce $50k daily limit
// ✅ Enable international transfers
// ✅ Apply US banking regulations
// ✅ Skip additional verification (low risk)`}</CodeBlock>

					<h3>How to Add Custom Claims</h3>

					<h4>For ID Tokens (User Profile Data)</h4>
					<StepList>
						<li>Go to PingOne Admin Console</li>
						<li>Navigate to Connections → Applications → [Your App]</li>
						<li>Click "Attribute Mapping" tab</li>
						<li>Click "Add Attribute"</li>
						<li>Enter claim name and map to user attribute: <code>${'${user.fieldName}'}</code></li>
						<li>Save and test your OAuth flow</li>
					</StepList>

					<h4>For Access Tokens (Authorization Context)</h4>
					<StepList>
						<li>Go to PingOne Admin Console</li>
						<li>Navigate to Connections → Resources → [Your API]</li>
						<li>Click "Attributes" tab</li>
						<li>Click "Add Attribute"</li>
						<li>Enter attribute name and value: <code>${'${user.fieldName}'}</code></li>
						<li>Save and test your OAuth flow</li>
					</StepList>

					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Pro Tips:</strong>
							<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li>Use ID tokens for user profile display (name, email, avatar)</li>
								<li>Use access tokens for authorization decisions (role, permissions, limits)</li>
								<li>Keep tokens small - only include data you actually need</li>
								<li>Avoid frequently changing data (balance, points) - they can become stale</li>
								<li>Include data that changes rarely (role, tier, region)</li>
							</ul>
						</div>
					</InfoBox>

					<h3>Testing Your Custom Claims</h3>
					<CodeBlock>{`// 1. Complete an OAuth flow
// 2. Decode your tokens at jwt.io
// 3. Verify custom claims are present

// ID Token Example
{
  "sub": "user123",
  "email": "user@example.com",
  "employee_id": "EMP-12345",  // ✅ Your custom claim
  "department": "Engineering"   // ✅ Your custom claim
}

// Access Token Example
{
  "sub": "user123",
  "aud": "https://api.example.com",
  "tenant_id": "acme-corp",    // ✅ Your custom claim
  "role": "admin"              // ✅ Your custom claim
}`}</CodeBlock>

					<ExternalLink 
						href="https://docs.pingidentity.com/r/en-us/pingone/p1_t_configure_app_attributes" 
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn More: Configure Application Attributes <FiExternalLink size={14} />
					</ExternalLink>
				</>
			),
		},
		adminAPI: {
			title: 'Admin API: Create Resources & Scopes',
			icon: <FiCode size={24} />,
			content: (
				<>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<strong>Automate Resource Management</strong>
							<p style={{ margin: '0.5rem 0 0 0' }}>
								Use the PingOne Management API to programmatically create resources, scopes, and attributes.
								Perfect for CI/CD pipelines, multi-environment setups, or dynamic resource provisioning.
							</p>
						</div>
					</InfoBox>

					<h3>Prerequisites</h3>
					<StepList>
						<li>Worker app with <code>p1:create:resource</code> and <code>p1:update:resource</code> scopes</li>
						<li>Worker app access token</li>
						<li>Environment ID</li>
					</StepList>

					<h3>Step 1: Get Worker Token</h3>
					<CodeBlock>{`POST https://auth.pingone.com/{envId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={workerAppClientId}
&client_secret={workerAppClientSecret}

// Response
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}`}</CodeBlock>

					<h3>Real-World Example: E-Commerce Platform Setup</h3>
					<InfoBox $variant="success">
						<FiShield size={20} />
						<div>
							<strong>Scenario:</strong> Automatically provision resources for a new e-commerce tenant
						</div>
					</InfoBox>

					<h4>Step 2: Create Product Catalog Resource</h4>
					<CodeBlock>{`POST https://api.pingone.com/v1/environments/{envId}/resources
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "Product Catalog API",
  "description": "Access to product listings and inventory",
  "type": "CUSTOM",
  "audience": "https://api.acme-shop.com/products",
  "accessTokenValiditySeconds": 3600
}

// Response
{
  "id": "resource-products-123",
  "name": "Product Catalog API",
  "audience": "https://api.acme-shop.com/products",
  "type": "CUSTOM",
  "accessTokenValiditySeconds": 3600,
  "createdAt": "2024-11-20T10:00:00Z"
}`}</CodeBlock>

					<h4>Step 3: Add Scopes to Product Catalog</h4>
					<CodeBlock>{`// Scope 1: Browse products
POST https://api.pingone.com/v1/environments/{envId}/resources/resource-products-123/scopes
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "read:products",
  "description": "Browse product listings and details"
}

// Scope 2: Manage products (admin)
POST https://api.pingone.com/v1/environments/{envId}/resources/resource-products-123/scopes
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "write:products",
  "description": "Create, update, and delete products"
}

// Scope 3: Manage inventory
POST https://api.pingone.com/v1/environments/{envId}/resources/resource-products-123/scopes
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "manage:inventory",
  "description": "Update stock levels and availability"
}`}</CodeBlock>

					<h4>Step 4: Add Custom Attributes</h4>
					<CodeBlock>{`// Add tenant context to access tokens
POST https://api.pingone.com/v1/environments/{envId}/resources/resource-products-123/attributes
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "tenant_id",
  "value": "\${user.tenantId}"
}

POST https://api.pingone.com/v1/environments/{envId}/resources/resource-products-123/attributes
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "store_region",
  "value": "\${user.storeRegion}"
}

POST https://api.pingone.com/v1/environments/{envId}/resources/resource-products-123/attributes
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "catalog_access_level",
  "value": "\${user.catalogAccessLevel}"
}`}</CodeBlock>

					<h4>Step 5: Create Order Management Resource</h4>
					<CodeBlock>{`POST https://api.pingone.com/v1/environments/{envId}/resources
Authorization: Bearer {workerToken}
Content-Type: application/json

{
  "name": "Order Management API",
  "description": "Place and manage customer orders",
  "type": "CUSTOM",
  "audience": "https://api.acme-shop.com/orders",
  "accessTokenValiditySeconds": 1800
}

// Add scopes
POST https://api.pingone.com/v1/environments/{envId}/resources/{ordersResourceId}/scopes
{
  "name": "read:orders",
  "description": "View order history"
}

POST https://api.pingone.com/v1/environments/{envId}/resources/{ordersResourceId}/scopes
{
  "name": "create:orders",
  "description": "Place new orders"
}

POST https://api.pingone.com/v1/environments/{envId}/resources/{ordersResourceId}/scopes
{
  "name": "cancel:orders",
  "description": "Cancel pending orders"
}

POST https://api.pingone.com/v1/environments/{envId}/resources/{ordersResourceId}/scopes
{
  "name": "refund:orders",
  "description": "Process refunds (admin only)"
}

// Add attributes
POST https://api.pingone.com/v1/environments/{envId}/resources/{ordersResourceId}/attributes
{
  "name": "customer_tier",
  "value": "\${user.customerTier}"
}

POST https://api.pingone.com/v1/environments/{envId}/resources/{ordersResourceId}/attributes
{
  "name": "max_order_value",
  "value": "\${user.maxOrderValue}"
}`}</CodeBlock>

					<h3>Complete Automation Script</h3>
					<CodeBlock>{`#!/bin/bash
# setup-ecommerce-resources.sh

ENV_ID="your-env-id"
WORKER_TOKEN="your-worker-token"
BASE_URL="https://api.pingone.com/v1"

# Create Product Catalog Resource
PRODUCTS_RESOURCE=$(curl -X POST \\
  "$BASE_URL/environments/$ENV_ID/resources" \\
  -H "Authorization: Bearer $WORKER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Product Catalog API",
    "type": "CUSTOM",
    "audience": "https://api.acme-shop.com/products",
    "accessTokenValiditySeconds": 3600
  }' | jq -r '.id')

echo "Created Product Catalog Resource: $PRODUCTS_RESOURCE"

# Add Product Scopes
curl -X POST \\
  "$BASE_URL/environments/$ENV_ID/resources/$PRODUCTS_RESOURCE/scopes" \\
  -H "Authorization: Bearer $WORKER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "read:products", "description": "Browse products"}'

curl -X POST \\
  "$BASE_URL/environments/$ENV_ID/resources/$PRODUCTS_RESOURCE/scopes" \\
  -H "Authorization: Bearer $WORKER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "write:products", "description": "Manage products"}'

# Add Product Attributes
curl -X POST \\
  "$BASE_URL/environments/$ENV_ID/resources/$PRODUCTS_RESOURCE/attributes" \\
  -H "Authorization: Bearer $WORKER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "tenant_id", "value": "\${user.tenantId}"}'

echo "Product Catalog setup complete!"

# Create Orders Resource
ORDERS_RESOURCE=$(curl -X POST \\
  "$BASE_URL/environments/$ENV_ID/resources" \\
  -H "Authorization: Bearer $WORKER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Order Management API",
    "type": "CUSTOM",
    "audience": "https://api.acme-shop.com/orders",
    "accessTokenValiditySeconds": 1800
  }' | jq -r '.id')

echo "Created Orders Resource: $ORDERS_RESOURCE"

# Add Order Scopes
for scope in "read:orders" "create:orders" "cancel:orders" "refund:orders"; do
  curl -X POST \\
    "$BASE_URL/environments/$ENV_ID/resources/$ORDERS_RESOURCE/scopes" \\
    -H "Authorization: Bearer $WORKER_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d "{\"name\": \"$scope\", \"description\": \"$scope permission\"}"
done

echo "E-Commerce resources setup complete!"
echo "Products Resource ID: $PRODUCTS_RESOURCE"
echo "Orders Resource ID: $ORDERS_RESOURCE"`}</CodeBlock>

					<h3>Healthcare Example: Automated Setup</h3>
					<CodeBlock>{`// Create Patient Records Resource
POST /environments/{envId}/resources
{
  "name": "Patient Records API",
  "audience": "https://api.healthsystem.com/patient-records",
  "accessTokenValiditySeconds": 1800
}

// Add Healthcare Scopes
POST /resources/{resourceId}/scopes
{"name": "read:patient-records", "description": "View patient medical records"}

POST /resources/{resourceId}/scopes
{"name": "write:patient-records", "description": "Update patient records"}

POST /resources/{resourceId}/scopes
{"name": "read:prescriptions", "description": "View prescriptions"}

POST /resources/{resourceId}/scopes
{"name": "write:prescriptions", "description": "Create prescriptions"}

// Add Healthcare Attributes
POST /resources/{resourceId}/attributes
{"name": "facility_id", "value": "\${user.facilityId}"}

POST /resources/{resourceId}/attributes
{"name": "department", "value": "\${user.department}"}

POST /resources/{resourceId}/attributes
{"name": "license_type", "value": "\${user.licenseType}"}

POST /resources/{resourceId}/attributes
{"name": "can_prescribe", "value": "\${user.canPrescribe}"}`}</CodeBlock>

					<h3>Banking Example: Automated Setup</h3>
					<CodeBlock>{`// Create Accounts Resource
POST /environments/{envId}/resources
{
  "name": "Banking Accounts API",
  "audience": "https://api.bank.com/accounts",
  "accessTokenValiditySeconds": 900
}

// Add Banking Scopes
POST /resources/{resourceId}/scopes
{"name": "read:accounts", "description": "View account balances"}

POST /resources/{resourceId}/scopes
{"name": "read:transactions", "description": "View transaction history"}

POST /resources/{resourceId}/scopes
{"name": "create:transfers", "description": "Initiate money transfers"}

POST /resources/{resourceId}/scopes
{"name": "manage:payees", "description": "Manage payment recipients"}

// Add Banking Attributes
POST /resources/{resourceId}/attributes
{"name": "account_type", "value": "\${user.accountType}"}

POST /resources/{resourceId}/attributes
{"name": "kyc_verified", "value": "\${user.kycVerified}"}

POST /resources/{resourceId}/attributes
{"name": "transaction_limit", "value": "\${user.transactionLimit}"}

POST /resources/{resourceId}/attributes
{"name": "country_code", "value": "\${user.countryCode}"}`}</CodeBlock>

					<h3>Benefits of API Automation</h3>
					<StepList>
						<li><strong>Consistency:</strong> Same setup across dev, staging, production</li>
						<li><strong>Speed:</strong> Provision new tenants in seconds</li>
						<li><strong>Version Control:</strong> Track resource changes in Git</li>
						<li><strong>CI/CD Integration:</strong> Automate deployment pipelines</li>
						<li><strong>Disaster Recovery:</strong> Quickly rebuild environments</li>
						<li><strong>Multi-Environment:</strong> Easily replicate across regions</li>
					</StepList>

					<InfoBox $variant="warning">
						<FiInfo size={20} />
						<div>
							<strong>Security Best Practices:</strong>
							<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li>Store worker credentials in secure vaults (AWS Secrets Manager, Azure Key Vault)</li>
								<li>Use short-lived worker tokens</li>
								<li>Limit worker app permissions to only what's needed</li>
								<li>Log all resource creation/modification</li>
								<li>Implement approval workflows for production changes</li>
							</ul>
						</div>
					</InfoBox>

					<ExternalLink 
						href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#resources" 
						target="_blank"
						rel="noopener noreferrer"
					>
						View Full Management API Documentation <FiExternalLink size={14} />
					</ExternalLink>
				</>
			),
		},
		bestPractices: {
			title: 'Best Practices',
			icon: <FiShield size={24} />,
			content: (
				<>
					<h3>Resource Design</h3>
					<StepList>
						<li><strong>Unique Audiences:</strong> Each resource should have a unique audience identifier</li>
						<li><strong>Descriptive Names:</strong> Use clear, meaningful names for resources and scopes</li>
						<li><strong>Logical Grouping:</strong> Group related permissions under the same resource</li>
					</StepList>

					<h3>Scope Naming</h3>
					<StepList>
						<li><strong>Consistent Format:</strong> Use patterns like <code>action:resource</code></li>
						<li><strong>Granular Permissions:</strong> Separate read and write operations</li>
						<li><strong>Avoid Wildcards:</strong> Be explicit about what each scope allows</li>
					</StepList>

					<h3>Security</h3>
					<InfoBox $variant="warning">
						<FiShield size={20} />
						<div>
							<strong>Important Security Practices:</strong>
							<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
								<li>Always validate the <code>aud</code> claim in your API</li>
								<li>Check that required scopes are present</li>
								<li>Use short token lifetimes (15-60 minutes)</li>
								<li>Implement token refresh for long-lived sessions</li>
								<li>Never include sensitive data in tokens</li>
							</ul>
						</div>
					</InfoBox>

					<h3>Performance</h3>
					<StepList>
						<li><strong>Cache Tokens:</strong> Reuse valid tokens instead of requesting new ones</li>
						<li><strong>Limit Attributes:</strong> Only include necessary custom claims</li>
						<li><strong>Monitor Usage:</strong> Track which scopes are actually being used</li>
					</StepList>

					<ExternalLink 
						href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#resources" 
						target="_blank"
						rel="noopener noreferrer"
					>
						Read Full Documentation <FiExternalLink size={14} />
					</ExternalLink>
				</>
			),
		},
	};

	const cards = [
		{
			id: 'overview',
			icon: <FiBook size={24} />,
			color: '#3b82f6',
			title: 'Resources Overview',
			description: 'Learn what resources are and how they work in PingOne',
		},
		{
			id: 'createResource',
			icon: <FiLayers size={24} />,
			color: '#10b981',
			title: 'Create a Resource',
			description: 'Step-by-step guide to creating a new resource',
		},
		{
			id: 'createScopes',
			icon: <FiKey size={24} />,
			color: '#f59e0b',
			title: 'Define Scopes',
			description: 'Add granular permissions to your resources',
		},
		{
			id: 'resourceAttributes',
			icon: <FiCode size={24} />,
			color: '#8b5cf6',
			title: 'Resource Attributes',
			description: 'Add custom claims to access tokens',
		},
		{
			id: 'customClaims',
			icon: <FiCode size={24} />,
			color: '#14b8a6',
			title: 'Custom Claims in Tokens',
			description: 'Add custom claims to access tokens and ID tokens with real examples',
		},
		{
			id: 'pingoneScopes',
			icon: <FiKey size={24} />,
			color: '#ef4444',
			title: 'PingOne Access Control',
			description: 'Custom scopes for user data with real-world examples',
		},
		{
			id: 'adminAPI',
			icon: <FiCode size={24} />,
			color: '#f97316',
			title: 'Admin API Automation',
			description: 'Programmatically create resources and scopes',
		},
		{
			id: 'integration',
			icon: <FiShield size={24} />,
			color: '#ec4899',
			title: 'Auth Flow Integration',
			description: 'Use resources in OAuth 2.0 flows',
		},
		{
			id: 'bestPractices',
			icon: <FiShield size={24} />,
			color: '#06b6d4',
			title: 'Best Practices',
			description: 'Security and design recommendations',
		},
	];

	return (
		<Container>
			<ContentWrapper>
				<Header>
					<Title>
						<FiLayers size={32} />
						PingOne Resources API
					</Title>
					<Subtitle>
						Learn how to manage OAuth 2.0 resources, scopes, and custom token claims
					</Subtitle>
				</Header>

				<Grid>
					{cards.map(card => (
						<Card key={card.id} onClick={() => setActiveModal(card.id)}>
							<CardIcon $color={card.color}>
								{card.icon}
							</CardIcon>
							<CardTitle>{card.title}</CardTitle>
							<CardDescription>{card.description}</CardDescription>
						</Card>
					))}
				</Grid>

				{Object.entries(modals).map(([id, modal]) => (
					<Modal key={id} $isOpen={activeModal === id} onClick={() => setActiveModal(null)}>
						<ModalContent onClick={(e) => e.stopPropagation()}>
							<ModalHeader>
								<ModalTitle>
									{modal.icon}
									{modal.title}
								</ModalTitle>
								<CloseButton onClick={() => setActiveModal(null)}>×</CloseButton>
							</ModalHeader>
							<ModalBody>
								{modal.content}
							</ModalBody>
						</ModalContent>
					</Modal>
				))}
			</ContentWrapper>
		</Container>
	);
};

export default ResourcesAPIFlowV8;
