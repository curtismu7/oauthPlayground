// src/pages/CIBAvsDeviceAuthz.tsx - CIBA vs Device Authorization Comparison Guide
import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheck,
	FiClock,
	FiCode,
	FiCopy,
	FiInfo,
	FiMonitor,
	FiSettings,
	FiSmartphone,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';
import { showFlowSuccess } from '../components/CentralizedSuccessMessage';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';
import PageLayoutService from '../services/pageLayoutService';
import { copyToClipboard } from '../utils/clipboard';

// Container styling handled by PageLayoutService

const OverviewCard = styled(Card)`
  margin-bottom: 2rem;
  border-left: 4px solid #8b5cf6;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const ComparisonCard = styled(Card)<{ $type: 'ciba' | 'device' }>`
  border-left: 4px solid ${({ $type }) => ($type === 'ciba' ? '#8b5cf6' : '#3b82f6')};
`;

const CodeBlock = styled.pre`
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const CodeBlockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const CopyButton = styled.button`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const FlowStep = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-left: 4px solid #3b82f6;
  border-radius: 0.25rem;
`;

const FlowStepNumber = styled.span`
  display: inline-block;
  background: #3b82f6;
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  text-align: center;
  line-height: 1.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 0.5rem;
`;

const FlowStepTitle = styled.h4`
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const FlowStepDescription = styled.p`
  color: #6b7280;
  margin: 0;
`;

const InfoBox = styled.div`
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const InfoIcon = styled.div`
  color: #3b82f6;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const InfoContent = styled.div`
  flex: 1;

  h4 {
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 0.5rem;
  }

  p {
    color: #1e3a8a;
    margin: 0;
  }
`;

const WarningBox = styled(InfoBox)`
  background-color: #fef3c7;
  border-color: #fcd34d;

  ${InfoIcon} {
    color: #f59e0b;
  }

  h4 {
    color: #92400e;
  }

  p {
    color: #78350f;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid #e5e7eb;
  }

  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #111827;
  }

  td {
    color: #374151;
  }

  tr:nth-child(even) {
    background-color: #f9fafb;
  }
`;

const UseCaseCard = styled(Card)`
  margin: 1rem 0;
  border-left: 4px solid #10b981;
`;

const CIBAvsDeviceAuthz: React.FC = () => {
	usePageScroll({ pageName: 'CIBA vs Device Authorization', force: true });

	const handleCopyCode = (code: string, description: string) => {
		copyToClipboard(code);
		showFlowSuccess(`Copied ${description} to clipboard`);
	};

	// Use PageLayoutService for consistent layout and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1400px',
		showHeader: false, // We handle the header manually with FlowHeader
		showFooter: false,
		responsive: true,
	};

	const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				<FlowHeader
					flowId="ciba-vs-device-authz"
					customConfig={{
						flowType: 'documentation',
						title: 'CIBA vs Device Authorization Guide',
						subtitle:
							'Understanding when to use Client-Initiated Backchannel Authentication (CIBA) versus Device Authorization Grant, with comprehensive examples and use cases.',
						icon: '🔐',
					}}
				/>

				<OverviewCard>
					<CardHeader>
						<h2>Overview</h2>
					</CardHeader>
					<CardBody>
						<p>
							<strong>CIBA (Client-Initiated Backchannel Authentication - RFC 9441)</strong> and{' '}
							<strong>Device Authorization Grant (RFC 8628)</strong> are both designed for scenarios
							where traditional browser-based authorization isn't feasible. However, they solve
							different problems and have distinct use cases.
						</p>
						<InfoBox>
							<InfoIcon>
								<FiInfo />
							</InfoIcon>
							<InfoContent>
								<h4>Key Insight</h4>
								<p>
									<strong>CIBA</strong> uses push notifications to the user's authenticated device
									(usually mobile) when you know the user's identity.
									<strong>Device Authorization</strong> uses a manual code entry process when you
									don't know the user's identity. Choose CIBA for known users, Device Authorization
									for unknown users.
								</p>
							</InfoContent>
						</InfoBox>
					</CardBody>
				</OverviewCard>

				<CollapsibleHeader
					title="Quick Comparison Table"
					theme="blue"
					icon={<FiSettings />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
							<Table>
								<thead>
									<tr>
										<th>Feature</th>
										<th>CIBA (RFC 9441)</th>
										<th>Device Authorization (RFC 8628)</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<strong>User Identification</strong>
										</td>
										<td>✅ Known user (login_hint required)</td>
										<td>❌ Unknown user</td>
									</tr>
									<tr>
										<td>
											<strong>User Experience</strong>
										</td>
										<td>🔔 Push notification to user's device</td>
										<td>📝 Manual code entry on separate device</td>
									</tr>
									<tr>
										<td>
											<strong>Approval Method</strong>
										</td>
										<td>User approves on trusted device (mobile app)</td>
										<td>User visits URL and enters user code</td>
									</tr>
									<tr>
										<td>
											<strong>Client Requirements</strong>
										</td>
										<td>Must know user identifier (email, phone, etc.)</td>
										<td>No user identifier needed</td>
									</tr>
									<tr>
										<td>
											<strong>Device Requirements</strong>
										</td>
										<td>User must have registered authenticator device</td>
										<td>User needs any device with browser</td>
									</tr>
									<tr>
										<td>
											<strong>Polling</strong>
										</td>
										<td>Client polls for tokens after authentication request</td>
										<td>Device polls for tokens after user enters code</td>
									</tr>
									<tr>
										<td>
											<strong>Use Cases</strong>
										</td>
										<td>Banking apps, payment apps, known user scenarios</td>
										<td>Smart TVs, CLI tools, IoT devices, unknown users</td>
									</tr>
									<tr>
										<td>
											<strong>RFC</strong>
										</td>
										<td>RFC 9441</td>
										<td>RFC 8628</td>
									</tr>
									<tr>
										<td>
											<strong>Authentication Mode</strong>
										</td>
										<td>Poll mode (client polls for result)</td>
										<td>Poll mode (device polls for tokens)</td>
									</tr>
									<tr>
										<td>
											<strong>Security</strong>
										</td>
										<td>User authenticates on trusted device</td>
										<td>User must manually verify on separate device</td>
									</tr>
								</tbody>
							</Table>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<ComparisonGrid>
					<ComparisonCard $type="ciba">
						<CardHeader>
							<h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiSmartphone />
								CIBA (Client-Initiated Backchannel Authentication)
							</h2>
						</CardHeader>
						<CardBody>
							<h3>What is CIBA?</h3>
							<p>
								CIBA is an OpenID Connect extension that enables clients to initiate authentication
								flows by sending authentication requests to the authorization server, which then
								notifies the user via their registered authenticator device (typically a mobile
								app).
							</p>

							<h3 style={{ marginTop: '1.5rem' }}>Key Characteristics:</h3>
							<ul>
								<li>
									✅ <strong>Known User:</strong> Requires user identifier (login_hint)
								</li>
								<li>
									🔔 <strong>Push Notification:</strong> User receives notification on trusted
									device
								</li>
								<li>
									📱 <strong>Mobile-Centric:</strong> Designed for mobile authenticator apps
								</li>
								<li>
									🔒 <strong>High Security:</strong> User approves on their trusted device
								</li>
								<li>
									⚡ <strong>Seamless UX:</strong> No manual code entry required
								</li>
							</ul>

							<h3 style={{ marginTop: '1.5rem' }}>When to Use CIBA:</h3>
							<ul>
								<li>✅ Banking and financial applications</li>
								<li>✅ Payment authorization requests</li>
								<li>✅ High-security transaction approvals</li>
								<li>✅ Known user scenarios (user is logged in or identified)</li>
								<li>✅ Mobile-first authentication flows</li>
								<li>✅ When user has registered authenticator device</li>
							</ul>
						</CardBody>
					</ComparisonCard>

					<ComparisonCard $type="device">
						<CardHeader>
							<h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiMonitor />
								Device Authorization Grant
							</h2>
						</CardHeader>
						<CardBody>
							<h3>What is Device Authorization?</h3>
							<p>
								Device Authorization Grant is an OAuth 2.0 extension that enables devices without
								browsers or with limited input capabilities to obtain user authorization through a
								separate device.
							</p>

							<h3 style={{ marginTop: '1.5rem' }}>Key Characteristics:</h3>
							<ul>
								<li>
									❓ <strong>Unknown User:</strong> No user identifier required
								</li>
								<li>
									📝 <strong>Manual Code Entry:</strong> User must enter code on separate device
								</li>
								<li>
									🖥️ <strong>Device-Centric:</strong> Designed for constrained devices
								</li>
								<li>
									🌐 <strong>Browser Required:</strong> User needs browser on separate device
								</li>
								<li>
									⏱️ <strong>Polling:</strong> Device polls until user completes authorization
								</li>
							</ul>

							<h3 style={{ marginTop: '1.5rem' }}>When to Use Device Authorization:</h3>
							<ul>
								<li>✅ Smart TVs and set-top boxes</li>
								<li>✅ Command-line interface (CLI) tools</li>
								<li>✅ IoT devices without browsers</li>
								<li>✅ Gaming consoles</li>
								<li>✅ Devices with limited input capabilities</li>
								<li>✅ Unknown user scenarios (first-time setup)</li>
							</ul>
						</CardBody>
					</ComparisonCard>
				</ComparisonGrid>

				<CollapsibleHeader
					title="CIBA Flow Example"
					theme="purple"
					icon={<FiSmartphone />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
							<p>
								CIBA flow starts when a client initiates an authentication request with a user
								identifier. The authorization server then sends a push notification to the user's
								registered authenticator device.
							</p>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>1</FlowStepNumber>
									Client Sends Backchannel Authentication Request
								</FlowStepTitle>
								<FlowStepDescription>
									Client sends authentication request to the backchannel authorization endpoint with
									user identifier (login_hint).
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>POST to /as/bc-authorize endpoint</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`POST https://auth.pingone.com/{environmentId}/as/bc-authorize
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

client_id=your_client_id&
scope=openid profile email&
login_hint=user@example.com&
binding_message=Please approve this transaction&
user_code=1234&
requested_expiry=600`,
												'CIBA request'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/bc-authorize
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

client_id=your_client_id&
scope=openid profile email&
login_hint=user@example.com&
binding_message=Please approve this transaction&
user_code=1234&
requested_expiry=600`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>2</FlowStepNumber>
									Authorization Server Sends Push Notification
								</FlowStepTitle>
								<FlowStepDescription>
									Authorization server sends push notification to user's registered authenticator
									device (mobile app).
								</FlowStepDescription>
								<InfoBox>
									<InfoIcon>
										<FiInfo />
									</InfoIcon>
									<InfoContent>
										<h4>Push Notification</h4>
										<p>
											The user receives a push notification on their mobile device with the binding
											message and user code. They can then open the authenticator app to approve or
											deny the request.
										</p>
									</InfoContent>
								</InfoBox>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>3</FlowStepNumber>
									Receive Authentication Request ID
								</FlowStepTitle>
								<FlowStepDescription>
									Authorization server returns an authentication request ID (auth_req_id) and
									expiration time.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>CIBA Response</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`{
  "auth_req_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_in": 600,
  "interval": 5
}`,
												'CIBA response'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "auth_req_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_in": 600,
  "interval": 5
}`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>4</FlowStepNumber>
									Client Polls Token Endpoint
								</FlowStepTitle>
								<FlowStepDescription>
									Client polls the token endpoint using the auth_req_id until user approves or
									request expires.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Poll Token Endpoint</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

grant_type=urn:openid:params:grant-type:ciba&
auth_req_id=550e8400-e29b-41d4-a716-446655440000`,
												'CIBA token request'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

grant_type=urn:openid:params:grant-type:ciba&
auth_req_id=550e8400-e29b-41d4-a716-446655440000`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>5</FlowStepNumber>
									User Approves on Authenticator Device
								</FlowStepTitle>
								<FlowStepDescription>
									User opens the authenticator app and approves the authentication request on their
									trusted device.
								</FlowStepDescription>
								<InfoBox>
									<InfoIcon>
										<FiSmartphone />
									</InfoIcon>
									<InfoContent>
										<h4>User Experience</h4>
										<p>
											The user sees a notification on their mobile device, opens the authenticator
											app, reviews the binding message and user code, then approves or denies the
											request. This happens on their trusted device, providing high security.
										</p>
									</InfoContent>
								</InfoBox>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>6</FlowStepNumber>
									Tokens Issued
								</FlowStepTitle>
								<FlowStepDescription>
									Once user approves, the polling request returns tokens (access token, ID token,
									refresh token).
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Token Response</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}`,
												'CIBA token response'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}`}</CodeBlock>
							</FlowStep>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Device Authorization Flow Example"
					theme="blue"
					icon={<FiMonitor />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
							<p>
								Device Authorization flow starts when a constrained device requests a device code
								and user code. The user then visits a verification URL on a separate device and
								enters the code.
							</p>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>1</FlowStepNumber>
									Device Requests Device Code
								</FlowStepTitle>
								<FlowStepDescription>
									Device calls the device authorization endpoint to obtain a device code and user
									code.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>POST to /as/device endpoint</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`POST https://auth.pingone.com/{environmentId}/as/device
Content-Type: application/x-www-form-urlencoded

client_id=your_client_id&
scope=openid profile email`,
												'Device authorization request'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/device
Content-Type: application/x-www-form-urlencoded

client_id=your_client_id&
scope=openid profile email`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>2</FlowStepNumber>
									Receive Device Code and User Code
								</FlowStepTitle>
								<FlowStepDescription>
									Authorization server returns device code, user code, verification URI, and
									expiration time.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Device Authorization Response</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`{
  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://auth.pingone.com/{environmentId}/as/device/user",
  "verification_uri_complete": "https://auth.pingone.com/{environmentId}/as/device/user?user_code=WDJB-MJHT",
  "expires_in": 1800,
  "interval": 5
}`,
												'Device authorization response'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://auth.pingone.com/{environmentId}/as/device/user",
  "verification_uri_complete": "https://auth.pingone.com/{environmentId}/as/device/user?user_code=WDJB-MJHT",
  "expires_in": 1800,
  "interval": 5
}`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>3</FlowStepNumber>
									Device Displays User Code
								</FlowStepTitle>
								<FlowStepDescription>
									Device displays the user code and verification URI to the user (e.g., on TV
									screen, CLI output).
								</FlowStepDescription>
								<InfoBox>
									<InfoIcon>
										<FiMonitor />
									</InfoIcon>
									<InfoContent>
										<h4>User Code Display</h4>
										<p>
											The device shows the user code (e.g., "WDJB-MJHT") and verification URI on its
											display. The user must remember this code and visit the verification URI on a
											separate device (phone, computer, etc.).
										</p>
									</InfoContent>
								</InfoBox>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>4</FlowStepNumber>
									User Visits Verification URI
								</FlowStepTitle>
								<FlowStepDescription>
									User opens the verification URI on a separate device (phone, computer) and enters
									the user code.
								</FlowStepDescription>
								<WarningBox>
									<InfoIcon>
										<FiAlertCircle />
									</InfoIcon>
									<InfoContent>
										<h4>Manual Process</h4>
										<p>
											The user must manually visit the verification URL and enter the user code.
											This is more cumbersome than CIBA's push notification, but works for unknown
											users.
										</p>
									</InfoContent>
								</WarningBox>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>5</FlowStepNumber>
									Device Polls Token Endpoint
								</FlowStepTitle>
								<FlowStepDescription>
									Device continuously polls the token endpoint using the device code until user
									completes authorization or request expires.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Poll Token Endpoint</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code&
device_code=GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS&
client_id=your_client_id`,
												'Device token request'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code&
device_code=GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS&
client_id=your_client_id`}</CodeBlock>
								<InfoBox>
									<InfoIcon>
										<FiClock />
									</InfoIcon>
									<InfoContent>
										<h4>Polling Behavior</h4>
										<p>
											The device polls the token endpoint every 5 seconds (or as specified by the
											interval). If the user hasn't completed authorization yet, it receives a
											"authorization_pending" response and continues polling. Once the user
											approves, tokens are returned.
										</p>
									</InfoContent>
								</InfoBox>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>6</FlowStepNumber>
									User Completes Authorization
								</FlowStepTitle>
								<FlowStepDescription>
									User authenticates and approves the authorization request on the verification
									page.
								</FlowStepDescription>
								<InfoBox>
									<InfoIcon>
										<FiInfo />
									</InfoIcon>
									<InfoContent>
										<h4>User Flow</h4>
										<p>
											The user visits the verification URI, enters the user code, logs in (if
											needed), and approves the authorization request. This is similar to a standard
											authorization code flow but triggered by the device code.
										</p>
									</InfoContent>
								</InfoBox>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>7</FlowStepNumber>
									Tokens Issued
								</FlowStepTitle>
								<FlowStepDescription>
									Once user approves, the polling request returns tokens (access token, ID token,
									refresh token).
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Token Response</span>
									<CopyButton
										onClick={() =>
											handleCopyCode(
												`{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}`,
												'Device token response'
											)
										}
									>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}`}</CodeBlock>
							</FlowStep>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="When to Use Which?"
					theme="green"
					icon={<FiBook />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
							<h3>Decision Tree</h3>

							<UseCaseCard>
								<CardHeader>
									<h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<FiSmartphone />
										Use CIBA When:
									</h3>
								</CardHeader>
								<CardBody>
									<ul>
										<li>
											<strong>✅ Known User:</strong> You know the user's identity (email, phone
											number, username)
										</li>
										<li>
											<strong>✅ High Security Needed:</strong> Banking, payments, sensitive
											transactions
										</li>
										<li>
											<strong>✅ Mobile-First:</strong> User has registered authenticator app on
											mobile device
										</li>
										<li>
											<strong>✅ Seamless UX:</strong> Want push notification instead of manual code
											entry
										</li>
										<li>
											<strong>✅ Transaction Approval:</strong> User needs to approve specific
											actions
										</li>
										<li>
											<strong>✅ Trusted Device:</strong> User authenticates on their own trusted
											device
										</li>
									</ul>

									<h4 style={{ marginTop: '1.5rem' }}>Example Use Cases:</h4>
									<ul>
										<li>
											<strong>Banking App:</strong> "Approve this $500 transfer?" - User receives
											push notification, approves on mobile
										</li>
										<li>
											<strong>Payment App:</strong> "Authorize this payment?" - User approves on
											their registered device
										</li>
										<li>
											<strong>High-Value Transaction:</strong> "Confirm this purchase?" - User
											approves on trusted device
										</li>
										<li>
											<strong>Account Recovery:</strong> "Approve password reset?" - User receives
											notification, approves
										</li>
									</ul>
								</CardBody>
							</UseCaseCard>

							<UseCaseCard>
								<CardHeader>
									<h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<FiMonitor />
										Use Device Authorization When:
									</h3>
								</CardHeader>
								<CardBody>
									<ul>
										<li>
											<strong>✅ Unknown User:</strong> You don't know the user's identity
										</li>
										<li>
											<strong>✅ Constrained Device:</strong> Device has no browser or limited input
										</li>
										<li>
											<strong>✅ First-Time Setup:</strong> User is setting up device for first time
										</li>
										<li>
											<strong>✅ No Mobile Requirement:</strong> User doesn't need to have mobile
											app
										</li>
										<li>
											<strong>✅ Generic Authorization:</strong> Any user can authorize on any
											device
										</li>
										<li>
											<strong>✅ IoT/Embedded:</strong> Smart devices, TVs, gaming consoles
										</li>
									</ul>

									<h4 style={{ marginTop: '1.5rem' }}>Example Use Cases:</h4>
									<ul>
										<li>
											<strong>Smart TV:</strong> User wants to watch Netflix - TV shows code, user
											enters on phone
										</li>
										<li>
											<strong>CLI Tool:</strong> Developer wants to authenticate - tool shows code,
											user visits URL
										</li>
										<li>
											<strong>IoT Device:</strong> Smart thermostat setup - device displays code,
											user enters on phone
										</li>
										<li>
											<strong>Gaming Console:</strong> First-time login - console shows code, user
											enters on browser
										</li>
										<li>
											<strong>Public Kiosk:</strong> Kiosk setup - displays code, admin enters on
											separate device
										</li>
									</ul>
								</CardBody>
							</UseCaseCard>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Complete Code Examples"
					theme="orange"
					icon={<FiCode />}
					defaultCollapsed={true}
				>
					<Card>
						<CardBody>
							<h3>CIBA Implementation Example (JavaScript)</h3>
							<CodeBlockHeader>
								<span>Complete CIBA Flow Implementation</span>
								<CopyButton
									onClick={() =>
										handleCopyCode(
											`async function initiateCIBAFlow(config) {
  const bcAuthEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/bc-authorize\`;
  
  // Step 1: Send backchannel authentication request
  const authResponse = await fetch(bcAuthEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': \`Basic \${btoa(\`\${config.clientId}:\${config.clientSecret}\`)}\`
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      scope: 'openid profile email',
      login_hint: config.userEmail, // User identifier required
      binding_message: 'Please approve this transaction',
      user_code: '1234', // Optional: user-friendly code
      requested_expiry: '600' // 10 minutes
    })
  });
  
  const { auth_req_id, expires_in, interval } = await authResponse.json();
  
  // Step 2: Poll token endpoint until user approves
  const tokenEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/token\`;
  let tokens = null;
  
  while (Date.now() < Date.now() + expires_in * 1000) {
    await sleep(interval * 1000); // Wait for interval seconds
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${btoa(\`\${config.clientId}:\${config.clientSecret}\`)}\`
      },
      body: new URLSearchParams({
        grant_type: 'urn:openid:params:grant-type:ciba',
        auth_req_id: auth_req_id
      })
    });
    
    if (tokenResponse.ok) {
      tokens = await tokenResponse.json();
      break; // User approved, tokens received
    } else if (tokenResponse.status === 400) {
      const error = await tokenResponse.json();
      if (error.error === 'authorization_pending') {
        continue; // Keep polling
      } else {
        throw new Error(\`CIBA failed: \${error.error}\`);
      }
    }
  }
  
  return tokens;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}`,
											'CIBA JavaScript example'
										)
									}
								>
									<FiCopy size={12} />
									Copy
								</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`async function initiateCIBAFlow(config) {
  const bcAuthEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/bc-authorize\`;
  
  // Step 1: Send backchannel authentication request
  const authResponse = await fetch(bcAuthEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': \`Basic \${btoa(\`\${config.clientId}:\${config.clientSecret}\`)}\`
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      scope: 'openid profile email',
      login_hint: config.userEmail, // User identifier required
      binding_message: 'Please approve this transaction',
      user_code: '1234', // Optional: user-friendly code
      requested_expiry: '600' // 10 minutes
    })
  });
  
  const { auth_req_id, expires_in, interval } = await authResponse.json();
  
  // Step 2: Poll token endpoint until user approves
  const tokenEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/token\`;
  let tokens = null;
  
  while (Date.now() < Date.now() + expires_in * 1000) {
    await sleep(interval * 1000); // Wait for interval seconds
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${btoa(\`\${config.clientId}:\${config.clientSecret}\`)}\`
      },
      body: new URLSearchParams({
        grant_type: 'urn:openid:params:grant-type:ciba',
        auth_req_id: auth_req_id
      })
    });
    
    if (tokenResponse.ok) {
      tokens = await tokenResponse.json();
      break; // User approved, tokens received
    } else if (tokenResponse.status === 400) {
      const error = await tokenResponse.json();
      if (error.error === 'authorization_pending') {
        continue; // Keep polling
      } else {
        throw new Error(\`CIBA failed: \${error.error}\`);
      }
    }
  }
  
  return tokens;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}`}</CodeBlock>

							<h3 style={{ marginTop: '2rem' }}>
								Device Authorization Implementation Example (JavaScript)
							</h3>
							<CodeBlockHeader>
								<span>Complete Device Authorization Flow Implementation</span>
								<CopyButton
									onClick={() =>
										handleCopyCode(
											`async function initiateDeviceFlow(config) {
  const deviceEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/device\`;
  
  // Step 1: Request device code
  const deviceResponse = await fetch(deviceEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      scope: 'openid profile email'
    })
  });
  
  const { 
    device_code, 
    user_code, 
    verification_uri, 
    verification_uri_complete,
    expires_in, 
    interval 
  } = await deviceResponse.json();
  
  // Step 2: Display user code to user
  console.log('Please visit:', verification_uri);
  console.log('Enter code:', user_code);
  // In real app, display on device screen or CLI output
  
  // Step 3: Poll token endpoint until user completes authorization
  const tokenEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/token\`;
  let tokens = null;
  const startTime = Date.now();
  
  while (Date.now() - startTime < expires_in * 1000) {
    await sleep(interval * 1000); // Wait for interval seconds
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: device_code,
        client_id: config.clientId
      })
    });
    
    if (tokenResponse.ok) {
      tokens = await tokenResponse.json();
      break; // User completed authorization, tokens received
    } else if (tokenResponse.status === 400) {
      const error = await tokenResponse.json();
      if (error.error === 'authorization_pending') {
        continue; // Keep polling
      } else if (error.error === 'slow_down') {
        // Increase polling interval
        interval = (interval || 5) + 5;
        continue;
      } else {
        throw new Error(\`Device flow failed: \${error.error}\`);
      }
    }
  }
  
  return tokens;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}`,
											'Device Authorization JavaScript example'
										)
									}
								>
									<FiCopy size={12} />
									Copy
								</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`async function initiateDeviceFlow(config) {
  const deviceEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/device\`;
  
  // Step 1: Request device code
  const deviceResponse = await fetch(deviceEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      scope: 'openid profile email'
    })
  });
  
  const { 
    device_code, 
    user_code, 
    verification_uri, 
    verification_uri_complete,
    expires_in, 
    interval 
  } = await deviceResponse.json();
  
  // Step 2: Display user code to user
  console.log('Please visit:', verification_uri);
  console.log('Enter code:', user_code);
  // In real app, display on device screen or CLI output
  
  // Step 3: Poll token endpoint until user completes authorization
  const tokenEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/token\`;
  let tokens = null;
  const startTime = Date.now();
  
  while (Date.now() - startTime < expires_in * 1000) {
    await sleep(interval * 1000); // Wait for interval seconds
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: device_code,
        client_id: config.clientId
      })
    });
    
    if (tokenResponse.ok) {
      tokens = await tokenResponse.json();
      break; // User completed authorization, tokens received
    } else if (tokenResponse.status === 400) {
      const error = await tokenResponse.json();
      if (error.error === 'authorization_pending') {
        continue; // Keep polling
      } else if (error.error === 'slow_down') {
        // Increase polling interval
        interval = (interval || 5) + 5;
        continue;
      } else {
        throw new Error(\`Device flow failed: \${error.error}\`);
      }
    }
  }
  
  return tokens;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}`}</CodeBlock>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Summary & Recommendations"
					theme="highlight"
					icon={<FiCheck />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
							<h3>Key Takeaways</h3>

							<ComparisonGrid>
								<ComparisonCard $type="ciba">
									<CardHeader>
										<h3>CIBA Advantages</h3>
									</CardHeader>
									<CardBody>
										<ul>
											<li>
												✅ <strong>Seamless UX:</strong> Push notification, no manual code entry
											</li>
											<li>
												✅ <strong>High Security:</strong> User approves on trusted device
											</li>
											<li>
												✅ <strong>Known User:</strong> Works when you know user identity
											</li>
											<li>
												✅ <strong>Transaction Context:</strong> Can include binding messages
											</li>
											<li>
												✅ <strong>Mobile-First:</strong> Perfect for mobile authenticator apps
											</li>
										</ul>
									</CardBody>
								</ComparisonCard>

								<ComparisonCard $type="device">
									<CardHeader>
										<h3>Device Authorization Advantages</h3>
									</CardHeader>
									<CardBody>
										<ul>
											<li>
												✅ <strong>Unknown Users:</strong> Works without user identifier
											</li>
											<li>
												✅ <strong>Universal:</strong> Works on any device with browser
											</li>
											<li>
												✅ <strong>No Mobile App:</strong> User doesn't need mobile app
											</li>
											<li>
												✅ <strong>First-Time Setup:</strong> Perfect for device initialization
											</li>
											<li>
												✅ <strong>Constrained Devices:</strong> Ideal for IoT, TVs, CLI tools
											</li>
										</ul>
									</CardBody>
								</ComparisonCard>
							</ComparisonGrid>

							<h3 style={{ marginTop: '2rem' }}>Decision Matrix</h3>
							<Table>
								<thead>
									<tr>
										<th>Scenario</th>
										<th>Recommended Flow</th>
										<th>Reason</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Banking app transaction approval</td>
										<td>
											<strong>CIBA</strong>
										</td>
										<td>Known user, high security, push notification UX</td>
									</tr>
									<tr>
										<td>Smart TV first-time setup</td>
										<td>
											<strong>Device Authorization</strong>
										</td>
										<td>Unknown user, constrained device, no mobile app</td>
									</tr>
									<tr>
										<td>Payment authorization</td>
										<td>
											<strong>CIBA</strong>
										</td>
										<td>Known user, transaction context, trusted device</td>
									</tr>
									<tr>
										<td>CLI tool authentication</td>
										<td>
											<strong>Device Authorization</strong>
										</td>
										<td>Unknown user, no browser, manual process OK</td>
									</tr>
									<tr>
										<td>IoT device setup</td>
										<td>
											<strong>Device Authorization</strong>
										</td>
										<td>Unknown user, constrained device, one-time setup</td>
									</tr>
									<tr>
										<td>Account recovery approval</td>
										<td>
											<strong>CIBA</strong>
										</td>
										<td>Known user, security-critical, push notification</td>
									</tr>
									<tr>
										<td>Gaming console login</td>
										<td>
											<strong>Device Authorization</strong>
										</td>
										<td>Unknown user, constrained input, first-time setup</td>
									</tr>
								</tbody>
							</Table>

							<InfoBox style={{ marginTop: '2rem' }}>
								<InfoIcon>
									<FiInfo />
								</InfoIcon>
								<InfoContent>
									<h4>PingOne Support</h4>
									<p>
										<strong>CIBA:</strong> PingOne supports CIBA with push notifications to
										registered authenticator devices. Requires user to have a registered
										authenticator app (e.g., PingOne Mobile App).
									</p>
									<p style={{ marginTop: '0.5rem' }}>
										<strong>Device Authorization:</strong> PingOne fully supports RFC 8628 Device
										Authorization Grant. Note that PingOne requires the <code>openid</code> scope
										even for OAuth 2.0 device flows.
									</p>
								</InfoContent>
							</InfoBox>
						</CardBody>
					</Card>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default CIBAvsDeviceAuthz;
